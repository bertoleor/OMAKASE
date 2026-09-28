"use server";

import { createClient } from "@/lib/supabase/server";
import { sendConfirmationEmail } from "@/lib/email/resend";
import { checkRateLimit } from "@/lib/rate-limit";
import { validateSubmission, MIN_ELAPSED_MS } from "@/lib/anti-abuse";
import { createBookingInputSchema } from "@/lib/validations";
import { headers } from "next/headers";
import { BUSINESS } from "@/config/business";

/** Minimal booking row shape returned by try_create_booking's jsonb payload. */
interface CreateBookingRpcRow {
  id: string;
  zone?: string;
  zone_id?: string;
  status?: string;
  pax?: number;
  booking_date?: string;
  booking_time?: string;
  customer_email?: string;
  idempotency_key?: string | null;
}

interface CreateBookingData {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  date: string;
  timeSlot: string;
  pax: number;
  zone: string;
  notes?: string;
  idempotencyKey?: string;
  mpPaymentId?: string;
  mpPreferenceId?: string;
  honeypot?: string;
  renderedAt?: string;
}

const GENERIC_INVALID_INPUT = "Invalid booking data. Please review the form.";

/** User-facing messages for the RPC's typed rejection reasons. */
const CAPACITY_REASONS: Record<string, string> = {
  CAPACITY_EXCEEDED:
    "That time slot is fully booked. Please choose another time or reduce your party size.",
  ZONE_UNAVAILABLE: "That seating area is not available. Please choose another area.",
  INVALID_PAX: "Invalid party size.",
  INVALID_INPUT: "Invalid booking data. Please review the form.",
  // ORN-124 Fase 2b — calendar gates enforced server-side by the RPC.
  BLOCKED_DATE: "We are closed on that date. Please choose another date.",
  SCHEDULE_CLOSED: "We are closed at that time. Please choose a time within our opening hours.",
  INVALID_ADVANCE:
    "That booking time is outside our booking window. Please choose a date closer to today.",
};

/**
 * Accepted typed codes: derived from the message map so the RPC and the
 * action can never drift apart again (this exact gap created ORN-124 Fase 2b).
 */
const KNOWN_REASONS = new Set(Object.keys(CAPACITY_REASONS));

export async function createBooking(data: CreateBookingData) {
  // Never log the raw payload: it travels alongside payment-adjacent fields.
  const parsed = createBookingInputSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, code: "VALIDATION_ERROR", error: GENERIC_INVALID_INPUT };
  }
  const input = parsed.data;

  const supabase = await createClient();

  const verdict = validateSubmission(
    { honeypot: input.honeypot, renderedAt: input.renderedAt },
    { minElapsedMs: MIN_ELAPSED_MS },
  );

  if (!verdict.ok && verdict.reason === "honeypot") {
    return { success: true };
  }

  if (!verdict.ok && verdict.reason === "time-trap") {
    return {
      success: false,
      code: "TIME_TRAP",
      error: "Please wait before confirming your booking.",
    };
  }

  const headerStore = await headers();
  const forwarded = headerStore.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? headerStore.get("x-real-ip") ?? "unknown";
  const ua = headerStore.get("user-agent") ?? "";
  const rateKey = `${ip}:${ua.slice(0, 50)}`;
  const limitCheck = checkRateLimit(rateKey, { limit: 20, windowMs: 60 * 1000 });

  if (!limitCheck.allowed) {
    return {
      success: false,
      code: "RATE_LIMITED",
      error: "Too many requests",
      retryAfter: limitCheck.retryAfter,
    };
  }

  // ORN P1: the authoritative capacity/overlap/idempotency gate is the
  // Postgres function `try_create_booking` (SECURITY DEFINER + advisory
  // lock). This flow runs with the anon key, and bookings RLS only lets a
  // caller SELECT its own rows (owner-by-email or staff): any occupancy or
  // idempotency read done here would see ZERO rows, so the gate MUST live
  // server-side. The RPC resolves the zone by slug, computes live occupancy
  // (pending/confirmed/seated/completed), enforces capacity, re-checks
  // idempotency atomically, and inserts with zone_id set.
  const zoneSlugMap: Record<string, string> = {
    "indoor-tables": "salon",
    "outdoor-pergola": "pergola",
    "indoor-bar": "barra",
  };

  const { data: rpcData, error: rpcError } = await supabase.rpc(
    "try_create_booking",
    {
      p_zone_slug: zoneSlugMap[input.zone] ?? null,
      p_booking_date: input.date,
      p_booking_time: input.timeSlot,
      p_pax: input.pax,
      p_customer_name: input.customerName,
      p_customer_email: input.customerEmail,
      p_customer_phone: input.customerPhone,
      p_notes: input.notes || null,
      p_idempotency_key: input.idempotencyKey || null,
      p_mp_payment_id: input.mpPaymentId || null,
      p_mp_preference_id: input.mpPreferenceId || null,
    },
  );

  // Fail closed on transport/schema errors: no booking, no email.
  if (rpcError || !rpcData) {
    return {
      success: false,
      code: rpcError?.code === "PGRST202" ? "RPC_UNAVAILABLE" : "BOOKING_FAILED",
      error: "We could not process your booking. Please try again.",
      ...(rpcError?.code === "PGRST202" ? { rpcCode: "PGRST202" } : {}),
    };
  }

  const gate = rpcData as {
    ok: boolean;
    reason?: string;
    deduped?: boolean;
    booking?: CreateBookingRpcRow;
  };

  if (!gate.ok) {
    const reason = gate.reason ?? "";
    const code = KNOWN_REASONS.has(reason) ? reason : "BOOKING_FAILED";
    return {
      success: false,
      code,
      // eslint-disable-next-line security/detect-object-injection -- code is a closed set derived from gate.reason
      error: CAPACITY_REASONS[code] ?? "We could not process your booking. Please try again.",
    };
  }

  const result = gate.booking;
  if (!result?.id) {
    // Defensive: RPC contract violated — never proceed with a broken row.
    return { success: false, code: "BOOKING_FAILED", error: "We could not process your booking." };
  }

  // Idempotent retry: the original booking already exists and its
  // confirmation email was already sent on the first attempt.
  // NOTE: read `gate.deduped` (the RPC payload), NOT `verdict.deduped` —
  // `verdict` is the anti-abuse result and has no such field; reading it
  // would silently fall through and re-send the email on every retry.
  if (gate.deduped) {
    return { success: true, booking: result, deduped: true };
  }

  // Generate manage booking URL
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const manageBookingUrl = `${baseUrl}/mis-reservas/${result.id}`;

  // Send confirmation email with enhanced data
  try {
    await sendConfirmationEmail({
      to: input.customerEmail,
      customerName: input.customerName,
      bookingDate: input.date,
      bookingTime: input.timeSlot,
      pax: input.pax,
      zoneName: BUSINESS.zones[input.zone] || input.zone,
      bookingId: result.id,
      notes: input.notes,
      manageBookingUrl,
    });
  } catch (e) {
    // Log a sanitized signal only — never the booking payload or identifiers.
    console.error("Error sending confirmation email:", e instanceof Error ? e.message : "unknown");
    // We don't return error here because the booking was already created successfully
  }

  return { success: true, booking: result };
}

