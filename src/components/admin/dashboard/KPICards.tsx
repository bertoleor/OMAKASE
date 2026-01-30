"use client";

import { useEffect, useState } from "react";
import { Users, Clock, TrendingUp, CalendarCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRealtimeBookings } from "@/hooks/useRealtimeBookings";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface KPICardsProps {
  readonly date: string;
}

export default function KPICards({ date }: KPICardsProps) {
  const { bookings, loading: loadingBookings } = useRealtimeBookings(date);
  const [zones, setZones] = useState<{ id: string; capacity_pax: number }[]>(
    [],
  );
  const [next7DaysCount, setNext7DaysCount] = useState(0);

  useEffect(() => {
    async function fetchAdditionalStats() {
      const supabase = createClient();

      // Fetch Zones for capacity
      const { data: zonesData } = await supabase
        .from("zones")
        .select("id, capacity_pax")
        .eq("is_active", true);

      if (zonesData) setZones(zonesData);

      // Fetch Next 7 Days count
      const today = new Date().toISOString().split("T")[0];
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      const nextWeekStr = nextWeek.toISOString().split("T")[0];

      const { count } = await supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .gte("booking_date", today)
        .lte("booking_date", nextWeekStr)
        .neq("status", "cancelled");

      setNext7DaysCount(count || 0);
    }

    fetchAdditionalStats();
  }, []);

  // Calculate Today's Stats from Realtime Bookings
  const totalBookings = bookings.length;
  const confirmedCount = bookings.filter((b) => b.status === "confirmed").length;
  const totalPax = bookings.reduce(
    (acc, b) => (b.status !== "cancelled" ? acc + b.pax : acc),
    0,
  );
  const seatedPax = bookings.reduce(
    (acc, b) => (b.status === "seated" ? acc + b.pax : acc),
    0,
  );

  // Calculate Occupancy
  // Note: This is "Current Occupancy" based on "seated" status, which is real-time.
  // Capacity is total zone capacity.
  const totalCapacity = zones.reduce((acc, z) => acc + z.capacity_pax, 0);
  const occupancyPercent =
    totalCapacity > 0 ? Math.round((seatedPax / totalCapacity) * 100) : 0;

  const kpis = [
    {
      label: "Reservas Hoy",
      value: totalBookings,
      icon: CalendarCheck,
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/20",
      subtitle: `${confirmedCount} confirmadas`,
    },
    {
      label: "Comensales",
      value: totalPax,
      icon: Users,
      color: "text-green-400",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/20",
      subtitle: `${seatedPax} sentados ahora`,
    },
    {
      label: "Próximos 7 Días",
      value: next7DaysCount,
      icon: TrendingUp,
      color: "text-purple-400",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-500/20",
      subtitle: "nuevas reservas",
    },
    {
      label: "Ocupación Actual",
      value: `${occupancyPercent}%`,
      icon: Clock,
      color: "text-amber-400",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/20",
      subtitle: `${seatedPax} / ${totalCapacity} pax`,
    },
  ];

  if (loadingBookings) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {new Array(4).fill(null).map((_, i) => (
          <Card key={`skeleton-${i}`} className="bg-black/40 border-white/10 animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-white/10 rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-white/10 rounded w-3/4"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <Card
            key={kpi.label}
            className={cn(
              "bg-black/40 backdrop-blur-md border transition-all duration-300 hover:bg-black/60",
              "border-white/10 hover:border-white/20",
            )}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div
                  className={cn(
                    "p-3 rounded-xl border",
                    kpi.bgColor,
                    kpi.borderColor,
                  )}
                >
                  <Icon className={cn("w-5 h-5", kpi.color)} />
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-white/60 font-medium">{kpi.label}</p>
                <div className="flex items-baseline space-x-2">
                  <p className="text-3xl font-bold text-white tracking-tight">
                    {kpi.value}
                  </p>
                </div>
                <p className="text-xs text-white/40 font-medium">
                  {kpi.subtitle}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
