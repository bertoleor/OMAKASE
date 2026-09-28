-- ORN-84 P1-8 — client self-service cancellation RPC.
--
-- Why: bookings' UPDATE policy is staff-only (20260915000000_fix_bookings_rls).
-- The customer's raw .update({status:'cancelled'}) from /mis-reservas/[id]
-- affected ZERO rows under RLS — the "Cancel my booking" button silently
-- did nothing. Widening the UPDATE policy to owners would let the client
-- also flip payment-adjacent columns (mp_payment_id, deposit_amount), so the
-- decision (t_8c591275 triage) is a narrow SECURITY DEFINER function that
-- only flips status='cancelled' after verifying ownership.
--
-- Ownership model: customer_email = session JWT email (auth.jwt() ->> 'email').
-- The wizard books unauthenticated but /mis-reservas requires a magic-link
-- session with the SAME email used for the booking — that equality is the
-- ownership relation (bookings has no user_id FK).
--
-- Rejects (typed jsonb, mirroring try_create_booking's contract):
--   NOT_AUTHORIZED        session email does not own the booking
--   BOOKING_NOT_FOUND     no row with that id
--   ALREADY_CLOSED        status is terminal (cancelled/no_show/completed/seated-by-staff)
--   CANCEL_WINDOW_CLOSED  fewer than min_advance_minutes (default 240) remain
--                         before the slot (free-cancellation window, docs
--                         cancel-policy: 4h default = FREE_CANCEL_MINUTES_BEFORE)
--   INVALID_INPUT         p_booking_id is not a uuid
--
-- Session enforcement: grants go to authenticated ONLY (never anon —
-- cancellation requires a session). auth.jwt() is null for anon callers and
-- the NOT_AUTHORIZED branch fails closed.
--
-- Timezone: the restaurant operates in America/Argentina/Buenos_Aires
-- (fixed -03, no DST since 2009). Slot timestamp is booking_date + booking_time
-- wall-clock, compared against now() at time zone BA — same convention as
-- try_create_booking's advance gate.
--
-- Safe to re-run: create or replace + idempotent grants.

create or replace function public.cancel_my_booking(p_booking_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
  v_booking public.bookings%rowtype;
  v_settings public.restaurant_settings%rowtype;
  v_slot_ts timestamp;
  v_now timestamp;
  v_window_minutes int;
begin
  -- Session email from the JWT; anonymous callers have no email and fail closed.
  v_email := auth.jwt() ->> 'email';
  if v_email is null or v_email = '' then
    return jsonb_build_object('ok', false, 'reason', 'NOT_AUTHORIZED');
  end if;

  if p_booking_id is null then
    return jsonb_build_object('ok', false, 'reason', 'INVALID_INPUT');
  end if;

  select * into v_booking from public.bookings where id = p_booking_id;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'BOOKING_NOT_FOUND');
  end if;

  -- Ownership: the session's email must own the booking (equality is the
  -- ownership relation; bookings has no user_id FK).
  if v_booking.customer_email is distinct from v_email then
    return jsonb_build_object('ok', false, 'reason', 'NOT_AUTHORIZED');
  end if;

  -- Only live statuses can be cancelled; terminal states are idempotent-reject
  -- (not idempotent-success: the UI shows "no longer cancellable").
  if v_booking.status not in ('pending', 'confirmed') then
    return jsonb_build_object('ok', false, 'reason', 'ALREADY_CLOSED');
  end if;

  -- Free-cancellation window: min_advance_minutes from restaurant_settings
  -- doubles as the minimum notice to cancel (default 240 = 4h, matching
  -- cancel-policy's FREE_CANCEL_MINUTES_BEFORE=240). Missing settings row =
  -- fail-open window 240 (same default the client uses).
  select * into v_settings from public.restaurant_settings order by created_at limit 1;
  v_window_minutes := coalesce(v_settings.min_advance_minutes, 240);

  v_now := now() at time zone 'America/Argentina/Buenos_Aires';
  v_slot_ts := v_booking.booking_date + v_booking.booking_time;

  if v_slot_ts < v_now + make_interval(mins => v_window_minutes) then
    return jsonb_build_object('ok', false, 'reason', 'CANCEL_WINDOW_CLOSED');
  end if;

  update public.bookings
  set status = 'cancelled'
  where id = p_booking_id
    and status in ('pending', 'confirmed')
  returning * into v_booking;

  if not found then
    -- Lost a race with a concurrent staff update; nothing was cancelled.
    return jsonb_build_object('ok', false, 'reason', 'ALREADY_CLOSED');
  end if;

  return jsonb_build_object('ok', true, 'status', v_booking.status);
end;
$$;

-- authenticated only: cancellation requires a session. Revoke any inherited
-- PUBLIC execute first (defensive: SECURITY DEFINER must never be anon-callable).
revoke all on function public.cancel_my_booking(uuid) from public, anon;
grant execute on function public.cancel_my_booking(uuid) to authenticated;
