"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Calendar,
  Clock,
  Users,
  MapPin,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Phone,
  Mail,
  // QrCode,
  // Download,
  // Share2, // Keeping commented for future features or remove entirely
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import QRCode from "react-qr-code";

interface Reservation {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  booking_date: string;
  booking_time: string;
  pax: number;
  status: string;
  zone_id: string;
  notes?: string;
  created_at: string;
  zones?: { name: string };
}

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; icon: React.ElementType }
> = {
  pending: {
    label: "Pendiente de confirmación",
    color: "text-yellow-400",
    bg: "bg-yellow-500/20",
    icon: Clock,
  },
  confirmed: {
    label: "Confirmada",
    color: "text-blue-400",
    bg: "bg-blue-500/20",
    icon: CheckCircle2,
  },
  seated: {
    label: "En mesa",
    color: "text-green-400",
    bg: "bg-green-500/20",
    icon: CheckCircle2,
  },
  completed: {
    label: "Completada",
    color: "text-gray-400",
    bg: "bg-gray-500/20",
    icon: CheckCircle2,
  },
  cancelled: {
    label: "Cancelada",
    color: "text-red-400",
    bg: "bg-red-500/20",
    icon: XCircle,
  },
  no_show: {
    label: "No presentado",
    color: "text-orange-400",
    bg: "bg-orange-500/20",
    icon: AlertTriangle,
  },
};

