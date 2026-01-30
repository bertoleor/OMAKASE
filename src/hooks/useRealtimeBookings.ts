"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export interface Booking {
  id: string;
  customer_name: string;
  customer_phone?: string;
  booking_time: string;
  pax: number;
  zone_id: string;
  table_id?: string;
  status:
    | "pending"
    | "confirmed"
    | "seated"
    | "completed"
    | "cancelled"
    | "no_show";
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
        console.error("Error fetching bookings:", error);
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
          if (payload.eventType === "INSERT") {
            setBookings((prev) =>
              [...prev, payload.new as Booking].sort((a, b) =>
                a.booking_time.localeCompare(b.booking_time),
              ),
            );
          } else if (payload.eventType === "UPDATE") {
            setBookings((prev) =>
              prev.map((b) =>
                b.id === (payload.new as Booking).id
                  ? (payload.new as Booking)
                  : b,
              ),
            );
          } else if (payload.eventType === "DELETE") {
            setBookings((prev) =>
              prev.filter((b) => b.id !== (payload.old as Booking).id),
            );
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
