# Tasks: Cancel Policy Window — isCancellationAllowed

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 60-110 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Delivery strategy | single-pr |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Helper + tests + SDD | PR 1 | `npx vitest run src/lib/cancel-policy.test.ts` | `npx vitest run` + `npx tsc --noEmit` (node-only, no server) | delete `cancel-policy.ts` + `.test.ts` |

## Phase 1: RED — tests first

- [x] 1.1 Create `src/lib/cancel-policy.test.ts` covering all 5 spec scenarios of `cancel-policy` spec (append-file: dedicated suite).
- [x] 1.2 Run `npx vitest run src/lib/cancel-policy.test.ts` → confirm it FAILS (import/`isCancellationAllowed` missing).

## Phase 2: GREEN — minimal implementation

- [x] 2.1 Create `src/lib/cancel-policy.ts` with pure `isCancellationAllowed(now, bookingStart, windowHours = 4)` implementing the inclusive `>=` boundary.
- [x] 2.2 Run `npx vitest run` → full suite green (new tests pass, existing 16 unaffected).

## Phase 3: Verify

- [x] 3.1 Run `npx tsc --noEmit` → no type errors.
- [x] 3.2 Run `next build` (or documented fallback) → no errors.
- [x] 3.3 Confirm traceability: each spec scenario mapped to >= 1 test in `cancel-policy.test.ts`.
- [x] 3.4 Write `verify-report.md` with real command evidence (exit codes / output hashes).

## Traceability

| Requisito (spec) | Tests |
|------------------|-------|
| Free-window gate — far ahead | scenario 1 |
| Free-window gate — boundary | scenario 2 |
| Free-window gate — inside | scenario 3 |
| Free-window gate — after start | scenario 4 |
| Default/custom window | scenario 5 |