export default function ReservationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);


  useEffect(() => {
    checkAuthAndFetch();
    checkAuthAndFetch();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function checkAuthAndFetch() {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      router.push("/mis-reservas/login");
      return;
    }

    await fetchReservation(session.user.email);
  }

  async function fetchReservation(email: string) {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("bookings")
        .select(`*, zones(name)`)
        .eq("id", params.id)
        .eq("customer_email", email)
        .single();

      if (error) throw error;
      setReservation(data);
    } catch (err) {
      console.error("Error fetching reservation:", err);
      router.push("/mis-reservas");
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel() {
    if (!reservation) return;
    setCancelling(true);

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("bookings")
        .update({ status: "cancelled" })
        .eq("id", reservation.id);

      if (error) throw error;

      // Send cancellation email
      await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "cancellation",
          to: reservation.customer_email,
          customerName: reservation.customer_name,
          bookingDate: reservation.booking_date,
          bookingTime: reservation.booking_time,
          pax: reservation.pax,
        }),
      });

      setReservation({ ...reservation, status: "cancelled" });
      setShowCancelConfirm(false);
    } catch (err) {
      console.error("Error cancelling:", err);
      alert("Error al cancelar. Por favor intenta de nuevo.");
    } finally {
      setCancelling(false);
    }
  }

  function addToCalendar() {
    if (!reservation) return;

    const startDate = new Date(
      `${reservation.booking_date}T${reservation.booking_time}`,
    );
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // 2 hours

    const formatDate = (d: Date) => d.toISOString().replace(/-|:|\.\d{3}/g, "");

    const event = {
      text: `Reserva en OMAKASE - ${reservation.pax} personas`,
      dates: `${formatDate(startDate)}/${formatDate(endDate)}`,
      details: `Tu reserva en OMAKASE restaurante para ${reservation.pax} personas.`,
      location: "OMAKASE Restaurant",
    };

    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.text)}&dates=${event.dates}&details=${encodeURIComponent(event.details)}&location=${encodeURIComponent(event.location)}`;

    window.open(url, "_blank");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-white/40 animate-spin" />
      </div>
    );
  }

  if (!reservation) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white/60">Reserva no encontrada</p>
      </div>
    );
  }

  const status = STATUS_CONFIG[reservation.status] || STATUS_CONFIG.pending;
  const StatusIcon = status.icon;
  const zoneName = reservation.zones?.name || "Mesa asignada al llegar";
  const date = new Date(reservation.booking_date);
  const formattedDate = date.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const canCancel = ["pending", "confirmed"].includes(reservation.status);
  const isPast =
    reservation.booking_date < new Date().toISOString().split("T")[0];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => router.push("/mis-reservas")}
            className="flex items-center space-x-2 text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Mis Reservas</span>
          </button>
          <h1 className="text-xl font-bold tracking-[0.1em]">OMAKASE</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {/* Status Header */}
        <div
          className={`rounded-2xl p-6 ${status.bg} border ${status.color.replace("text-", "border-")}/30`}
        >
          <div className="flex items-center space-x-3">
            <StatusIcon className={`w-6 h-6 ${status.color}`} />
            <span className={`text-lg font-medium ${status.color}`}>
              {status.label}
            </span>
          </div>
        </div>

        {/* Main Details Card */}
        <div className="bg-white/5 rounded-2xl p-6 space-y-6">
          {/* Date & Time - Big */}
          <div className="text-center py-4 border-b border-white/10">
            <p className="text-2xl font-medium text-white capitalize mb-2">
              {formattedDate}
            </p>
            <p className="text-4xl font-bold text-white">
              {reservation.booking_time}
            </p>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-lg bg-white/5">
                <Users className="w-5 h-5 text-white/60" />
              </div>
              <div>
                <p className="text-sm text-white/40">Personas</p>
                <p className="text-white font-medium">{reservation.pax}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-lg bg-white/5">
                <MapPin className="w-5 h-5 text-white/60" />
              </div>
              <div>
                <p className="text-sm text-white/40">Zona</p>
                <p className="text-white font-medium">{zoneName}</p>
              </div>
            </div>
          </div>

          {/* Notes */}
          {reservation.notes && (
            <div className="pt-4 border-t border-white/10">
              <p className="text-sm text-white/40 mb-1">Notas</p>
              <p className="text-white">{reservation.notes}</p>
            </div>
          )}
        </div>

        {/* QR Code */}
        {!isPast && !["cancelled", "no_show"].includes(reservation.status) && (
          <div className="bg-white/5 rounded-2xl p-6 text-center">
            <h3 className="text-sm text-white/60 mb-4">
              Muestra este código al llegar
            </h3>
            <div className="bg-white p-4 rounded-xl inline-block">
              <QRCode value={`OMAKASE-${reservation.id}`} size={160} />
            </div>
            <p className="mt-4 text-xs text-white/40">
              Código: {reservation.id.slice(0, 8).toUpperCase()}
            </p>
          </div>
        )}

        {/* Actions */}
        {!isPast && (
          <div className="space-y-3">
            <button
              onClick={addToCalendar}
              className="w-full flex items-center justify-center space-x-2 py-4 bg-white/10 hover:bg-white/15 text-white rounded-xl transition-colors"
            >
              <Calendar className="w-5 h-5" />
              <span>Agregar al calendario</span>
            </button>

            {canCancel && (
              <button
                onClick={() => setShowCancelConfirm(true)}
                className="w-full flex items-center justify-center space-x-2 py-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-colors"
              >
                <XCircle className="w-5 h-5" />
                <span>Cancelar reserva</span>
              </button>
            )}
          </div>
        )}

        {/* Contact Info */}
        <div className="bg-white/5 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm text-white/60">Datos de reserva</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Mail className="w-4 h-4 text-white/40" />
              <span className="text-white">{reservation.customer_email}</span>
            </div>
            <div className="flex items-center space-x-3">
              <Phone className="w-4 h-4 text-white/40" />
              <span className="text-white">{reservation.customer_phone}</span>
            </div>
          </div>
        </div>

        {/* Help */}
        <div className="text-center pt-6 text-sm text-white/40">
          <p>¿Necesitas ayuda? Contáctanos en reservas@mess.com</p>
        </div>
      </main>

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <>
          <div
            className="fixed inset-0 bg-black/60 z-50"
            onClick={() => setShowCancelConfirm(false)}
          />
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-md mx-auto bg-black border border-white/10 rounded-2xl p-6 z-50">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                ¿Cancelar reserva?
              </h3>
              <p className="text-white/60 mb-6">
                Esta acción no se puede deshacer. Se enviará una confirmación de
                cancelación a tu email.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  className="flex-1 py-3 bg-white/10 hover:bg-white/15 text-white rounded-xl transition-colors"
                >
                  No, mantener
                </button>
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors disabled:opacity-50"
                >
                  {cancelling ? (
                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                  ) : (
                    "Sí, cancelar"
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
