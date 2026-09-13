"use client";

import { useBookingStore } from "@/store/booking-store";
import { Button } from "@/components/ui/button";
import { createBooking } from "@/app/actions/bookings";
import { useState, useTransition, useEffect, useRef } from "react";
import { Calendar, Clock, Users, MapPin, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { BUSINESS } from "@/config/business";
import { useLanguage } from "@/hooks/useLanguage";

export default function ConfirmationStep() {
  const router = useRouter();
  const { draftBooking, resetDraft, setStep, updateDraft } = useBookingStore();
  const { t, language } = useLanguage();
  const [isPending, startTransition] = useTransition();
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [honeypot, setHoneypot] = useState("");
  const [renderedAt, setRenderedAt] = useState("");
  // Stable per confirmation attempt so safe retries dedupe server-side.
  const idempotencyKeyRef = useRef<string | null>(null);
  if (!idempotencyKeyRef.current) {
    idempotencyKeyRef.current =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  useEffect(() => {
    setRenderedAt(new Date().toISOString());
  }, []);

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
        // PCI: card data stays in the browser only — never sent to the server.
        idempotencyKey: idempotencyKeyRef.current ?? undefined,
        honeypot,
        renderedAt,
      });

      if (result.success) {
        setIsSuccess(true);
      } else {
        setError(result.error || "Error al crear la reserva. Inténtelo de nuevo.");
      }
    });
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    const [year, month, day] = dateStr.split("-").map(Number);
    const d = new Date(year, month - 1, day);
    // User requested standard Spanish format: "Sábado 31 de enero"
    const locales: Record<string, string> = { es: "es-ES", pt: "pt-BR" };
    const locale = locales[language] || "en-GB";
    const weekday = d.toLocaleDateString(locale, { weekday: "long" });
    const monthName = d.toLocaleDateString(locale, { month: "long" });

    // Capitalize first letter of weekday strictly
    const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

    // User requested "Sábado 31 de Enero" (Capitalized Month, lowercase 'de')
    if (language === "en") {
      return `${capitalize(weekday)} ${day} ${capitalize(monthName)}`;
    }
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
            {t("confirmation.title")}
          </h2>

          <div className="space-y-4">
            <p className="text-white/60 text-base font-light leading-relaxed">
              {t("confirmation.email_sent")}
            </p>
            <p className="text-white text-lg font-medium">
              {t("confirmation.thank_you")}, {draftBooking.customer?.firstName || "Cliente"}
            </p>
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const startTime = `${draftBooking.date?.replaceAll("-", "")}T${draftBooking.timeSlot?.replaceAll(":", "")}00`;
              const endTime = `${draftBooking.date?.replaceAll("-", "")}T${(Number.parseInt(draftBooking.timeSlot?.split(":")[0] || "0") + 2).toString().padStart(2, "0")}${draftBooking.timeSlot?.split(":")[1]}00`;
              const title = encodeURIComponent(`Reserva en ${BUSINESS.name}`);
              const details = encodeURIComponent(
                `Reserva para ${draftBooking.pax} personas.\nZona: ${draftBooking.zone}\nNotas: ${draftBooking.notes || "Ninguna"}`,
              );
              const location = encodeURIComponent(BUSINESS.address || "");
              globalThis.open(
                `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startTime}/${endTime}&details=${details}&location=${location}`,
                "_blank",
              );
            }}
            className="text-white/60 hover:text-white border-white/10 hover:bg-white/5 uppercase tracking-wider text-[10px]"
          >
            Google Calendar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const startTime = `${draftBooking.date?.replaceAll("-", "")}T${draftBooking.timeSlot?.replaceAll(":", "")}00`;
              const endTime = `${draftBooking.date?.replaceAll("-", "")}T${(Number.parseInt(draftBooking.timeSlot?.split(":")[0] || "0") + 2).toString().padStart(2, "0")}${draftBooking.timeSlot?.split(":")[1]}00`;
              const icsContent = String.raw`BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
URL:${globalThis.location.origin}
DTSTART:${startTime}
DTEND:${endTime}
SUMMARY:Reserva en ${BUSINESS.name}
DESCRIPTION:Reserva para ${draftBooking.pax} personas.\nZona: ${draftBooking.zone}\nNotas: ${draftBooking.notes || "Ninguna"}
LOCATION:${BUSINESS.address}
END:VEVENT
END:VCALENDAR`;
              const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
              const link = document.createElement("a");
              link.href = globalThis.URL.createObjectURL(blob);
              link.setAttribute("download", "reserva.ics");
              document.body.appendChild(link);
              link.click();
              link.remove();
            }}
            className="text-white/60 hover:text-white border-white/10 hover:bg-white/5 uppercase tracking-wider text-[10px]"
          >
            .ICS (Outlook/Apple)
          </Button>
        </div>

        <Button
          variant="ghost"
          onClick={() => {
            resetDraft();
            router.push("/");
          }}
          className="text-white/40 hover:text-white hover:bg-white/5 uppercase tracking-widest text-xs transition-colors mt-8"
        >
          {t("confirmation.home")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-4">
      <input
        type="text"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="sr-only"
      />

      <div className="text-center space-y-2">
        <h2 className="text-2xl font-light text-white uppercase tracking-wide">
          {t("summary.title")}
        </h2>
        <p className="text-white/40 text-sm">{t("summary.description")}</p>
      </div>

      {/* Full Summary Card */}
      <div className="bg-white/5 rounded-2xl p-6 border border-white/10 space-y-6 backdrop-blur-sm">
        {/* Reservation Details */}
        <div className="space-y-4 border-b border-white/10 pb-4">
          <p className="text-white/30 text-xs uppercase tracking-wider font-bold mb-2">
            {t("summary.details")}
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-white/50 mt-0.5" />
              <div>
                <p className="text-xs text-white/40 uppercase tracking-wider">
                  {t("wizard.steps.date")}
                </p>
                <p className="text-white text-sm capitalize">{formatDate(draftBooking.date)}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-white/50 mt-0.5" />
              <div>
                <p className="text-xs text-white/40 uppercase tracking-wider">
                  {t("wizard.steps.time")}
                </p>
                <p className="text-white text-sm">{draftBooking.timeSlot}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-white/50 mt-0.5" />
              <div>
                <p className="text-xs text-white/40 uppercase tracking-wider">
                  {t("quantity.label")}
                </p>
                <p className="text-white text-sm">{draftBooking.pax}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-white/50 mt-0.5" />
              <div>
                <p className="text-xs text-white/40 uppercase tracking-wider">{t("zones.title")}</p>
                <p className="text-white text-sm">{getZoneName(draftBooking.zone).split("-")[0]}</p>
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
              {t("summary.preferences")}
            </p>
            <div className="space-y-1">
              {(draftBooking.kids ?? 0) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">{t("personalize.kids")}:</span>
                  <span className="text-white">{draftBooking.kids}</span>
                </div>
              )}
              {(draftBooking.vegetarians ?? 0) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">{t("personalize.vegetarians")}:</span>
                  <span className="text-white">{draftBooking.vegetarians}</span>
                </div>
              )}
              {draftBooking.restrictions && (
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">{t("personalize.restrictions")}:</span>
                  <span className="text-white">{t("common.yes")}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Personal & Payment */}
        <div className="space-y-4">
          <p className="text-white/30 text-xs uppercase tracking-wider font-bold mb-2">
            {t("summary.holder")}
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-white/60">{t("auth.name_label")}:</span>
              <span className="text-white font-medium uppercase">{customerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">{t("auth.email_label")}:</span>
              <span className="text-white">{draftBooking.customer?.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">{t("auth.phone_label")}:</span>
              <span className="text-white">{draftBooking.customer?.phone || "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">{t("guarantee.payment_method")}:</span>
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
            {t("guarantee.terms")}
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
            t("common.confirm")
          )}
        </Button>
      </div>
    </div>
  );
}
