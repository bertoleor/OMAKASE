"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  Calendar,
  Users,
  MapPin,
  Loader2,
  ArrowRight,
  Home,
  ExternalLink,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import QRCode from "react-qr-code";

interface Reservation {
  id: string;
  customer_name: string;
  customer_email: string;
  booking_date: string;
  booking_time: string;
  pax: number;
  zone_id: string;
  zones?: { name: string };
}

export default function BookingConfirmationPage() {
  const params = useParams();
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchReservation = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("bookings")
        .select(`*, zones(name)`)
        .eq("id", params.id)
        .single();

      if (error) throw error;
      setReservation(data);
    } catch (err) {
      console.error("Error fetching reservation:", err);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchReservation();
  }, [fetchReservation]);

  function addToGoogleCalendar() {
    if (!reservation) return;

    const startDate = new Date(
      `${reservation.booking_date}T${reservation.booking_time}`,
    );
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);

    const formatDate = (d: Date) => d.toISOString().replaceAll(
      "-", ""
    ).replaceAll(
      ":", ""
    ).replaceAll(".", "");

    // Build calendar URL with separate variables to avoid nested template literals
    const eventTitle = `Reserva en MESS - ${reservation.pax} personas`;
    const eventDetails = `Tu reserva en MESS restaurante para ${reservation.pax} personas.`;
    const eventLocation = "MESS Restaurant";
    const dates = `${formatDate(startDate)}/${formatDate(endDate)}`;
    
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventTitle)}&dates=${dates}&details=${encodeURIComponent(eventDetails)}&location=${encodeURIComponent(eventLocation)}`;

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
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6">
        <p className="text-white/60 mb-4">Reserva no encontrada</p>
        <Link href="/" className="text-blue-400 hover:text-blue-300">
          Volver al inicio
        </Link>
      </div>
    );
  }

  const date = new Date(reservation.booking_date);
  const formattedDate = date.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const zoneName = reservation.zones?.name || "Mesa asignada al llegar";

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 bg-[url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2670&auto=format&fit=crop')] bg-cover bg-center relative">
      <div className="absolute inset-0 bg-black/80" />

      <div className="relative z-10 w-full max-w-md">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center animate-bounce">
            <CheckCircle2 className="w-10 h-10 text-green-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            ¡Reserva Confirmada!
          </h1>
          <p className="text-white/60">
            Hemos enviado los detalles a{" "}
            <strong className="text-white">{reservation.customer_email}</strong>
          </p>
        </div>

        {/* Reservation Card */}
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-6">
          {/* Date & Time */}
          <div className="text-center pb-6 border-b border-white/10">
            <p className="text-lg text-white/80 capitalize mb-2">
              {formattedDate}
            </p>
            <p className="text-5xl font-bold text-white">
              {reservation.booking_time}
            </p>
          </div>

          {/* Details */}
          <div className="py-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 text-white/60">
                <Users className="w-5 h-5" />
                <span>Personas</span>
              </div>
              <span className="text-white font-medium">{reservation.pax}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 text-white/60">
                <MapPin className="w-5 h-5" />
                <span>Zona</span>
              </div>
              <span className="text-white font-medium">{zoneName}</span>
            </div>
          </div>

          {/* QR Code */}
          <div className="pt-6 border-t border-white/10 text-center">
            <p className="text-sm text-white/60 mb-4">
              Muestra este código al llegar
            </p>
            <div className="bg-white p-4 rounded-xl inline-block">
              <QRCode value={`MESS-${reservation.id}`} size={140} />
            </div>
            <p className="mt-4 text-xs text-white/40 font-mono">
              {reservation.id.slice(0, 8).toUpperCase()}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={addToGoogleCalendar}
            className="w-full flex items-center justify-center space-x-2 py-4 bg-white text-black font-medium rounded-xl hover:bg-white/90 transition-colors"
          >
            <Calendar className="w-5 h-5" />
            <span>Agregar al calendario</span>
            <ExternalLink className="w-4 h-4" />
          </button>

          <Link
            href="/mis-reservas"
            className="w-full flex items-center justify-center space-x-2 py-4 bg-white/10 hover:bg-white/15 text-white rounded-xl transition-colors"
          >
            <span>Ver mis reservas</span>
            <ArrowRight className="w-5 h-5" />
          </Link>

          <Link
            href="/"
            className="w-full flex items-center justify-center space-x-2 py-3 text-white/60 hover:text-white transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>Volver al inicio</span>
          </Link>
        </div>

        {/* Help */}
        <div className="text-center mt-8 text-sm text-white/40">
          <p>¿Necesitas modificar tu reserva?</p>
          <Link
            href="/mis-reservas"
            className="text-blue-400 hover:text-blue-300"
          >
            Gestiona tu reserva aquí
          </Link>
        </div>
      </div>
    </div>
  );
}
