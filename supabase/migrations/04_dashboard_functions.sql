-- ============================================
-- MESS Reservations - Dashboard RPC Functions
-- ============================================
-- IDEMPOTENT: Safe to run multiple times
-- Drop if exists and recreate
drop function if exists get_dashboard_stats();
create or replace function get_dashboard_stats() returns jsonb language plpgsql security definer as $$
declare result jsonb;
today_date date := current_date;
begin
select jsonb_build_object(
        'today',
        (
            select jsonb_build_object(
                    'total_bookings',
                    count(*),
                    'confirmed',
                    count(*) filter (
                        where status = 'confirmed'
                    ),
                    'pending',
                    count(*) filter (
                        where status = 'pending'
                    ),
                    'seated',
                    count(*) filter (
                        where status = 'seated'
                    ),
                    'cancelled',
                    count(*) filter (
                        where status = 'cancelled'
                    ),
                    'total_pax',
                    coalesce(sum(pax), 0),
                    'revenue_potential',
                    coalesce(sum(deposit_amount), 0)
                )
            from bookings
            where booking_date = today_date
        ),
        'upcoming',
        jsonb_build_object(
            'next_7_days',
            (
                select count(*)
                from bookings
                where booking_date between today_date and today_date + interval '7 days'
                    and status in ('confirmed', 'pending')
            ),
            'next_30_days',
            (
                select count(*)
                from bookings
                where booking_date between today_date and today_date + interval '30 days'
                    and status in ('confirmed', 'pending')
            )
        ),
        'zones',
        coalesce(
            (
                select jsonb_agg(
                        zone_stats
                        order by zone_stats->>'display_order'
                    )
                from (
                        select jsonb_build_object(
                                'zone_name',
                                z.name,
                                'current_occupancy',
                                coalesce(
                                    (
                                        select sum(pax)
                                        from bookings b
                                        where b.zone_id = z.id
                                            and b.booking_date = today_date
                                            and b.status = 'seated'
                                    ),
                                    0
                                ),
                                'capacity',
                                z.capacity_pax,
                                'utilization_percent',
                                round(
                                    (
                                        coalesce(
                                            (
                                                select sum(pax)
                                                from bookings b
                                                where b.zone_id = z.id
                                                    and b.booking_date = today_date
                                                    and b.status = 'seated'
                                            ),
                                            0
                                        )::numeric / nullif(z.capacity_pax, 0)
                                    ) * 100
                                ),
                                'display_order',
                                z.display_order
                            ) as zone_stats
                        from zones z
                        where z.is_active = true
                    ) as zone_data
            ),
            '[]'::jsonb
        )
    ) into result;
return result;
end;
$$;
-- Grant access to all users
grant execute on function get_dashboard_stats() to authenticated,
    anon;