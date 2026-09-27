> Parte de: [[INDICE-SISTEMA]] · Relacionados: [ORN-84], [ORN-124]

# ODD Feature — booking-server-gates (ORN-124 Fase 2b)

> **Búsqueda:** keywords: `blocked-dates, weekly-schedule, advance-window, try_create_booking, rpc, server-side, calendar-gates` · clasificación: `odd-feature` · estado: in-progress · actualizado: 2026-09-27

## Objective
Make blocked dates, weekly schedule, and advance window authoritative server-side inside `try_create_booking`, closing the client-only enforcement gap flagged by ORN-84.

## Problem / Why
The three gates (blocked dates, weekly schedule, min/max advance) are only enforced in `DateStep.tsx` / `TimeStep.tsx` (client-side). Anyone bypassing the UI (direct RPC call with the anon key, tampered client) can book on a blocked date, a closed day, or outside the advance window. ORN-84: "Capacidad/solape por zona-mesa-horario; blocked_dates/schedule; limites server-side. Sin esto no hay launch."

## Scope
- In: new migration `create or replace function try_create_booking` adding three rejects (BLOCKED_DATE, SCHEDULE_CLOSED, INVALID_ADVANCE); reason mapping in `src/app/actions/bookings.ts`; action-side tests pinning the three new rejects (RED→GREEN); lint on touched files; RDD receipt.
- Out: applying the migration to the live DB (t_6991e705, 06-dba, launch-gate); changing the UI steps; events blocking logic; client availability preview.

## Constraints
- TDD strict: RED test first with real output logs in `reports/`.
- Runner: vitest. Lint: eslint scoped to touched files.
- Keep the RPC idempotent and keep all existing rejects (INVALID_PAX, INVALID_INPUT, ZONE_UNAVAILABLE, CAPACITY_EXCEEDED) unchanged.
- Migration must be `create or replace` + idempotent grants (safe re-run).
- Budget: 3 build-review iterations (ODD).

