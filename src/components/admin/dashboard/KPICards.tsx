"use client";

import { Users, Clock, TrendingUp, CalendarCheck } from "lucide-react";
import { useDashboardKPIs } from "@/hooks/queries";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface KPICardsProps {
  readonly date: string;
}

export default function KPICards({ date }: KPICardsProps) {
  const { data: kpis, isLoading, error } = useDashboardKPIs(date);

  // Calculate derived values
  const occupancyPercent =
    kpis && kpis.totalCapacity > 0
      ? Math.round((kpis.seatedPax / kpis.totalCapacity) * 100)
      : 0;

  const kpiData = [
    {
      label: "Reservas Hoy",
      value: kpis?.todayBookings ?? 0,
      icon: CalendarCheck,
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/20",
      subtitle: `${kpis?.confirmedCount ?? 0} confirmadas`,
    },
    {
      label: "Comensales",
      value: kpis?.totalPax ?? 0,
      icon: Users,
      color: "text-green-400",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/20",
      subtitle: `${kpis?.seatedPax ?? 0} sentados ahora`,
    },
    {
      label: "Próximos 7 Días",
      value: kpis?.next7DaysCount ?? 0,
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
      subtitle: `${kpis?.seatedPax ?? 0} / ${kpis?.totalCapacity ?? 0} pax`,
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {["kpi-1", "kpi-2", "kpi-3", "kpi-4"].map((key) => (
          <Card key={key} className="bg-black/40 border-white/10 animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-white/10 rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-white/10 rounded w-3/4"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="col-span-full bg-red-500/10 border-red-500/20">
          <CardContent className="p-6 text-center text-red-400">
            Error al cargar KPIs
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpiData.map((kpi) => {
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
