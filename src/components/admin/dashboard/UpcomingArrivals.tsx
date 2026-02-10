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
import {
  Booking,
  useRealtimeBookings,
} from "@/hooks/useRealtimeBookings";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Zone {
  id: string;
  name: string;
  slug: string;
}

interface UpcomingArrivalsProps {
  readonly date: string;
  readonly onBookingClick?: (booking: Booking) => void;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning"; icon: React.ElementType }
> = {
  pending: {
    label: "Pendiente",
    variant: "warning",
    icon: Clock,
  },
  confirmed: {
    label: "Confirmada",
    variant: "default", // Blue/Primary usually
    icon: CheckCircle2,
  },
  seated: {
    label: "Sentado",
    variant: "success",
    icon: UserCheck,
  },
  completed: {
    label: "Completada",
    variant: "outline",
    icon: CheckCircle2,
  },
  cancelled: {
    label: "Cancelada",
    variant: "destructive",
    icon: XCircle,
  },
  no_show: {
    label: "No Show",
    variant: "destructive",
    icon: XCircle,
  },
};

export default function UpcomingArrivals({
  date,
  onBookingClick,
}: UpcomingArrivalsProps) {
  // Use the shared hook - only fetches active bookings
  const { bookings, loading } = useRealtimeBookings(date);
  const [zones, setZones] = useState<Zone[]>([]);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchZones() {
      const supabase = createClient();
      const { data } = await supabase
        .from("zones")
        .select("id, name, slug")
        .eq("is_active", true);
      if (data) setZones(data);
    }
    fetchZones();
  }, []);

  const getZoneName = (zoneId: string) =>
    zones.find((z) => z.id === zoneId)?.name || "Unknown";

  const handleQuickAction = async (bookingId: string, newStatus: string) => {
    try {
      const { success, error } = await updateBookingStatus(
        bookingId,
        newStatus,
      );
      if (!success) throw new Error(error);
      // Realtime hook will update the UI automatically via Supabase subscription
    } catch (error) {
      console.error("Error updating booking:", error);
      setActionError(
        error instanceof Error ? error.message : "Error al actualizar reserva",
      );
      setTimeout(() => setActionError(null), 4000);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {new Array(3).fill(null).map((_, i) => (
          <Card key={`skeleton-${i}`} className="bg-black/40 border-white/10 animate-pulse">
            <CardContent className="p-4 h-24" />
          </Card>
        ))}
      </div>
    );
  }

  // Filter relevant bookings for the "Stream" (Pending, Confirmed, Seated)
  // No cancelled or completed in the arrival stream typically, unless for history, 
  // but "UpcomingArrivals" implies active items.
  const activeBookings = bookings.filter((b) =>
    ["pending", "confirmed", "seated"].includes(b.status),
  );

  if (activeBookings.length === 0) {
    return (
      <Card className="bg-black/40 border-white/10 border-dashed">
        <CardContent className="p-8 text-center flex flex-col items-center justify-center">
          <Clock className="w-10 h-10 text-white/20 mb-3" />
          <p className="text-white/60 font-medium">No hay llegadas programadas</p>
        </CardContent>
      </Card>
    );
  }

  // Group bookings
  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  const grouped = {
    seated: activeBookings.filter((b) => b.status === "seated"),
    // Urgent: Confirmed/Pending bookings that are due now or in the past (late)
    urgent: activeBookings.filter(
      (b) => b.status !== "seated" && b.booking_time <= currentTime,
    ),
    // Upcoming: Future bookings
    upcoming: activeBookings.filter(
      (b) => b.status !== "seated" && b.booking_time > currentTime,
    ),
  };

  return (
    <div className="space-y-6">
      {/* Error Banner */}
      {actionError && (
        <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center justify-between">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="text-red-400/60 hover:text-red-400 ml-3">✕</button>
        </div>
      )}
      {/* SECCION 1: URGENTE (Llegando ahora o tarde) */}
      {grouped.urgent.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center space-x-2 px-1">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wider">
              Llegando Ahora / Tarde ({grouped.urgent.length})
            </h3>
          </div>
          <div className="space-y-3">
            {grouped.urgent.map((booking) => (
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

      {/* SECCION 2: SENTADOS (Activos) */}
      {grouped.seated.length > 0 && (
        <div className="space-y-3">
           <div className="flex items-center space-x-2 px-1">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <h3 className="text-sm font-semibold text-green-400 uppercase tracking-wider">
              En Servicio ({grouped.seated.length})
            </h3>
          </div>
          <div className="space-y-3">
            {grouped.seated.map((booking) => (
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

      {/* SECCION 3: PRÓXIMAS */}
      {grouped.upcoming.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center space-x-2 px-1">
            <div className="w-2 h-2 rounded-full bg-white/20" />
            <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wider">
              Próximas Llegadas ({grouped.upcoming.length})
            </h3>
          </div>
          <div className="space-y-3">
            {grouped.upcoming.map((booking) => (
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
  readonly booking: Booking;
  readonly zoneName: string;
  readonly onAction: (id: string, status: string) => void;
  readonly onClick?: (booking: Booking) => void;
  readonly isUrgent?: boolean;
}

function BookingCard({
  booking,
  zoneName,
  onAction,
  onClick,
  isUrgent,
}: BookingCardProps) {
  const statusConfig = STATUS_CONFIG[booking.status] || STATUS_CONFIG.pending;
  const StatusIcon = statusConfig.icon;

  return (
    <Card
      className={cn(
        "bg-black/40 backdrop-blur-md transition-all duration-300 group",
        isUrgent
          ? "border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.1)]"
          : "border-white/10 hover:border-white/20 hover:bg-white/5",
      )}
    >
      <CardContent className="p-4 relative">
        {/* Urgent Indicator Strip */}
        {isUrgent && (
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500" />
        )}

        <div className="flex flex-col gap-3">
          {/* Top Row: Time & Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div
                className={cn(
                  "px-2.5 py-1 rounded-md text-lg font-bold font-mono tracking-tight",
                  isUrgent
                    ? "bg-amber-500/10 text-amber-400"
                    : "bg-white/5 text-white",
                )}
              >
                {booking.booking_time}
              </div>
              <Badge variant={statusConfig.variant as "default" | "secondary" | "destructive" | "outline"} className="pl-1.5 pr-2.5">
                <StatusIcon className="w-3.5 h-3.5 mr-1" />
                {statusConfig.label}
              </Badge>
            </div>
            
            <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-white/40 hover:text-white"
                onClick={() => onClick?.(booking)}
            >
                <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Middle Row: Customer & Details */}
          <div className="flex items-center justify-between pl-1">
             <div className="space-y-1">
                <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-white/40" />
                    <span className="font-semibold text-white">
                        {booking.customer_name}
                    </span>
                </div>
                <div className="flex items-center space-x-4 text-xs text-white/50 pl-6">
                    <span className="flex items-center">
                        <Users className="w-3 h-3 mr-1" />
                        {booking.pax} pax
                    </span>
                    <span className="flex items-center">
                        <MapPin className="w-3 h-3 mr-1" />
                        {zoneName}
                    </span>
                </div>
             </div>
          </div>

          {/* Bottom Row: Quick Actions */}
          {/* Show actions only for active states to keep card clean */}
          <div className="pt-2 border-t border-white/5 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {booking.status === "pending" && (
                <Button 
                    size="sm" 
                    className="flex-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-600/30 h-8 text-xs"
                    onClick={() => onAction(booking.id, "confirmed")}
                >
                    Confirmar
                </Button>
            )}
            {booking.status === "confirmed" && (
                <Button 
                    size="sm" 
                    className="flex-1 bg-green-600/20 hover:bg-green-600/30 text-green-400 border border-green-600/30 h-8 text-xs"
                    onClick={() => onAction(booking.id, "seated")}
                >
                    Sentar
                </Button>
            )}
            {booking.status === "seated" && (
                <Button 
                    size="sm" 
                    className="flex-1 bg-white/5 hover:bg-white/10 text-white/60 border border-white/10 h-8 text-xs"
                    onClick={() => onAction(booking.id, "completed")}
                >
                    Completar
                </Button>
            )}
            
            {/* Destructive actions always available but smaller */}
            {booking.status !== "seated" && (
                <Button 
                    size="sm" 
                    variant="ghost"
                    className="h-8 w-8 px-0 text-red-400/60 hover:text-red-400 hover:bg-red-500/10"
                    onClick={() => onAction(booking.id, "no_show")}
                    title="No Show"
                >
                   <XCircle className="w-4 h-4" />
                </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
