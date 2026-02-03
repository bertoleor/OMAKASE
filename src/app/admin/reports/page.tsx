"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Download,
  TrendingUp,
  TrendingDown,
  Users,
  Clock,
  MapPin,
  XCircle,
  CheckCircle2,
  BarChart3,
  PieChart,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface PeriodStats {
  total_bookings: number;
  total_pax: number;
  confirmed: number;
  cancelled: number;
  no_shows: number;
  completed: number;
  avg_pax: number;
  peak_hour: string;
  zone_stats: {
    zone_name: string;
    bookings: number;
    pax: number;
    avg_pax: number;
  }[];
  daily_trend: {
    date: string;
    bookings: number;
    pax: number;
  }[];
}

interface BookingRecord {
  id: string;
  booking_date: string;
  booking_time: string;
  pax: number;
  status: string;
  zone_id: string;
  zones: { name: string } | null;
}

const PERIOD_OPTIONS = [
  { value: "7d", label: "Últimos 7 días" },
  { value: "30d", label: "Últimos 30 días" },
  { value: "90d", label: "Últimos 90 días" },
  { value: "custom", label: "Personalizado" },
];

import { useUserRole } from "@/hooks/useUserRole";
import { useRouter } from "next/navigation";

const getZoneBarColor = (index: number) => {
  const colors = [
    "bg-blue-500",
    "bg-purple-500",
    "bg-emerald-500",
    "bg-orange-500",
    "bg-pink-500",
  ];
  return colors[index % colors.length];
};

