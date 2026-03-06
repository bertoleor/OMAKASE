"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Types for realtime subscriptions
 */
export type RealtimeEvent = "INSERT" | "UPDATE" | "DELETE";
export type RealtimeTable = "bookings" | "tables" | "zones" | "events" | "profiles";

export interface RealtimePayload<T> {
  eventType: RealtimeEvent;
  new: T;
  old: T;
}

export interface UseRealtimeOptions {
  /** Table to subscribe to */
  table: RealtimeTable;
  /** Optional filter (e.g., 'booking_date=eq.2024-01-01') */
  filter?: string;
  /** Callback when events occur */
  onEvent?: (payload: RealtimePayload<unknown>) => void;
  /** Enable/disable subscription */
  enabled?: boolean;
}

/**
 * Hook for subscribing to Supabase Realtime changes
 *
 * @example
 * const { data, loading, error } = useRealtime({
 *   table: 'bookings',
 *   filter: 'booking_date=eq.2024-01-01',
 *   onEvent: (payload) => console.log('Change:', payload)
 * });
 */
export function useRealtime<T>({ table, filter, onEvent, enabled = true }: UseRealtimeOptions) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Build the channel name
  const channelName = filter ? `${table}-${filter.replaceAll(/[^a-zA-Z0-9]/g, "-")}` : table;

  useEffect(() => {
    if (!enabled) return;

    const supabase = createClient();
    let isMounted = true;

    // Initial fetch
    async function fetchInitialData() {
      try {
        setLoading(true);
        let query = supabase.from(table).select("*");

        // Apply filter if provided
        if (filter) {
          const [column, operator, value] = filter.split(".");
          if (column && operator && value) {
            query = query.filter(column, operator.replace("eq", "eq") as "eq", value);
          }
        }

        const { data: result, error: fetchError } = await query;

        if (fetchError) throw fetchError;
        if (isMounted) setData(result || []);
      } catch (err) {
        if (isMounted) setError(err as Error);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchInitialData();

    // Subscribe to changes
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table,
          ...(filter ? { filter } : {}),
        },
        (payload: RealtimePayload<T>) => {
          if (!isMounted) return;

          // Call the event handler
          if (onEvent) {
            onEvent(payload as RealtimePayload<unknown>);
          }

          // Process event based on type - inline to avoid nesting
          const evt = payload.eventType;
          if (evt === "INSERT") {
            setData((prev: T[]) => [...prev, payload.new]);
          } else if (evt === "UPDATE") {
            const updId = (payload.new as { id?: string })?.id;
            const updateItem = (item: T): T => {
              const itemId = (item as { id?: string })?.id;
              return itemId === updId ? payload.new : item;
            };
            setData((prev: T[]) => prev.map(updateItem));
          } else if (evt === "DELETE") {
            const delId = (payload.old as { id?: string })?.id;
            const filterItem = (item: T): boolean => {
              return (item as { id?: string })?.id !== delId;
            };
            setData((prev: T[]) => prev.filter(filterItem));
          }
        },
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [table, filter, enabled, channelName, onEvent]);

  // Manual refresh function
  const refresh = useCallback(async () => {
    const supabase = createClient();
    try {
      let query = supabase.from(table).select("*");

      if (filter) {
        const [column, operator, value] = filter.split(".");
        if (column && operator && value) {
          query = query.filter(column, operator.replace("eq", "eq") as "eq", value);
        }
      }

      const { data: result, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setData(result || []);
    } catch (err) {
      setError(err as Error);
    }
  }, [table, filter]);

  return { data, loading, error, refresh };
}

/**
 * Hook specifically for booking realtime updates
 *
 * @example
 * const { bookings, loading } = useRealtimeBookings('2024-01-01');
 */
export function useRealtimeBookings(date: string) {
  const { data, loading, error, refresh } = useRealtime<{
    id: string;
    customer_name: string;
    customer_phone?: string;
    booking_time: string;
    pax: number;
    zone_id: string;
    table_id?: string;
    status: string;
    notes?: string;
    booking_date: string;
  }>({
    table: "bookings",
    filter: `booking_date=eq.${date}`,
  });

  // Sort by time
  const sortedData = [...data].sort((a, b) => a.booking_time.localeCompare(b.booking_time));

  return {
    bookings: sortedData,
    loading,
    error,
    refresh,
  };
}

/**
 * Hook for realtime table updates
 *
 * @example
 * const { tables, loading } = useRealtimeTables();
 */
export function useRealtimeTables(zoneId?: string) {
  const { data, loading, error, refresh } = useRealtime<{
    id: string;
    zone_id: string;
    name: string;
    seats: number;
    position_x: number;
    position_y: number;
    width: number;
    height: number;
    shape: string;
    is_active: boolean;
  }>({
    table: "tables",
    filter: zoneId ? `zone_id=eq.${zoneId}` : undefined,
  });

  return { tables: data, loading, error, refresh };
}

/**
 * Hook for realtime zone updates
 *
 * @example
 * const { zones, loading } = useRealtimeZones();
 */
export function useRealtimeZones() {
  const { data, loading, error, refresh } = useRealtime<{
    id: string;
    name: string;
    slug: string;
    capacity_pax: number;
    is_active: boolean;
    display_order: number;
  }>({
    table: "zones",
  });

  // Sort by display order
  const sortedData = [...data].sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

  return { zones: sortedData, loading, error, refresh };
}

/**
 * Hook for realtime event updates
 *
 * @example
 * const { events, loading } = useRealtimeEvents();
 */
export function useRealtimeEvents(date?: string) {
  const { data, loading, error, refresh } = useRealtime<{
    id: string;
    name: string;
    description: string;
    event_type: string;
    event_date: string;
    start_time: string;
    end_time: string;
    max_capacity: number;
    current_guests: number;
    price_per_person: number;
    zones_enabled: string[];
    blocks_regular_bookings: boolean;
    status: string;
  }>({
    table: "events",
    filter: date ? `event_date=eq.${date}` : undefined,
  });

  // Sort by date and time
  const sortedData = [...data].sort((a, b) => {
    const dateCompare = a.event_date.localeCompare(b.event_date);
    if (dateCompare !== 0) return dateCompare;
    return a.start_time.localeCompare(b.start_time);
  });

  return { events: sortedData, loading, error, refresh };
}
