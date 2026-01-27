"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { BookingRow, BookingStatusDb } from "@/types/database.types";

interface UseRealtimeBookingsOptions {
  date: string; // YYYY-MM-DD
}

interface RealtimePayload {
  eventType: string;
  new: unknown;
  old: { id?: string } | null;
}

function sortByTime(a: BookingRow, b: BookingRow): number {
  return a.booking_time.localeCompare(b.booking_time);
}

function applyRealtimeUpdate(
  prev: BookingRow[],
  payload: RealtimePayload,
): BookingRow[] {
  const newBooking = payload.new as BookingRow;

  if (payload.eventType === "INSERT") {
    return [...prev, newBooking].sort(sortByTime);
  }
  if (payload.eventType === "UPDATE") {
    return prev.map((b) => (b.id === newBooking.id ? newBooking : b));
  }
  if (payload.eventType === "DELETE") {
    return prev.filter((b) => b.id !== payload.old?.id);
  }
  return prev;
}

export function useRealtimeBookings({ date }: UseRealtimeBookingsOptions) {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = useMemo(() => createClient(), []);

  // Fetch initial data
  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from("bookings")
        .select("*")
        .eq("booking_date", date)
        .order("booking_time", { ascending: true });

      if (fetchError) {
        setError(fetchError.message);
        setBookings([]);
      } else {
        setBookings((data as BookingRow[]) || []);
      }
    } catch {
      setError("Failed to fetch bookings");
      setBookings([]);
    }
    setLoading(false);
  }, [date, supabase]);

  // Update status function for UI actions
  const updateStatus = useCallback(
    async (id: string, status: BookingStatusDb) => {
      try {
        const { error: updateError } = await supabase
          .from("bookings")
          .update({ status })
          .eq("id", id);

        if (updateError) {
          console.error("Error updating status:", updateError);
          return false;
        }
        return true;
      } catch {
        return false;
      }
    },
    [supabase],
  );

  // Realtime subscription
  useEffect(() => {
    // eslint-disable-next-line
    fetchBookings();

    // Only set up realtime if we have a real supabase client
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return;
    }

    const handleRealtimeUpdate = (payload: RealtimePayload) => {
      setBookings((prev) => applyRealtimeUpdate(prev, payload));
    };

    const channel = supabase
      .channel("bookings-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookings",
          filter: `booking_date=eq.${date}`,
        },
        handleRealtimeUpdate,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [date, fetchBookings, supabase]);

  return { bookings, loading, error, updateStatus, refetch: fetchBookings };
}
