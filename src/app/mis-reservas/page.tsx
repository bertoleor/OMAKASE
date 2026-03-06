"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  Clock,
  Users,
  MapPin,
  ArrowRight,
  LogOut,
  Loader2,
  ChevronRight,
} from "lucide-react";
import { PageBackground } from "@/components/ui/page-background";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { BUSINESS } from "@/config/business";
import { useBookingsByCustomer, Booking } from "@/hooks/queries";
import { useLanguage } from "@/hooks/useLanguage";

// Use Booking type from queries - extend with zone name relation
type Reservation = Booking & { zones?: { name: string } };

// Status labels are now managed through translations
const getStatusConfig = (t: (key: string) => string) => ({
  pending: {
    label: t("myReservations.status_pending"),
    color: "text-white/80",
    bg: "bg-white/10",
  },
  confirmed: {
    label: t("myReservations.status_confirmed"),
    color: "text-white/80",
    bg: "bg-white/10",
  },
  seated: { 
    label: t("myReservations.status_seated"), 
    color: "text-white/80", 
    bg: "bg-white/10" 
  },
  completed: {
    label: t("myReservations.status_completed"),
    color: "text-white/40",
    bg: "bg-white/5",
  },
  cancelled: { 
    label: t("myReservations.status_cancelled"), 
    color: "text-white/30", 
    bg: "bg-white/5" 
  },
  no_show: {
    label: t("myReservations.status_noShow"),
    color: "text-white/30",
    bg: "bg-white/5",
  },
});

export default function MyReservationsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Use React Query hook for fetching reservations
  const { data: reservations = [] } = useBookingsByCustomer(user?.email || "");

  // Handle auth check separately
  useEffect(() => {
    const initAuth = async () => {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/mis-reservas/login");
        return;
      }

      setUser(session.user);
      setLoading(false);
    };

    initAuth();
  }, [router]);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/mis-reservas/login");
  }

  // Separate upcoming and past reservations
  const today = new Date().toISOString().split("T")[0];
  const upcoming = reservations.filter(
    (r) => r.booking_date >= today && !["cancelled", "no_show", "completed"].includes(r.status),
  );
  const past = reservations.filter(
    (r) => r.booking_date < today || ["cancelled", "no_show", "completed"].includes(r.status),
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-white/40 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black font-light">
      {/* Background Image - Shared Component */}
      <PageBackground />

      {/* Header */}
      <header className="border-b border-white/5 bg-black/20 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 py-4 sm:py-6 flex items-center justify-between">
          <div>
            <h1 className="text-lg sm:text-xl font-extralight tracking-[0.3em] mb-0.5 uppercase text-white/90">
              {BUSINESS.name}
            </h1>
            <div className="h-px w-6 bg-white/20 mb-1" />
            <p className="text-[9px] text-white/40 uppercase tracking-[0.2em] font-medium">
              Mis Reservas
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-[9px] text-white/20 uppercase tracking-[0.2em] leading-none mb-1">
                Sesión
              </span>
              <span className="text-[10px] text-white/40 font-light tracking-widest">
                {user?.email}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 sm:p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group shadow-lg"
              title="Cerrar sesión"
            >
              <LogOut className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-white/40 group-hover:text-white transition-colors" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-8 space-y-10 relative z-10">
        {/* Reservation List Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-white/60" />
              </div>
              <h2 className="text-sm font-medium text-white/80 uppercase tracking-widest">
                Próximas reservas
              </h2>
            </div>

            <a
              href="/reservar"
              className="inline-flex items-center space-x-2 text-[10px] uppercase tracking-widest text-white/40 hover:text-white transition-all group"
            >
              <span>Nueva reserva</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>

          {upcoming.length === 0 ? (
            <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-12 text-center backdrop-blur-sm">
              <p className="text-white/30 font-light text-sm tracking-wide">
                No tienes reservas activas en este momento
              </p>
              <Link
                href="/reservar"
                className="inline-block mt-6 px-8 py-3 bg-white text-black rounded-full text-[10px] uppercase tracking-[0.2em] font-bold hover:scale-105 transition-transform"
              >
                Hacer una reserva
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {upcoming.map((res) => (
                <ReservationCard key={res.id} reservation={res} />
              ))}
            </div>
          )}
        </section>

        {/* Past History Section */}
        {past.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center space-x-3 mb-8 opacity-40">
              <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-medium uppercase tracking-widest">Historial</h2>
            </div>

            <div className="space-y-4 opacity-40 hover:opacity-100 transition-opacity">
              {past.slice(0, 5).map((res) => (
                <ReservationCard key={res.id} reservation={res} isPast />
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Footer Branding */}
      <footer className="max-w-3xl mx-auto px-6 py-12 text-center">
        <p className="text-[10px] text-white/10 uppercase tracking-[0.4em]">
          {BUSINESS.name} · {BUSINESS.tagline}
        </p>
      </footer>
    </div>
  );
}

function ReservationCard({
  reservation,
  isPast,
}: Readonly<{
  reservation: Reservation;
  isPast?: boolean;
}>) {
  const { t } = useLanguage();
  const statusConfig = getStatusConfig(t);
  const status = statusConfig[reservation.status] || statusConfig.pending;
  const zoneName = reservation.zones?.name || t("myReservations.tableAssignedAtArrival");

  // Format date nicely
  const date = new Date(reservation.booking_date);
  const formattedDate = date.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <a
      href={`/mis-reservas/${reservation.id}`}
      className={`block bg-white/[0.02] backdrop-blur-[40px] border border-white/10 rounded-2xl p-4 sm:p-6 hover:bg-white/[0.05] hover:border-white/20 transition-all group relative overflow-hidden shadow-xl ${
        isPast ? "cursor-default opacity-50 grayscale select-none" : ""
      }`}
    >
      {/* Inner glow effect */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center space-x-4 sm:space-x-6">
          {/* Status Indicator Bar */}
          <div
            className={`w-0.5 h-8 sm:h-10 rounded-full ${status.bg} border-l border-white/5 opacity-40`}
            title={status.label}
          />

          <div className="space-y-1">
            <p className="text-sm sm:text-base font-extralight text-white tracking-wide uppercase">
              {formattedDate}
            </p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[8px] sm:text-[9px] text-white/40 font-light tracking-widest uppercase">
              <div className="flex items-center space-x-1.5">
                <Clock className="w-3 h-3 text-white/20" />
                <span>{reservation.booking_time}</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <Users className="w-3 h-3 text-white/20" />
                <span>
                  {reservation.pax} {reservation.pax === 1 ? "persona" : "personas"}
                </span>
              </div>
              <div className="flex items-center space-x-1.5">
                <MapPin className="w-3 h-3 text-white/20" />
                <span className="truncate max-w-[80px] sm:max-w-[120px]">{zoneName}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="hidden sm:flex flex-col items-end space-y-2">
            <span className={`text-[10px] uppercase tracking-[0.3em] font-medium ${status.color}`}>
              {status.label}
            </span>
          </div>

          {!isPast && (
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
              <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white" />
            </div>
          )}
        </div>
      </div>
    </a>
  );
}
