import { describe, it, expect } from "vitest";
import { createBookingInputSchema } from "@/lib/validations";

/**
 * PCI (ORN-86): the booking server action must never accept, persist, or log
 * card data (PAN, CVV, expiry, reusable payment tokens). Only Mercado Pago
 * reference IDs may accompany a booking. `createBookingInputSchema` is `.strict()`,
 * so any unknown key — including raw card fields — is rejected outright.
 */

const validBooking = {
  customerName: "Juan Pérez",
  customerEmail: "juan@example.com",
  customerPhone: "+54 11 5555 5555",
  date: "2026-09-20",
  timeSlot: "20:30",
  pax: 2,
  zone: "indoor-tables",
  idempotencyKey: "123e4567-e89b-42d3-a456-426614174000",
  mpPaymentId: "123456789",
  mpPreferenceId: "omakase-20-20-30",
};

describe("createBookingInputSchema — PCI card-data rejection", () => {
  it("accepts a booking with only Mercado Pago reference IDs", () => {
    const result = createBookingInputSchema.safeParse(validBooking);
    expect(result.success).toBe(true);
  });

  it("rejects a raw card number field", () => {
    const result = createBookingInputSchema.safeParse({
      ...validBooking,
      cardNumber: "4111111111111111",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a CVV field", () => {
    const result = createBookingInputSchema.safeParse({
      ...validBooking,
      cvv: "123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a card expiry field", () => {
    const result = createBookingInputSchema.safeParse({
      ...validBooking,
      cardExpiry: "12/29",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a legacy reusable payment token", () => {
    const result = createBookingInputSchema.safeParse({
      ...validBooking,
      paymentToken: "tok_reusable_abc123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects legacy card brand / last-four fields", () => {
    const result = createBookingInputSchema.safeParse({
      ...validBooking,
      cardBrand: "visa",
      cardLastFour: "1111",
    });
    expect(result.success).toBe(false);
  });
});

/*
 * ORN-141 edge cases: these mirror the RLS `with check` on bookings and the
 * idempotency contract enforced in `createBooking`. Keeping the Zod boundary
 * in lockstep with the DB policy prevents a client from crafting a row that
 * the policy would reject (or worse, a row that skips the `pending` gate).
 */

describe("createBookingInputSchema — RLS/business edge cases (ORN-141)", () => {
  it("accepts pax at lower and upper bounds (1 and 20)", () => {
    expect(createBookingInputSchema.safeParse({ ...validBooking, pax: 1 }).success).toBe(true);
    expect(createBookingInputSchema.safeParse({ ...validBooking, pax: 20 }).success).toBe(true);
  });

  it("rejects pax outside [1,20] (over-forged capacity, matches RLS with check)", () => {
    expect(createBookingInputSchema.safeParse({ ...validBooking, pax: 0 }).success).toBe(false);
    expect(createBookingInputSchema.safeParse({ ...validBooking, pax: 21 }).success).toBe(false);
  });

  it("never accepts a forged status field (status is RLS-guarded, set server-side)", () => {
    const result = createBookingInputSchema.safeParse({
      ...validBooking,
      status: "confirmed",
    });
    // `.strict()` must reject the unknown `status` key.
    expect(result.success).toBe(false);
  });

  it("accepts an oversize email only up to the RLS max (255)", () => {
    const ok = createBookingInputSchema.safeParse({
      ...validBooking,
      customerEmail: `${"a".repeat(200)}@example.com`, // 213 ≤ 255 → ok
    });
    expect(ok.success).toBe(true);
    const long = `${"a".repeat(250)}@example.com`; // 262 > 255 → rejected
    expect(long.length).toBeGreaterThan(255);
    expect(createBookingInputSchema.safeParse({ ...validBooking, customerEmail: long }).success).toBe(false);
  });

  it("accepts a valid uuid idempotency key and rejects a non-uuid one", () => {
    const ok = createBookingInputSchema.safeParse({
      ...validBooking,
      idempotencyKey: "123e4567-e89b-42d3-a456-426614174000",
    });
    expect(ok.success).toBe(true);
    const bad = createBookingInputSchema.safeParse({
      ...validBooking,
      idempotencyKey: "not-a-uuid",
    });
    expect(bad.success).toBe(false);
  });
});
