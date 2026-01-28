"use client";

import { useEffect, useState, useCallback } from "react";
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
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";

interface Reservation {
  id: string;
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
  { label: string; color: string; bg: string }
> = {
  pending: {
    label: "Pendiente",
    color: "text-yellow-400",
    bg: "bg-yellow-500/20",
  },
  confirmed: {
    label: "Confirmada",
    color: "text-blue-400",
    bg: "bg-blue-500/20",
  },
  seated: { label: "En mesa", color: "text-green-400", bg: "bg-green-500/20" },
  completed: {
    label: "Completada",
    color: "text-gray-400",
    bg: "bg-gray-500/20",
  },
  cancelled: { label: "Cancelada", color: "text-red-400", bg: "bg-red-500/20" },
  no_show: {
    label: "No presentado",
    color: "text-orange-400",
    bg: "bg-orange-500/20",
  },
};

export default function MyReservationsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchReservations = useCallback(async (email: string) => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("bookings")
        .select(
          `
          id, booking_date, booking_time, pax, status, zone_id, notes, created_at,
          zones(name)
        `,
        )
        .eq("customer_email", email)
        .order("booking_date", { ascending: false })
        .order("booking_time", { ascending: false });

      if (error) throw error;
      setReservations(data || []);
    } catch (err) {
      console.error("Error fetching reservations:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const checkAuth = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      router.push("/mis-reservas/login");
      return;
    }

    setUser(session.user);
    await fetchReservations(session.user.email!);
  }, [router, fetchReservations]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/mis-reservas/login");
  }

  // Separate upcoming and past reservations
  const today = new Date().toISOString().split("T")[0];
  const upcoming = reservations.filter(
    (r) =>
      r.booking_date >= today &&
      !["cancelled", "no_show", "completed"].includes(r.status),
  );
  const past = reservations.filter(
    (r) =>
      r.booking_date < today ||
      ["cancelled", "no_show", "completed"].includes(r.status),
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-white/40 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black">
      {/* Subtle background effects to match calendar identity */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.03),_transparent)] pointer-events-none" />
      
      {/* Header */}
      <header className="border-b border-white/5 bg-black/40 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-extralight tracking-[0.2em] mb-0.5 uppercase">OMAKASE</h1>
            <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-medium">Gestión de reservas</p>
          </div>
          <div className="flex items-center space-x-5">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-[10px] text-white/20 uppercase tracking-widest leading-none mb-1">Sesión iniciada</span>
              <span className="text-xs text-white/60 font-light">{user?.email}</span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all group"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4 text-white/40 group-hover:text-white/80 transition-colors" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12 space-y-12 relative z-10">
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
              <p className="text-white/30 font-light text-sm tracking-wide">No tienes reservas activas en este momento</p>
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
              <h2 className="text-sm font-medium uppercase tracking-widest">
                Historial
              </h2>
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
         <p className="text-[10px] text-white/10 uppercase tracking-[0.4em]">OMAKASE · Experience</p>
      </footer>
    </div>
  );
}

function ReservationCard({
  reservation,
  isPast,
}: {
  reservation: Reservation;
  isPast?: boolean;
}) {
  const status = STATUS_CONFIG[reservation.status] || STATUS_CONFIG.pending;
  const zoneName = reservation.zones?.name || "Mesa asignada al llegar";

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
      className={`block bg-white/[0.03] backdrop-blur-md border border-white/5 rounded-[24px] p-6 hover:bg-white/[0.06] hover:border-white/10 transition-all group relative overflow-hidden ${
        isPast ? "cursor-default brightness-75" : ""
      }`}
    >
      {/* Inner glow effect */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6">
          {/* Status Indicator */}
          <div className={`w-1.5 h-12 rounded-full ${status.bg} shadow-lg shadow-${status.color.split('-')[1]}-500/20`} title={status.label} />
          
          <div className="space-y-1.5">
            <p className="text-base font-medium text-white/90">
              {formattedDate}
            </p>
            <div className="flex items-center space-x-5 text-xs text-white/40 font-light">
              <div className="flex items-center space-x-2">
                <Clock className="w-3.5 h-3.5" />
                <span>{reservation.booking_time}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="w-3.5 h-3.5" />
                <span>{reservation.pax} {reservation.pax === 1 ? 'persona' : 'personas'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="w-3.5 h-3.5" />
                <span className="truncate max-w-[120px]">{zoneName}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="hidden sm:flex flex-col items-end space-y-1">
             <span className={`text-[9px] uppercase tracking-widest font-bold ${status.color}`}>
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
