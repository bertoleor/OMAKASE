# Proposal: General Project Audit — Health, Structure, Security, Fluidity

## Intent

- Convert audit findings (#930 + addendum #937 + final gap sweep #941) into chained, shippable fixes. Fluidity stays top priority; **PWA-installable** and **pago-por-mesa** co-primordial. Brand canonical = **Omakase**, zero hardcodes.
- Close the three NEW holes the gap sweep found: dead rate-limit wiring (active abuse vector), non-functional `send-reminders`, and absent privacy/backup/SEO. tsc clean; `src/proxy.ts` correct for Next 16.

## Scope

### In Scope

- N1: wire `rateLimiters` into anon booking INSERT + `sendAuthMagicLink`; honeypot/captcha for `check(true)` policies; RBAC via `profiles` lookup (no client-settable claim).
- N2: fix `send-reminders` to send via Resend; backup/PITR/restore-drill + secret-rotation runbook; `npm audit` in CI; Playwright seed e2e.
- N3: cookie-consent banner; data export/delete; JSON-LD + `og-image.jpg`; dynamic `<html lang>`; sitemap prune (drop admin/login, add privacy/terms).
- Existing chain S0 (toolchain), A (query+logger), B (fluidity/a11y), C (vitest), D (ops), E (PWA), F (pago), G (branding).

### Out of Scope

- 90% coverage inside C; admin i18n (ES-only documented); `proxy.ts` rename (rejected); schema migrations.

## Capabilities

### New Capabilities

- `toolchain-strict`, `query-migration`, `fluidity-a11y`, `test-wiring`, `ops-confirmation`, `pwa-installable`, `pago-por-mesa`, `branding-central` (from S0/A–G).
- `abuse-rate-limit`: rate-limit wiring + honeypot/captcha + profiles-based RBAC (N1).
- `ops-reliability`: reminders send + backup/PITR/restore + secret rotation + npm audit + Playwright seed (N2).
- `privacy-seo`: cookie consent + data export/delete + JSON-LD/og-image + dynamic lang + sitemap prune (N3).

### Modified Capabilities

- None (no `openspec/specs/` exist; quality-only deltas).

## Slices (force-chained, ≤800 lines each)

| Slice                     | Content                                                                             | Forecast                  |
| ------------------------- | ----------------------------------------------------------------------------------- | ------------------------- |
| N1 — abuse/rate-limit     | Wire `rateLimiters` (booking INSERT, magic-link), honeypot/captcha, `profiles` RBAC | ~150–250                  |
| S0 — toolchain            | eslint strict, prettier check, husky, CI gates                                      | ~100–200                  |
| A — query + logger        | Query migration + logger + guard                                                    | ~500–650                  |
| B — fluidity + thumb/a11y | `ssr:false`, Suspense, 44px, focus/contrast/safe-area                               | ~250–400                  |
| C — vitest wiring         | Config, seed suites, CI test step                                                   | ~200–300                  |
| D — ops extended          | Cron ×3 verify, Resend domain/key, env + runbook                                    | ~50–150 docs              |
| E — PWA                   | Manifest, icons, viewport/themeColor, SW (Serwist), offline                         | ~200–350                  |
| F — pago discovery+slice  | MP vs Stripe per-table QR → flow                                                    | disc ~50 + slice ~300–500 |
| G — branding              | `src/config/branding.ts`, sweep `Suhi`/`MESS` hardcodes                             | ~150–250                  |
| N2 — ops-reliability      | Resend send fix, backup/PITR/restore, secret rotation, `npm audit`, Playwright seed | ~200–350                  |
| N3 — privacy + SEO        | Cookie consent, data export/delete, JSON-LD/og-image, dynamic lang, sitemap         | ~150–300                  |

**First-slice: N1 goes first** — the ONLY active security hole (open anon INSERT `check(true)` + unrate-limited magic link = spam/abuse). S0 then gates all code slices A–G (blocks `console.*`/style drift, enforces CI). N2/N3 last: reliability and privacy/SEO build on the hardened chain (N2 on C's test wiring + D's ops; N3 independent). Each slice within 800-line budget.

## Approach

One slice per chained PR stacked to main (N1→S0→A→B→C→D→E→F→G→N2→N3); verify (tsc, lint, build, test) per slice; F gated on provider decision in specs.

## Affected Areas

| Area                                                                       | Impact       | Description                     |
| -------------------------------------------------------------------------- | ------------ | ------------------------------- |
| `src/lib/rate-limit.ts`, `src/app/api/booking`/`email`, `src/lib/admin.ts` | Modified     | Wire rate limit + honeypot (N1) |
| `supabase/functions/send-reminders/index.ts`                               | Modified     | Resend send (N2)                |
| `src/app/layout.tsx`, `src/lib/seo.ts`, `public/og-image.jpg`, sitemap     | New/Modified | Privacy/SEO (N3)                |
| `eslint.config.mjs`, `.github/workflows/`, `package.json`                  | Modified     | S0/C/N2 CI gates                |

## Risks

| Risk                                             | Likelihood | Mitigation                                       |
| ------------------------------------------------ | ---------- | ------------------------------------------------ |
| Rate-limit false positives on legit anon booking | Med        | Conservative thresholds + honeypot; monitor logs |
| Backup/PITR disruption                           | Low        | Runbook-drill against staging, not prod          |
| Cookie-consent UX friction                       | Low        | Non-blocking banner; consent in localStorage     |
| Pago provider rework                             | Med        | Discovery gate before code                       |

## Rollback Plan

Revert slice PR (stacked, independent). N1 additive (rate-limit guard off = old behavior); N2 reminder fix restorable to TODO stub; N3 (banner/export/SEO) all additive, no migrations.

## Dependencies

- Supabase dashboard (cron + backup/PITR UI); Resend domain/key; pago provider decision (specs); brand assets (logo paths).

## Success Criteria

- [ ] Anon booking + magic-link rate-limited; no `check(true)` without honeypot/captcha; RBAC from `profiles`.
- [ ] `send-reminders` actually emails via Resend (integration test proves send).
- [ ] Backup/PITR/restore drilled once; secrets rotated; `npm audit` green in CI.
- [ ] Cookie consent live; data export/delete functional; JSON-LD + og-image present; sitemap correct.
- [ ] S0 gates green; zero stray `console.*`; installable on desktop + mobile; pago flow spec'd.
