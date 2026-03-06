"use client";

import { CalendarDays, ChevronLeft, ChevronRight, LayoutGrid, List } from "lucide-react";
import { useState } from "react";
import dynamic from "next/dynamic";
import { useMediaQuery } from "@/hooks/useMediaQuery";

// Dynamic imports for heavy components
// Components handle their own loading states with matching skeletons
const KPICards = dynamic(() => import("@/components/admin/dashboard/KPICards"));

const ZoneOccupancy = dynamic(() => import("@/components/admin/dashboard/ZoneOccupancy"));

const ServiceTimeline = dynamic(() => import("@/components/admin/dashboard/ServiceTimeline"));

const UpcomingArrivals = dynamic(() => import("@/components/admin/dashboard/UpcomingArrivals"));

const ReservationsTable = dynamic(() => import("@/components/admin/dashboard/ReservationsTable"));

const QuickActionsPanel = dynamic(() => import("@/components/admin/dashboard/QuickActionsPanel"));

export default function DashboardPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"timeline" | "list">("timeline");
  const isMobile = useMediaQuery(768);

  // Force list view on mobile
  const effectiveViewMode = isMobile ? "list" : viewMode;

  const formatDate = (d: Date) => {
    return d.toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  };

  const toISODate = (d: Date) => d.toISOString().split("T")[0];

  const goToDate = (direction: "prev" | "next") => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + (direction === "next" ? 1 : -1));
    setSelectedDate(newDate);
  };

  const isToday = selectedDate.toDateString() === new Date().toDateString();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-white/40 mt-1">Gestión del servicio en tiempo real</p>
        </div>

        <div className="flex items-center space-x-3">
          {/* View Toggle - Only on Desktop */}
          {!isMobile && (
            <div className="flex bg-black/30 backdrop-blur-md border border-white/10 rounded-xl p-1">
              <button
                onClick={() => setViewMode("timeline")}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === "timeline"
                    ? "bg-white/10 text-white"
                    : "text-white/40 hover:text-white"
                }`}
                title="Vista Timeline"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === "list" ? "bg-white/10 text-white" : "text-white/40 hover:text-white"
                }`}
                title="Vista Lista"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Date Picker Navigation */}
          <div className="flex items-center space-x-2 bg-black/30 backdrop-blur-md border border-white/10 rounded-xl p-1.5">
            <button
              onClick={() => goToDate("prev")}
              className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Día anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button className="px-4 py-2 flex items-center space-x-2 text-white font-medium rounded-lg hover:bg-white/5 transition-colors">
              <CalendarDays className="w-4 h-4 text-white/60" />
              <span className="capitalize">
                {isToday ? "Hoy" : ""} {formatDate(selectedDate)}
              </span>
            </button>

            <button
              onClick={() => goToDate("next")}
              className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Día siguiente"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            <button
              onClick={() => setSelectedDate(new Date())}
              className="px-3 py-2 text-xs uppercase tracking-wider font-medium text-white/60 hover:text-white border border-white/10 rounded-lg hover:bg-white/5 transition-colors"
            >
              Hoy
            </button>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <KPICards date={toISODate(selectedDate)} />

      {/* Quick Actions Panel - Próximas Reservas + Disponibilidad */}
      <QuickActionsPanel date={toISODate(selectedDate)} />

      {/* Zone Occupancy - Horizontal scroll on mobile */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-3">Ocupación por Zona</h2>
        <ZoneOccupancy date={toISODate(selectedDate)} />
      </div>

      {/* Main View - Timeline (Desktop) or Card Stream (Mobile) */}
      {effectiveViewMode === "timeline" ? (
        <ServiceTimeline date={toISODate(selectedDate)} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-semibold text-white mb-3">Próximas Llegadas</h2>
            <UpcomingArrivals date={toISODate(selectedDate)} />
          </div>
          <div className="hidden lg:block">
            <h2 className="text-lg font-semibold text-white mb-3">Todas las Reservas</h2>
            <ReservationsTable date={toISODate(selectedDate)} />
          </div>
        </div>
      )}

      {/* Full Table - Always visible on Timeline mode, and on desktop List mode */}
      {effectiveViewMode === "timeline" && <ReservationsTable date={toISODate(selectedDate)} />}

      {/* Mobile: Show table below arrivals */}
      {isMobile && (
        <div className="lg:hidden">
          <h2 className="text-lg font-semibold text-white mb-3">Todas las Reservas</h2>
          <ReservationsTable date={toISODate(selectedDate)} />
        </div>
      )}
    </div>
  );
}
