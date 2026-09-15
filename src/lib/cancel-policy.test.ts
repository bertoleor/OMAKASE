import { describe, it, expect } from "vitest";
import { isCancellationAllowed } from "@/lib/cancel-policy";

/**
 * cancel-policy capability — free-cancellation window gate.
 * Mirrors the scenarios in openspec/changes/cancel-policy-window/specs/cancel-policy/spec.md
 * (Free-window gate requirement). Boundary is inclusive: `true` while at least
 * `windowHours` remain before the slot start.
 */

const bookingStart = new Date("2026-09-20T20:00:00-03:00");

describe("isCancellationAllowed — free-window gate", () => {
  it("returns true when far ahead of start (default 4h window)", () => {
    const now = new Date("2026-09-20T12:00:00-03:00"); // 8h before
    expect(isCancellationAllowed(now, bookingStart)).toBe(true);
  });

  it("returns true exactly at the 4h boundary (windowHours=4)", () => {
    const now = new Date("2026-09-20T16:00:00-03:00"); // exactly 4h before
    expect(isCancellationAllowed(now, bookingStart, 4)).toBe(true);
  });

  it("returns false inside the window (1h before, windowHours=4)", () => {
    const now = new Date("2026-09-20T19:00:00-03:00"); // 1h before
    expect(isCancellationAllowed(now, bookingStart, 4)).toBe(false);
  });

  it("returns false after the slot has started", () => {
    const now = new Date("2026-09-20T21:00:00-03:00"); // 1h after start
    expect(isCancellationAllowed(now, bookingStart)).toBe(false);
  });

  it("honors a custom window (2h before with windowHours=2)", () => {
    const now = new Date("2026-09-20T17:00:00-03:00"); // 3h before
    expect(isCancellationAllowed(now, bookingStart, 2)).toBe(true);
  });
});