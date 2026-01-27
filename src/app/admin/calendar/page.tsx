"use client";

import nextDynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

export const dynamic = "force-dynamic";

// Use dynamic import with ssr: false to avoid FullCalendar SSR issues
const CalendarView = nextDynamic(
  () => import("@/components/admin/calendar/CalendarView"),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-white/40 animate-spin" />
      </div>
    ),
  },
);

export default function CalendarPage() {
  return <CalendarView />;
}
