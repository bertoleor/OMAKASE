"use client";

import { useEffect, useState } from "react";
import { Users, Clock, TrendingUp, CalendarCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface KPIData {
  today: {
    total_bookings: number;
    confirmed: number;
    pending: number;
    seated: number;
    total_pax: number;
  };
  upcoming: {
    next_7_days: number;
    next_30_days: number;
  };
  zones: {
    zone_name: string;
    current_occupancy: number;
    capacity: number;
    utilization_percent: number;
  }[];
}

export default function KPICards({ date }: { date: string }) {
  const [stats, setStats] = useState<KPIData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const supabase = createClient();

        // Call the new dashboard skill via RPC or API
        // For now, we'll query directly, but this should call the DashboardSkill
        const { data, error } = await supabase.rpc("get_dashboard_stats");

        if (error) throw error;
        setStats(data);
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [date]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-black/30 backdrop-blur-md border border-white/10 rounded-xl p-6 animate-pulse"
          >
            <div className="h-4 bg-white/10 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-white/10 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  const kpis = [
    {
      label: "Reservas Hoy",
      value: stats?.today.total_bookings || 0,
      icon: CalendarCheck,
      color: "text-white",
      bgColor: "bg-white/5",
      subtitle: `${stats?.today.confirmed || 0} confirmadas`,
    },
    {
      label: "Comensales Hoy",
      value: stats?.today.total_pax || 0,
      icon: Users,
      color: "text-white",
      bgColor: "bg-white/5",
      subtitle: `${stats?.today.seated || 0} sentados`,
    },
    {
      label: "Próximos 7 Días",
      value: stats?.upcoming.next_7_days || 0,
      icon: TrendingUp,
      color: "text-white",
      bgColor: "bg-white/5",
      subtitle: "reservas",
    },
    {
      label: "Ocupación Actual",
      value: `${Math.round(
        (stats?.zones.reduce((sum, z) => sum + z.utilization_percent, 0) || 0) /
          (stats?.zones.length || 1),
      )}%`,
      icon: Clock,
      color: "text-white",
      bgColor: "bg-white/5",
      subtitle: "promedio zonas",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi, index) => {
        const Icon = kpi.icon;
        return (
          <div
            key={index}
            className="group bg-black/30 backdrop-blur-md border border-white/10 rounded-xl p-6 hover:bg-black/40 hover:border-white/20 transition-all duration-300"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-lg ${kpi.bgColor}`}>
                <Icon className={`w-5 h-5 ${kpi.color}`} />
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-white/60 font-medium">{kpi.label}</p>
              <p className="text-3xl font-bold text-white group-hover:scale-105 transition-transform">
                {kpi.value}
              </p>
              <p className="text-xs text-white/40">{kpi.subtitle}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
