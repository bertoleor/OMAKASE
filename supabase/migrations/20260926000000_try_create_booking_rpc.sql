-- ORN P1 — capacity/overlap guard enforced server-side (Fase 2 wiring).
--
-- Why an RPC (precedent: KHAL G4 create_booking RPC): the booking flow is
-- unauthenticated and bookings RLS only lets a caller SELECT its own rows
-- (owner-by-email or staff). A client-side occupancy read with the anon key
-- always returns zero rows, so any guard computed outside the database is
-- dead code in runtime. A SECURITY DEFINER function reads real occupancy and
-- performs check+insert atomically under an advisory lock, closing:
--   - capacity exceeded rejections (shared-capacity semantics)
--   - concurrent double-submit races (advisory lock + idempotency re-check)
--   - zone_id population (bookings.zone_id was never set by the action)
--
-- Semantics: a slot's occupancy is the cumulative pax of LIVE rows
-- (pending/confirmed/seated/completed) for the zone+date+time. Cancelled /
-- no_show rows free the slot. hasSlotOverlap stays a pure client module for
-- admin/offline calculations; the authoritative gate is this function.
--
-- Exposure: grant execute to anon+authenticated (the flow is public). The
-- function is strictly narrower than the existing "Public/Anon create
-- bookings" INSERT policy: it forces status='pending', validates pax 1-20,
-- email length, and now capacity. No PAN data accepted — payment refs only.
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

  -- Idempotency re-check (belt & suspenders with the unique partial index:
  -- a concurrent retry that won the race returns the original row).
  if p_idempotency_key is not null then
    select * into v_booking from public.bookings
    where idempotency_key = p_idempotency_key
    limit 1;
    if found then
      return jsonb_build_object('ok', true, 'deduped', true, 'booking', to_jsonb(v_booking));
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
  )
  values (
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
