"use server";

import { createClient } from "@/lib/supabase/server";
import { sendConfirmationEmail } from "@/lib/email/resend";
import { checkRateLimit } from "@/lib/rate-limit";
import { validateSubmission, MIN_ELAPSED_MS } from "@/lib/anti-abuse";
import { createBookingInputSchema } from "@/lib/validations";
import { headers } from "next/headers";
import { BUSINESS } from "@/config/business";
import type { TableZoneDb } from "@/types/database.types";

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

  // Idempotency guard: safe retries with the same key return the original row.
  if (input.idempotencyKey) {
    const { data: existing, error: lookupError } = await supabase
      .from("bookings")
      .select()
      .eq("idempotency_key", input.idempotencyKey)
      .maybeSingle();

    if (!lookupError && existing) {
      return { success: true, booking: existing, deduped: true };
    }
  }

  // Map zone to database enum
  const zoneMap: Record<string, TableZoneDb> = {
    "indoor-tables": "indoor_tables",
    "outdoor-pergola": "outdoor_pergola",
    "indoor-bar": "indoor_bar",
  };

  const bookingData = {
    customer_name: input.customerName,
    customer_email: input.customerEmail,
    customer_phone: input.customerPhone,
    booking_date: input.date,
    booking_time: input.timeSlot,
    pax: input.pax,
    zone: zoneMap[input.zone] || "indoor_tables",
    status: "pending",
    notes: input.notes || null,
    deposit_amount: 0,
    // PCI: only Mercado Pago reference IDs are persisted — never PAN data.
    idempotency_key: input.idempotencyKey || null,
    mp_payment_id: input.mpPaymentId || null,
    mp_preference_id: input.mpPreferenceId || null,
  };

  const { data: result, error } = await supabase
    .from("bookings")
    .insert(bookingData)
    .select()
    .single();

  if (error) {
    // A concurrent retry may have won the race on the unique key: return it.
    if (input.idempotencyKey && error.code === "23505") {
      const { data: raced } = await supabase
        .from("bookings")
        .select()
        .eq("idempotency_key", input.idempotencyKey)
        .maybeSingle();
      if (raced) {
        return { success: true, booking: raced, deduped: true };
      }
    }
    return { success: false, error: error.message };
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
