# Supabase Realtime Health Report — RESERVAS-APP (OMAKASE)

**Check Time:** 2026-09-12 14:37-14:39 UTC
**Project:** `aagjotwckrfrmayojhom` (RESERVAS-APP) — us-west-2 — **ACTIVE_HEALTHY**
**Database:** PostgreSQL 17.6.1, GA channel

---

## 🎯 Health Score: **2 / 5** — Serious security & performance issues

> **Score rationale:** Critical RLS disabled on `agent_audit_logs` + 12 tables exposed to anon via GraphQL + 2 SECURITY DEFINER functions callable by public + 28 overlapping RLS policies degrading query performance. System is _running_ but has significant attack surface and query degradation.

---

## ✅ Operational Summary

- Project status: **ACTIVE_HEALTHY** (database reachable, no outage)
- Postgres 17.6, GA release channel
- No connection/availability errors in advisors
- Realtime itself not explicitly flagged (advisors cover DB/RLS/schema)

---

## 🔴 Critical & High-Severity Findings

| Severity  | Issue                                                      | Count | Impact                                                                |
| --------- | ---------------------------------------------------------- | ----- | --------------------------------------------------------------------- |
| **ERROR** | RLS disabled on table in public schema                     | 1     | `agent_audit_logs` fully exposed — any role can read/write            |
| **WARN**  | SECURITY DEFINER functions executable by `anon`            | 2     | `get_dashboard_stats()`, `handle_new_user()` callable unauthenticated |
| **WARN**  | SECURITY DEFINER functions executable by `authenticated`   | 2     | Same functions callable by any signed-in user                         |
| **WARN**  | All 12 public tables exposed in GraphQL to `anon`          | 12    | Full schema discoverable without auth                                 |
| **WARN**  | All 12 public tables exposed in GraphQL to `authenticated` | 12    | Every signed-in user sees entire schema                               |
| **WARN**  | 3 functions with mutable `search_path`                     | 3     | Search-path injection risk                                            |
| **WARN**  | Leaked password protection (HaveIBeenPwned) disabled       | 1     | Weak password acceptance                                              |
| **WARN**  | 28 multiple permissive RLS policies                        | 28    | Query planner evaluates redundant policies per row                    |
| **INFO**  | 2 unindexed foreign keys                                   | 2     | FK joins on `blocked_dates.zone_id`, `event_history.event_id` slow    |
| **INFO**  | 11 unused indexes                                          | 11    | Write overhead, no read benefit                                       |

---

## 📋 Exception Details (by severity)

### 1. **RLS Disabled — `public.agent_audit_logs`** [ERROR]

- Table exposed to PostgREST without RLS → any key (anon/service) can SELECT/INSERT/UPDATE/DELETE.
- **Remediation:** `ALTER TABLE public.agent_audit_logs ENABLE ROW LEVEL SECURITY;` + add policies.

### 2. **SECURITY DEFINER Functions Callable by Public** [WARN ×4]

| Function                | Callable by             | Risk                                         |
| ----------------------- | ----------------------- | -------------------------------------------- |
| `get_dashboard_stats()` | `anon`, `authenticated` | May leak aggregated business data            |
| `handle_new_user()`     | `anon`, `authenticated` | Auth hook — should not be directly invocable |

**Fix:** `REVOKE EXECUTE ON FUNCTION public.get_dashboard_stats() FROM anon, authenticated;` and/or `ALTER FUNCTION ... SECURITY INVOKER;`

### 3. **GraphQL Schema Exposure** [WARN ×24]

All 12 tables visible to both `anon` and `authenticated` via GraphQL introspection.

- Tables: `agent_audit_logs`, `blocked_dates`, `bookings`, `event_history`, `events`, `payment_logs`, `payments`, `profiles`, `restaurant_settings`, `tables`, `weekly_schedule`, `zones`
- **Fix:** `REVOKE SELECT ON table FROM anon;` (and `authenticated` where not needed) — rely on RLS for row-level control.

