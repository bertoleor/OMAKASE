-- ORN-124 Fase 2b — calendar gates server-side in try_create_booking.
--
-- Why: blocked dates, weekly schedule and the advance window were enforced
-- ONLY client-side (DateStep.tsx / TimeStep.tsx). The booking flow is
-- unauthenticated and this function is callable with the anon key, so any
-- client could book on a blocked date, a closed weekday, or outside the
-- advance window. ORN-84: limits must be server-side. This migration
-- extends the existing capacity RPC (20260926000000) with three rejects:
--
--   BLOCKED_DATE     p_booking_date is in blocked_dates
--                    (zone_id IS NULL = all zones, or zone_id = zone's id)
--   SCHEDULE_CLOSED  weekly_schedule says the weekday is closed, or the
--                    slot falls outside [opening, closing)
--   INVALID_ADVANCE  slot earlier than now+min_advance_minutes, or later
--                    than now+max_advance_days (America/Argentina/Buenos_Aires
--                    wall-clock, fixed -03 since 2009, no DST)
--
-- Order of checks (idempotency first — deliberate): an idempotent retry of an
-- already-created booking must dedupe even if the admin blocked the date
-- afterwards; a payment retry that suddenly 4xx'd would break the MP flow.
-- Config semantics: missing restaurant_settings / weekly_schedule rows are
-- FAIL-OPEN with the same defaults the client uses (a missing config must not
-- brick the public flow; seed presence in the live DB is verified by
-- t_6991e705, the DBA launch-gate card).
--
-- Schedule window arithmetic is done in minutes-of-day (not time casting)
-- because the seed has wrap-around shifts: Fri/Sat opening 19:00 closing
-- 00:00 — a closing <= opening shift is read as closing + 24h. Interval
-- [opening, closing): a slot exactly at closing is rejected.
--
-- The guarded cast: the p_booking_time regex allows '99:99', and the gates
-- cast it to time — an invalid value returns INVALID_INPUT (typed reject)
-- instead of an unhandled exception, keeping the function's "always returns
-- typed jsonb" contract.
--
-- Safe to re-run: create or replace + idempotent grants.

create or replace function public.try_create_booking(
  p_zone_slug text,
  p_booking_date date,
  p_booking_time text,
  p_pax int,
  p_customer_name text,
  p_customer_email text,
  p_customer_phone text,
  p_notes text default null,
  p_idempotency_key text default null,
  p_mp_payment_id text default null,
  p_mp_preference_id text default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_zone public.zones%rowtype;
  v_zone_db public.table_zone;
  v_occupancy int;
  v_booking public.bookings%rowtype;
  v_slot_time time;
  v_is_open boolean;
  v_slot_min int;
  v_open_min int;
  v_closing_min int;
  v_settings public.restaurant_settings%rowtype;
  v_now timestamp;
  v_slot_ts timestamp;
begin
  -- Input guards (the function is directly callable with the anon key:
  -- mirror the INSERT policy constraints, plus capacity).
  if p_pax is null or p_pax < 1 or p_pax > 20 then
    return jsonb_build_object('ok', false, 'reason', 'INVALID_PAX');
  end if;
  if p_customer_email is null or length(p_customer_email) > 255 then
    return jsonb_build_object('ok', false, 'reason', 'INVALID_INPUT');
  end if;
  if p_booking_time is null or p_booking_time !~ '^\d{2}:\d{2}$' then
    return jsonb_build_object('ok', false, 'reason', 'INVALID_INPUT');
  end if;

  -- Guarded cast: '99:99'-shaped values would raise on ::time. The function
  -- contract is typed rejects, never unhandled exceptions.
  begin
    v_slot_time := p_booking_time::time;
  exception when others then
    return jsonb_build_object('ok', false, 'reason', 'INVALID_INPUT');
  end;

  -- Resolve the zone row by slug: single source of truth for capacity_pax,
  -- zone_id and is_active (admin can edit capacity without a deploy).
  select * into v_zone from public.zones where slug = p_zone_slug;
  if not found or not v_zone.is_active then
    return jsonb_build_object('ok', false, 'reason', 'ZONE_UNAVAILABLE');
  end if;

  -- Deterministic slug -> enum mapping (table_zone enum is fixed:
  -- indoor_tables / outdoor_pergola / indoor_bar; seed slugs are 1:1).
  v_zone_db := case p_zone_slug
    when 'salon' then 'indoor_tables'::table_zone
    when 'pergola' then 'outdoor_pergola'::table_zone
    when 'barra' then 'indoor_bar'::table_zone
    else null::table_zone
  end;
  if v_zone_db is null then
    return jsonb_build_object('ok', false, 'reason', 'ZONE_UNAVAILABLE');
  end if;

  -- Serialize concurrent capacity checks for the same slot.
  perform pg_advisory_xact_lock(
    hashtext('booking:' || p_zone_slug || ':' || p_booking_date::text || ':' || p_booking_time)
  );

  -- Idempotency re-check FIRST (belt & suspenders with the unique partial
  -- index): a retry of an already-created booking dedupes even if the date
  -- was blocked/closed after creation — MP payment retries must not break.
  if p_idempotency_key is not null then
    select * into v_booking from public.bookings
    where idempotency_key = p_idempotency_key
    limit 1;
    if found then
      return jsonb_build_object('ok', true, 'deduped', true, 'booking', to_jsonb(v_booking));
    end if;
  end if;

  -- GATE 1 — BLOCKED_DATE: admin-blocked dates reject new bookings.
  -- zone_id IS NULL blocks every zone; a zone-specific row only blocks that
  -- zone (blocked_dates_date_zone_unique allows both rows to coexist).
  if exists (
    select 1 from public.blocked_dates
    where date = p_booking_date
      and (zone_id is null or zone_id = v_zone.id)
  ) then
    return jsonb_build_object('ok', false, 'reason', 'BLOCKED_DATE');
  end if;

  -- GATE 2 — SCHEDULE_CLOSED: the weekday must be open and the slot within
  -- [opening, closing). Compared in minutes-of-day; closing <= opening is a
  -- wrap-around shift (closing + 24h), so Fri/Sat 19:00->00:00 accepts
  -- 19:00..23:59 and rejects 00:00 (boundary) and early-morning slots (they
  -- belong to the previous date's shift). extract(dow) is 0=Sunday..6=Saturday,
  -- matching the weekly_schedule seed convention. Missing row or NULL times =
  -- fail-open (matches the client, which renders defaults when unseeded).
  select is_open,
         coalesce(extract(hour from opening_time)::int * 60 + extract(minute from opening_time)::int, -1),
         coalesce(extract(hour from closing_time)::int * 60 + extract(minute from closing_time)::int, -1)
  into v_is_open, v_open_min, v_closing_min
  from public.weekly_schedule
  where day_of_week = extract(dow from p_booking_date)::int;
  if found then
    -- Closed weekday (explicit is_open=false) always rejects. A NULL is_open
    -- coalesces to open (fail-open, matches the client's default-open seed).
    if not coalesce(v_is_open, true) then
      return jsonb_build_object('ok', false, 'reason', 'SCHEDULE_CLOSED');
    end if;
    if v_open_min >= 0 and v_closing_min >= 0 then
      v_slot_min := extract(hour from v_slot_time)::int * 60 + extract(minute from v_slot_time)::int;
      if v_closing_min <= v_open_min then
        -- wrap-around midnight shift: fold slot times before opening into the
        -- next day so [opening, closing+24h) is a single ascending interval.
        v_closing_min := v_closing_min + 1440;
        if v_slot_min < v_open_min then
          v_slot_min := v_slot_min + 1440;
        end if;
      end if;
      if v_slot_min < v_open_min or v_slot_min >= v_closing_min then
        return jsonb_build_object('ok', false, 'reason', 'SCHEDULE_CLOSED');
      end if;
    end if;
  end if;

  -- GATE 3 — INVALID_ADVANCE: the slot must be at least min_advance_minutes
  -- in the future and at most max_advance_days ahead, both measured against
  -- Buenos Aires wall-clock. All comparisons in naive local timestamps:
  -- 'now() at time zone BA' is BA wall-clock, and date + time is the slot's
  -- wall-clock. BA is fixed -03 (no DST since 2009) so wall-clock arithmetic
  -- is exact for both bounds. Missing settings row = fail-open (the client
  -- falls back to the same schema defaults).
-- FIX 2026-09-28: restaurant_settings has NO created_at column (42703 at
-- runtime, found by live smoke). Single-row settings table: limit 1
-- without order by is the correct read.
  select * into v_settings from public.restaurant_settings limit 1;
  if found then
    v_now := now() at time zone 'America/Argentina/Buenos_Aires';
    v_slot_ts := p_booking_date + v_slot_time;
    if v_slot_ts < v_now + make_interval(mins => coalesce(v_settings.min_advance_minutes, 60))
       or v_slot_ts > v_now + make_interval(days => coalesce(v_settings.max_advance_days, 30))
    then
      return jsonb_build_object('ok', false, 'reason', 'INVALID_ADVANCE');
    end if;
  end if;

  -- Occupancy: LIVE statuses consume capacity; cancelled/no_show free it.
  -- Filtered by zone_id: it uses idx_bookings_zone_time_status and matches
  -- the floorplan's occupancy model (bookings.zone_id, never the enum).
  select coalesce(sum(pax), 0) into v_occupancy
  from public.bookings
  where zone_id = v_zone.id
    and booking_date = p_booking_date
    and booking_time = p_booking_time
    and status in ('pending', 'confirmed', 'seated', 'completed');

  if p_pax > v_zone.capacity_pax - v_occupancy then
    return jsonb_build_object(
      'ok', false,
      'reason', 'CAPACITY_EXCEEDED',
      'occupancy', v_occupancy,
      'capacity', v_zone.capacity_pax,
      'remaining_pax', greatest(v_zone.capacity_pax - v_occupancy, 0)
    );
  end if;

  insert into public.bookings (
    customer_name, customer_email, customer_phone,
    booking_date, booking_time, pax,
    zone, zone_id, status, notes, deposit_amount,
    idempotency_key, mp_payment_id, mp_preference_id
  ) values (
    p_customer_name, p_customer_email, p_customer_phone,
    p_booking_date, p_booking_time, p_pax,
    v_zone_db, v_zone.id, 'pending', p_notes, 0,
    p_idempotency_key, p_mp_payment_id, p_mp_preference_id
  )
  returning * into v_booking;

  return jsonb_build_object(
    'ok', true,
    'deduped', false,
    'booking', to_jsonb(v_booking),
    'occupancy', v_occupancy + p_pax,
    'capacity', v_zone.capacity_pax,
    'remaining_pax', v_zone.capacity_pax - v_occupancy - p_pax
  );
end;
$$;

revoke all on function public.try_create_booking(text, date, text, int, text, text, text, text, text, text, text)
  from public;
grant execute on function public.try_create_booking(text, date, text, int, text, text, text, text, text, text, text)
  to anon, authenticated;
