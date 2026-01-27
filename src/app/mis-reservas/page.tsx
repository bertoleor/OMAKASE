"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
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
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-[0.15em]">OMAKASE</h1>
            <p className="text-sm text-white/60">Mis Reservas</p>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-white/60">{user?.email}</span>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="w-5 h-5 text-white/60" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-8">
        {/* Quick action */}
        <a
          href="/reservar"
          className="block p-6 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-2xl hover:border-blue-500/50 transition-all group"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-white mb-1">
                Nueva Reserva
              </h3>
              <p className="text-white/60">Reserva una mesa en OMAKASE</p>
            </div>
            <ArrowRight className="w-6 h-6 text-white/40 group-hover:text-white group-hover:translate-x-1 transition-all" />
          </div>
        </a>

        {/* Upcoming Reservations */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-blue-400" />
            <span>Próximas Reservas</span>
          </h2>

          {upcoming.length === 0 ? (
            <div className="bg-white/5 rounded-2xl p-8 text-center">
              <p className="text-white/60">No tienes reservas próximas</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcoming.map((res) => (
                <ReservationCard key={res.id} reservation={res} />
              ))}
            </div>
          )}
        </section>

        {/* Past Reservations */}
        {past.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-white/60 mb-4">
              Historial
            </h2>
            <div className="space-y-3 opacity-60">
              {past.slice(0, 5).map((res) => (
                <ReservationCard key={res.id} reservation={res} isPast />
              ))}
            </div>
          </section>
        )}
      </main>
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
      className={`block bg-white/5 rounded-2xl p-5 hover:bg-white/10 transition-all group ${
        isPast ? "cursor-default" : ""
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          {/* Date & Time */}
          <div>
            <p className="text-lg font-medium text-white capitalize">
              {formattedDate}
            </p>
            <div className="flex items-center space-x-4 mt-1 text-white/60">
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>{reservation.booking_time}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Users className="w-4 h-4" />
                <span>{reservation.pax} personas</span>
              </div>
            </div>
          </div>

          {/* Zone */}
          <div className="flex items-center space-x-2 text-sm text-white/40">
            <MapPin className="w-4 h-4" />
            <span>{zoneName}</span>
          </div>
        </div>

        <div className="flex flex-col items-end space-y-2">
          {/* Status Badge */}
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}
          >
            {status.label}
          </span>

          {!isPast && (
            <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-white/60 transition-colors" />
          )}
        </div>
      </div>
    </a>
  );
}
