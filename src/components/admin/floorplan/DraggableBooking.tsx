"use client";

import { memo } from "react";
import { Draggable } from "@/components/ui/draggable";
import { Users, Clock, GripVertical } from "lucide-react";

interface Booking {
  id: string;
  customer_name: string;
  pax: number;
  booking_time: string;
}

interface DraggableBookingProps {
  readonly booking: Booking;
}

export const DraggableBooking = memo(function DraggableBooking({ booking }: DraggableBookingProps) {
  return (
    <Draggable
      id={booking.id}
      data={{ type: "booking", booking }}
    >
      {({ isDragging }) => (
        <div
          className={`
            relative group p-3 rounded-xl border transition-all cursor-grab active:cursor-grabbing
            ${
              isDragging
                ? "bg-blue-600 border-blue-500 shadow-2xl scale-105 opacity-90"
                : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
            }
          `}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white/5 text-white/40 group-hover:text-white transition-colors">
              <GripVertical className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {booking.customer_name}
              </p>
              <div className="flex items-center gap-3 text-xs text-white/50 mt-1">
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  <span>{booking.pax}p</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{booking.booking_time}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
});