export default function ReportsPage() {
  const { isAdmin, loading: roleLoading } = useUserRole();
  const router = useRouter();

  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      router.push("/admin/dashboard");
    }
  }, [isAdmin, roleLoading, router]);

  const [period, setPeriod] = useState("30d");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [stats, setStats] = useState<PeriodStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Calculate date range based on period
  const dateRange = useMemo(() => {
    const end = new Date();
    const start = new Date();

    if (period === "7d") {
      start.setDate(end.getDate() - 7);
    } else if (period === "30d") {
      start.setDate(end.getDate() - 30);
    } else if (period === "90d") {
      start.setDate(end.getDate() - 90);
    } else if (period === "custom" && startDate && endDate) {
      return { start: startDate, end: endDate };
    }

    return {
      start: start.toISOString().split("T")[0],
      end: end.toISOString().split("T")[0],
    };
  }, [period, startDate, endDate]);

  useEffect(() => {
    async function fetchStats() {
      if (period === "custom" && (!startDate || !endDate)) return;

      setLoading(true);
      try {
        const supabase = createClient();

        // Fetch bookings in range
        const { data: bookings, error } = await supabase
          .from("bookings")
          .select(
            `
            id, booking_date, booking_time, pax, status, zone_id,
            zones(name)
          `,
          )
          .gte("booking_date", dateRange.start)
          .lte("booking_date", dateRange.end);

        if (error) throw error;

        const typedBookings = (bookings || []) as BookingRecord[];

        // Calculate stats
        const total = typedBookings.length;
        const totalPax = typedBookings.reduce(
          (sum: number, b) => sum + b.pax,
          0,
        );
        const confirmed = typedBookings.filter(
          (b) => b.status === "confirmed",
        ).length;
        const cancelled = typedBookings.filter(
          (b) => b.status === "cancelled",
        ).length;
        const noShows = typedBookings.filter(
          (b) => b.status === "no_show",
        ).length;
        const completed = typedBookings.filter(
          (b) => b.status === "completed",
        ).length;

        // Peak hour calculation
        const hourCounts: Record<string, number> = {};
        typedBookings.forEach((b) => {
          const hour = b.booking_time?.substring(0, 2) || "00";
          hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        });
        const peakHour =
          Object.entries(hourCounts).sort(([, a], [, b]) => b - a)[0]?.[0] ||
          "20";

        // Zone stats
        const zoneMap: Record<
          string,
          { bookings: number; pax: number; name: string }
        > = {};
        typedBookings.forEach((b) => {
          const zoneName = b.zones?.name || "Unknown";
          if (!zoneMap[zoneName]) {
            zoneMap[zoneName] = { bookings: 0, pax: 0, name: zoneName };
          }
          zoneMap[zoneName].bookings++;
          zoneMap[zoneName].pax += b.pax;
        });
        const zoneStats = Object.values(zoneMap)
          .map((z) => ({
            zone_name: z.name,
            bookings: z.bookings,
            pax: z.pax,
            avg_pax: Math.round((z.pax / z.bookings) * 10) / 10,
          }))
          .sort((a, b) => b.bookings - a.bookings);

        // Daily trend
        const dailyMap: Record<string, { bookings: number; pax: number }> = {};
        typedBookings.forEach((b) => {
          const date = b.booking_date;
          if (!dailyMap[date]) {
            dailyMap[date] = { bookings: 0, pax: 0 };
          }
          dailyMap[date].bookings++;
          dailyMap[date].pax += b.pax;
        });
        const dailyTrend = Object.entries(dailyMap)
          .map(([date, data]) => ({ date, ...data }))
          .sort((a, b) => a.date.localeCompare(b.date));

        setStats({
          total_bookings: total,
          total_pax: totalPax,
          confirmed,
          cancelled,
          no_shows: noShows,
          completed,
          avg_pax: total > 0 ? Math.round((totalPax / total) * 10) / 10 : 0,
          peak_hour: `${peakHour}:00`,
          zone_stats: zoneStats,
          daily_trend: dailyTrend,
        });
      } catch (error) {
        console.error("Error fetching report stats:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [dateRange, period, startDate, endDate]);

  const exportCSV = () => {
    if (!stats) return;

    const headers = ["Fecha", "Reservas", "PAX"];
    const rows = stats.daily_trend.map((d) => [d.date, d.bookings, d.pax]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reporte-${dateRange.start}-${dateRange.end}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const cancellationRate = stats
    ? Math.round(
        ((stats.cancelled + stats.no_shows) /
          Math.max(stats.total_bookings, 1)) *
          100,
      )
    : 0;

  const renderContent = () => {
    if (loading || roleLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-white/40 animate-spin" />
        </div>
      );
    }

    if (!stats || !isAdmin) {
      return (
        <div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-xl p-12 text-center">
          <p className="text-white/60">
            {isAdmin 
              ? "Selecciona un período para ver las estadísticas" 
              : "No tienes permisos para ver este reporte"}
          </p>
        </div>
      );
    }

    return (
      <>
        {/* Main KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            icon={BarChart3}
            label="Total Reservas"
            value={stats.total_bookings}
            color="blue"
          />
          <MetricCard
            icon={Users}
            label="Total PAX"
            value={stats.total_pax}
            subtitle={`Promedio: ${stats.avg_pax} pax/reserva`}
            color="green"
          />
          <MetricCard
            icon={CheckCircle2}
            label="Completadas"
            value={stats.completed}
            subtitle={`${Math.round((stats.completed / Math.max(stats.total_bookings, 1)) * 100)}% del total`}
            color="emerald"
          />
          <MetricCard
            icon={XCircle}
            label="Cancelaciones + No-Shows"
            value={stats.cancelled + stats.no_shows}
            subtitle={`${cancellationRate}% tasa de cancelación`}
            color="red"
            trend={cancellationRate > 15 ? "down" : "up"}
          />
        </div>

        {/* Secondary stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Clock className="w-5 h-5 text-purple-400" />
              <h3 className="font-medium text-white">Hora Pico</h3>
            </div>
            <p className="text-3xl font-bold text-white">{stats.peak_hour}</p>
            <p className="text-sm text-white/60 mt-1">
              Mayor cantidad de reservas
            </p>
          </div>

          <div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-xl p-6 md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <MapPin className="w-5 h-5 text-orange-400" />
              <h3 className="font-medium text-white">Rendimiento por Zona</h3>
            </div>
            <div className="space-y-3">
              {stats.zone_stats.map((zone, i) => {
                const maxBookings = Math.max(
                  ...stats.zone_stats.map((z) => z.bookings),
                );
                const percentage = (zone.bookings / maxBookings) * 100;
                return (
                  <div key={zone.zone_name} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-white">{zone.zone_name}</span>
                      <span className="text-white/60">
                        {zone.bookings} reservas • {zone.pax} pax
                      </span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        ref={(el) => {
                          if (el) el.style.setProperty("--progress", `${percentage}%`);
                        }}
                        className={`h-full rounded-full progress-bar ${getZoneBarColor(i)}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Daily Trend Chart */}
        <div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              <h3 className="font-medium text-white">Tendencia Diaria</h3>
            </div>
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                <span className="text-white/60">Reservas</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                <span className="text-white/60">PAX</span>
              </div>
            </div>
          </div>

          {/* Simple bar chart */}
          <div className="h-48 flex items-end space-x-1">
            {stats.daily_trend.slice(-14).map((day) => {
              const maxPax = Math.max(
                ...stats.daily_trend.map((d) => d.pax),
                1,
              );
              const maxBookings = Math.max(
                ...stats.daily_trend.map((d) => d.bookings),
                1,
              );
              const heightPax = (day.pax / maxPax) * 100;
              const heightBookings = (day.bookings / maxBookings) * 100;
              const isWeekend = [0, 6].includes(new Date(day.date).getDay());

              return (
                <div
                  key={day.date}
                  className="flex-1 flex flex-col items-center"
                  title={`${day.date}: ${day.bookings} reservas, ${day.pax} pax`}
                >
                  <div className="w-full flex items-end justify-center space-x-0.5 mb-2 chart-container">
                    <div
                      ref={(el) => {
                        if (el) el.style.setProperty("--bar-height", `${heightBookings}%`);
                      }}
                      className="w-2 bg-blue-400 rounded-t chart-bar hover:bg-blue-300"
                    />
                    <div
                      ref={(el) => {
                        if (el) el.style.setProperty("--bar-height", `${heightPax}%`);
                      }}
                      className="w-2 bg-green-400 rounded-t chart-bar hover:bg-green-300"
                    />
                  </div>
                  <span
                    className={`text-xs ${isWeekend ? "text-orange-400" : "text-white/40"}`}
                  >
                    {new Date(day.date).getDate()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <PieChart className="w-5 h-5 text-cyan-400" />
            <h3 className="font-medium text-white">
              Distribución por Estado
            </h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <StatusBlock
              label="Confirmadas"
              value={stats.confirmed}
              total={stats.total_bookings}
              color="bg-blue-500"
            />
            <StatusBlock
              label="Completadas"
              value={stats.completed}
              total={stats.total_bookings}
              color="bg-green-500"
            />
            <StatusBlock
              label="Canceladas"
              value={stats.cancelled}
              total={stats.total_bookings}
              color="bg-red-500"
            />
            <StatusBlock
              label="No-Shows"
              value={stats.no_shows}
              total={stats.total_bookings}
              color="bg-orange-500"
            />
            <StatusBlock
              label="Pendientes"
              value={
                stats.total_bookings -
                stats.confirmed -
                stats.completed -
                stats.cancelled -
                stats.no_shows
              }
              total={stats.total_bookings}
              color="bg-yellow-500"
            />
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Reportes</h1>
          <p className="text-white/40 mt-1">
            Análisis y métricas del período seleccionado
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Period Selector */}
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2 bg-black/30 border border-white/10 rounded-xl text-white focus:border-blue-500 focus:outline-none"
            aria-label="Seleccionar período"
          >
            {PERIOD_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {period === "custom" && (
            <>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-4 py-2 bg-black/30 border border-white/10 rounded-xl text-white focus:border-blue-500 focus:outline-none"
                aria-label="Fecha inicio"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-4 py-2 bg-black/30 border border-white/10 rounded-xl text-white focus:border-blue-500 focus:outline-none"
                aria-label="Fecha fin"
              />
            </>
          )}

          <button
            onClick={exportCSV}
            disabled={!stats}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-medium rounded-xl transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {renderContent()}
    </div>
  );
}

interface MetricCardProps {
  readonly icon: React.ElementType;
  readonly label: string;
  readonly value: string | number;
  readonly subtitle?: string;
  readonly color: "blue" | "green" | "emerald" | "red" | "purple" | "orange";
  readonly trend?: "up" | "down";
}

function MetricCard({
  icon: Icon,
  label,
  value,
  subtitle,
  color,
  trend,
}: MetricCardProps) {
  const colorClasses: Record<MetricCardProps["color"], string> = {
    blue: "text-blue-400 bg-blue-500/10",
    green: "text-green-400 bg-green-500/10",
    emerald: "text-emerald-400 bg-emerald-500/10",
    red: "text-red-400 bg-red-500/10",
    purple: "text-purple-400 bg-purple-500/10",
    orange: "text-orange-400 bg-orange-500/10",
  };

  return (
    <div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-xl p-6 hover:bg-black/40 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className={`w-5 h-5 ${colorClasses[color].split(" ")[0]}`} />
        </div>
        {trend && (
          <div className={trend === "up" ? "text-green-400" : "text-red-400"}>
            {trend === "up" ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
          </div>
        )}
      </div>
      <p className="text-sm text-white/60 mb-1">{label}</p>
      <p className="text-3xl font-bold text-white">{value}</p>
      {subtitle && <p className="text-xs text-white/40 mt-1">{subtitle}</p>}
    </div>
  );
}

function StatusBlock({
  label,
  value,
  total,
  color,
}: {
  readonly label: string;
  readonly value: number;
  readonly total: number;
  readonly color: string;
}) {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div className="text-center">
      <div className="relative w-16 h-16 mx-auto mb-2">
        <svg className="w-16 h-16 transform -rotate-90">
          <circle
            cx="32"
            cy="32"
            r="28"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            className="text-white/10"
          />
          <circle
            cx="32"
            cy="32"
            r="28"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 28}`}
            strokeDashoffset={`${2 * Math.PI * 28 * (1 - percentage / 100)}`}
            className={color.replace("bg-", "text-")}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-white">{percentage}%</span>
        </div>
      </div>
      <p className="text-xs text-white/60">{label}</p>
      <p className="text-sm font-medium text-white">{value}</p>
    </div>
  );
}
