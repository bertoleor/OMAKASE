"use client";

import { useEffect, useCallback, useMemo } from "react";
import { useBookingStore } from "@/store/booking-store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Clock } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

export default function TimeStep() {
  const { draftBooking, updateDraft, setStep, settings } = useBookingStore();
  const { t } = useLanguage();

  const shifts = useMemo(() => {
    // Defaults if settings not loaded
    const openTime = settings?.opening_time || "20:00";
    const closeTime = settings?.closing_time || "23:00";
    const gap = settings?.gap_minutes || 15;
    const minAdvance = settings?.min_advance_minutes || 60;

    const slots: string[] = [];
    const [startHour, startMinute] = openTime.split(":").map(Number);
    const [endHour, endMinute] = closeTime.split(":").map(Number);

    const current = new Date();
    current.setHours(startHour, startMinute, 0, 0);

    const end = new Date();
    end.setHours(endHour, endMinute, 0, 0);

    // Current time for advance validation
    const now = new Date();
    // Parse selected date
    const selectedDateStr = draftBooking.date; // YYYY-MM-DD
    let isToday = false;

    if (selectedDateStr) {
      const [y, m, d] = selectedDateStr.split("-").map(Number);
      // Create date object for selected date (at midnight local)
      const selectedDate = new Date(y, m - 1, d);
      const todayMidnight = new Date();
      todayMidnight.setHours(0, 0, 0, 0);
      isToday = selectedDate.getTime() === todayMidnight.getTime();
    }

    while (current < end) {
      const hours = current.getHours().toString().padStart(2, "0");
      const minutes = current.getMinutes().toString().padStart(2, "0");
      const timeString = `${hours}:${minutes}`;

      let isValid = true;
      if (isToday) {
        // Check min advance
        const slotDate = new Date(); // today
        slotDate.setHours(current.getHours(), current.getMinutes(), 0, 0);

        const diffMinutes = (slotDate.getTime() - now.getTime()) / (1000 * 60);
        if (diffMinutes < minAdvance) {
          isValid = false;
        }
      }

      if (isValid) {
        slots.push(timeString);
      }

      current.setMinutes(current.getMinutes() + gap);
    }

    return slots;
  }, [settings, draftBooking.date]);

  const handleSelect = (t: string) => {
    if (draftBooking.timeSlot === t) {
      updateDraft({ timeSlot: undefined });
    } else {
      updateDraft({ timeSlot: t });
    }
  };

  const handleContinue = useCallback(() => {
    if (draftBooking.timeSlot) {
      setStep(4);
    }
  }, [draftBooking.timeSlot, setStep]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && draftBooking.timeSlot) {
        handleContinue();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [draftBooking.timeSlot, handleContinue]);

  return (
    <div className="space-y-6 pt-4">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-light text-white uppercase tracking-wide">
          {t("time.title")}
        </h2>
        <p className="text-white/40 text-sm">{t("time.select_time")}</p>
      </div>

      {shifts.length === 0 ? (
        <div className="text-center p-8 bg-white/5 rounded-xl border border-white/10">
          <p className="text-white/60">{t("time.no_slots")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {shifts.map((t) => {
            const isSelected = draftBooking.timeSlot === t;
            return (
              <button
                key={t}
                onClick={() => handleSelect(t)}
                className={cn(
                  "relative flex items-center justify-center space-x-2 py-3 px-4 rounded-xl border transition-all duration-300",
                  isSelected
                    ? "bg-white border-white text-black"
                    : "bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-white/50",
                )}
              >
                <Clock className={cn("w-4 h-4", isSelected ? "text-black/60" : "text-white/40")} />
                <span className="font-medium tracking-wide">{t}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Footer - Back & Continue */}
      <div className="flex items-center justify-center gap-4 pt-4">
        <button
          onClick={() => setStep(2)}
          className="w-14 h-14 rounded-full bg-white/5 border border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 hover:border-white/50 transition-all"
          aria-label="Volver"
        >
          ←
        </button>
        <Button
          onClick={handleContinue}
          disabled={!draftBooking.timeSlot}
          className="px-16 py-6 bg-white/5 text-white border border-white/20 hover:bg-white hover:text-black hover:border-white transition-all duration-300 uppercase tracking-wider disabled:opacity-30 disabled:hover:bg-white/5 disabled:hover:text-white h-14 rounded-full"
        >
          {t("common.next")}
        </Button>
      </div>
    </div>
  );
}
