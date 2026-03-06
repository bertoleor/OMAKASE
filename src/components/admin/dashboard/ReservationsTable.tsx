"use client";

import { Clock, MapPin, Users, CheckCircle2 } from "lucide-react";
import { useBookingsByDate, useZones, useUpdateBookingStatus, Booking } from "@/hooks/queries";
import { useState } from "react";

interface ReservationsTableProps {
  readonly date: string;
}

export default function ReservationsTable({
  date,
}: Readonly<ReservationsTableProps>) {
  const [actionError, setActionError] = useState<string | null>(null);

  const { data: bookings = [], isLoading: loadingBookings } = useBookingsByDate(date);
  const { data: zones = [] } = useZones();
  const updateStatus = useUpdateBookingStatus();

  const getZoneName = (zoneId: string) => {
    return zones.find((z) => z.id === zoneId)?.name || "Unknown";
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "text-yellow-400 bg-yellow-500/10",
      confirmed: "text-blue-400 bg-blue-500/10",
      seated: "text-green-400 bg-green-500/10",
      completed: "text-gray-400 bg-gray-500/10",
      cancelled: "text-red-400 bg-red-500/10",
      no_show: "text-orange-400 bg-orange-500/10",
    };
    return colors[status] || "text-gray-400";
  };

  const handleForceComplete = async (bookingId: string) => {
    if (
      !confirm(
        "¿Marcar esta reserva como completada? Esto liberará la capacidad inmediatamente.",
      )
    ) {
      return;
    }

    setActionError(null);
    try {
      await updateStatus.mutateAsync({ id: bookingId, status: "completed" });
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Error al completar la reserva",
      );
      setTimeout(() => setActionError(null), 4000);
    }
  };

  if (loadingBookings) {
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
      {/* Error Banner */}
      {actionError && (
        <div className="px-4 py-3 bg-red-500/10 border-b border-red-500/20 text-red-400 text-sm flex items-center justify-between">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="text-red-400/60 hover:text-red-400 ml-3">✕</button>
        </div>
      )}
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
            {bookings.map((booking: Booking) => (
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
                      {getZoneName(booking.zone_id || "")}
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
                      disabled={updateStatus.isPending}
                      className="inline-flex items-center space-x-1 px-3 py-1.5 text-xs font-medium text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg hover:bg-green-500/20 transition-colors disabled:opacity-50"
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
