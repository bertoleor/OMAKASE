"use client";

import { useEffect, useState } from "react";
import {
  Clock,
  User,
  Users,
  MapPin,
  ChevronRight,
  CheckCircle2,
  UserCheck,
  XCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { updateBookingStatus } from "@/app/actions/admin";

interface Booking {
  id: string;
  customer_name: string;
  customer_phone: string;
  booking_time: string;
  pax: number;
  zone_id: string;
  status:
    | "pending"
    | "confirmed"
    | "seated"
    | "completed"
    | "cancelled"
    | "no_show";
  notes?: string;
}

interface Zone {
  id: string;
  name: string;
  slug: string;
}

interface UpcomingArrivalsProps {
  date: string;
  onBookingClick?: (booking: Booking) => void;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bgColor: string; icon: React.ElementType }
> = {
  pending: {
    label: "Pendiente",
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/20",
    icon: Clock,
  },
  confirmed: {
    label: "Confirmada",
    color: "text-blue-400",
    bgColor: "bg-blue-500/20",
    icon: CheckCircle2,
  },
  seated: {
    label: "Sentado",
    color: "text-green-400",
    bgColor: "bg-green-500/20",
    icon: UserCheck,
  },
  completed: {
    label: "Completada",
    color: "text-gray-400",
    bgColor: "bg-gray-500/20",
    icon: CheckCircle2,
  },
  cancelled: {
    label: "Cancelada",
    color: "text-red-400",
    bgColor: "bg-red-500/20",
    icon: XCircle,
  },
  no_show: {
    label: "No Show",
    color: "text-red-400",
    bgColor: "bg-red-500/20",
    icon: XCircle,
  },
};

export default function UpcomingArrivals({
  date,
  onBookingClick,
}: UpcomingArrivalsProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);

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
      } catch (error) {
        console.error("Error fetching arrivals:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();

    // Realtime subscription
    const supabase = createClient();
    const channel = supabase
      .channel("arrivals-updates")
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

  const getZoneName = (zoneId: string) =>
    zones.find((z) => z.id === zoneId)?.name || "Unknown";

  const handleQuickAction = async (bookingId: string, newStatus: string) => {
    try {
      const { success, error } = await updateBookingStatus(
        bookingId,
        newStatus,
      );
      if (!success) throw new Error(error);

      // Update local state for immediate feedback
      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId
            ? { ...b, status: newStatus as Booking["status"] }
            : b,
        ),
      );
    } catch (error) {
      console.error("Error updating booking:", error);
      alert(
        error instanceof Error ? error.message : "Error al actualizar reserva",
      );
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-black/30 backdrop-blur-md border border-white/10 rounded-xl p-4 animate-pulse"
          >
            <div className="h-16 bg-white/5 rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-xl p-8 text-center">
        <Clock className="w-12 h-12 text-white/20 mx-auto mb-3" />
        <p className="text-white/60">No hay llegadas programadas</p>
      </div>
    );
  }

  // Group bookings by upcoming (next 30 min), soon, later
  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  const grouped = {
    now: bookings.filter((b) => b.status === "seated"),
    upcoming: bookings.filter(
      (b) => b.status !== "seated" && b.booking_time <= currentTime,
    ),
    later: bookings.filter(
      (b) => b.status !== "seated" && b.booking_time > currentTime,
    ),
  };

  return (
    <div className="space-y-4">
      {/* Currently Seated */}
      {grouped.now.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-green-400 uppercase tracking-wider mb-2 px-1">
            Sentados Ahora ({grouped.now.length})
          </h3>
          <div className="space-y-2">
            {grouped.now.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                zoneName={getZoneName(booking.zone_id)}
                onAction={handleQuickAction}
                onClick={onBookingClick}
              />
            ))}
          </div>
        </div>
      )}

      {/* Arriving Now / Late */}
      {grouped.upcoming.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-yellow-400 uppercase tracking-wider mb-2 px-1">
            Llegando Ahora ({grouped.upcoming.length})
          </h3>
          <div className="space-y-2">
            {grouped.upcoming.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                zoneName={getZoneName(booking.zone_id)}
                onAction={handleQuickAction}
                onClick={onBookingClick}
                isUrgent
              />
            ))}
          </div>
        </div>
      )}

      {/* Later */}
      {grouped.later.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-white/60 uppercase tracking-wider mb-2 px-1">
            Próximas ({grouped.later.length})
          </h3>
          <div className="space-y-2">
            {grouped.later.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                zoneName={getZoneName(booking.zone_id)}
                onAction={handleQuickAction}
                onClick={onBookingClick}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface BookingCardProps {
  booking: Booking;
  zoneName: string;
  onAction: (id: string, status: string) => void;
  onClick?: (booking: Booking) => void;
  isUrgent?: boolean;
}

function BookingCard({
  booking,
  zoneName,
  onAction,
  onClick,
  isUrgent,
}: BookingCardProps) {
  const statusConfig = STATUS_CONFIG[booking.status];
  const StatusIcon = statusConfig.icon;

  return (
    <div
      className={`bg-black/30 backdrop-blur-md border rounded-xl overflow-hidden transition-all ${
        isUrgent
          ? "border-yellow-500/40 ring-1 ring-yellow-500/20"
          : "border-white/10 hover:border-white/20"
      }`}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${statusConfig.bgColor}`}>
              <StatusIcon className={`w-4 h-4 ${statusConfig.color}`} />
            </div>
            <div>
              <span className="text-xl font-bold text-white">
                {booking.booking_time}
              </span>
              <span
                className={`ml-2 text-xs px-2 py-0.5 rounded-full ${statusConfig.bgColor} ${statusConfig.color}`}
              >
                {statusConfig.label}
              </span>
            </div>
          </div>
          <button
            onClick={() => onClick?.(booking)}
            className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Ver detalles"
            title="Ver detalles"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Customer Info */}
        <div className="flex items-center space-x-4 mb-3">
          <div className="flex items-center space-x-2">
            <User className="w-4 h-4 text-white/40" />
            <span className="text-sm font-medium text-white">
              {booking.customer_name}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-white/40" />
            <span className="text-sm text-white/80">{booking.pax} pax</span>
          </div>
        </div>

        {/* Zone */}
        <div className="flex items-center space-x-2 mb-4">
          <MapPin className="w-4 h-4 text-white/40" />
          <span className="text-sm text-white/60">{zoneName}</span>
        </div>

        {/* Quick Actions */}
        <div className="flex space-x-2">
          {booking.status === "pending" && (
            <button
              onClick={() => onAction(booking.id, "confirmed")}
              className="flex-1 py-2 px-3 text-sm font-medium text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-lg hover:bg-blue-500/20 transition-colors"
            >
              Confirmar
            </button>
          )}
          {booking.status === "confirmed" && (
            <button
              onClick={() => onAction(booking.id, "seated")}
              className="flex-1 py-2 px-3 text-sm font-medium text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg hover:bg-green-500/20 transition-colors"
            >
              Sentar
            </button>
          )}
          {booking.status === "seated" && (
            <button
              onClick={() => onAction(booking.id, "completed")}
              className="flex-1 py-2 px-3 text-sm font-medium text-gray-400 bg-gray-500/10 border border-gray-500/20 rounded-lg hover:bg-gray-500/20 transition-colors"
            >
              Completar
            </button>
          )}
          {booking.status !== "seated" && booking.status !== "completed" && (
            <button
              onClick={() => onAction(booking.id, "no_show")}
              className="py-2 px-3 text-sm font-medium text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-colors"
            >
              No Show
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
