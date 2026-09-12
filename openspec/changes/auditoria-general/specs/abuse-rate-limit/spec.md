# abuse-rate-limit Specification

## Purpose

Close the active security hole in slice N1: anon booking INSERT and magic-link send are unrate-limited, `check(true)` policies on `bookings`/`payments` accept bot traffic, and RBAC role comes from client-settable `user_metadata`. This spec wires existing `rateLimiters`, adds honeypot protection, and moves role resolution to `profiles`.

## Requirements

### Requirement: Anon booking create rate limit

The server action `createBooking` SHALL apply a per-client rate limit before the INSERT to `bookings`. Default threshold: `standard` (20 req/min per IP+UA), **flagged OPEN for review** against legit burst usage. When limited, the action MUST NOT perform the INSERT.

#### Scenario: Happy path under limit

- GIVEN a client below 20 booking submissions in the window
- WHEN `createBooking` is invoked
- THEN the INSERT succeeds AND `X-RateLimit-Remaining` is returned

#### Scenario: Burst exceeds limit

- GIVEN a client submits 21 booking requests within 60s
- WHEN the 21st `createBooking` is invoked
- THEN no INSERT occurs AND the action returns `{ success:false, error:"Too many requests" }`

### Requirement: Magic-link send rate limit

`sendAuthMagicLink` SHALL rate-limit by email address AND by IP before calling `generateLink`/Resend. Default: `email` (3 per 5 min) per email, plus 5 per 5 min per IP — thresholds **OPEN for review**.

#### Scenario: Normal send succeeds

- GIVEN an email under its 3-per-5-min quota
- WHEN `sendAuthMagicLink` is invoked
- THEN a link is generated and emailed

#### Scenario: Repeated send rejected

- GIVEN 3 links already sent to an email in 5 min
- WHEN a 4th send is attempted
- THEN it fails WITHOUT calling Resend AND returns a friendly error

### Requirement: Honeypot on public booking form

The public booking form SHALL include a hidden honeypot field and a time-trap (min 3s between render and submit). `createBooking` SHALL reject submissions with a filled honeypot OR elapsed time under the trap.

#### Scenario: Bot fills honeypot

- GIVEN a submission with the hidden honeypot field non-empty
- WHEN `createBooking` is invoked
- THEN it returns success-looking response but performs NO INSERT AND sends NO email

#### Scenario: Legit human fast submit

- GIVEN a human submits in under 3s (form autofill)
- WHEN `createBooking` is invoked
- THEN the request is rejected as suspected-bot with no INSERT (edge case: log + allow retry)

### Requirement: Payments INSERT abuse mitigation

The `payments` `check(true)` insert policy SHALL be gated server-side: payment INSERTs MUST only occur from a rate-limited, honeypot-validated server action (never direct anon API).

#### Scenario: Direct anon payments POST blocked

- GIVEN an anon request POSTing directly to payments with no valid honeypot/rate-limit token
- WHEN the request is processed
- THEN it is rejected BEFORE reaching the INSERT

#### Scenario: Gated server flow succeeds

- GIVEN a booking flow that passed honeypot + rate limit
- WHEN the payment is written server-side
- THEN the INSERT succeeds under existing policy

### Requirement: RBAC role from profiles

Role resolution SHALL read `profiles.role` server-side (helper `getUserRole(uid)`), NOT `user.user_metadata.role`. `useUserRole` SHALL call the server helper. `user_metadata.role` MAY remain for display but MUST NOT be trusted for authorization.

#### Scenario: Role resolved from profiles

- GIVEN an admin whose `profiles.role='admin'` but `user_metadata.role` unset
- WHEN role is resolved
- THEN `isAdmin` is true (authoritative source = profiles)

#### Scenario: Tampered metadata ignored

- GIVEN a user with `user_metadata.role='admin'` but `profiles.role='staff'`
- WHEN role is resolved
- THEN role is `staff` and admin capabilities are denied

### Requirement: Rate-limit response contract

Rate-limit rejections MUST return HTTP 429 with `Retry-After` and a friendly localized message; UI MUST surface "please wait" without a broken state.

#### Scenario: UI shows friendly wait message

- GIVEN a 429 from booking or magic-link action
- WHEN the client receives it
- THEN the UI shows a friendly retry-later message AND the submit button re-enables after cooldown

### Requirement: Backward compatibility

For users with an existing `profiles` row, no data migration is required; new signups continue via `handle_new_user`. A one-time backfill SHOULD populate `profiles.role` from `user_metadata.role` for legacy users.

#### Scenario: Legacy admin retains role

- GIVEN a legacy user with `user_metadata.role='manager'` and no profiles row
- WHEN the backfill runs
- THEN a `profiles` row is created with `role='manager'`

## Success Criteria

- [ ] Rate limit proven active on `createBooking` + `sendAuthMagicLink` (burst test returns 429, no INSERT/send)
- [ ] Honeypot catches a filled-field bot (no INSERT, no email)
- [ ] RBAC role resolves from `profiles`; tampered metadata yields no privilege
- [ ] No false positives: legit under-limit, post-trap human booking succeeds end-to-end
- [ ] Rollback: disabling the rate-limit guard restores prior behavior; all changes additive, no schema migration
