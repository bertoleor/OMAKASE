# Design: Cancel Policy Window — isCancellationAllowed

## Technical Approach

Add a pure, dependency-free helper in a new `src/lib/cancel-policy.ts`
reusing the `@/lib` convention. It computes the free-cancellation gate as a
time-remaining comparison against a default 4h window; returns `true` iff
`bookingStart - now >= windowHours` (inclusive boundary). No I/O, no Zod, no
Date-fns — raw epoch millis, deterministic and unit-testable. Backs the
`cancel-policy` capability; consumers (booking action, "Mis Reservas") wire
into it later without changing the function's signature.

## Architecture Decisions

| Decision | Option | Tradeoff | Choice |
|----------|--------|----------|--------|
| **1. Boundary** | `>=` (inclusive) vs `>` (exclusive) | Exclusive would deny a cancel exactly at the 4h cutoff | **`>=` inclusive** — matches docs example "up to 240 min before"; fixed in tests |
| **2. Default window** | const default `4` vs required arg | Required arg forces callers to repeat a constant | **Default param `windowHours = 4`** — mirrors FREE_CANCEL_MINUTES_BEFORE=240 |
| **3. Dependency** | date-fns vs raw Date.getTime | date-fns adds a dep for trivial math | **Raw `getTime()`** difference in ms vs `windowHours * 3_600_000` |
| **4. Location** | new `src/lib/cancel-policy.ts` vs append to `validations.ts` | `validations.ts` hosts Zod schemas; mixing scopes bloat | **New file** — single-responsibility, own test file, avoids touching `validations.test.ts` |

## Data Flow

```
isCancellationAllowed(now: Date, bookingStart: Date, windowHours = 4)
  remaining = bookingStart.getTime() - now.getTime()      // ms
  minMs     = windowHours * 3_600_000
  return remaining >= minMs                                 // inclusive boundary
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/lib/cancel-policy.ts` | Create | Pure helper `isCancellationAllowed` (+ doc comment) |
| `src/lib/cancel-policy.test.ts` | Create | Vitest suite covering the 5 spec scenarios |

## Interfaces / Contracts

```ts
export function isCancellationAllowed(
  now: Date,
  bookingStart: Date,
  windowHours: number = 4
): boolean;
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | All 5 spec scenarios | Vitest, fixed `new Date(...)` fixtures, boundary inclusive at 4h |

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file
classification, or process-integration boundary.

## Migration / Rollout

No migration required. Additive helper with no consumers yet; rollback = delete
the two new files.

## Open Questions

None.