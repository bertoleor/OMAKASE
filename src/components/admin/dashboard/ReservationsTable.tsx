"use client";

import { useEffect, useState } from "react";
import { Clock, MapPin, Users, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { updateBookingStatus } from "@/app/actions/admin";

interface Booking {
  id: string;
  customer_name: string;
  customer_phone: string;
  booking_time: string;
  pax: number;
  zone_id: string;
  status: "pending" | "confirmed" | "seated" | "completed" | "cancelled";
  notes?: string;
}

interface Zone {
  id: string;
  name: string;
  slug: string;
}

export default function ReservationsTable({
  date,
}: Readonly<{ date: string }>) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
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

        // Fetch bookings for the date
        const { data: bookingsData } = await supabase
          .from("bookings")
          .select("*")
          .eq("booking_date", date)
          .order("booking_time");

        setZones(zonesData || []);
        setBookings(bookingsData || []);
      } catch (error) {
        console.error("Error fetching bookings:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [date]);

  const getZoneName = (zoneId: string) => {
    return zones.find((z) => z.id === zoneId)?.name || "Unknown";
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: "text-yellow-400 bg-yellow-500/10",
      confirmed: "text-blue-400 bg-blue-500/10",
      seated: "text-green-400 bg-green-500/10",
      completed: "text-gray-400 bg-gray-500/10",
      cancelled: "text-red-400 bg-red-500/10",
    };
    return colors[status as keyof typeof colors] || "text-gray-400";
  };

  const handleForceComplete = async (bookingId: string) => {
    if (
      !confirm(
        "¿Marcar esta reserva como completada? Esto liberará la capacidad inmediatamente.",
      )
    ) {
      return;
    }

    try {
      const { success, error: actionError } = await updateBookingStatus(
        bookingId,
        "completed",
        "Admin force-complete"
      );

      if (!success) throw new Error(actionError);

      // Refresh data
      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId ? { ...b, status: "completed" as const } : b,
        ),
      );
    } catch (error) {
      console.error("Error completing booking:", error);
      alert(error instanceof Error ? error.message : "Error al completar la reserva");
    }
  };

  if (loading) {
    return (
      <div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-xl p-6">
        <div className="animate-pulse space-y-4">
          {[...new Array(5)].map((_, i) => (
            <div
              key={`skeleton-${i}`}
              className="h-16 bg-white/5 rounded-lg"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden">
      <div className="p-6 border-b border-white/10">
        <h2 className="text-xl font-bold text-white">Reservas del Día</h2>
        <p className="text-sm text-white/60 mt-1">
          {bookings.length} reservas totales
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-black/20 border-b border-white/10">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                Hora
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                Cliente
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                Zona
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                PAX
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-white/60 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {bookings.map((booking) => (
              <tr
                key={booking.id}
                className="hover:bg-white/5 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-white/40" />
                    <span className="text-sm font-medium text-white">
                      {booking.booking_time}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div>
                    <p className="text-sm font-medium text-white">
                      {booking.customer_name}
                    </p>
                    <p className="text-xs text-white/60">
                      {booking.customer_phone}
                    </p>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-white/40" />
                    <span className="text-sm text-white/80">
                      {getZoneName(booking.zone_id)}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-white/40" />
                    <span className="text-sm text-white">{booking.pax}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(booking.status)}`}
                  >
                    {booking.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  {booking.status === "seated" && (
                    <button
                      onClick={() => handleForceComplete(booking.id)}
                      className="inline-flex items-center space-x-1 px-3 py-1.5 text-xs font-medium text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg hover:bg-green-500/20 transition-colors"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Completar</span>
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {bookings.length === 0 && (
        <div className="p-12 text-center">
          <p className="text-white/40">No hay reservas para esta fecha</p>
        </div>
      )}
    </div>
  );
}
