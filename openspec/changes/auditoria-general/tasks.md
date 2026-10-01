# Tasks: N1 — Abuse Rate-Limit (auditoria-general)

## Review Workload Forecast

| Field                   | Value                       |
| ----------------------- | --------------------------- |
| Estimated changed lines | ~250–350                    |
| 400-line budget risk    | Low                         |
| Chained PRs recommended | Yes                         |
| Suggested split         | PR1 → PR2 → PR3 → PR4 → PR5 |
| Delivery strategy       | force-chained               |
| Chain strategy          | stacked-to-main             |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: Low

Magic-link IP cap resolved by orchestrator to **10/5min** (overrides design default 5/5min). All thresholds fixed; no open decision.

### Suggested Work Units

| Unit | Goal                          | PR  | Notes                           |
| ---- | ----------------------------- | --- | ------------------------------- |
| 1    | Anti-abuse + rate-limit infra | PR1 | New helpers, base of all wiring |
| 2    | Booking wiring                | PR2 | Depends PR1                     |
| 3    | Magic-link wiring             | PR3 | Depends PR1                     |
| 4    | RBAC + backfill               | PR4 | Depends PR3 (admin.ts switch)   |
| 5    | UI 429 handling               | PR5 | Depends PR2/PR3                 |

## Phase 1: Infrastructure

- [x] 1.1 (PR1) `src/lib/rate-limit.ts`: add `checkRateLimit(key, {limit,windowMs}): {allowed, retryAfter}` reusing `InMemoryRateLimiter`; add Redis note for slice D. Verify: ts-node script asserts 20 allows then reject with `retryAfter`.
- [x] 1.2 (PR1) `src/lib/anti-abuse.ts` (create): `validateSubmission({honeypot?, renderedAt?}, {minElapsedMs})` + `MIN_ELAPSED_MS=3000`. Verify: script — empty honeypot ok, filled rejects, `<3s` rejects.

## Phase 2: Booking wiring

- [x] 2.1 (PR2) `src/app/actions/bookings.ts`: call `validateSubmission` before INSERT — honeypot returns success-looking (no INSERT/email); time-trap returns retryable error. Verify: scenario "Bot fills honeypot" / "Legit human fast submit".
- [x] 2.2 (PR2) `src/app/actions/bookings.ts`: call `checkRateLimit(ip:ua, standard 20/min)` before INSERT; reject returns `{success:false, code:"RATE_LIMITED", error, retryAfter}`; no INSERT. Verify: script 21st call in 60s → 429, bookings count unchanged.
- [x] 2.3 (PR2) `src/components/booking/steps/ConfirmationStep.tsx`: add hidden honeypot field + `renderedAt` timestamp. Verify: rendered input renders hidden; timestamp set on mount.

## Phase 3: Magic-link wiring

- [x] 3.1 (PR3) `src/app/actions/admin.ts` in `sendAuthMagicLink`: `checkRateLimit(email, 3/5min)` AND `checkRateLimit(ip, 10/5min)` before `generateLink`; reject → 429 payload, no Resend. Verify: script 4th email send in 5min → 429, Resend stubbed not called.

## Phase 4: RBAC + backfill

- [ ] 4.1 (PR4) `src/lib/roles.ts` (create): `getUserRole(uid)` reading `profiles.role`, wrapped in React `cache()`. Verify: `profiles.role='admin'` & metadata unset → admin (SC "Role from profiles"); tampered metadata ignored → staff, admin denied.
- [ ] 4.2 (PR4) `src/app/actions/roles.ts` (create): `getMyRole()` server action returning server truth. Verify: manual call returns role from profiles.
- [ ] 4.3 (PR4) `src/hooks/useUserRole.ts`: call `getMyRole()`, drop `user_metadata.role` trust. Verify: tampered metadata yields no privilege.
- [ ] 4.4 (PR4) `src/app/actions/admin.ts`: switch `checkAdminPermission` to `getUserRole`. Verify: staff with metadata 'admin' denied.
- [ ] 4.5 (PR4) `supabase/backfill-profiles-role.sql` (create): one-time insert `profiles.role` from `user_metadata.role` for legacy users. Verify: run SQL → legacy manager gets `profiles.role='manager'` (SC "Legacy admin retains role").

## Phase 5: UI 429 handling

- [ ] 5.1 (PR5) `ConfirmationStep.tsx`: map `code:"RATE_LIMITED"` → friendly localized wait via `useLanguage`; disable submit for `retryAfter`s then re-enable. Verify: scenario "UI shows friendly wait message" manual.
- [ ] 5.2 (PR5) `src/app/mis-reservas/login/page.tsx`: map magic-link 429 → friendly message + cooldown re-enable. Verify: manual 4th send → wait message, button re-enables after cooldown.

## Rules

- `.agentrules` + restaurant-auditor: no comments, no `any`, AppError/AppLogger for flow breaks, dumb UI components, Zod schemas. Audit via `npx ts-node .agent/skills/restaurant-auditor/audit-engine.ts` before commit.
- Vitest unwired until slice C → verification is ts-node scripts / manual per design proof table; no fake test claims. `check(true)` NOT removed in N1 (deferred to slice D).