/**
 * ORN-84 P1-8 — user-facing messages for cancel_my_booking's typed rejects.
 * Mirrors the RPC's jsonb contract; kept in one place so a new RPC reason
 * surfaces as CANCEL_FAILED instead of passing silently.
 */
const CANCEL_REASONS: Record<string, string> = {
  NOT_AUTHORIZED: "You can only cancel your own booking.",
  BOOKING_NOT_FOUND: "We could not find that booking.",
  ALREADY_CLOSED: "This booking can no longer be cancelled.",
  CANCEL_WINDOW_CLOSED: "The free-cancellation window for this booking has closed. Contact us for assistance.",
  INVALID_INPUT: "Invalid booking reference.",
};

const CANCEL_KNOWN_REASONS = new Set(Object.keys(CANCEL_REASONS));

/** Minimal uuid shape check (v4-ish); the RPC re-validates authoritatively. */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Typed result contract for cancelBooking — consumed by /mis-reservas/[id]. */
export interface CancelBookingResult {
  success: boolean;
  code?: string;
  error?: string;
  status?: string;
  rpcCode?: string;
}

/**
 * Client self-service cancellation. The authoritative ownership check and
 * status transition live in the Postgres function `cancel_my_booking`
 * (SECURITY DEFINER): bookings' UPDATE policy is staff-only, so a raw
 * .update() from the customer's session affects ZERO rows under RLS — the
 * old button silently did nothing. The RPC verifies the session email owns
 * the booking and cancels server-side.
 */
export async function cancelBooking(bookingId: string): Promise<CancelBookingResult> {
  const supabase = await createClient();

  // Ownership travels with the session (JWT), never with a client-sent email.
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user?.email) {
    return { success: false, code: "NOT_AUTHENTICATED", error: "Please sign in to manage your booking." };
  }

  if (typeof bookingId !== "string" || !UUID_RE.test(bookingId)) {
    return { success: false, code: "INVALID_INPUT", error: CANCEL_REASONS.INVALID_INPUT };
  }

  const { data: rpcData, error: rpcError } = await supabase.rpc("cancel_my_booking", {
    p_booking_id: bookingId,
  });

  // Fail closed on transport/schema errors: nothing cancelled, nothing claimed.
  if (rpcError || !rpcData) {
    return {
      success: false,
      code: rpcError?.code === "PGRST202" ? "RPC_UNAVAILABLE" : "CANCEL_FAILED",
      error: "We could not cancel your booking. Please try again.",
      ...(rpcError?.code === "PGRST202" ? { rpcCode: "PGRST202" } : {}),
    };
  }

  const gate = rpcData as { ok?: boolean; reason?: string; status?: string };

  if (!gate.ok) {
    const reason = gate.reason ?? "";
    const code = CANCEL_KNOWN_REASONS.has(reason) ? reason : "CANCEL_FAILED";
    return {
      success: false,
      code,
      // eslint-disable-next-line security/detect-object-injection -- code is a closed set derived from gate.reason
      error: CANCEL_REASONS[code] ?? "We could not cancel your booking. Please try again.",
    };
  }

  return { success: true, status: gate.status ?? "cancelled" };
}
