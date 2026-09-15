/**
 * cancel-policy — free-cancellation window gate.
 *
 * Pure, dependency-free helper deciding whether a booking may be cancelled
 * free of charge for a given `now` and `bookingStart`. Allowed while at least
 * `windowHours` remain before the slot start (inclusive boundary).
 *
 * The default `windowHours = 4` mirrors FREE_CANCEL_MINUTES_BEFORE = 240
 * described in docs/sdd-ejemplo-cancel-policy (spec "Free Cancellation Window").
 */

const MS_PER_HOUR = 3_600_000;

export function isCancellationAllowed(
  now: Date,
  bookingStart: Date,
  windowHours: number = 4
): boolean {
  const remainingMs = bookingStart.getTime() - now.getTime();
  const minMs = windowHours * MS_PER_HOUR;
  return remainingMs >= minMs;
}