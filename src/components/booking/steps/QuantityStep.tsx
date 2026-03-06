"use client";

import { useEffect, useCallback } from "react";
import { useBookingStore } from "@/store/booking-store";
import { Button } from "@/components/ui/button";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/hooks/useLanguage";

const DIRECT_SELECTION = [1, 2, 3, 4];

export default function QuantityStep() {
  const { draftBooking, updateDraft, setStep, settings } = useBookingStore();
  const { t } = useLanguage();
  const currentPax = draftBooking.pax || 0;
  const router = useRouter();

  const maxPax = settings?.max_pax_per_booking || 10;
  const directOptions = DIRECT_SELECTION.filter((n) => n <= maxPax);
  const showCounter = maxPax > 4;

  const handleSelect = (qty: number) => {
    if (currentPax === qty) {
      updateDraft({ pax: 0 }); // Deselect
    } else {
      updateDraft({ pax: qty });
    }
  };

  const handleIncrement = () => {
    if (currentPax >= maxPax) return;
    updateDraft({ pax: (currentPax || 0) + 1 });
  };

  const handleDecrement = () => {
    if (currentPax <= 1) return;
    updateDraft({ pax: currentPax - 1 });
  };

  const handleContinue = useCallback(() => {
    if (currentPax > 0) {
      setStep(2);
    }
  }, [currentPax, setStep]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && currentPax > 0) {
        handleContinue();
      }
    };
    globalThis.addEventListener("keydown", handleKeyDown);
    return () => globalThis.removeEventListener("keydown", handleKeyDown);
  }, [currentPax, handleContinue]);

  return (
    <div className="space-y-10 pt-8">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-light text-white uppercase tracking-wide">
          {t('quantity.title')}
        </h2>
        <p className="text-white/40 text-sm">{t('quantity.description')}</p>
      </div>

      <div className="flex flex-col items-center gap-6">
        {/* Row 1: Direct Circles 1-4 (filtered) */}
        <div className="flex items-center gap-4">
          {directOptions.map((qty) => (
            <button
              key={qty}
              onClick={() => handleSelect(qty)}
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center text-lg font-medium transition-all duration-300 border",
                currentPax === qty
                  ? "bg-white text-black border-white"
                  : "bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-white/50",
              )}
            >
              {qty}
            </button>
          ))}
        </div>

        {/* Row 2: Counter for 5+ (or larger groups) */}
        {(showCounter || currentPax > 4) && (
          <div className="flex items-center gap-4">
            <button
              onClick={handleDecrement}
              className="w-12 h-12 rounded-full bg-white/5 border border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 hover:border-white/50 transition-all"
              aria-label="Disminuir cantidad"
            >
              <Minus className="w-5 h-5" />
            </button>

            <button
              onClick={() => {
                if (maxPax >= 5) handleSelect(currentPax > 4 ? currentPax : 5);
              }}
              className={cn(
                "h-12 w-24 rounded-full flex items-center justify-center font-medium transition-all duration-300 border",
                currentPax >= 5
                  ? "bg-white text-black border-white"
                  : "bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-white/50",
              )}
            >
              {currentPax > 4 ? currentPax : "5+"}
            </button>

            <button
              onClick={handleIncrement}
              disabled={currentPax >= maxPax}
              className="w-12 h-12 rounded-full bg-white/5 border border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 hover:border-white/50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Aumentar cantidad"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Footer - Back & Continue */}
      <div className="flex items-center justify-center gap-4 pt-8">
        <button
          onClick={() => router.push("/")}
          className="w-14 h-14 rounded-full bg-white/5 border border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 hover:border-white/50 transition-all"
          aria-label="Volver"
        >
          ←
        </button>
        <Button
          onClick={handleContinue}
          disabled={!currentPax || currentPax < 1}
          className="px-16 py-6 bg-white/5 text-white border border-white/20 hover:bg-white hover:text-black hover:border-white transition-all duration-300 uppercase tracking-wider disabled:opacity-30 disabled:hover:bg-white/5 disabled:hover:text-white h-14 rounded-full"
        >
          {t('common.next')}
        </Button>
      </div>
    </div>
  );
}
