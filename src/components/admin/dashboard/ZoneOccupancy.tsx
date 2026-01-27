"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Zone {
  id: string;
  name: string;
  slug: string;
  capacity_pax: number;
}

interface ZoneOccupancyProps {
  date: string;
}

export default function ZoneOccupancy({ date }: ZoneOccupancyProps) {
  const [zones, setZones] = useState<(Zone & { occupied: number })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const supabase = createClient();

        // Fetch zones
        const { data: zonesData } = await supabase
          .from("zones")
          .select("*")
          .eq("is_active", true)
          .order("display_order");

        // For each zone, calculate current occupancy
        const enrichedZones = await Promise.all(
          ((zonesData || []) as Zone[]).map(async (zone: Zone) => {
            const { data: seatedBookings } = await supabase
              .from("bookings")
              .select("pax")
              .eq("booking_date", date)
              .eq("zone_id", zone.id)
              .eq("status", "seated");

            const occupied =
              seatedBookings?.reduce(
                (sum: number, b: { pax: number }) => sum + b.pax,
                0,
              ) || 0;
            return { ...zone, occupied };
          }),
        );

        setZones(enrichedZones);
      } catch (error) {
        console.error("Error fetching zone occupancy:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();

    // Realtime updates
    const supabase = createClient();
    const channel = supabase
      .channel("zone-occupancy")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings" },
        () => {
          fetchData();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [date]);

  if (loading) {
    return (
      <div className="flex space-x-4 overflow-x-auto pb-2">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="flex-shrink-0 w-32 h-32 bg-black/30 rounded-xl animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex space-x-4 overflow-x-auto pb-2 scrollbar-hide">
      {zones.map((zone) => {
        const percentage = Math.round(
          (zone.occupied / zone.capacity_pax) * 100,
        );
        const isFull = percentage >= 100;
        const isHigh = percentage >= 75;

        // SVG circle calculations
        const radius = 40;
        const circumference = 2 * Math.PI * radius;
        const offset =
          circumference - (Math.min(percentage, 100) / 100) * circumference;

        const colorClass = isFull
          ? "text-red-400"
          : isHigh
            ? "text-yellow-400"
            : "text-green-400";

        const bgColorClass = isFull
          ? "from-red-500/20"
          : isHigh
            ? "from-yellow-500/20"
            : "from-green-500/20";

        return (
          <div
            key={zone.id}
            className={`flex-shrink-0 w-36 bg-gradient-to-b ${bgColorClass} to-transparent backdrop-blur-md border border-white/10 rounded-xl p-4 text-center hover:scale-105 transition-transform cursor-pointer`}
          >
            {/* Circular Progress */}
            <div className="relative w-20 h-20 mx-auto mb-2">
              <svg className="w-20 h-20 transform -rotate-90">
                {/* Background circle */}
                <circle
                  cx="40"
                  cy="40"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="none"
                  className="text-white/10"
                />
                {/* Progress circle */}
                <circle
                  cx="40"
                  cy="40"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  className={`${colorClass} gauge-progress`}
                />
              </svg>
              {/* Percentage Text */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-lg font-bold ${colorClass}`}>
                  {percentage}%
                </span>
              </div>
            </div>

            {/* Zone Info */}
            <p className="text-sm font-medium text-white truncate">
              {zone.name.split(" - ")[1] || zone.name}
            </p>
            <p className="text-xs text-white/60">
              {zone.occupied}/{zone.capacity_pax} pax
            </p>
          </div>
        );
      })}
    </div>
  );
}
