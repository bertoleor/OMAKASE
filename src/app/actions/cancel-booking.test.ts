import { beforeEach, describe, expect, it, vi } from "vitest";

const headerGet = vi.fn((key: string) => (key === "user-agent" ? "vitest" : null));

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => ({ get: headerGet })),
}));

/**
 * ORN-84 P1-8 — client self-service cancellation via cancel_my_booking RPC.
 *
 * Architecture (mirrors try_create_booking): the authoritative gate is the
 * Postgres function `cancel_my_booking` (SECURITY DEFINER). Reason: bookings
 * UPDATE policy is staff-only; a raw .update({status:'cancelled'}) from the
 * customer's browser affects ZERO rows under RLS — the button silently
 * does nothing today. The RPC verifies the caller's session email owns the
 * booking and flips the status server-side.
 *
 * This suite pins the ACTION-side contract:
 *  - requires an authenticated session (no session → NOT_AUTHENTICATED)
 *  - delegates to rpc("cancel_my_booking", { p_booking_id }) on the
 *    session-carrying server client
 *  - RPC ok:false maps to typed failures (NOT_AUTHORIZED, ALREADY_CLOSED,
 *    CANCEL_WINDOW_CLOSED, BOOKING_NOT_FOUND, INVALID_INPUT)
 *  - RPC transport errors fail closed (no success)
 *  - ok:true returns { success: true, status: 'cancelled' }
 *  - unknown typed reasons still fail closed with CANCEL_FAILED
 */
type Row = Record<string, unknown>;

const state: {
  rpcResult: { data: Row | null; error: { code: string; message: string } | null };
  rpcCalls: { fn: string; args: Row }[];
  session: { user: { email: "guest@example.com" } } | null;
} = {
  rpcResult: { data: null, error: null },
  rpcCalls: [],
  // Real Supabase session shape: session.user.email (what the action reads).
  session: { user: { email: "guest@example.com" } },
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    rpc: (fn: string, args: Row) => {
      state.rpcCalls.push({ fn, args });
      return Promise.resolve(state.rpcResult);
    },
    auth: {
      getSession: async () => ({ data: { session: state.session } }),
    },
  })),
}));

import { cancelBooking } from "@/app/actions/bookings";

beforeEach(() => {
  state.rpcResult = { data: null, error: null };
  state.rpcCalls = [];
  state.session = { user: { email: "guest@example.com" } };
  headerGet.mockClear();
});

describe("cancelBooking — cancel_my_booking RPC wiring (ORN-84 P1-8)", () => {
  it("requires a session: no session → NOT_AUTHENTICATED, no RPC call", async () => {
    state.session = null;
    const res = await cancelBooking("6f1d2a34-9b8c-4e7f-8a2b-3c4d5e6f7a89");
    expect(res.success).toBe(false);
    expect(res.code).toBe("NOT_AUTHENTICATED");
    expect(state.rpcCalls).toHaveLength(0);
  });

  it("delegates to cancel_my_booking with p_booking_id on the session client", async () => {
    state.rpcResult = { data: { ok: true, status: "cancelled" }, error: null };
    const res = await cancelBooking("6f1d2a34-9b8c-4e7f-8a2b-3c4d5e6f7a89");
    expect(state.rpcCalls).toHaveLength(1);
    expect(state.rpcCalls[0].fn).toBe("cancel_my_booking");
    expect(state.rpcCalls[0].args.p_booking_id).toBe("6f1d2a34-9b8c-4e7f-8a2b-3c4d5e6f7a89");
    expect(res).toEqual({ success: true, status: "cancelled" });
  });

  it("maps NOT_AUTHORIZED without leaking the booking id", async () => {
    state.rpcResult = { data: { ok: false, reason: "NOT_AUTHORIZED" }, error: null };
    const res = await cancelBooking("7a2e3b45-8c9d-4f0a-9b3c-4d5e6f7a8b90");
    expect(res.success).toBe(false);
    expect(res.code).toBe("NOT_AUTHORIZED");
    expect(res.error).toBe("You can only cancel your own booking.");
    expect(state.rpcCalls).toHaveLength(1);
  });

  it("maps BOOKING_NOT_FOUND fail-closed", async () => {
    state.rpcResult = { data: { ok: false, reason: "BOOKING_NOT_FOUND" }, error: null };
    const res = await cancelBooking("8b3f4c56-9d0e-4a1b-8c4d-5e6f7a8b9c01");
    expect(res.success).toBe(false);
    expect(res.code).toBe("BOOKING_NOT_FOUND");
  });

  it("maps ALREADY_CLOSED without treating it as success", async () => {
    state.rpcResult = { data: { ok: false, reason: "ALREADY_CLOSED" }, error: null };
    const res = await cancelBooking("6f1d2a34-9b8c-4e7f-8a2b-3c4d5e6f7a89");
    expect(res.success).toBe(false);
    expect(res.code).toBe("ALREADY_CLOSED");
  });

  it("maps CANCEL_WINDOW_CLOSED (free-cancellation window expired)", async () => {
    state.rpcResult = { data: { ok: false, reason: "CANCEL_WINDOW_CLOSED" }, error: null };
    const res = await cancelBooking("6f1d2a34-9b8c-4e7f-8a2b-3c4d5e6f7a89");
    expect(res.success).toBe(false);
    expect(res.code).toBe("CANCEL_WINDOW_CLOSED");
  });

  it("maps INVALID_INPUT fail-closed", async () => {
    state.rpcResult = { data: { ok: false, reason: "INVALID_INPUT" }, error: null };
    const res = await cancelBooking("not-a-uuid");
    expect(res.success).toBe(false);
    expect(res.code).toBe("INVALID_INPUT");
  });

  it("fails closed on unknown typed reasons (CANCEL_FAILED, no silent success)", async () => {
    state.rpcResult = { data: { ok: false, reason: "SOMETHING_NEW" }, error: null };
    const res = await cancelBooking("6f1d2a34-9b8c-4e7f-8a2b-3c4d5e6f7a89");
    expect(res.success).toBe(false);
    expect(res.code).toBe("CANCEL_FAILED");
  });

  it("fails closed on RPC transport errors (PGRST202 → RPC_UNAVAILABLE)", async () => {
    state.rpcResult = { data: null, error: { code: "PGRST202", message: "Could not find the function" } };
    const res = await cancelBooking("6f1d2a34-9b8c-4e7f-8a2b-3c4d5e6f7a89");
    expect(res.success).toBe(false);
    expect(res.code).toBe("RPC_UNAVAILABLE");
  });

  it("rejects a non-uuid booking id before calling the RPC (INVALID_INPUT)", async () => {
    state.rpcResult = { data: { ok: true, status: "cancelled" }, error: null };
    const res = await cancelBooking("definitely-not-a-uuid");
    expect(res.success).toBe(false);
    expect(res.code).toBe("INVALID_INPUT");
    expect(state.rpcCalls).toHaveLength(0);
  });
});
