---
name: omakase-supabase-functions
description: >
  Supabase setup + Deno edge functions for omakase. Trigger: working with Supabase clients, auth, RLS, or the auto-confirm / no-show-handler / send-reminders edge functions.
license: Apache-2.0
metadata:
  author: omakase
  version: "1.0"
---

# Omakase Supabase + Edge Functions

## Client construction — pick exactly one per surface

React-client (`@/lib/supabase/client.ts`), SSR server (`@/lib/supabase/server.ts`, cookies-aware), and service-role admin (`@/lib/supabase/admin.ts`). Read the file before writing a new call; don't conflate them in one action. Server actions use `createClient()` from `server.ts` for user-scoped calls and `createAdminClient()` only when bypassing RLS/int is required (after `checkAdminPermission`).

## Server auth gate (server actions)

Admin mutations run the shared `checkAdminPermission()` (`src/app/actions/admin.ts`): `supabase.auth.getUser()` → role from `user.user_metadata.role` must be `admin` | `manager` | `staff` (`ADMIN_ROLES`). Update role via `supabaseAdmin.auth.admin.updateUserById(id, { user_metadata: { role } })`.

## Edge functions (Deno, keep them framework-free)

Pattern pinned in `supabase/functions/*/index.ts`:

- Entrypoint: `serve(async (req) => { ... })` from `https://deno.land/std@0.168.0/http/server.ts`; Supabase client from `https://esm.sh/@supabase/supabase-js@2`.
- Always handle CORS pre-flight: fixed `corsHeaders` object, return `200 "ok"` for `OPTIONS`; every `Response` carries those headers + `Content-Type: application/json`.
- Read `Deno.env.get("SUPABASE_URL")` and `SUPABASE_SERVICE_ROLE_KEY` non-nullable (`!`) at the top.
- Wrap the whole body in `try { … } catch (error) { console.error("<name> error:", error); return 500 { error: error.message }; }`.

### `auto-confirm` (cron: hourly)

Marks `pending` bookings older than threshold (`autoConfirmHours = 2`, hardcoded — see TODO in file) as `status: "confirmed"` and `notes: "Auto-confirmed after 2 hours"`. Fetcheth pending via `cutoffTime` window, then `.update(...).in("id", bookingIds)`.

### `no-show-handler` (cron: every 15 min during service)

Marks `confirmed` for today whose `booking_time < (now-30m)` as `status: "no_show"` (**underscore** — deviates from the TS type `"no-show"`; map at the read boundary, see `omakase-reservations-domain`) with `notes: Auto-marked as no-show at <iso>`.

### `send-reminders` (cron: every hour)

Two windows: `reminder_24h_sent` for bookings **tomorrow** (`confirmed`/`pending`), `reminder_2h_sent` for bookings **today** within the next 2h (`confirmed`). Email integration is still a TODO — it only `console.log`s and flips the `*_sent` timestamps.

## Deploy + schedule

- Deploy: `supabase functions deploy <name>` (from repo root).
- Schedule strictly via Supabase Dashboard cron; functions themselves contain no scheduler.
- Test locally with `supabase functions serve` + `curl`.

## Rules

- `MUST`: do all user-visible notification side-effects via `src/lib/email/resend.ts` (currently only `auto-confirm`/`no-show-handler` don't send email — `send-reminders` TODO is to be wired through Resend).
- `MUST`: keep functions idempotent (updating `status`/`notes`/`reminder_*_sent` is safe); never multi-window-select the same row twice.
- `SHOULD`: keep per-function logic queries simple; reuse shared helpers only if they stay Deno-compatible (no Node polyfills).
- `nunca`: never change CORS headers to a narrower allow-list mid-function; never use `SUPABASE_ANON_KEY` for service-side logic; never mix the `no_show`/`no-show` spellings inside a function — it's `no_show` for the DB here, by convention + existing rows.
