"use client";

import { useBookingStore } from "@/store/booking-store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import { useRef, useState, useMemo, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

interface BlockedDate {
  blocked_date: string;
  reason?: string;
}

// Helper to generate days based on maxDays limit
const generateDays = (maxDays: number) => {
  const days = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize to midnight local

  for (let i = 0; i < maxDays; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);

    // Manual local YYYY-MM-DD
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const localDateStr = `${year}-${month}-${day}`;

    days.push({
      date: localDateStr,
      day: d.getDate(),
      weekday: d
        .toLocaleDateString("es-ES", { weekday: "short" })
        .replace(".", "")
        .toUpperCase(),
      month: d
        .toLocaleDateString("es-ES", { month: "short" })
        .replace(".", "")
        .toUpperCase(),
      monthIdx: d.getMonth(),
      year: d.getFullYear(),
    });
  }
  return days;
};

export default function DateStep() {
  const { draftBooking, updateDraft, setStep, settings } = useBookingStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [blockedDates, setBlockedDates] = useState<Set<string>>(new Set());
  const [blockedReasons, setBlockedReasons] = useState<Record<string, string>>(
    {},
  );
  const [visibleMonth, setVisibleMonth] = useState("");

  // Use settings or default to 30 days
  const maxAdvanceDays = settings?.max_advance_days || 30;
  const days = useMemo(() => generateDays(maxAdvanceDays), [maxAdvanceDays]);

  // Initialize visible month
  useEffect(() => {
    if (days.length > 0) {
      const targetDay =
        days.find((d) => d.date === draftBooking.date) || days[0];
      const newLabel = `${targetDay.month}. ${targetDay.year}`;
      if (visibleMonth !== newLabel) {
        setVisibleMonth(newLabel);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days, draftBooking.date]);

  // Fetch blocked dates on mount
  useEffect(() => {
    async function fetchBlockedDates() {
      try {
        const supabase = createClient();
        const today = new Date().toISOString().split("T")[0];
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + maxAdvanceDays);

        const { data } = await supabase
          .from("blocked_dates")
          .select("blocked_date, reason")
          .gte("blocked_date", today)
          .lte("blocked_date", futureDate.toISOString().split("T")[0]);

        if (data) {
          const dates = new Set<string>(
            data.map((d: BlockedDate) => d.blocked_date),
          );
          const reasons: Record<string, string> = {};
          data.forEach((d: BlockedDate) => {
            if (d.reason) reasons[d.blocked_date] = d.reason;
          });
          setBlockedDates(dates);
          setBlockedReasons(reasons);
        }
      } catch (err) {
        console.error("Error fetching blocked dates:", err);
      }
    }
    fetchBlockedDates();
  }, [maxAdvanceDays]);

  const handleSelect = (dayStr: string) => {
    // Don't allow selecting blocked dates
    if (blockedDates.has(dayStr)) return;

    // Toggle deselection
    if (draftBooking.date === dayStr) {
      updateDraft({ date: undefined });
    } else {
      updateDraft({ date: dayStr });
    }
  };

  // Native date picker handler for far future dates
  const handleNativeDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value && !blockedDates.has(e.target.value)) {
      handleSelect(e.target.value);
    }
  };

  const handleContinue = useCallback(() => {
    if (draftBooking.date && !blockedDates.has(draftBooking.date)) {
      setStep(3); // To TimeStep
    }
  }, [draftBooking.date, blockedDates, setStep]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "Enter" &&
        draftBooking.date &&
        !blockedDates.has(draftBooking.date)
      ) {
        handleContinue();
      }
    };
    globalThis.addEventListener("keydown", handleKeyDown);
    return () => globalThis.removeEventListener("keydown", handleKeyDown);
  }, [draftBooking.date, blockedDates, handleContinue]);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);

      // Determine visible month based on scroll position
      // Item width approx 68px (56px width + 12px gap)
      const itemWidth = 68;
      const index = Math.round(scrollLeft / itemWidth);
      const visibleDay = days[Math.min(index, days.length - 1)];

      if (visibleDay) {
        const newMonthDisplay = `${visibleDay.month}. ${visibleDay.year}`;
        if (newMonthDisplay !== visibleMonth) {
          setVisibleMonth(newMonthDisplay);
        }
      }
    }
  };

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  // Check if selected date is blocked (edge case if blocked after selection)
  const isSelectedBlocked = Boolean(
    draftBooking.date && blockedDates.has(draftBooking.date),
  );
  
  const getDateButtonClasses = (isBlocked: boolean, isSelected: boolean) => {
    if (isBlocked) return "bg-red-500/10 border-red-500/20 text-red-400/50 cursor-not-allowed line-through";
    if (isSelected) return "bg-white border-white text-black";
    return "bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-white/50";
  };

  const getWeekdayClasses = (isBlocked: boolean, isSelected: boolean) => {
    if (isBlocked) return "text-red-400/40";
    if (isSelected) return "text-black/60";
    return "text-white/50";
  };
  
  const getDayNumberClasses = (isBlocked: boolean, isSelected: boolean) => {
    if (isBlocked) return "text-red-400/50";
    if (isSelected) return "text-black";
    return "text-white";
  };

  return (
    <div className="space-y-6 pt-4">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-light text-white uppercase tracking-wide">
          Seleccionar Fecha
        </h2>
        <p className="text-white/60 text-sm uppercase tracking-wider">
          {visibleMonth}
        </p>
      </div>

      {/* Blocked date warning */}
      {isSelectedBlocked && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <div>
            <p className="text-red-400 font-medium">Fecha no disponible</p>
            <p className="text-red-300/60 text-sm">
              {blockedReasons[draftBooking.date || ""] ||
                "El restaurante está cerrado este día"}
            </p>
          </div>
        </div>
      )}

      {/* Date Scroll Area */}
      <div className="relative w-full">
        {/* Scroll Buttons */}
        {canScrollLeft && (
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-8 h-8 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-black/70 transition-all"
            aria-label="Ver fechas anteriores"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
        {canScrollRight && (
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-8 h-8 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-black/70 transition-all"
            aria-label="Ver más fechas"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

        {/* Scrollable Container */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex gap-3 overflow-x-auto pb-4 px-6 snap-x scroll-smooth scrollbar-hide"
        >
          {days.map((d, idx) => {
            const isSelected = draftBooking.date === d.date;
            const isToday = idx === 0;
            const isBlocked = blockedDates.has(d.date);

            return (
              <button
                key={d.date}
                onClick={() => handleSelect(d.date)}
                disabled={isBlocked}
                title={
                  isBlocked
                    ? blockedReasons[d.date] || "No disponible"
                    : undefined
                }
                className={cn(
                  "flex-shrink-0 flex flex-col items-center justify-center w-14 h-20 rounded-2xl border transition-all duration-300 snap-center",
                  getDateButtonClasses(isBlocked, isSelected),
                  isToday && !isSelected && !isBlocked && "border-white/30",
                )}
              >
                <span
                  className={cn(
                    "text-[10px] uppercase tracking-wider font-medium mb-1",
                    getWeekdayClasses(isBlocked, isSelected)
                  )}
                >
                  {d.weekday}
                </span>
                <span
                  className={cn(
                    "text-xl font-semibold",
                    getDayNumberClasses(isBlocked, isSelected)
                  )}
                >
                  {d.day}
                </span>
                {isToday && !isBlocked && (
                  <span
                    className={cn(
                      "text-[8px] uppercase mt-0.5",
                      isSelected ? "text-black/60" : "text-white/40",
                    )}
                  >
                    Hoy
                  </span>
                )}
                {isBlocked && (
                  <span className="text-[8px] uppercase mt-0.5 text-red-400/60">
                    Cerrado
                  </span>
                )}
              </button>
            );
          })}

          {/* Custom Calendar Picker */}
          <div className="flex-shrink-0 w-14 h-20 relative">
            <input
              type="date"
              onChange={handleNativeDateChange}
              className="absolute inset-0 opacity-0 z-20 cursor-pointer"
              aria-label="Seleccionar otra fecha"
              min={new Date().toISOString().split("T")[0]}
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/50 hover:bg-white/10 hover:border-white/30 transition-all">
              {/* Minimal calendar icon represented by dots pattern or just '...' */}
              <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center mb-1">
                <ChevronRight className="w-4 h-4" />
              </div>
              <span className="text-[9px] uppercase tracking-wider">Más</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer - Back & Continue */}
      <div className="flex items-center justify-center gap-4 pt-4">
        <button
          onClick={() => setStep(1)}
          className="w-14 h-14 rounded-full bg-white/5 border border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 hover:border-white/50 transition-all"
          aria-label="Volver"
        >
          ←
        </button>
        <Button
          onClick={handleContinue}
          disabled={!draftBooking.date || isSelectedBlocked}
          className="px-16 py-6 bg-white/5 text-white border border-white/20 hover:bg-white hover:text-black hover:border-white transition-all duration-300 uppercase tracking-wider disabled:opacity-30 disabled:hover:bg-white/5 disabled:hover:text-white h-14 rounded-full"
        >
          Continuar
        </Button>
      </div>
    </div>
  );
}
