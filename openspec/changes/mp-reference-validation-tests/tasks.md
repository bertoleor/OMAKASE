# Tasks: MP Reference Validation Tests

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 40–80 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | single PR |
| Delivery strategy | single-pr |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

## Phase 1: RED — Boundary Tests First

- [x] 1.1 Append `describe("createBookingInputSchema — MP reference boundaries")` to `src/lib/validations.test.ts`; run `pnpm test src/lib/validations.test.ts` and record RED vs GREEN per case

## Phase 2: GREEN — Fix Only If Gap

- [x] 2.1 If any boundary case fails, fix `src/lib/validations.ts` minimally until green; otherwise no prod change

## Phase 3: Verify

- [x] 3.1 Full `pnpm test src/lib/validations.test.ts` green + `pnpm typecheck`
- [x] 3.2 Linear mirror (new micro-issue) to Done with evidence; commit + push (`master`)
