import { describe, it, expect } from "vitest";
import {
  bookingOccupancy,
  canAcceptBooking,
  hasSlotOverlap,
  type CapacityBooking,
} from "@/lib/booking-availability";

/**
 * ORN P1 — bookings capacity/overlap guard.
 * Domain model: bookings are keyed by (zone, booking_date, booking_time).
 * Capacity = cumulative pax of non-cancelled / non-no-show rows for a zone+date+time.
 * Overlap = any other non-cancelled row already holds the same zone+date+time slot.
 */

const mk = (over: Partial<CapacityBooking>): CapacityBooking => ({
  zone: "indoor_tables",
  booking_date: "2026-10-01",
  booking_time: "20:30",
  pax: 4,
  status: "pending",
  ...over,
});

describe("bookingOccupancy — pax consumed per zone+date+time slot", () => {
  it("returns 0 for an empty slot", () => {
    expect(bookingOccupancy([], "indoor_tables", "2026-10-01", "20:30")).toBe(0);
  });

  it("sums pax of non-cancelled rows for the exact slot only", () => {
    const existing = [
      mk({ pax: 2, status: "confirmed" }),
      mk({ pax: 3, status: "pending" }),
      mk({ booking_time: "21:30", pax: 9, status: "pending" }), // different slot
      mk({ zone: "outdoor_pergola", pax: 5, status: "pending" }), // different zone
      mk({ booking_date: "2026-10-02", pax: 6, status: "pending" }), // different date
      mk({ pax: 4, status: "cancelled" }), // freed slot
      mk({ pax: 4, status: "no_show" }), // freed slot
    ];
    expect(bookingOccupancy(existing, "indoor_tables", "2026-10-01", "20:30")).toBe(5);
  });
});

describe("hasSlotOverlap — same zone+date+time with a live booking", () => {
  it("is false when no other live booking holds the slot", () => {
    expect(hasSlotOverlap([], mk({}))).toBe(false);
    expect(hasSlotOverlap([mk({ booking_time: "19:00" })], mk({}))).toBe(false);
  });

  it("is true for any other non-cancelled row in the same slot", () => {
    expect(hasSlotOverlap([mk({ pax: 2 })], mk({ pax: 3 }))).toBe(true);
  });

  it("ignores cancelled and no_show rows (slot is freed)", () => {
    const freed = [mk({ pax: 2, status: "cancelled" }), mk({ pax: 2, status: "no_show" })];
    expect(hasSlotOverlap(freed, mk({}))).toBe(false);
  });

  it("does not overlap when zone/date/time differ", () => {
    const existing = [
      mk({ zone: "indoor_bar" }),
      mk({ booking_date: "2026-10-02" }),
      mk({ booking_time: "22:00" }),
    ];
    expect(hasSlotOverlap(existing, mk({}))).toBe(false);
  });
});

describe("canAcceptBooking — capacity decision for a new booking", () => {
  it("accepts when occupancy + pax fits within zone capacity", () => {
    const existing = [mk({ pax: 3 })];
    const result = canAcceptBooking(existing, mk({ pax: 5 }), {
      zoneCapacityPax: 10,
    });
    expect(result.accepted).toBe(true);
    expect(result.occupancy).toBe(3);
    expect(result.capacity).toBe(10);
  });

  it("rejects when occupancy + pax exceeds zone capacity", () => {
    const existing = [mk({ pax: 8 })];
    const result = canAcceptBooking(existing, mk({ pax: 5 }), {
      zoneCapacityPax: 10,
    });
    expect(result.accepted).toBe(false);
    expect(result.reason).toBe("CAPACITY_EXCEEDED");
    expect(result.remainingPax).toBe(2);
  });

  it("boundary: exactly at capacity is accepted", () => {
    const existing = [mk({ pax: 5 })];
    const result = canAcceptBooking(existing, mk({ pax: 5 }), {
      zoneCapacityPax: 10,
    });
    expect(result.accepted).toBe(true);
  });

  it("zero zone capacity never accepts a booking (misconfiguration guard)", () => {
    const result = canAcceptBooking([], mk({ pax: 1 }), {
      zoneCapacityPax: 0,
    });
    expect(result.accepted).toBe(false);
  });
});
