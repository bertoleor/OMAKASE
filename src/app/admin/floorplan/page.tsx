"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import {
  Loader2,
  Users,
  MapPin,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  X,
  Check,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Zone {
  id: string;
  name: string;
  slug: string;
  capacity_pax: number;
  is_active: boolean;
}

interface Table {
  id: string;
  zone_id: string;
  name: string;
  seats: number;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  shape: "rectangle" | "circle" | "square";
  rotation: number;
}

interface Booking {
  id: string;
  customer_name: string;
  pax: number;
  zone_id: string;
  table_id: string | null;
  booking_time: string;
  status: string;
}

export default function FloorPlanPage() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedZone, setSelectedZone] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const today = new Date().toISOString().split("T")[0];

  const fetchData = useCallback(async () => {
    try {
      const supabase = createClient();

      const [
        { data: zonesData },
        { data: tablesData },
        { data: bookingsData },
      ] = await Promise.all([
        supabase
          .from("zones")
          .select("*")
          .eq("is_active", true)
          .order("display_order"),
        supabase.from("tables").select("*").eq("is_active", true),
        supabase
          .from("bookings")
          .select(
            "id, customer_name, pax, zone_id, table_id, booking_time, status",
          )
          .eq("booking_date", today)
          .in("status", ["confirmed", "seated"]),
      ]);

      setZones(zonesData || []);
      setTables(tablesData || []);
      setBookings(bookingsData || []);

      if (!selectedZone && zonesData?.length) {
        setSelectedZone(zonesData[0].id);
      }
    } catch (error) {
      console.error("Error fetching floor plan data:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedZone, today]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Get tables for selected zone
  const zoneTables = tables.filter((t) => t.zone_id === selectedZone);
  const currentZone = zones.find((z) => z.id === selectedZone);

  // Get booking assigned to a table
  const getTableBooking = (tableId: string) =>
    bookings.find((b) => b.table_id === tableId);

  // Get unassigned bookings for current zone
  const unassignedBookings = bookings.filter(
    (b) => b.zone_id === selectedZone && !b.table_id,
  );

  // Calculate zone occupancy
  const zoneBookings = bookings.filter((b) => b.zone_id === selectedZone);
  const occupiedPax = zoneBookings.reduce((sum, b) => sum + b.pax, 0);
  const capacity = currentZone?.capacity_pax || 0;
  const occupancyPercent =
    capacity > 0 ? Math.round((occupiedPax / capacity) * 100) : 0;

  // Assign booking to table
  const assignBookingToTable = async (bookingId: string, tableId: string) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("bookings")
        .update({ table_id: tableId })
        .eq("id", bookingId);

      if (error) throw error;
      await fetchData();
      setShowAssignModal(false);
      setSelectedTable(null);
    } catch (error) {
      console.error("Error assigning table:", error);
    }
  };

  // Remove booking from table
  const removeBookingFromTable = async (bookingId: string) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("bookings")
        .update({ table_id: null })
        .eq("id", bookingId);

      if (error) throw error;
      await fetchData();
    } catch (error) {
      console.error("Error removing table assignment:", error);
    }
  };

  // Handle table click
  const handleTableClick = (table: Table) => {
    const booking = getTableBooking(table.id);
    if (booking) {
      // Table is occupied - show option to remove
      if (confirm(`¿Liberar ${table.name}? (${booking.customer_name})`)) {
        removeBookingFromTable(booking.id);
      }
    } else {
      // Table is free - show assignment modal
      setSelectedTable(table);
      setShowAssignModal(true);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-white/40 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">
            Plano del Restaurante
          </h1>
          <p className="text-white/40 mt-1">
            Gestión de mesas y asignaciones en tiempo real
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}
            className="p-2 rounded-lg bg-black/30 border border-white/10 text-white/60 hover:text-white transition-colors"
            aria-label="Alejar"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="px-3 py-1 text-sm text-white/60">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom((z) => Math.min(2, z + 0.1))}
            className="p-2 rounded-lg bg-black/30 border border-white/10 text-white/60 hover:text-white transition-colors"
            aria-label="Acercar"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={fetchData}
            className="p-2 rounded-lg bg-black/30 border border-white/10 text-white/60 hover:text-white transition-colors"
            aria-label="Refrescar"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Zone Tabs */}
      <div className="flex space-x-2 overflow-x-auto pb-2">
        {zones.map((zone) => {
          const zoneBookingCount = bookings.filter(
            (b) => b.zone_id === zone.id,
          ).length;
          return (
            <button
              key={zone.id}
              onClick={() => setSelectedZone(zone.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
                selectedZone === zone.id
                  ? "bg-blue-600 text-white"
                  : "bg-black/30 border border-white/10 text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>{zone.name}</span>
              {zoneBookingCount > 0 && (
                <span
                  className={`px-2 py-0.5 text-xs rounded-full ${
                    selectedZone === zone.id
                      ? "bg-white/20"
                      : "bg-blue-500/20 text-blue-400"
                  }`}
                >
                  {zoneBookingCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Zone Stats */}
      <div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-xl p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-400" />
              <span className="text-white font-medium">
                {occupiedPax} / {capacity} PAX
              </span>
            </div>
            <div className="h-2 w-32 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all progress-bar ${
                  occupancyPercent >= 80
                    ? "bg-red-500"
                    : occupancyPercent >= 50
                      ? "bg-amber-500"
                      : "bg-green-500"
                }`}
                style={
                  {
                    "--progress": `${occupancyPercent}%`,
                  } as React.CSSProperties
                }
              />
            </div>
            <span className="text-white/60">{occupancyPercent}%</span>
          </div>
          {/* Legend */}
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded bg-green-500/20 border border-green-500" />
              <span className="text-white/60">Libre</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded bg-red-500/20 border border-red-500" />
              <span className="text-white/60">Ocupada</span>
            </div>
          </div>
        </div>
      </div>

      {/* Floor Plan Canvas */}
      <div
        ref={containerRef}
        className="bg-black/30 backdrop-blur-md border border-white/10 rounded-xl p-6 overflow-auto min-h-floorplan"
      >
        <div
          className="relative mx-auto floorplan-canvas"
          style={
            {
              "--canvas-width": `${450 * zoom}px`,
              "--canvas-height": `${300 * zoom}px`,
              "--zoom": zoom,
            } as React.CSSProperties
          }
        >
          {/* Tables */}
          {zoneTables.map((table) => {
            const booking = getTableBooking(table.id);
            const isOccupied = !!booking;

            const tableStyle = {
              "--x": `${table.position_x}px`,
              "--y": `${table.position_y}px`,
              "--w": `${table.width}px`,
              "--h": `${table.height}px`,
              "--rotation": `${table.rotation}deg`,
            } as React.CSSProperties;

            return (
              <button
                key={table.id}
                type="button"
                onClick={() => handleTableClick(table)}
                className={`position-dynamic flex flex-col items-center justify-center transition-all cursor-pointer ${
                  isOccupied
                    ? "bg-red-500/30 border-2 border-red-500 text-red-300 hover:bg-red-500/40"
                    : "bg-green-500/20 border-2 border-green-500/50 text-green-300 hover:bg-green-500/30"
                } ${table.shape === "circle" ? "rounded-full" : "rounded-lg"}`}
                style={tableStyle}
                title={
                  isOccupied
                    ? `${booking?.customer_name} (${booking?.pax}p) - Click para liberar`
                    : `${table.name} - ${table.seats} asientos - Click para asignar`
                }
              >
                <span className="text-xs font-semibold">{table.name}</span>
                <span className="text-xs opacity-60">{table.seats}p</span>
                {isOccupied && booking && (
                  <span className="text-xs mt-1 max-w-full truncate px-1">
                    {booking.customer_name.split(" ")[0]}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Unassigned Bookings */}
      {unassignedBookings.length > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
          <h3 className="font-medium text-yellow-400 mb-3">
            ⚠️ Reservas sin mesa asignada ({unassignedBookings.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {unassignedBookings.map((booking) => (
              <div
                key={booking.id}
                className="px-3 py-2 bg-black/30 rounded-lg text-sm text-white/80"
              >
                <span className="font-medium">{booking.customer_name}</span>
                <span className="text-white/40 ml-2">
                  {booking.pax}p • {booking.booking_time}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assigned Bookings List */}
      <div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-xl">
        <div className="p-4 border-b border-white/10">
          <h3 className="font-medium text-white">
            Mesas Asignadas - {currentZone?.name}
          </h3>
        </div>
        <div className="divide-y divide-white/5">
          {zoneBookings.filter((b) => b.table_id).length === 0 ? (
            <div className="p-8 text-center text-white/40">
              No hay mesas asignadas en esta zona
            </div>
          ) : (
            zoneBookings
              .filter((b) => b.table_id)
              .map((booking) => {
                const table = tables.find((t) => t.id === booking.table_id);
                return (
                  <div
                    key={booking.id}
                    className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-green-500/10">
                        <Users className="w-4 h-4 text-green-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">
                          {booking.customer_name}
                        </p>
                        <p className="text-sm text-white/60">
                          {table?.name} • {booking.pax}p •{" "}
                          {booking.booking_time}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeBookingFromTable(booking.id)}
                      className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Liberar mesa"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                );
              })
          )}
        </div>
      </div>

      {/* Assignment Modal */}
      {showAssignModal && selectedTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                Asignar {selectedTable.name}
              </h3>
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedTable(null);
                }}
                className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10"
                aria-label="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-white/60 text-sm mb-4">
              Selecciona una reserva para asignar a esta mesa (
              {selectedTable.seats} asientos)
            </p>

            {unassignedBookings.length === 0 ? (
              <p className="text-white/40 text-center py-4">
                No hay reservas sin asignar en esta zona
              </p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {unassignedBookings.map((booking) => (
                  <button
                    key={booking.id}
                    onClick={() =>
                      assignBookingToTable(booking.id, selectedTable.id)
                    }
                    className="w-full flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors text-left"
                  >
                    <div>
                      <p className="font-medium text-white">
                        {booking.customer_name}
                      </p>
                      <p className="text-sm text-white/60">
                        {booking.pax} personas • {booking.booking_time}
                      </p>
                    </div>
                    <Check className="w-5 h-5 text-green-400" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
