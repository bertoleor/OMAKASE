import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CapacityBooking } from "@/lib/booking-availability";
import { LIVE_STATUSES } from "@/lib/booking-availability";

const headerGet = vi.fn((key: string) => (key === "user-agent" ? "vitest" : null));
vi.mock("next/headers", () => ({
  headers: vi.fn(async () => ({ get: headerGet })),
}));

/**
 * ORN P1 — capacity/overlap/idempotency guard wiring (Fase 2).
 *
 * Architecture (decided 2026-09-26, resolving the 30-booking review):
 * the authoritative gate is the Postgres function `try_create_booking`
 * (SECURITY DEFINER + advisory lock). Reason: the booking flow is
 * unauthenticated, and bookings RLS only lets a caller SELECT its own rows
 * (owner-by-email or staff). With the anon key, any occupancy or
 * idempotency read outside the database returns ZERO rows, so a guard
 * computed in the action would be dead code in runtime.
 *
 * This suite pins the ACTION-side contract:
 *  - createBooking calls rpc("try_create_booking") with the mapped zone_slug
 *  - RPC ok:false maps to a typed failure (code per reason)
 *  - RPC errors fail closed (no success, no email)
 *  - deduped retries return the original booking without re-sending email
 *  - confirmation email fires only on a fresh accepted booking
 */
type Row = Record<string, unknown>;

interface RpcCall {
  fn: string;
  args: Row;
}

const state: {
  rpcResult: { data: Row | null; error: { code: string; message: string } | null };
  rpcCalls: RpcCall[];
  emailsSent: string[];
} = {
  rpcResult: { data: null, error: null },
  rpcCalls: [],
  emailsSent: [],
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    rpc: (fn: string, args: Row) => {
      state.rpcCalls.push({ fn, args });
      return Promise.resolve(state.rpcResult);
    },
  })),
}));

vi.mock("@/lib/email/resend", () => ({
  sendConfirmationEmail: vi.fn(async (payload: { bookingId: string }) => {
    state.emailsSent.push(payload.bookingId);
    return { id: `email_${state.emailsSent.length}` };
  }),
}));

import { createBooking } from "@/app/actions/bookings";

const baseInput = {
  customerName: "Test",
  customerEmail: "t@example.com",
  customerPhone: "+5491155550000",
  date: "2026-10-01",
  timeSlot: "20:00",
  pax: 4,
  zone: "indoor-tables",
  honeypot: "",
  renderedAt: new Date(Date.now() - 10_000).toISOString(),
};

const okResult = (over: Partial<Row> = {}): Row => ({
  ok: true,
  deduped: false,
  booking: {
    id: "b_123",
    zone: "indoor_tables",
    zone_id: "z_salon",
    status: "pending",
    pax: 4,
    booking_date: "2026-10-01",
    booking_time: "20:00",
    idempotency_key: "11111111-1111-4111-8111-111111111111",
  },
  occupancy: 4,
  capacity: 10,
  remaining_pax: 6,
  // Overrides apply at the TOP level (e.g. { deduped: true }) so they
  // mirror the real RPC payload shape, not the nested booking row.
  ...over,
});

beforeEach(() => {
  state.rpcResult = { data: null, error: null };
  state.rpcCalls = [];
  state.emailsSent = [];
  headerGet.mockClear();
});

