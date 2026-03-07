"use client";

import { useEffect, useCallback } from "react";

import { useBookingStore } from "@/store/booking-store";
import { Button } from "@/components/ui/button";
import { Minus, Plus } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

export default function PersonalizeStep() {
  const { draftBooking, updateDraft, setStep } = useBookingStore();
  const { t } = useLanguage();

  const pax = draftBooking.pax || 1;
  const vegetarians = draftBooking.vegetarians ?? 0;
  const kids = draftBooking.kids ?? 0;
  const restrictions = draftBooking.restrictions ?? false;

  const maxVegetarians = pax;
  const maxKids = Math.max(0, pax - 1);

  const handleIncrementVegetarians = () => {
    if (vegetarians < maxVegetarians) {
      updateDraft({ vegetarians: vegetarians + 1 });
    }
  };

  const handleDecrementVegetarians = () => {
    if (vegetarians > 0) {
      updateDraft({ vegetarians: vegetarians - 1 });
    }
  };

  const handleIncrementKids = () => {
    if (kids < maxKids) {
      updateDraft({ kids: kids + 1 });
    }
  };

  const handleDecrementKids = () => {
    if (kids > 0) {
      updateDraft({ kids: kids - 1 });
    }
  };

  const handleContinue = useCallback(() => {
    setStep(6);
  }, [setStep]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        handleContinue();
      }
    };
    globalThis.addEventListener("keydown", handleKeyDown);
    return () => globalThis.removeEventListener("keydown", handleKeyDown);
  }, [handleContinue]);

  return (
    <div className="space-y-8 pt-8">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-light text-white uppercase tracking-wide">
          {t("personalize.title")}
        </h2>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <span className="text-white/80 font-medium">{t("personalize.vegetarians")}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDecrementVegetarians}
              className="w-10 h-10 rounded-lg bg-white/5 border border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 hover:border-white/50 transition-all disabled:opacity-30 disabled:hover:bg-white/5 disabled:hover:border-white/20"
              disabled={vegetarians <= 0}
              aria-label="Disminuir vegetarianos"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-10 text-center text-white font-medium tabular-nums text-lg">
              {vegetarians}
            </span>
            <button
              onClick={handleIncrementVegetarians}
              className="w-10 h-10 rounded-lg bg-white/5 border border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 hover:border-white/50 transition-all disabled:opacity-30 disabled:hover:bg-white/5 disabled:hover:border-white/20"
              disabled={vegetarians >= maxVegetarians}
              aria-label="Aumentar vegetarianos"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Dietary Restrictions - Checkbox aligned with counters */}
        <div className="flex items-center justify-between">
          <span className="text-white/80 font-medium">{t("personalize.restrictions")}</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={restrictions}
              onChange={(e) => updateDraft({ restrictions: e.target.checked })}
              className="sr-only peer"
              aria-label={t("personalize.restrictions")}
            />
            <div className="w-14 h-7 bg-white/10 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-white/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white/40 peer-checked:bg-white peer-checked:after:bg-black after:rounded-full after:h-6 after:w-6 after:transition-all"></div>
          </label>
        </div>

        {/* Kids */}
        <div className="flex items-center justify-between">
          <span className="text-white/80 font-medium">{t("personalize.kids")}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDecrementKids}
              className="w-10 h-10 rounded-lg bg-white/5 border border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 hover:border-white/50 transition-all disabled:opacity-30 disabled:hover:bg-white/5 disabled:hover:border-white/20"
              disabled={kids <= 0}
              aria-label="Disminuir niños"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-10 text-center text-white font-medium tabular-nums text-lg">
              {kids}
            </span>
            <button
              onClick={handleIncrementKids}
              className="w-10 h-10 rounded-lg bg-white/5 border border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 hover:border-white/50 transition-all disabled:opacity-30 disabled:hover:bg-white/5 disabled:hover:border-white/20"
              disabled={kids >= maxKids}
              aria-label="Aumentar niños"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Continue Button */}
      <div className="flex items-center justify-center gap-4 pt-4">
        <button
          onClick={() => setStep(4)}
          className="w-14 h-14 rounded-full bg-white/5 border border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 hover:border-white/50 transition-all"
          aria-label="Volver"
        >
          ←
        </button>
        <Button
          onClick={handleContinue}
          className="px-16 py-6 bg-white/5 text-white border border-white/20 hover:bg-white hover:text-black hover:border-white transition-all duration-300 uppercase tracking-wider h-14 rounded-full"
        >
          {t("common.next")}
        </Button>
      </div>
    </div>
  );
}
