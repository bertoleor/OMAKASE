"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
  Clock,
  Users,
  Phone,
  Mail,
  MessageCircle,
  ChevronRight,
  Loader2,
  UserPlus,
  X,
  CheckCircle2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Booking {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  booking_date: string;
  booking_time: string;
  pax: number;
  zone: string; // Uses zone enum or zone_id
  zone_id?: string;
  status: string;
}

interface Zone {
  id: string;
  name: string;
  slug: string;
  capacity_pax: number;
  is_active: boolean;
}

interface QuickActionsPanelProps {
  readonly date: string;
}

export default function QuickActionsPanel({ date }: QuickActionsPanelProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);

  // Walk-in State
  const [isWalkInModalOpen, setIsWalkInModalOpen] = useState(false);
  const [walkInPax, setWalkInPax] = useState(2);
  const [walkInZone, setWalkInZone] = useState("");
  const [walkInName, setWalkInName] = useState("");
  const [isSubmittingWalkIn, setIsSubmittingWalkIn] = useState(false);
  const [walkInError, setWalkInError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const supabase = createClient();

        const [{ data: zonesData }, { data: bookingsData }] = await Promise.all(
          [
            supabase.from("zones").select("*").eq("is_active", true),
            supabase
              .from("bookings")
              .select("*")
              .eq("booking_date", date)
              .in("status", ["pending", "confirmed", "seated"])
              .order("booking_time"),
          ],
        );

        setZones(zonesData || []);
        setBookings(bookingsData || []);
        if (zonesData && zonesData.length > 0) {
          setWalkInZone(zonesData[0].id);
        }
      } catch (error) {
        console.error("Error fetching quick actions data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();

    // Realtime updates
    const supabase = createClient();
    const channel = supabase
      .channel("quick-actions-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookings",
          filter: `booking_date=eq.${date}`,
        },
        () => {
          fetchData();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [date]);

  // Map zone enum to zone object (supports both zone_id and zone enum)
  const getZoneForBooking = useCallback((booking: Booking): Zone | undefined => {
    // First try zone_id (new format)
    if (booking.zone_id) {
      return zones.find((z) => z.id === booking.zone_id);
    }
    // Fallback to zone slug mapping (old format)
    const zoneMap: Record<string, string> = {
      indoor_tables: "salon",
      outdoor_pergola: "pergola",
      indoor_bar: "barra",
    };
    const slug = zoneMap[booking.zone] || booking.zone;
    return zones.find((z) => z.slug === slug);
  }, [zones]);

  // Calculate zone occupancy
  const zoneOccupancy = useMemo(() => {
    return zones.map((zone) => {
      const zoneBookings = bookings.filter((b) => {
        const bookingZone = getZoneForBooking(b);
        // Only count active bookings (seated, confirmed, pending) for occupancy
        // 'seated' definitely counts. 'confirmed'/'pending' usually count towards future occupancy
        // For REAL-TIME "Currently Occupied", we might strictly want "seated".
        // However, to prevent overbooking, we usually count all active.
        // Given this is "Occupancy per Zone" display, showing all active helps staff know what's coming too.
        return (
          bookingZone?.id === zone.id &&
          ["seated", "confirmed", "pending"].includes(b.status)
        );
      });
      const occupiedPax = zoneBookings.reduce((sum, b) => sum + b.pax, 0);
      return {
        ...zone,
        occupiedPax,
        percentage: Math.min(100, (occupiedPax / zone.capacity_pax) * 100),
      };
    });
  }, [zones, bookings, getZoneForBooking]);

  const getOccupancyColor = (percentage: number) => {
    if (percentage >= 80) return "bg-red-500";
    if (percentage >= 50) return "bg-amber-500";
    return "bg-green-500";
  };

  const totalCapacity = zones.reduce((sum, z) => sum + z.capacity_pax, 0);
  // Same logic for total occupied
  const totalOccupied = bookings
    .filter((b) => ["seated", "confirmed", "pending"].includes(b.status))
    .reduce((sum, b) => sum + b.pax, 0);

  const totalPercentage =
    totalCapacity > 0 ? (totalOccupied / totalCapacity) * 100 : 0;

  // Get zone name for display
  const getZoneName = (booking: Booking) =>
    getZoneForBooking(booking)?.name || "Sin zona";

  // WhatsApp link
  const getWhatsAppLink = (phone: string, name: string, time: string) => {
    const cleanPhone = phone.replaceAll(/\D/g, "");
    const message = encodeURIComponent(
      `Hola ${name}, te escribimos de Suhi para confirmar tu reserva de hoy a las ${time}. ¿Todo bien?`,
    );
    return `https://wa.me/${cleanPhone}?text=${message}`;
  };

  const handleWalkIn = async () => {
    if (!walkInZone) return;

    setIsSubmittingWalkIn(true);
    setWalkInError(null);
    try {
      const supabase = createClient();
      const now = new Date();
      const timeString = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      const name = walkInName || `Walk-in ${timeString}`;

      const { error } = await supabase.from("bookings").insert({
        booking_date: date,
        booking_time: timeString,
        pax: walkInPax,
        customer_name: name,
        customer_email: "walkin@local",
        customer_phone: "0000000000",
        status: "seated", // Immediately seated
        zone_id: walkInZone,
        zone: zones.find((z) => z.id === walkInZone)?.slug || "indoor_tables", // Fallback for old column
        notes: "Walk-in client created by staff",
      });

      if (error) throw error;

      // Reset and close
      setIsWalkInModalOpen(false);
      setWalkInPax(2);
      setWalkInName("");
    } catch (err) {
      console.error("Error creating walk-in:", err);
      setWalkInError("Error al crear Walk-in. Intentá de nuevo.");
    } finally {
      setIsSubmittingWalkIn(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-xl p-8">
        <div className="flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-white/40 animate-spin" />
        </div>
      </div>
    );
  }

  // Filter bookings for list (exclude seated if we want, but usually we want to see upcoming)
  const upcomingBookings = bookings.filter((b) =>
    ["pending", "confirmed"].includes(b.status),
  );

  return (
    <>
      <div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-400" />
            Acciones Rápidas
          </h2>
          <button
            onClick={() => setIsWalkInModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span>Walk-in</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-white/10">
          {/* Upcoming Reservations */}
          <div className="lg:col-span-2 p-4">
            <h3 className="text-sm font-medium text-white/60 uppercase tracking-wider mb-3">
              Próximas Reservas ({upcomingBookings.length})
            </h3>

            {upcomingBookings.length === 0 ? (
              <p className="text-white/40 text-sm py-4">
                No hay reservas pendientes para hoy
              </p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto booking-scrollbar">
                {upcomingBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-center min-w-[50px]">
                        <span className="text-lg font-bold text-white">
                          {booking.booking_time}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-white">
                          {booking.customer_name}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-white/60">
                          <Users className="w-3 h-3" />
                          <span>{booking.pax}p</span>
                          <span className="text-white/30">•</span>
                          <span>{getZoneName(booking)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Contact Buttons */}
                    <div className="flex items-center gap-1">
                      <a
                        href={getWhatsAppLink(
                          booking.customer_phone,
                          booking.customer_name.split(" ")[0],
                          booking.booking_time,
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg text-green-400 hover:bg-green-500/20 transition-colors"
                        title="Enviar WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </a>
                      <a
                        href={`mailto:${booking.customer_email}`}
                        className="p-2 rounded-lg text-blue-400 hover:bg-blue-500/20 transition-colors"
                        title="Enviar Email"
                      >
                        <Mail className="w-4 h-4" />
                      </a>
                      <a
                        href={`tel:${booking.customer_phone}`}
                        className="p-2 rounded-lg text-white/60 hover:bg-white/10 transition-colors"
                        title="Llamar"
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                      <button
                        className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                        title="Ver detalle"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Availability Summary */}
          <div className="p-4">
            <h3 className="text-sm font-medium text-white/60 uppercase tracking-wider mb-3">
              Ocupación Actual
            </h3>

            <div className="space-y-3">
              {zoneOccupancy.map((zone) => (
                <div key={zone.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-white">{zone.name}</span>
                    <span className="text-white/60">
                      {zone.occupiedPax}/{zone.capacity_pax}
                    </span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      ref={(el) => {
                        if (el) el.style.setProperty("--progress", `${zone.percentage}%`);
                      }}
                      className={`h-full rounded-full transition-all duration-300 progress-bar ${getOccupancyColor(zone.percentage)}`}
                    />
                  </div>
                </div>
              ))}

              {/* Total */}
              <div className="pt-3 mt-3 border-t border-white/10">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-white font-medium">Total</span>
                  <span className="text-white/80">
                    {totalOccupied}/{totalCapacity} (
                    {Math.round(totalPercentage)}%)
                  </span>
                </div>
                <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                  <div
                    ref={(el) => {
                      if (el) el.style.setProperty("--progress", `${Math.min(100, totalPercentage)}%`);
                    }}
                    className={`h-full rounded-full transition-all duration-300 progress-bar ${getOccupancyColor(totalPercentage)}`}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Walk-in Modal */}
      {isWalkInModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-white/10 rounded-xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-green-400" />
                Nuevo Walk-in (Sin Reserva)
              </h3>
              <button
                onClick={() => setIsWalkInModalOpen(false)}
                className="text-white/40 hover:text-white"
                title="Cerrar modal"
                aria-label="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Walk-in Error */}
              {walkInError && (
                <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                  {walkInError}
                </div>
              )}
              <div>
                <label 
                  htmlFor="walkin-name"
                  className="block text-sm text-white/60 mb-1"
                >
                  Nombre (Opcional)
                </label>
                <input
                  id="walkin-name"
                  type="text"
                  value={walkInName}
                  onChange={(e) => setWalkInName(e.target.value)}
                  placeholder={`Cliente Walk-in...`}
                  className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-lg text-white focus:border-green-500"
                  title="Nombre del cliente"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label 
                    htmlFor="walkin-pax"
                    className="block text-sm text-white/60 mb-1"
                  >
                    Personas (PAX)
                  </label>
                  <input
                    id="walkin-pax"
                    type="number"
                    min={1}
                    max={20}
                    value={walkInPax}
                    onChange={(e) =>
                      setWalkInPax(Number.parseInt(e.target.value) || 1)
                    }
                    className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-lg text-white focus:border-green-500"
                    title="Número de personas"
                  />
                </div>
                <div>
                  <label 
                    htmlFor="walkin-zone"
                    className="block text-sm text-white/60 mb-1"
                  >
                    Zona
                  </label>
                  <select
                    id="walkin-zone"
                    value={walkInZone}
                    onChange={(e) => setWalkInZone(e.target.value)}
                    className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-lg text-white focus:border-green-500"
                    title="Seleccionar zona"
                  >
                    {zones.map((z) => (
                      <option key={z.id} value={z.id}>
                        {z.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  onClick={handleWalkIn}
                  disabled={isSubmittingWalkIn || !walkInZone}
                  className="flex-1 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl transition-colors flex justify-center items-center gap-2"
                >
                  {isSubmittingWalkIn ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  Ocupar Mesa
                </button>
                <button
                  onClick={() => setIsWalkInModalOpen(false)}
                  className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
