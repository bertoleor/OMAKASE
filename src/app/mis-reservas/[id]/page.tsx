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
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.03),_transparent)] pointer-events-none" />
      
      {/* Header */}
      <header className="border-b border-white/5 bg-black/40 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-6 py-5 flex items-center justify-between">
          <button
            onClick={() => router.push("/mis-reservas")}
            className="group flex items-center space-x-3 text-[10px] uppercase tracking-[0.2em] text-white/30 hover:text-white transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
            <span>Volver</span>
          </button>
          <div className="text-center flex-1">
            <h1 className="text-lg font-extralight tracking-[0.3em] uppercase">Detalle</h1>
          </div>
          <div className="w-[60px]" /> {/* Spacer for centering */}
        </div>
      </header>

      <main className="max-w-xl mx-auto px-6 py-12 space-y-8 relative z-10">
        {/* Main Glasscard Card */}
        <div className="bg-white/[0.03] backdrop-blur-[24px] border border-white/10 rounded-[40px] p-8 md:p-12 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.5)] relative overflow-hidden">
          {/* Subtle Inner Glow */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          {/* Status Header */}
          <div className="flex flex-col items-center mb-12">
            <div className={`p-4 rounded-3xl ${status.bg} border inline-flex items-center justify-center mb-4 transition-all border-white/5`}>
              <StatusIcon className={`w-6 h-6 ${status.color}`} />
            </div>
            <p className={`text-[10px] uppercase tracking-[0.3em] font-bold ${status.color} mb-1`}>
              {status.label}
            </p>
            <p className="text-[10px] text-white/20 uppercase tracking-widest leading-none">
              Reserva #{reservation.id.slice(0, 8).toUpperCase()}
            </p>
          </div>

          {/* Date & Time - Visual Focus */}
          <div className="text-center mb-12 space-y-4">
            <p className="text-3xl font-extralight text-white tracking-wide">
              {formattedDate}
            </p>
            <p className="text-7xl font-light text-white tracking-tight">
              {reservation.booking_time}
            </p>
          </div>

          {/* Details Grid - Minimalist */}
          <div className="grid grid-cols-2 gap-px bg-white/5 rounded-3xl overflow-hidden border border-white/5">
            <div className="bg-black/20 p-6 flex flex-col items-center text-center space-y-2">
              <Users className="w-4 h-4 text-white/20" />
              <div className="space-y-0.5">
                <p className="text-[9px] uppercase tracking-widest text-white/30">Personas</p>
                <p className="text-lg font-light text-white">{reservation.pax}</p>
              </div>
            </div>

            <div className="bg-black/20 p-6 flex flex-col items-center text-center space-y-2">
              <MapPin className="w-4 h-4 text-white/20" />
              <div className="space-y-0.5">
                <p className="text-[9px] uppercase tracking-widest text-white/30">Zona</p>
                <p className="text-lg font-light text-white truncate max-w-full">{zoneName}</p>
              </div>
            </div>
          </div>

          {/* Customer Info & Notes */}
          <div className="mt-10 pt-10 border-t border-white/5 space-y-8">
            {reservation.notes && (
              <div className="space-y-2">
                <p className="text-[9px] uppercase tracking-widest text-white/30 text-center">Notas de la reserva</p>
                <p className="text-xs text-white/60 font-light leading-relaxed text-center italic px-4">
                  &ldquo;{reservation.notes}&rdquo;
                </p>
              </div>
            )}

            <div className="flex flex-col items-center space-y-3 opacity-40">
               <div className="flex items-center space-x-2 text-[10px] tracking-widest uppercase">
                  <Mail className="w-3 h-3" />
                  <span>{reservation.customer_email}</span>
               </div>
               <div className="flex items-center space-x-2 text-[10px] tracking-widest uppercase">
                  <Phone className="w-3 h-3" />
                  <span>{reservation.customer_phone}</span>
               </div>
            </div>
          </div>
        </div>

        {/* Action Buttons - Distinct and Sleek */}
        {!isPast && (
          <div className="space-y-4 px-4">
            <button
              onClick={addToCalendar}
              className="w-full flex items-center justify-center space-x-3 py-4 bg-white text-black rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] font-medium text-xs uppercase tracking-widest shadow-xl shadow-white/5"
            >
              <Calendar className="w-4 h-4" />
              <span>Agregar al calendario</span>
            </button>

            {canCancel && (
              <button
                onClick={() => setShowCancelConfirm(true)}
                className="w-full flex items-center justify-center space-x-3 py-4 bg-white/5 hover:bg-red-500/10 border border-white/5 hover:border-red-500/20 text-white/40 hover:text-red-400 rounded-2xl transition-all font-medium text-xs uppercase tracking-widest"
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
             ¿Necesitas ayuda? <span className="text-white/40">soporte@omakase.restaurant</span>
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
                Esta acción cancelará tu reserva permanentemente y el espacio quedará disponible para otros clientes.
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