## Design decisions (settled)
- **day_of_week convention**: 0=Sunday..6=Saturday, matching the schema seed comment and Postgres `extract(dow from date)`.
- **Wrap-around midnight**: seed has Fri/Sat `closing_time='00:00'` with `opening 19:00`. If `closing <= opening` the shift crosses midnight: compare the slot against `opening` and `closing+24h`. Interval is `[opening, closing)` — a slot exactly at closing is rejected.
- **Timezone for advance window**: the restaurant operates in `America/Argentina/Buenos_Aires` (fixed -03 since 2009, no DST). "Now" = `now() AT TIME ZONE 'America/Argentina/Buenos_Aires'`; requested slot = `p_booking_date::timestamp + p_booking_time::time`; both wall-clock local. `min_advance_minutes=60` / `max_advance_days=30` from `restaurant_settings` (schema defaults), fail-open with the same defaults the client uses if the settings row is missing. The min-advance rule `slot >= now + min_advance` applied to every date subsumes the client's "today-only" check.
- **Reject order**: idempotency re-check FIRST (a booking created while the date was open must still dedupe if the admin later blocks the date — MP retry safety), then blocked_dates → schedule → advance → capacity. All inside the existing advisory lock (calendar facts don't depend on concurrency but keeping one code path is simpler).
- **BLOCKED_DATE zone scope**: reject if a `blocked_dates` row matches `(date = p_booking_date AND (zone_id IS NULL OR zone_id = v_zone.id))` — NULL blocks all zones, per the card.
- **Missing weekly_schedule row / settings row = fail-open** (documented): matches client behavior (a missing config never blocks booking in the UI; TimeStep falls back to defaults). Fail-closed on a missing schedule row would take the whole site down if the admin never seeds it. The live-DB seed is verified by t_6991e705.
- **Guarded time cast**: the RPC regex `^\d{2}:\d{2}$` lets `99:99` through, and the new schedule check casts `p_booking_time::time`, which would raise an unhandled exception (fail-closed 500 instead of a typed reject). The cast is wrapped in an exception handler returning INVALID_INPUT — keeps the "always returns typed jsonb" contract.
- **knownReasons derived from CAPACITY_REASONS**: the drift class this task fixes (RPC gained reasons the action didn't map) is structural — two parallel lists. Deriving the accepted-code set from the message map keys removes one of the two lists.

## Tasks (stable IDs)
- [x] T1: RED — action-side tests for the 3 new rejects (BLOCKED_DATE, SCHEDULE_CLOSED, INVALID_ADVANCE) in `src/app/actions/bookings.test.ts`
  - evidence: `npx vitest run src/app/actions/bookings.test.ts` → 3 failed | 11 passed; each new reason fell to BOOKING_FAILED fallback. Log: `reports/tdd-red-2026-09-27-fase2b-calendar-gates.log`
- [x] T2: GREEN — extend `try_create_booking` via new migration `supabase/migrations/20260927000000_try_create_booking_calendar_gates.sql`
  - evidence: (SQL itself; runtime verification is the DBA card t_6991e705 — migration apply to live DB is out of scope here)
- [x] T3: Map the 3 new reasons in `src/app/actions/bookings.ts` (CAPACITY_REASONS + KNOWN_REASONS derivation)
  - evidence: same vitest run → 14/14 green on the action file. Log: `reports/tdd-green-2026-09-27-fase2b-calendar-gates.log`
- [x] T4: Verify — vitest suite green, tsc --noEmit EXIT:0, eslint scoped EXIT:0
  - evidence: full suite 65/65 green (log `reports/tdd-green-full-2026-09-27-fase2b.log`); `npx tsc --noEmit` EXIT_TSC=0 after fixing 2 preexisting type errors on the touched lines; `npx eslint src/app/actions/bookings.ts src/app/actions/bookings.test.ts` EXIT_LINT=0 (log `reports/lint-fase2b-2026-09-27.log`)
- [x] T5: RDD receipt + work-unit commit + mem_save
  - evidence: receipt `80e7b6881d1a` signed over staged diff (11 files); commit `3e9c68c` on master; Engram mirror saved as observation #1243 (`odd/booking-server-gates/tasks`); gentle-ai assess post-commit: Risk medium, engine transition terminal `stop (rdd_disabled)` — followed exactly.

## Accumulated evidence
- 2026-09-27 RED run: 3 tests failed exactly on the 3 new reasons (BLOCKED_DATE/SCHEDULE_CLOSED/INVALID_ADVANCE → BOOKING_FAILED). 11 preexisting tests passed — no regression in RED state.
- 2026-09-27 GREEN run (action file): 14/14 passed.
- 2026-09-27 full suite: 65/65 passed, VITEST_EXIT=0.
- 2026-09-27 `npx tsc --noEmit`: EXIT_TSC=0 (two PREEXISTING errors at bookings.ts:149 / bookings.test.ts:56 were on the exact lines this change touches — fixed as root cause, both confirmed preexisting at HEAD via git stash + re-run).
- 2026-09-27 `npx eslint` scoped to both touched TS files: EXIT_LINT=0.

## Accepted changes and rationale
- Guarded `::time` cast (INVALID_INPUT on `99:99`-style values): my change introduces the cast; without the guard the RPC would raise where its contract says "return typed reject".
- `KNOWN_REASONS` derived from `Object.keys(CAPACITY_REASONS)` — single source of truth, prevents the next reason-drift gap (this task exists because of that drift class).
- Reject order: idempotency re-check BEFORE calendar gates — an MP payment retry of an already-created booking must dedupe even if the admin blocked the date afterwards.
- Fail-open on missing restaurant_settings / weekly_schedule rows (matches client defaults; live-DB seed presence is the DBA launch-gate card t_6991e705).
- Fixed 2 preexisting tsc errors living on the touched lines (string index + emailsSent type): in-scope root fix, not drive-by.

## Next step
- T5: generate the RDD receipt over the staged diff, commit the work unit, mem_save the feature mirror.

## Progress
- 2026-09-27: Doc created after full context gather (RPC, schema, client steps, validations, prior receipt format). Semantics settled: dow 0=Sunday, midnight wrap, BA timezone, idempotency-first reject order, fail-open on missing config rows, guarded time cast.
- 2026-09-27: T1-T4 done. RED→GREEN complete: 3 new reject tests red first, mapping added, 65/65 suite green, tsc 0, lint 0.