describe("createBooking — try_create_booking RPC wiring (ORN P1)", () => {
  it("delegates the insert to the try_create_booking RPC with the mapped zone slug", async () => {
    state.rpcResult = { data: okResult(), error: null };
    const res = await createBooking({ ...baseInput });

    expect(state.rpcCalls).toHaveLength(1);
    expect(state.rpcCalls[0].fn).toBe("try_create_booking");
    // Arg names mirror the SQL signature: p_zone_slug, p_booking_date, ... (p_ prefix)
    expect(state.rpcCalls[0].args.p_zone_slug).toBe("salon");
    expect(state.rpcCalls[0].args.p_booking_date).toBe("2026-10-01");
    expect(state.rpcCalls[0].args.p_booking_time).toBe("20:00");
    expect(state.rpcCalls[0].args.p_pax).toBe(4);
    expect(state.rpcCalls[0].args.p_customer_email).toBe("t@example.com");
    expect(state.rpcCalls[0].args.p_idempotency_key).toBeNull();
    expect(res.success).toBe(true);
  });

  it("maps each UI zone key to its seeded zone slug", async () => {
    state.rpcResult = { data: okResult(), error: null };
    await createBooking({ ...baseInput, zone: "outdoor-pergola" });
    expect(state.rpcCalls[0].args.p_zone_slug).toBe("pergola");

    state.rpcCalls = [];
    await createBooking({ ...baseInput, zone: "indoor-bar" });
    expect(state.rpcCalls[0].args.p_zone_slug).toBe("barra");
  });

  it("forwards the idempotency key and payment references to the RPC", async () => {
    state.rpcResult = { data: okResult(), error: null };
    const idempotencyKey = "11111111-1111-4111-8111-111111111111";
    await createBooking({
      ...baseInput,
      idempotencyKey,
      mpPaymentId: "123456789",
      mpPreferenceId: "pref_1",
    });
    expect(state.rpcCalls[0].args.p_idempotency_key).toBe(idempotencyKey);
    expect(state.rpcCalls[0].args.p_mp_payment_id).toBe("123456789");
    expect(state.rpcCalls[0].args.p_mp_preference_id).toBe("pref_1");
  });

  it("rejects with CAPACITY_EXCEEDED when the RPC reports it (no email)", async () => {
    state.rpcResult = {
      data: { ok: false, reason: "CAPACITY_EXCEEDED", occupancy: 8, capacity: 10, remaining_pax: 2 },
      error: null,
    };
    const res = await createBooking({ ...baseInput });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.code).toBe("CAPACITY_EXCEEDED");
    }
    expect(state.emailsSent).toHaveLength(0);
  });

  it("rejects with ZONE_UNAVAILABLE when the zone is missing or inactive", async () => {
    state.rpcResult = { data: { ok: false, reason: "ZONE_UNAVAILABLE" }, error: null };
    const res = await createBooking({ ...baseInput });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.code).toBe("ZONE_UNAVAILABLE");
    }
  });

  it("fails closed when the RPC call itself errors (no success, no email)", async () => {
    state.rpcResult = { data: null, error: { code: "PGRST202", message: "function not found" } };
    const res = await createBooking({ ...baseInput });
    expect(res.success).toBe(false);
    expect(state.emailsSent).toHaveLength(0);
  });

  it("returns the original booking on a deduped idempotent retry (no second email)", async () => {
    state.rpcResult = { data: okResult({ deduped: true }), error: null };
    const res = await createBooking({
      ...baseInput,
      idempotencyKey: "11111111-1111-4111-8111-111111111111",
    });
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.deduped).toBe(true);
    }
    expect(state.emailsSent).toHaveLength(0);
  });

  it("sends the confirmation email exactly once for a fresh accepted booking", async () => {
    state.rpcResult = { data: okResult(), error: null };
    const res = await createBooking({ ...baseInput });
    expect(res.success).toBe(true);
    expect(state.emailsSent).toEqual(["b_123"]);
  });
});

describe("createBooking — calendar gates mapping (ORN-124 Fase 2b)", () => {
  // The three server-side rejects added to try_create_booking: blocked dates,
  // weekly schedule, advance window. The action MUST map each RPC reason to
  // its own typed code + user-facing message (not the generic BOOKING_FAILED
  // fallback), and never send an email on rejection.
  const rejectCases: { reason: string; code: string }[] = [
    { reason: "BLOCKED_DATE", code: "BLOCKED_DATE" },
    { reason: "SCHEDULE_CLOSED", code: "SCHEDULE_CLOSED" },
    { reason: "INVALID_ADVANCE", code: "INVALID_ADVANCE" },
  ];

  it.each(rejectCases)(
    "maps RPC reason $reason to typed code $code with a user-facing message",
    async ({ reason, code }) => {
      state.rpcResult = { data: { ok: false, reason }, error: null };
      const res = await createBooking({ ...baseInput });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.code).toBe(code);
        // A specific, non-generic message must exist for each mapped reason.
        expect(res.error).not.toBe("We could not process your booking. Please try again.");
        expect(res.error?.length).toBeGreaterThan(10);
      }
      expect(state.emailsSent).toHaveLength(0);
    },
  );

  it("still maps an unknown RPC reason to the generic BOOKING_FAILED fallback", async () => {
    state.rpcResult = { data: { ok: false, reason: "SOMETHING_ELSE" }, error: null };
    const res = await createBooking({ ...baseInput });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.code).toBe("BOOKING_FAILED");
    }
  });
});

describe("guard semantics — shared capacity vs slot overlap (ORN P1 resolution)", () => {
  it("same slot + fitting pax: hasSlotOverlap=true but canAcceptBooking accepts", async () => {
    const { hasSlotOverlap, canAcceptBooking } = await import("@/lib/booking-availability");
    const liveRow = {
      zone: "indoor_tables",
      booking_date: "2026-10-01",
      booking_time: "20:00",
      pax: 5,
      status: "confirmed",
    };
    const rows = [liveRow] as unknown as CapacityBooking[];
    const candidate = {
      zone: "indoor_tables",
      booking_date: "2026-10-01",
      booking_time: "20:00",
      pax: 4,
      status: "pending",
    };
    expect(hasSlotOverlap(rows, candidate)).toBe(true);
    expect(canAcceptBooking(rows, candidate, { zoneCapacityPax: 10 }).accepted).toBe(true);
  });

  it("LIVE_STATUSES excludes cancelled/no_show so they free the slot", () => {
    expect(LIVE_STATUSES.has("cancelled")).toBe(false);
    expect(LIVE_STATUSES.has("no_show")).toBe(false);
    expect(LIVE_STATUSES.has("pending")).toBe(true);
  });
});
