"use client";

import { useEffect, useState, useCallback } from "react";
import { X, CheckCircle2, UserPlus, XCircle, Clock } from "lucide-react";
import { createClient } from "/lib/supabase/client";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { useNotificationStore } from "@/store/notification-store";

interface Notification {
  id: string;
  type: "new_booking" | "status_change" | "no_show" | "cancelled";
  title: string;
  message: string;
  timestamp: Date;
}

interface BookingRecord {
  id: string;
  customer_name: string;
  booking_time: string;
  pax: number;
  status: string;
}

const TYPE_CONFIG = {
  new_booking: {
    icon: UserPlus,
    color: "text-green-400",
    bgColor: "bg-green-500/20",
  },
  status_change: {
    icon: CheckCircle2,
    color: "text-blue-400",
    bgColor: "bg-blue-500/20",
  },
  no_show: {
    icon: Clock,
    color: "text-orange-400",
    bgColor: "bg-orange-500/20",
  },
  cancelled: { icon: XCircle, color: "text-red-400", bgColor: "bg-red-500/20" },
};

export default function NotificationToast() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isEnabled] = useState(true);
  const incrementUnread = useNotificationStore((state) => state.incrementUnread);
  const clearUnread = useNotificationStore((state) => state.clearUnread);

  const addNotification = useCallback((notif: Omit<Notification, "id" | "timestamp">) => {
    // Play sound
    const audio = new Audio("/sounds/notification.mp3");
    audio.volume = 0.5;
    audio.play().catch(() => {}); // Ignore autoplay policy errors

    const newNotif: Notification = {
      ...notif,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    };
    setNotifications((prev) => [newNotif, ...prev].slice(0, 5));
    
    // Increment unread count in header
    incrementUnread();

    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== newNotif.id));
    }, 5000);
  }, [incrementUnread]);

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    // Clear unread when all notifications are dismissed
    if (notifications.length <= 1) {
      clearUnread();
    }
  }, [notifications.length, clearUnread]);

  const handleInsert = useCallback(
    (payload: RealtimePostgresChangesPayload<BookingRecord>) => {
      const booking = payload.new as BookingRecord;
      addNotification({
        type: "new_booking",
        title: "Nueva Reserva",
        message: `${booking.customer_name} - ${booking.pax} pax a las ${booking.booking_time}`,
      });
    },
    [addNotification],
  );

  const handleUpdate = useCallback(
    (payload: RealtimePostgresChangesPayload<BookingRecord>) => {
      const oldState = payload.old as Partial<BookingRecord>;
      const newState = payload.new as BookingRecord;

      if (oldState.status !== newState.status) {
        if (newState.status === "no_show") {
          addNotification({
            type: "no_show",
            title: "No Show",
            message: `${newState.customer_name} marcado como no-show`,
          });
        } else if (newState.status === "cancelled") {
          addNotification({
            type: "cancelled",
            title: "Cancelación",
            message: `${newState.customer_name} ha cancelado`,
          });
        } else if (newState.status === "seated") {
          addNotification({
            type: "status_change",
            title: "Cliente Sentado",
            message: `${newState.customer_name} está en su mesa`,
          });
        }
      }
    },
    [addNotification],
  );

  useEffect(() => {
    if (!isEnabled) return;

    const supabase = createClient();

    const channel = supabase
      .channel("admin-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "bookings" },
        handleInsert,
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "bookings" },
        handleUpdate,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isEnabled, handleInsert, handleUpdate]);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map((notif) => {
        const config = TYPE_CONFIG[notif.type];
        const Icon = config.icon;

        return (
          <div
            key={notif.id}
            className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-xl p-4 shadow-lg animate-slide-in-right flex items-start space-x-3"
          >
            <div className={`p-2 rounded-lg ${config.bgColor}`}>
              <Icon className={`w-5 h-5 ${config.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white">{notif.title}</p>
              <p className="text-sm text-white/60 truncate">{notif.message}</p>
            </div>
            <button
              onClick={() => dismissNotification(notif.id)}
              className="p-1 rounded text-white/40 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Cerrar notificación"
              title="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
