"use client";

import { useBookingStore } from "@/store/booking-store";
import { Button } from "@/components/ui/button";
import { createBooking } from "@/app/actions/bookings";
import { useState, useTransition } from "react";
import { Calendar, Clock, Users, MapPin, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { BUSINESS } from "@/config/business";

export default function ConfirmationStep() {
  const router = useRouter();
  const { draftBooking, resetDraft, setStep, updateDraft } = useBookingStore();
  const [isPending, startTransition] = useTransition();
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const customerName =
    `${draftBooking.customer?.firstName || ""} ${draftBooking.customer?.lastName || ""}`.trim();

  const handleConfirm = () => {
    setError(null);
    startTransition(async () => {
      // Validate mandatory fields
      if (
        !draftBooking.date ||
        !draftBooking.timeSlot ||
        !draftBooking.pax ||
        !draftBooking.customer?.email
      ) {
        setError("Faltan datos obligatorios para realizar la reserva.");
        return;
      }

      const result = await createBooking({
        customerName: customerName,
        customerEmail: draftBooking.customer.email,
        customerPhone: draftBooking.customer.phone || "",
        date: draftBooking.date,
        timeSlot: draftBooking.timeSlot,
        pax: draftBooking.pax,
        zone: draftBooking.zone || "indoor-tables",
        notes: draftBooking.notes,
        paymentToken: draftBooking.paymentToken, // Now retrieved from store
        cardBrand: draftBooking.cardBrand,
        cardLastFour: draftBooking.cardLastFour,
      });

      if (result.success) {
        setIsSuccess(true);
      } else {
        setError(
          result.error || "Error al crear la reserva. Inténtelo de nuevo.",
        );
      }
    });
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    const [year, month, day] = dateStr.split("-").map(Number);
    const d = new Date(year, month - 1, day);
    // User requested standard Spanish format: "Sábado 31 de enero"
    const weekday = d.toLocaleDateString("es-ES", { weekday: "long" });
    const monthName = d.toLocaleDateString("es-ES", { month: "long" });

    // Capitalize first letter of weekday strictly
    const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

    // User requested "Sábado 31 de Enero" (Capitalized Month, lowercase 'de')
    return `${capitalize(weekday)} ${day} de ${capitalize(monthName)}`;
  };

  const getZoneName = (zone?: string) => {
    if (!zone) return "No especificada";
    return BUSINESS.zones[zone] || "No especificada";
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center space-y-8 py-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center space-y-6 max-w-md mx-auto px-4">
          <h2 className="text-3xl font-light text-white uppercase tracking-wide">
            Reserva Confirmada
          </h2>

          <div className="space-y-4">
            <p className="text-white/60 text-base font-light leading-relaxed">
              Se envió a su correo la confirmación de la reserva.
            </p>
            <p className="text-white text-lg font-medium">
              Muchas gracias, {draftBooking.customer?.firstName || "Cliente"}
            </p>
          </div>
        </div>

        <Button
          variant="ghost"
          onClick={() => {
            resetDraft();
            router.push("/");
          }}
          className="text-white/40 hover:text-white hover:bg-white/5 uppercase tracking-widest text-xs transition-colors mt-8"
        >
          Volver al Principal
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-4">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-light text-white uppercase tracking-wide">
          Resumen Final
        </h2>
        <p className="text-white/40 text-sm">
          Confirme que los datos sean correctos
        </p>
      </div>

      {/* Full Summary Card */}
      <div className="bg-white/5 rounded-2xl p-6 border border-white/10 space-y-6 backdrop-blur-sm">
        {/* Reservation Details */}
        <div className="space-y-4 border-b border-white/10 pb-4">
          <p className="text-white/30 text-xs uppercase tracking-wider font-bold mb-2">
            Detalles de Reserva
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-white/50 mt-0.5" />
              <div>
                <p className="text-xs text-white/40 uppercase tracking-wider">
                  Fecha
                </p>
                <p className="text-white text-sm capitalize">
                  {formatDate(draftBooking.date)}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-white/50 mt-0.5" />
              <div>
                <p className="text-xs text-white/40 uppercase tracking-wider">
                  Hora
                </p>
                <p className="text-white text-sm">{draftBooking.timeSlot}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-white/50 mt-0.5" />
              <div>
                <p className="text-xs text-white/40 uppercase tracking-wider">
                  Personas
                </p>
                <p className="text-white text-sm">{draftBooking.pax}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-white/50 mt-0.5" />
              <div>
                <p className="text-xs text-white/40 uppercase tracking-wider">
                  Zona
                </p>
                <p className="text-white text-sm">
                  {getZoneName(draftBooking.zone).split("-")[0]}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Preferences / Conditionals */}
        {((draftBooking.vegetarians ?? 0) > 0 ||
          (draftBooking.kids ?? 0) > 0 ||
          draftBooking.restrictions) && (
          <div className="space-y-2 border-b border-white/10 pb-4">
            <p className="text-white/30 text-xs uppercase tracking-wider font-bold mb-2">
              Preferencias
            </p>
            <div className="space-y-1">
              {(draftBooking.kids ?? 0) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Menores de 12:</span>
                  <span className="text-white">{draftBooking.kids}</span>
                </div>
              )}
              {(draftBooking.vegetarians ?? 0) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Vegetarianos:</span>
                  <span className="text-white">{draftBooking.vegetarians}</span>
                </div>
              )}
              {draftBooking.restrictions && (
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Restricciones:</span>
                  <span className="text-white">SI</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Personal & Payment */}
        <div className="space-y-4">
          <p className="text-white/30 text-xs uppercase tracking-wider font-bold mb-2">
            Titular de la Reserva
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-white/60">Nombre:</span>
              <span className="text-white font-medium uppercase">
                {customerName}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Correo Electrónico:</span>
              <span className="text-white">{draftBooking.customer?.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Teléfono:</span>
              <span className="text-white">
                {draftBooking.customer?.phone || "-"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Método de pago:</span>
              <span className="text-white flex items-center gap-2 uppercase">
                {draftBooking.cardBrand && draftBooking.cardBrand !== "unknown"
                  ? draftBooking.cardBrand
                  : "Tarjeta"}{" "}
                •••• {draftBooking.cardLastFour}
              </span>
            </div>
          </div>
          {draftBooking.notes && (
            <div className="bg-white/5 p-3 rounded-lg text-sm text-white/70 italic border border-white/5">
              &quot;{draftBooking.notes}&quot;
            </div>
          )}
        </div>
      </div>

      {/* Terms & Conditions */}
      <div className="bg-white/5 rounded-2xl p-4 border border-white/10 space-y-3">
        <label className="flex items-start gap-3 cursor-pointer group">
          <div className="relative flex items-center mt-0.5">
            <input
              type="checkbox"
              checked={draftBooking.policyAccepted || false}
              onChange={(e) => {
                updateDraft({ policyAccepted: e.target.checked });
              }}
              className="peer sr-only "
            />
            <div className="w-5 h-5 border border-white/30 rounded flex items-center justify-center peer-checked:bg-white peer-checked:border-white transition-all">
              <span className="text-black text-xs font-bold opacity-0 peer-checked:opacity-100">
                ✓
              </span>
            </div>
          </div>
          <div className="text-sm text-white/70 group-hover:text-white/90 transition-colors">
            <span className="font-light">He leído y acepto los </span>
            <span className="font-medium underline decoration-white/30 underline-offset-2">
              Términos y Condiciones
            </span>
            <span className="font-light"> y la política de cancelación.</span>
          </div>
        </label>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-200 text-sm text-center">
          {error}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => setStep(7)}
          className="w-14 h-14 rounded-full bg-white/5 border border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 hover:border-white/50 transition-all"
          aria-label="Volver"
        >
          ←
        </button>
        <Button
          onClick={handleConfirm}
          disabled={isPending || !draftBooking.policyAccepted}
          className={cn(
            "px-16 py-6 border transition-all duration-300 uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed font-medium h-14 rounded-full min-w-[200px]",
            isPending
              ? "bg-white text-black border-white" // Solid white when processing
              : "bg-white/5 text-white border-white/20 hover:bg-white hover:text-black hover:border-white", // Glass default
          )}
        >
          {isPending ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Confirmando...
            </>
          ) : (
            "Confirmar Reserva"
          )}
        </Button>
      </div>
    </div>
  );
}