### 4. **RLS Policy Performance Anti-patterns** [WARN ×40]

- **12 policies** use `auth.uid()` / `auth.jwt()` without `(select ...)` wrapper → re-evaluated per row.
- **28 overlapping permissive policies** across tables (`zones` worst: 12 duplicates across 4 roles × 3 actions).
- **Fix pattern:** `USING ((select auth.uid()) = user_id)` + consolidate duplicate policies per (role, action).

### 5. **Missing FK Indexes** [INFO ×2]

- `blocked_dates.zone_id` (FK to `zones`)
- `event_history.event_id` (FK to `events`)
- **Fix:** `CREATE INDEX ON blocked_dates(zone_id);` / `CREATE INDEX ON event_history(event_id);`

### 6. **Unused Indexes** [INFO ×11]

All on high-write tables (`bookings`, `payments`, `payment_logs`, `blocked_dates`, `tables`, `events`, `event_history`). Safe to drop after confirming no query plans use them.

### 7. **Mutable Search Path** [WARN ×3]

- `archive_completed_event`, `handle_new_user`, `get_dashboard_stats`
- **Fix:** `ALTER FUNCTION ... SET search_path = public, pg_temp;`

### 8. **Leaked Password Protection Disabled** [WARN]

- Enable in Supabase Dashboard → Authentication → Password Strength → "Prevent leaked passwords".

---

## 🛠 Improvement Suggestions

### Short-term (this week)

1. **Enable RLS on `agent_audit_logs`** — blocks unauthenticated data access immediately.
2. **Revoke EXECUTE on SECURITY DEFINER functions** from `anon`/`authenticated` — closes RPC attack surface.
3. **Revoke SELECT from `anon` on all 12 tables** — GraphQL introspection no longer leaks schema.
4. **Enable leaked password protection** — one toggle in Dashboard.
5. **Fix the 12 RLS policies** using `(select auth.uid())` pattern — instant query perf win.

### Mid-term (this sprint)

6. **Consolidate 28 overlapping RLS policies** — merge per (table, role, action) into single policy with combined `USING` clause.
7. **Add 2 missing FK indexes** — unblocks join performance on booking/event lookups.
8. **Drop 11 unused indexes** — reduces write amplification on hot tables.
9. **Set immutable `search_path` on 3 functions** — eliminates search-path injection vector.

### Long-term (next quarter)

10. **Adopt declarative schema + `supabase db advisors` in CI** — catch regressions on every PR.
11. **Audit GraphQL exposure per feature** — only expose tables explicitly needed by clients.
12. **Rotate to `SECURITY INVOKER` for all RPC functions** — default deny, explicit allow.
13. **Implement RLS policy test suite** (pgTAP or Supabase local) — prevent regressions.

---

## 📊 SRE Signal Mapping

| Signal                               | Current State      | Target                      |
| ------------------------------------ | ------------------ | --------------------------- |
| **RLS Coverage**                     | 11/12 tables (91%) | 100%                        |
| **SECURITY DEFINER Public Exposure** | 2 functions        | 0                           |
| **GraphQL Anon Exposure**            | 12 tables          | 0 (only public-read tables) |
| **Policy Eval/Row**                  | Up to 3 redundant  | 1                           |
| **FK Index Coverage**                | 2 missing          | 0                           |
| **Unused Index Ratio**               | 11/unknown         | 0                           |

---

## 📌 Next Check

- **Scheduled:** Every 30 min (this cron)
- **Alert Threshold:** Only notify if health score drops to **1** or new **ERROR** advisories appear.
- **Report Location:** `reports/realtime-health.md` (overwritten each run)

---

_Generated by Hermes cron (G3) • Provider: nvidia/muse-spark-1.3 • Skills: supabase, sre-log-analytics, observability-and-instrumentation_
