"use client";

import { useState, useEffect, useCallback } from "react";
import { useBookingStore } from "@/store/booking-store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { TableZone } from "@/types/booking";
import { useLanguage } from "@/hooks/useLanguage";

export default function ZonesStep() {
  const { draftBooking, updateDraft, setStep } = useBookingStore();
  const { t } = useLanguage();
  const [expandedId, setExpandedId] = useState<TableZone | null>(draftBooking.zone || null);

  const zones: { id: TableZone; name: string; description: string }[] = [
    {
      id: "indoor-tables",
      name: t("zones.indoor_tables.name"),
      description: t("zones.indoor_tables.description"),
    },
    {
      id: "outdoor-pergola",
      name: t("zones.outdoor_pergola.name"),
      description: t("zones.outdoor_pergola.description"),
    },
    {
      id: "indoor-bar",
      name: t("zones.indoor_bar.name"),
      description: t("zones.indoor_bar.description"),
    },
  ];

  const handleSelect = (zone: TableZone) => {
    if (draftBooking.zone === zone) {
      updateDraft({ zone: undefined });
      setExpandedId(null);
    } else {
      updateDraft({ zone });
      setExpandedId(zone);
    }
  };

  const handleContinue = useCallback(() => {
    if (draftBooking.zone) {
      setStep(5);
    }
  }, [draftBooking.zone, setStep]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && draftBooking.zone) {
        handleContinue();
      }
    };
    globalThis.addEventListener("keydown", handleKeyDown);
    return () => globalThis.removeEventListener("keydown", handleKeyDown);
  }, [draftBooking.zone, handleContinue]);

  return (
    <div className="space-y-8 pt-10">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-light text-white uppercase tracking-wide">
          {t("zones.title")}
        </h2>
      </div>

      <div className="space-y-4">
        {zones.map((z) => {
          const isSelected = draftBooking.zone === z.id;
          const isExpanded = expandedId === z.id;

          return (
            <div
              key={z.id}
              className="rounded-xl border border-white/10 overflow-hidden transition-all duration-300"
            >
              {/* Header */}
              {/* Header */}
              <button
                onClick={() => {
                  handleSelect(z.id);
                }}
                className={cn(
                  "w-full flex items-center justify-between p-4 text-left transition-all duration-300",
                  isSelected ? "bg-white text-black" : "bg-white/5 text-white hover:bg-white/10",
                )}
              >
                <div className="flex items-center gap-3">
                  {/* Radio Circle */}
                  <div
                    className={cn(
                      "w-5 h-5 rounded-full border flex items-center justify-center transition-all",
                      isSelected ? "border-black" : "border-white/40 group-hover:border-white/60",
                    )}
                  >
                    <div
                      className={cn(
                        "w-2.5 h-2.5 rounded-full transition-all duration-300",
                        isSelected
                          ? "scale-100 opacity-100 bg-black"
                          : "scale-0 opacity-0 bg-white",
                      )}
                    />
                  </div>
                  <span
                    className={cn(
                      "font-light tracking-[0.2em] text-sm uppercase",
                      isSelected ? "text-black" : "text-white",
                    )}
                  >
                    {z.name}
                  </span>
                </div>
                {isExpanded ? (
                  <ChevronUp
                    className={cn("w-4 h-4", isSelected ? "text-black/40" : "text-white/40")}
                  />
                ) : (
                  <ChevronDown
                    className={cn("w-4 h-4", isSelected ? "text-black/40" : "text-white/40")}
                  />
                )}
              </button>

              <div
                className={cn(
                  "overflow-hidden transition-all duration-500 ease-in-out",
                  isExpanded ? "max-h-40 opacity-100" : "max-h-0 opacity-0",
                  isSelected ? "border-l-4 border-l-white" : "",
                )}
              >
                <div className="px-4 py-4 flex justify-center bg-white/5">
                  <p className="text-white/60 text-sm leading-normal font-light text-center max-w-[95%]">
                    {z.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Continue Button */}
      <div className="flex items-center justify-center gap-4 pt-4">
        <button
          onClick={() => setStep(3)}
          className="w-14 h-14 rounded-full bg-white/5 border border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 hover:border-white/50 transition-all"
          aria-label="Volver"
        >
          ←
        </button>
        <Button
          onClick={handleContinue}
          disabled={!draftBooking.zone}
          className="px-16 py-6 bg-white/5 text-white border border-white/20 hover:bg-white hover:text-black hover:border-white transition-all duration-300 uppercase tracking-wider disabled:opacity-30 disabled:hover:bg-white/5 disabled:hover:text-white h-14 rounded-full"
        >
          {t("common.next")}
        </Button>
      </div>
    </div>
  );
}
