import type { BookingStatusDb, TableZoneDb } from "@/types/database.types";

/**
 * Booking capacity / overlap guard (ORN P1).
 *
 * Domain model: bookings are keyed by (zone, booking_date, booking_time).
 * A zone advertises a `capacity_pax`; a slot's occupancy is the cumulative
 * pax of every NON-cancelled / NON-no_show row for that zone+date+time.
 * This is a pure, side-effect-free module so it can be unit-tested without a
 * database — the server action feeds it the rows it just read.
 *
 * Cancelled / no_show rows FREE the slot and do not consume capacity.
 */

export interface CapacityBooking {
  zone: string;
  booking_date: string; // YYYY-MM-DD
  booking_time: string; // "HH:MM"
  pax: number;
  status: BookingStatusDb | "no-show" | string;
}

/**
 * Statuses that still hold the table (consume capacity / block overlap).
 * Exported for tests and admin tooling that need the same live-set the
 * server-side gate (try_create_booking) enforces.
 */
export const LIVE_STATUSES = new Set(["pending", "confirmed", "seated", "completed"]);

function isLive(b: Pick<CapacityBooking, "status">): boolean {
  return LIVE_STATUSES.has(b.status);
}

function sameSlot(b: CapacityBooking, zone: string, date: string, time: string): boolean {
  return b.zone === zone && b.booking_date === date && b.booking_time === time;
}

/**
 * Cumulative pax currently consuming a zone+date+time slot.
 * Cancelled / no_show rows are excluded (slot freed).
 */
export function bookingOccupancy(
  existing: CapacityBooking[],
  zone: string,
  date: string,
  time: string,
): number {
  return existing.reduce(
    (sum, b) => (sameSlot(b, zone, date, time) && isLive(b) ? sum + b.pax : sum),
    0,
  );
}

/**
 * Whether any OTHER live booking already holds the same zone+date+time slot.
 * Used as a cheap double-submit / solape pre-check at the server boundary.
 */
export function hasSlotOverlap(
  existing: CapacityBooking[],
  candidate: Omit<CapacityBooking, "pax" | "status"> & {
    pax: number;
    status: string;
  },
): boolean {
  return existing.some(
    (b) =>
      b.zone === candidate.zone &&
      b.booking_date === candidate.booking_date &&
      b.booking_time === candidate.booking_time &&
      isLive(b),
  );
}

export interface CapacityDecision {
  accepted: boolean;
  occupancy: number;
  capacity: number;
  remainingPax: number;
  reason?: "CAPACITY_EXCEEDED";
}

/**
 * Decide whether a new booking of `candidate.pax` fits within a zone's
 * `capacityPax` for its slot, given the live occupancy already stored.
 *
 * Note: idempotency keys are handled separately (unique partial index +
 * 23505 race re-read in the server action). This function is purely about
 * physical capacity, not identity dedup.
 */
export function canAcceptBooking(
  existing: CapacityBooking[],
  candidate: Omit<CapacityBooking, "status"> & { status: string },
  { zoneCapacityPax }: { zoneCapacityPax: number },
): CapacityDecision {
  const occupancy = bookingOccupancy(
    existing,
    candidate.zone,
    candidate.booking_date,
    candidate.booking_time,
  );

  // Misconfiguration guard: a zone with 0 capacity cannot seat anyone.
  if (zoneCapacityPax <= 0) {
    return {
      accepted: false,
      occupancy,
      capacity: zoneCapacityPax,
      remainingPax: 0,
      reason: "CAPACITY_EXCEEDED",
    };
  }

  const remainingPax = zoneCapacityPax - occupancy;
  const accepted = candidate.pax <= remainingPax;

  return {
    accepted,
    occupancy,
    capacity: zoneCapacityPax,
    remainingPax: Math.max(remainingPax, 0),
    ...(accepted ? {} : { reason: "CAPACITY_EXCEEDED" as const }),
  };
}

/** Resolve a DB zone value to the public TableZoneDb enum for lookups. */
export function isTableZoneDb(value: string): value is TableZoneDb {
  return value === "indoor_tables" || value === "outdoor_pergola" || value === "indoor_bar";
}
