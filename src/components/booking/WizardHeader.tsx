"use client";

import { useBookingStore } from "@/store/booking-store";
import { ChevronLeft } from "lucide-react";
import { BUSINESS } from "@/config/business";

import { useLanguage } from "@/hooks/useLanguage";
import { useRouter } from "next/navigation";
import { LanguageSelector } from "../ui/LanguageSelector";

export default function WizardHeader() {
  const { currentStep, setStep, draftBooking } = useBookingStore();
  const { t, language } = useLanguage();
  const router = useRouter();

  const handleBack = () => {
    if (currentStep === 1) {
      router.push("/");
      return;
    }
    if (currentStep > 1) setStep(currentStep - 1);
  };

  const formatDate = (dStr: string) => {
    // Manually parse YYYY-MM-DD to avoid timezone issues
    const [year, month, day] = dStr.split("-").map(Number);
    const d = new Date(year, month - 1, day);

    // Determine locale based on language
    const locales: Record<string, string> = { es: "es-ES", pt: "pt-BR" };
    const locale = locales[language] || "en-GB";
    
    const weekday = d
      .toLocaleDateString(locale, { weekday: "short" })
      .replace(".", "")
      .toUpperCase();
    return `${weekday} ${day}`;
  };

  return (
    <div
      className={`flex flex-col items-center justify-between pb-6 relative ${currentStep > 0 ? "border-b border-white/5" : ""}`}
    >
      {/* Back Button */}
      {currentStep >= 1 && (
        <button
          onClick={handleBack}
          className="absolute left-0 top-0 p-2 text-white/60 hover:text-white transition-colors"
          aria-label="Volver al paso anterior"
          title="Volver"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      {/* Language Selector (Top Right) */}
      <div className="absolute right-0 top-0">
        <LanguageSelector />
      </div>

      {/* Logo placeholder */}
      <h1 className="hidden">{BUSINESS.name}</h1>

      {/* Breadcrumbs / Pills - Hidden on Welcome Step */}
      {currentStep > 0 && (
        <div className="flex items-center gap-2 mt-4 text-[10px] font-medium tracking-widest uppercase">
          {/* Show Pax only if step > 1 (Quantity confirmed) */}
          {currentStep > 1 && draftBooking.pax && (
            <div className="px-3 py-1 bg-white/10 rounded-full text-white/80 border border-white/5 backdrop-blur-sm">
              {draftBooking.pax} {t('wizard.pax')}
            </div>
          )}
          {/* Show Date only if step > 2 (Date confirmed) */}
          {currentStep > 2 && draftBooking.date && (
            <div className="px-3 py-1 bg-white/10 rounded-full text-white/80 border border-white/5 backdrop-blur-sm">
              {formatDate(draftBooking.date)}
            </div>
          )}
          {/* Show Time only if step > 3 (Time confirmed) */}
          {currentStep > 3 && draftBooking.timeSlot && (
            <div className="px-3 py-1 bg-white/10 rounded-full text-white/80 border border-white/5 backdrop-blur-sm">
              {draftBooking.timeSlot}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
