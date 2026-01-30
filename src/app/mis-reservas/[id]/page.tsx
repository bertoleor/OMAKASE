"use client";

import { useEffect, useState } from "react";
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
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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
    color: "text-white/90",
    bg: "bg-white/10",
    icon: Clock,
  },
  confirmed: {
    label: "Confirmada",
    color: "text-white/90",
    bg: "bg-white/10",
    icon: CheckCircle2,
  },
  seated: {
    label: "En mesa",
    color: "text-white/90",
    bg: "bg-white/10",
    icon: CheckCircle2,
  },
  completed: {
    label: "Completada",
    color: "text-white/40",
    bg: "bg-white/5",
    icon: CheckCircle2,
  },
  cancelled: {
    label: "Cancelada",
    color: "text-white/30",
    bg: "bg-white/5",
    icon: XCircle,
  },
  no_show: {
    label: "No presentado",
    color: "text-white/30",
    bg: "bg-white/5",
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
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black font-light">
      {/* Background Image - Same as home */}
      <div className="fixed inset-0 bg-cover bg-center bg-[url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2670&auto=format&fit=crop')] opacity-40" />
      <div className="fixed inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black pointer-events-none" />

      {/* Header */}
      <header className="border-b border-white/5 bg-black/20 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          <button
            onClick={() => router.push("/mis-reservas")}
            className="group flex items-center space-x-2 text-[9px] uppercase tracking-[0.2em] text-white/40 hover:text-white transition-all"
          >
            <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
            <span>Volver</span>
          </button>
          <div className="text-center flex-1">
            <h1 className="text-sm sm:text-base font-extralight tracking-[0.4em] uppercase text-white/90">
              DETALLE
            </h1>
          </div>
          <div className="w-[60px]" />
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-8 sm:py-12 space-y-6 relative z-10">
        {/* Main Glasscard Card */}
        <div className="bg-white/[0.02] backdrop-blur-[40px] border border-white/10 rounded-[2rem] p-6 sm:p-10 shadow-2xl relative overflow-hidden">
          {/* Subtle Inner Glow */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          {/* Status Header */}
          <div className="flex flex-col items-center mb-8">
            <div
              className={`p-4 rounded-full ${status.bg} border inline-flex items-center justify-center mb-4 transition-all border-white/10`}
            >
              <StatusIcon className={`w-4 h-4 sm:w-5 sm:h-5 ${status.color}`} />
            </div>
            <p
              className={`text-[9px] sm:text-[10px] uppercase tracking-[0.3em] font-medium ${status.color} mb-2`}
            >
              {status.label}
            </p>
            <div className="h-px w-6 bg-white/10 mb-2" />
            <p className="text-[8px] text-white/20 uppercase tracking-[0.1em] leading-none">
              Reserva #{reservation.id.slice(0, 8).toUpperCase()}
            </p>
          </div>

          {/* Date & Time - Visual Focus */}
          <div className="text-center mb-10 space-y-3">
            <p className="text-lg sm:text-xl font-extralight text-white tracking-[0.15em] uppercase opacity-80">
              {formattedDate}
            </p>
            <p className="text-5xl sm:text-6xl md:text-7xl font-thin text-white tracking-widest leading-tight">
              {reservation.booking_time}
            </p>
          </div>

          {/* Details Grid - Minimalist */}
          <div className="grid grid-cols-2 gap-px bg-white/5 rounded-2xl overflow-hidden border border-white/5">
            <div className="bg-white/[0.01] p-5 sm:p-6 flex flex-col items-center text-center space-y-2">
              <Users className="w-4 h-4 text-white/20" />
              <div className="space-y-0.5">
                <p className="text-[9px] uppercase tracking-[0.2em] text-white/30">
                  Personas
                </p>
                <p className="text-lg font-light text-white">
                  {reservation.pax}
                </p>
              </div>
            </div>

            <div className="bg-white/[0.01] p-5 sm:p-6 flex flex-col items-center text-center space-y-2">
              <MapPin className="w-4 h-4 text-white/20" />
              <div className="space-y-0.5">
                <p className="text-[9px] uppercase tracking-[0.2em] text-white/30">
                  Zona
                </p>
                <p className="text-lg font-light text-white truncate max-w-full px-2">
                  {zoneName}
                </p>
              </div>
            </div>
          </div>

          {/* Customer Info & Notes */}
          <div className="mt-8 pt-8 sm:mt-12 sm:pt-12 md:mt-14 md:pt-14 border-t border-white/5 space-y-8 sm:space-y-10">
            {reservation.notes && (
              <div className="space-y-2 sm:space-y-3">
                <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.3em] text-white/30 text-center">
                  Notas Especiales
                </p>
                <p className="text-xs sm:text-sm text-white/70 font-light leading-relaxed text-center italic px-4 sm:px-8">
                  &ldquo;{reservation.notes}&rdquo;
                </p>
              </div>
            )}

            <div className="flex flex-col items-center space-y-3 sm:space-y-4 opacity-30">
              <div className="flex items-center space-x-2 sm:space-x-3 text-[9px] sm:text-[10px] tracking-[0.2em] uppercase">
                <Mail className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                <span>{reservation.customer_email}</span>
              </div>
              <div className="flex items-center space-x-2 sm:space-x-3 text-[9px] sm:text-[10px] tracking-[0.2em] uppercase">
                <Phone className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                <span>{reservation.customer_phone}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons - Distinct and Sleek */}
        {!isPast && (
          <div className="space-y-3 px-0 sm:px-4">
            <button
              onClick={addToCalendar}
              className="w-full flex items-center justify-center space-x-3 py-4 bg-white text-black rounded-2xl transition-all hover:bg-neutral-200 active:scale-[0.98] font-semibold text-[10px] uppercase tracking-[0.2em] shadow-xl"
            >
              <Calendar className="w-4 h-4" />
              <span>Agregar al calendario</span>
            </button>

            {canCancel && (
              <button
                onClick={() => setShowCancelConfirm(true)}
                className="w-full flex items-center justify-center space-x-3 py-4 bg-transparent hover:bg-white/5 border border-white/10 text-white/30 hover:text-white transition-all rounded-2xl font-medium text-[10px] uppercase tracking-[0.2em]"
              >
                <XCircle className="w-4 h-4" />
                <span>Cancelar mi reserva</span>
              </button>
            )}
          </div>
        )}

        {/* Help Link */}
        <div className="text-center pt-8">
          <p className="text-[10px] text-white/20 uppercase tracking-[0.3em]">
            ¿Necesitas ayuda?{" "}
            <span className="text-white/40">soporte@omakase.restaurant</span>
          </p>
        </div>
      </main>

      {/* Cancel Confirmation Modal - Glasscard Style */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={() => setShowCancelConfirm(false)}
          />
          <div className="relative bg-white/[0.03] backdrop-blur-[32px] border border-white/10 rounded-[32px] p-8 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-3xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="text-xl font-light text-white mb-3">
                ¿Confirmas la cancelación?
              </h3>
              <p className="text-xs text-white/40 mb-8 font-light leading-relaxed">
                Esta acción cancelará tu reserva permanentemente y el espacio
                quedará disponible para otros clientes.
              </p>
              <div className="flex flex-col space-y-3">
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="w-full py-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl transition-all font-bold text-[10px] uppercase tracking-widest disabled:opacity-50"
                >
                  {cancelling ? (
                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                  ) : (
                    "Confirmar cancelación"
                  )}
                </button>
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  className="w-full py-4 bg-white/5 hover:bg-white/10 text-white/60 rounded-2xl transition-all font-medium text-[10px] uppercase tracking-widest"
                >
                  Mantener y volver
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
