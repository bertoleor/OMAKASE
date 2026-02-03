"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import {
  Loader2,
  Users,
  MapPin,
  RefreshCw,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  MouseSensor,
  TouchSensor,
  DragEndEvent,
  DragStartEvent,
} from "@dnd-kit/core";

import { DraggableBooking } from "@/components/admin/floorplan/DraggableBooking";
import { DroppableTable } from "@/components/admin/floorplan/DroppableTable";

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
  
  // Refs for dynamic styles to avoid "no inline styles" warning
  const progressRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  
  // Drag State
  // activeId removed as it was unused
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 10 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  );

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

  // Update dynamic styles via refs
  useEffect(() => {
    if (progressRef.current) {
      progressRef.current.style.setProperty("--progress", `${occupancyPercent}%`);
    }
  }, [occupancyPercent]);

  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.style.setProperty("--zoom", zoom.toString());
    }
  }, [zoom]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveBooking(active.data.current?.booking || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveBooking(null);

    if (!over) return;

    // active.id is bookingId, over.id is tableId
    const bookingId = active.id as string;
    const tableId = over.id as string;

    await assignBookingToTable(bookingId, tableId);
  };

  const assignBookingToTable = async (bookingId: string, tableId: string) => {
    // Optimistic update
    const updatedBookings = bookings.map((b) =>
      b.id === bookingId ? { ...b, table_id: tableId } : b
    );
    setBookings(updatedBookings);

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("bookings")
        .update({ table_id: tableId })
        .eq("id", bookingId);

      if (error) throw error;
      await fetchData(); // Re-fetch to confirm
    } catch (error) {
      console.error("Error assigning table:", error);
      // Revert if error
      await fetchData();
    }
  };

  const removeBookingFromTable = async (bookingId: string) => {
    if(!confirm("¿Liberar esta mesa?")) return;

    // Optimistic update
    const updatedBookings = bookings.map((b) =>
      b.id === bookingId ? { ...b, table_id: null } : b
    );
    setBookings(updatedBookings);

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
      await fetchData();
    }
  };

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-white/40 animate-spin" />
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-6 h-[calc(100vh-100px)] flex flex-col">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 flex-shrink-0">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Plano de Sala
            </h1>
            <p className="text-white/40 mt-1">
              Arrastra las reservas a las mesas para asignarlas
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
        <div className="flex space-x-2 overflow-x-auto pb-2 flex-shrink-0">
          {zones.map((zone) => {
            const unassignedCount = bookings.filter(
              (b) => b.zone_id === zone.id && !b.table_id
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
                {unassignedCount > 0 && (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-amber-500/20 text-amber-400 font-bold">
                    {unassignedCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        
        {/* Main Content Area */}
        <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
          
          {/* LEFT COLUMN: Sidebar with List */}
          <div className="w-full lg:w-80 flex flex-col gap-4 flex-shrink-0">
            {/* Stats Card */}
            <div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-xl p-4 flex-shrink-0">
               <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Users className="w-5 h-5 text-blue-400" />
                    <span className="text-white font-medium">
                      {occupiedPax} / {capacity} PAX
                    </span>
                  </div>
                  <span className={`text-sm font-bold ${
                    occupancyPercent >= 80 ? "text-red-400" : "text-green-400"
                  }`}>
                    {occupancyPercent}%
                  </span>
               </div>
                  <div className="h-1.5 w-full bg-white/10 rounded-full mt-3 overflow-hidden">
                    <div
                      ref={progressRef}
                      className={`h-full transition-all duration-500 progress-bar ${
                        occupancyPercent >= 80 ? "bg-red-500" : "bg-green-500"
                      }`}
                    />
                  </div>
            </div>

            {/* Draggable List */}
            <div className="flex-1 bg-black/30 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden flex flex-col min-h-0">
              <div className="p-4 border-b border-white/10">
                <h3 className="font-medium text-white flex items-center justify-between">
                  <span>Por Asignar</span>
                  <span className="bg-white/10 px-2 py-0.5 rounded text-xs text-white/60">
                    {unassignedBookings.length}
                  </span>
                </h3>
              </div>
              <div className="overflow-y-auto p-3 space-y-2 flex-1">
                {unassignedBookings.length === 0 ? (
                  <p className="text-white/30 text-center text-sm py-8">
                    No hay reservas pendientes
                  </p>
                ) : (
                  unassignedBookings.map((booking) => (
                    <DraggableBooking key={booking.id} booking={booking} />
                  ))
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Canvas */}
          <div 
            ref={containerRef}
            className="flex-1 bg-black/30 backdrop-blur-md border border-white/10 rounded-xl relative overflow-hidden flex items-center justify-center p-8"
          >
             {/* Canvas Container */}
              <div
                ref={canvasRef}
                className="relative transition-transform duration-200 ease-out origin-center w-full h-full floorplan-canvas"
              >
                {/* Tables Layer */}
                {zoneTables.map((table) => {
                   const booking = getTableBooking(table.id);
                   return (
                     <DroppableTable 
                        key={table.id} 
                        table={table} 
                        booking={booking} 
                        onRemoveBooking={removeBookingFromTable}
                     />
                   );
                })}
             </div>
          </div>
        </div>
      </div>

      {/* Drag Portal */}
      <DragOverlay>
        {activeBooking ? (
           <div className="p-3 rounded-xl bg-blue-600 border border-blue-500 shadow-2xl w-64 opacity-90 cursor-grabbing">
              <p className="text-sm font-medium text-white truncate">
                {activeBooking.customer_name}
              </p>
              <div className="flex items-center gap-3 text-xs text-white/70 mt-1">
                 <span>{activeBooking.pax}p</span>
                 <span>{activeBooking.booking_time}</span>
              </div>
           </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
