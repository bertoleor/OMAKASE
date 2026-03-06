"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { logger } from "@/lib/logger";

export interface Booking {
  id: string;
  customer_name: string;
  customer_phone?: string;
  booking_time: string;
  pax: number;
  zone_id: string;
  table_id?: string;
  status: "pending" | "confirmed" | "seated" | "completed" | "cancelled" | "no_show";
  notes?: string;
  booking_date: string;
}

export function useRealtimeBookings(date: string) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    let isMounted = true;

    async function fetchBookings() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("bookings")
          .select("*")
          .eq("booking_date", date)
          .order("booking_time", { ascending: true });

        if (error) throw error;
        if (isMounted) setBookings(data || []);
      } catch (error) {
        logger.error("Error fetching bookings", error instanceof Error ? error : undefined, {
          context: "useRealtimeBookings",
          date,
        });
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchBookings();

    // Subscribe to changes
    const channel = supabase
      .channel(`dashboard-bookings-${date}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookings",
          filter: `booking_date=eq.${date}`,
        },
        (payload: { eventType: string; new: Booking; old: Booking }) => {
          const evt = payload.eventType;
          const newItem = payload.new;
          const oldItem = payload.old;

          // Process event - use inline callbacks to reduce nesting
          if (evt === "INSERT") {
            const sorter = (a: Booking, b: Booking) => a.booking_time.localeCompare(b.booking_time);
            setBookings((prev: Booking[]) => [newItem, ...prev].toSorted(sorter));
          } else if (evt === "UPDATE") {
            const id = newItem.id;
            const updater = (b: Booking) => b.id === id ? newItem : b;
            setBookings((prev: Booking[]) => prev.map(updater));
          } else if (evt === "DELETE") {
            const id = oldItem.id;
            const filterPred = (b: Booking) => b.id !== id;
            setBookings((prev: Booking[]) => prev.filter(filterPred));
          }
        },
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [date]);

  return { bookings, loading };
}
