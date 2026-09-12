# Design: Slice N1 — Abuse Rate-Limit (auditoria-general)

## Technical Approach

Wire the existing dead `rateLimiters` (currently zero imports) into the two abuse
vectors — anon `createBooking` INSERT and `sendAuthMagicLink` — plus honeypot +
time-trap on the public booking form, and move RBAC role resolution from
client-settable `user_metadata` to `profiles`. All changes additive; no schema
migration. Server actions return `Result`-shaped payloads (they cannot set HTTP
status), so the 429 contract is modeled in the return payload and mapped to
friendly UI; a pure-HTTP 429 applies only to route handlers (future D).

## Architecture Decisions

| Decision                     | Option                                           | Tradeoff                                                                        | Choice                                                                                                                                                                                                                       |
| ---------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1. Booking threshold**     | `standard` 20/min vs lower 10/min                | Lower catches bursts; higher avoids false positives on family/table selects     | **`standard` 20/min** — booking form is single-submit per human; 20/min only trips bots. Monitor logs in N2.                                                                                                                 |
| **2. Magic-link thresholds** | As-specified email 3/5min + IP 5/5min vs tighter | Tighter reduces bomb risk; looser avoids blocking shared NAT                    | **Keep spec defaults** — email 3/5min AND IP 5/5min (both, AND not OR). Flag for user confirmation: if shared-office IP falsely trips 5/5min, raise IP to 10/5min.                                                           |
| **3. Payments gate**         | captcha vs honeypot-only                         | Captcha adds friction to legit flow; honeypot is zero-friction                  | **Honeypot-only for N1** — payments write only via the already-gated `createBooking` path. Full RLS hardening (drop `check(true)`, service-role writes) is a schema migration → **defer to ops slice D** (noted, not built). |
| **4. Rate-limit backend**    | `InMemoryRateLimiter` (single-instance) vs Redis | In-memory resets on restart, breaks across instances; Redis is correct for prod | **Use in-memory for N1** behind an interface; Redis implementation noted for **ops slice D** (adds `ioredis`, env-driven backend). Document in `rate-limit.ts`.                                                              |
| **5. Server-action 429**     | HTTP 429 vs payload code                         | Actions can't set status; HTTP 429 impossible here                              | **Payload contract**: `{ success:false, code:"RATE_LIMITED", error, retryAfter }`. Client maps to friendly wait message. Pure-HTTP 429 if moved to route handlers.                                                           |

Requires **user input**: item 2's IP cap (10/5min) if shared-NAT false positives observed. Default chosen now: 5/5min.

## Architecture / Data Flow

New server-action helper in `src/lib/rate-limit.ts`:

```ts
checkRateLimit(key: string, cfg: { limit: number; windowMs: number }):
  { allowed: boolean; retryAfter: number }
```

Reuses the existing `InMemoryRateLimiter` singleton. Anti-abuse validation in
`src/lib/anti-abuse.ts`:

```ts
validateSubmission(form: { honeypot?: string; renderedAt?: string },
  opts: { minElapsedMs: number }):
  { ok: true } | { ok: false; reason: "honeypot" | "time-trap" }
```

```
ConfirmationStep (form + honeypot + renderedAt)
  └─ createBooking (action)
       ├─ validateSubmission → honeypot=bot: return success-looking, NO INSERT/email
       ├─ validateSubmission → time-trap <3s: reject suspected-bot, log, allow retry
       ├─ checkRateLimit(ip:ua, standard 20/min) → !allowed: return 429 payload, NO INSERT
       └─ INSERT bookings + payments  (payments only reachable here → gated)

login form ──> sendAuthMagicLink (action)
       ├─ checkRateLimit(email, email cfg 3/5min) AND checkRateLimit(ip, 5/5min)
       │    → !allowed: 429 payload, NO generateLink/Resend
       └─ generateLink → sendMagicLinkEmail
```

RBAC: `src/lib/roles.ts` exports `getUserRole(uid)` wrapped in React `cache()`
(per-request memo, avoids duplicate SELECTs). Server truth → client via new
server action `getMyRole()` in `src/app/actions/roles.ts`.

