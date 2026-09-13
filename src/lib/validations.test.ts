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
