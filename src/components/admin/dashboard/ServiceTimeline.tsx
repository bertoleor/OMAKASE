"use client";

import { useEffect, useState, useMemo } from "react";
import { User, Users, MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Booking {
  id: string;
  customer_name: string;
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
  capacity_pax: number;
}

interface ServiceTimelineProps {
  date: string;
}

const STATUS_COLORS: Record<
  string,
  { bg: string; border: string; text: string }
> = {
  pending: {
    bg: "bg-yellow-500/20",
    border: "border-yellow-500/40",
    text: "text-yellow-400",
  },
  confirmed: {
    bg: "bg-blue-500/20",
    border: "border-blue-500/40",
    text: "text-blue-400",
  },
  seated: {
    bg: "bg-green-500/20",
    border: "border-green-500/40",
    text: "text-green-400",
  },
  completed: {
    bg: "bg-gray-500/20",
    border: "border-gray-500/30",
    text: "text-gray-400",
  },
  cancelled: {
    bg: "bg-red-500/20",
    border: "border-red-500/30",
    text: "text-red-400",
  },
  no_show: {
    bg: "bg-red-500/20",
    border: "border-red-500/30",
    text: "text-red-400",
  },
};

// Generate time slots from 19:00 to 23:00 in 15-min intervals
function generateTimeSlots(): string[] {
  const slots: string[] = [];
  for (let hour = 19; hour <= 23; hour++) {
    for (let min = 0; min < 60; min += 15) {
      if (hour === 23 && min > 0) break;
      slots.push(
        `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`,
      );
    }
  }
  return slots;
}

export default function ServiceTimeline({ date }: ServiceTimelineProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);

  const timeSlots = useMemo(() => generateTimeSlots(), []);

  useEffect(() => {
    async function fetchData() {
      try {
        const supabase = createClient();

        const [{ data: zonesData }, { data: bookingsData }] = await Promise.all(
          [
            supabase
              .from("zones")
              .select("*")
              .eq("is_active", true)
              .order("display_order"),
            supabase
              .from("bookings")
              .select("*")
              .eq("booking_date", date)
              .neq("status", "cancelled")
              .order("booking_time"),
          ],
        );

        setZones(zonesData || []);
        setBookings(bookingsData || []);
      } catch (error) {
        console.error("Error fetching timeline data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();

    // Realtime subscription
    const supabase = createClient();
    const channel = supabase
      .channel("timeline-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookings",
          filter: `booking_date=eq.${date}`,
        },
        (payload: { eventType: string; new: unknown; old: unknown }) => {
          if (payload.eventType === "INSERT") {
            setBookings((prev) =>
              [...prev, payload.new as Booking].sort((a, b) =>
                a.booking_time.localeCompare(b.booking_time),
              ),
            );
          } else if (payload.eventType === "UPDATE") {
            setBookings((prev) =>
              prev.map((b) =>
                b.id === (payload.new as Booking).id
                  ? (payload.new as Booking)
                  : b,
              ),
            );
          } else if (payload.eventType === "DELETE") {
            setBookings((prev) =>
              prev.filter((b) => b.id !== (payload.old as Booking).id),
            );
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [date]);

  // Get bookings for a specific slot and zone
  const getBookingsForSlot = (slot: string, zoneId: string) => {
    return bookings.filter(
      (b) => b.booking_time === slot && b.zone_id === zoneId,
    );
  };

  // Get current time marker position
  const getCurrentTimePosition = () => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();

    if (hours < 19 || hours > 23) return null;

    const startMinutes = 19 * 60;
    const currentMinutes = hours * 60 + minutes;
    const totalMinutes = 4 * 60; // 19:00 to 23:00

    return ((currentMinutes - startMinutes) / totalMinutes) * 100;
  };

  const currentTimePosition = getCurrentTimePosition();
  const isToday = date === new Date().toISOString().split("T")[0];

  if (loading) {
    return (
      <div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-xl p-6 animate-pulse">
        <div className="h-64 bg-white/5 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">
            Timeline del Servicio
          </h2>
          <p className="text-sm text-white/60">
            {bookings.length} reservas programadas
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {Object.entries(STATUS_COLORS)
            .slice(0, 4)
            .map(([status, colors]) => (
              <div key={status} className="flex items-center space-x-1.5">
                <div
                  className={`w-3 h-3 rounded-full ${colors.bg} border ${colors.border}`}
                ></div>
                <span className="text-xs text-white/60 capitalize">
                  {status}
                </span>
              </div>
            ))}
        </div>
      </div>

      {/* Timeline Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[800px] relative">
          {/* Time Header */}
          <div className="flex border-b border-white/10 bg-black/20">
            <div className="w-32 shrink-0 p-3 text-xs font-medium text-white/60 uppercase tracking-wider">
              Zona
            </div>
            <div className="flex-1 flex relative">
              {timeSlots.map((slot, i) => (
                <div
                  key={slot}
                  className={`flex-1 p-2 text-center text-xs text-white/40 border-l border-white/5 ${i % 4 === 0 ? "font-medium text-white/60" : ""}`}
                >
                  {i % 4 === 0 ? slot : ""}
                </div>
              ))}

              {/* Current time indicator */}
              {/* Current time indicator */}
              {isToday &&
                currentTimePosition !== null &&
                (() => {
                  const indicatorStyle = {
                    "--position": `${currentTimePosition}%`,
                  } as React.CSSProperties;
                  return (
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10 timeline-indicator"
                      style={indicatorStyle}
                    >
                      <div className="absolute -top-1 -left-1.5 w-3 h-3 rounded-full bg-red-500"></div>
                    </div>
                  );
                })()}
            </div>
          </div>

          {/* Zone Rows */}
          {zones.map((zone) => (
            <div
              key={zone.id}
              className="flex border-b border-white/5 hover:bg-white/5 transition-colors"
            >
              {/* Zone Label */}
              <div className="w-32 shrink-0 p-3 border-r border-white/10">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-white/40" />
                  <div>
                    <p className="text-sm font-medium text-white truncate">
                      {zone.name.split(" - ")[1] || zone.name}
                    </p>
                    <p className="text-xs text-white/40">
                      {zone.capacity_pax} pax
                    </p>
                  </div>
                </div>
              </div>

              {/* Time Slots */}
              <div className="flex-1 flex relative">
                {timeSlots.map((slot) => {
                  const slotBookings = getBookingsForSlot(slot, zone.id);

                  return (
                    <div
                      key={`${zone.id}-${slot}`}
                      className="flex-1 min-h-[60px] border-l border-white/5 p-1 relative"
                    >
                      {slotBookings.map((booking) => {
                        const colors =
                          STATUS_COLORS[booking.status] ||
                          STATUS_COLORS.pending;
                        return (
                          <div
                            key={booking.id}
                            className={`${colors.bg} ${colors.border} border rounded-lg p-1.5 mb-1 cursor-pointer hover:scale-105 transition-transform`}
                            title={`${booking.customer_name} - ${booking.pax} pax`}
                          >
                            <div className="flex items-center space-x-1">
                              <User className={`w-3 h-3 ${colors.text}`} />
                              <span className="text-xs text-white font-medium truncate">
                                {booking.customer_name.split(" ")[0]}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1 mt-0.5">
                              <Users className="w-3 h-3 text-white/40" />
                              <span className="text-xs text-white/60">
                                {booking.pax}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
