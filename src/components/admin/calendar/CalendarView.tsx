"use client";

import { useEffect, useState, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { EventClickArg, EventDropArg, DateSelectArg } from "@fullcalendar/core";
import { Loader2, Plus, RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import ReservationDetail from "@/components/admin/reservations/ReservationDetail";
import BookingForm from "@/components/admin/reservations/BookingForm";

interface Booking {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  booking_date: string;
  booking_time: string;
  pax: number;
  zone_id: string;
  status: string;
  notes?: string;
  duration_minutes?: number;
  created_at?: string;
}

interface Zone {
  id: string;
  name: string;
  slug: string;
  capacity_pax: number;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  extendedProps: {
    booking: Booking;
    zoneName: string;
  };
}

const STATUS_COLORS: Record<string, { bg: string; border: string }> = {
  pending: { bg: "#fbbf24", border: "#f59e0b" },
  confirmed: { bg: "#3b82f6", border: "#2563eb" },
  seated: { bg: "#22c55e", border: "#16a34a" },
  completed: { bg: "#6b7280", border: "#4b5563" },
  cancelled: { bg: "#ef4444", border: "#dc2626" },
  no_show: { bg: "#f97316", border: "#ea580c" },
};

export default function CalendarView() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createDate, setCreateDate] = useState<string>("");
  const [actionLoading, setActionLoading] = useState(false);
  const calendarRef = useRef<FullCalendar>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: zonesData } = await supabase
        .from("zones")
        .select("*")
        .eq("is_active", true);

      setZones(zonesData || []);

      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 2);

      const { data: bookingsData } = await supabase
        .from("bookings")
        .select("*")
        .gte("booking_date", startDate.toISOString().split("T")[0])
        .lte("booking_date", endDate.toISOString().split("T")[0])
        .not("status", "eq", "cancelled");

      const calendarEvents: CalendarEvent[] = (bookingsData || []).map(
        (b: Booking) => {
          const zone = zonesData?.find((z: Zone) => z.id === b.zone_id);
          const duration = b.duration_minutes || 120;
          const startTime = new Date(`${b.booking_date}T${b.booking_time}`);
          const endTime = new Date(startTime.getTime() + duration * 60000);
          const colors = STATUS_COLORS[b.status] || STATUS_COLORS.pending;

          return {
            id: b.id,
            title: `${b.customer_name} (${b.pax}p)`,
            start: startTime.toISOString(),
            end: endTime.toISOString(),
            backgroundColor: colors.bg,
            borderColor: colors.border,
            textColor: "#ffffff",
            extendedProps: {
              booking: b,
              zoneName: zone?.name || "Unknown",
            },
          };
        },
      );

      setEvents(calendarEvents);
    } catch (error) {
      console.error("Error fetching calendar data:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleEventClick = (info: EventClickArg) => {
    const booking = info.event.extendedProps.booking as Booking;
    setSelectedBooking(booking);
  };

  const handleDateSelect = (info: DateSelectArg) => {
    setCreateDate(info.startStr.split("T")[0]);
    setShowCreateForm(true);
  };

  const handleEventDrop = async (info: EventDropArg) => {
    const booking = info.event.extendedProps.booking as Booking;
    const newDate = info.event.start?.toISOString().split("T")[0];
    const newTime = info.event.start?.toTimeString().substring(0, 5);

    if (!newDate || !newTime) {
      info.revert();
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("bookings")
        .update({
          booking_date: newDate,
          booking_time: newTime,
        })
        .eq("id", booking.id);

      if (error) throw error;
      await fetchData();
    } catch (error) {
      console.error("Error moving booking:", error);
      info.revert();
    }
  };

  const handleAction = async (bookingId: string, newStatus: string) => {
    setActionLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("bookings")
        .update({ status: newStatus })
        .eq("id", bookingId);

      if (error) throw error;
      await fetchData();

      if (selectedBooking?.id === bookingId) {
        setSelectedBooking((prev) =>
          prev ? { ...prev, status: newStatus } : null,
        );
      }
    } catch (error) {
      console.error("Error updating booking:", error);
    } finally {
      setActionLoading(false);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Calendario</h1>
          <p className="text-white/40 mt-1"> Vista de todas las reservas. </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchData}
            className="p-2 rounded-xl bg-black/30 border border-white/10 text-white/60 hover:text-white"
            title="Refrescar"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              setCreateDate(new Date().toISOString().split("T")[0]);
              setShowCreateForm(true);
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Nueva Reserva</span>
          </button>
        </div>
      </div>

      <div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-xl p-4 calendar-container">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          events={events}
          eventClick={handleEventClick}
          select={handleDateSelect}
          eventDrop={handleEventDrop}
          selectable={true}
          editable={true}
          droppable={true}
          slotMinTime="18:00:00"
          slotMaxTime="24:00:00"
          slotDuration="00:15:00"
          allDaySlot={false}
          locale="es"
          firstDay={1}
          height="auto"
          buttonText={{
            today: "Hoy",
            month: "Mes",
            week: "Semana",
            day: "Día",
          }}
          eventTimeFormat={{
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }}
          slotLabelFormat={{
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }}
        />
      </div>

      {selectedBooking && (
        <ReservationDetail
          booking={selectedBooking}
          zones={zones}
          onClose={() => setSelectedBooking(null)}
          onAction={handleAction}
          isLoading={actionLoading}
        />
      )}

      {showCreateForm && (
        <BookingForm
          zones={zones}
          date={createDate}
          onClose={() => setShowCreateForm(false)}
          onSuccess={fetchData}
        />
      )}
    </div>
  );
}