## File Changes

| File                                                | Action | Description                                                                                 |
| --------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------- |
| `src/lib/rate-limit.ts`                             | Modify | Add `checkRateLimit` server-action helper + Redis note                                      |
| `src/lib/anti-abuse.ts`                             | Create | Honeypot + time-trap validation, constant `MIN_ELAPSED_MS=3000`                             |
| `src/app/actions/bookings.ts`                       | Modify | Wire honeypot/time-trap/rate-limit before INSERT; 429 payload                               |
| `src/app/actions/admin.ts`                          | Modify | Email+IP rate limit in `sendAuthMagicLink`; switch `checkAdminPermission` to `getUserRole`  |
| `src/components/booking/steps/ConfirmationStep.tsx` | Modify | Hidden honeypot field + `renderedAt` timestamp; map 429 to wait+retry                       |
| `src/app/mis-reservas/login/page.tsx`               | Modify | Map magic-link 429 to friendly message + cooldown re-enable                                 |
| `src/lib/roles.ts`                                  | Create | `getUserRole(uid)` via `profiles.role`, `cache()`d                                          |
| `src/app/actions/roles.ts`                          | Create | `getMyRole()` server action exposing server truth                                           |
| `src/hooks/useUserRole.ts`                          | Modify | Call `getMyRole()`; drop `user_metadata.role` trust                                         |
| `supabase/backfill-profiles-role.sql`               | Create | One-time backfill `profiles.role` from `user_metadata.role` (legacy users, no profiles row) |

## 429 Contract

```ts
// server action return on rejection (Result-shaped, mirrors src/core/result.ts)
{ success: false, code: "RATE_LIMITED", error: "Too many requests",
  retryAfter: 47 }
```

UI: friendly localized "please wait Ns" via `useLanguage`; submit button disabled
for `retryAfter` seconds then re-enables. Time-trap fast-submit returns
success-looking only for honeypot; for time-trap returns a distinct retryable
error so legit autofill humans are not locked out.

## Testing Strategy (manual/scripted — vitest unwired until slice C)

| Spec scenario             | Proof                                                                                                                  |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Happy path under limit    | Script: 20 sequential `createBooking` calls via HTTP client → all INSERT, `X-RateLimit-Remaining`/`retryAfter` present |
| Burst exceeds limit       | Script: 21st call within 60s → returns 429 payload, assert bookings row count unchanged                                |
| Normal magic-link send    | Script: 3 sends to an email → all generate + email                                                                     |
| Repeated send rejected    | Script: 4th send to same email in 5 min → 429, assert Resend not called (stub/mock)                                    |
| Bot fills honeypot        | Script: POST with honeypot non-empty → success-looking, assert zero INSERT                                             |
| Legit fast submit         | Script: submit `renderedAt` <3s → rejected-as-suspected-bot, assert retry succeeds on resubmit                         |
| Direct anon payments POST | Note: `check(true)` still accepts at API — covered by gating (only `createBooking` path writes); full RLS fix in D     |
| Role from profiles        | Test `getUserRole` with `profiles.role='admin'` & `user_metadata.role` unset → admin                                   |
| Tampered metadata ignored | `user_metadata.role='admin'`, `profiles.role='staff'` → staff, admin denied                                            |
| Legacy backfill           | Run SQL, assert legacy manager gets `profiles.role='manager'`                                                          |
| UI wait message           | Manual: trigger 429 → friendly message + button re-enables after cooldown                                              |

Each above is a `ts-node` script or manual step recorded in the slice PR; formal
unit suites move to slice C.

## Migration / Rollout

`supabase/backfill-profiles-role.sql` is a data backfill (no schema change) — run
once via SQL editor or `supabase db push`. New signups unaffected
(`handle_new_user` already creates `profiles`). Rollback: disable the
rate-limit/anti-abuse guard in `bookings.ts`/`admin.ts` → prior behavior restored;
all changes additive.

## Open Questions

- [x] Thresholds 1–4 resolved with defaults above (item 2 needs user eyes on IP cap).
- [ ] User confirm: magic-link per-IP 5/5min acceptable, or raise to 10/5min?
