"use client";

import { memo } from "react";
import { Droppable } from "@/components/ui/droppable";
import { Users } from "lucide-react";
import type { CSSProperties } from "react";

interface Table {
  id: string;
  name: string;
  seats: number;
  shape: "rectangle" | "circle" | "square";
  width: number;
  height: number;
  position_x: number;
  position_y: number;
  rotation: number;
}

interface Booking {
  id: string;
  customer_name: string;
  pax: number;
  booking_time: string;
}

interface DroppableTableProps {
  readonly table: Table;
  readonly booking?: Booking | null;
  readonly onRemoveBooking: (bookingId: string) => void;
}

export const DroppableTable = memo(function DroppableTable({
  table,
  booking,
  onRemoveBooking,
}: DroppableTableProps) {
  const isOccupied = !!booking;

  const tableStyle = {
    "--x": `${table.position_x}px`,
    "--y": `${table.position_y}px`,
    "--w": `${table.width}px`,
    "--h": `${table.height}px`,
    "--r": `${table.rotation}deg`,
  } as CSSProperties;

  const getShapeClasses = (shape: string) => {
    switch (shape) {
      case "circle":
        return "rounded-full";
      case "rectangle":
      case "square":
      default:
        return "rounded-xl";
    }
  };

  return (
    <Droppable
      id={table.id}
      data={{ type: "table", table }}
      disabled={isOccupied}
      className="absolute"
    >
      {({ isOver }) => {
        const getStatusClasses = () => {
          if (isOccupied) return "border-red-500/50 bg-red-500/10 hover:bg-red-500/20 cursor-not-allowed";
          if (isOver) return "border-blue-500 bg-blue-500/30 scale-105 shadow-[0_0_30px_rgba(59,130,246,0.5)] z-10";
          return "border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10 cursor-pointer";
        };

        return (
          <div
            {...{ style: tableStyle }}
            className={`
              absolute flex flex-col items-center justify-center transition-all duration-200
              border-2 backdrop-blur-sm
              left-[var(--x)] top-[var(--y)] w-[var(--w)] h-[var(--h)] rotate-[var(--r)]
              ${getShapeClasses(table.shape)}
              ${getStatusClasses()}
            `}
          >
            {isOccupied && booking ? (
              <button
                type="button"
                className="w-full h-full flex flex-col items-center justify-center cursor-pointer p-2 outline-none focus:ring-2 focus:ring-red-500/50 rounded-[inherit]"
                onClick={() => {
                  if (confirm(`¿Liberar mesa ${table.name}? (${booking.customer_name})`)) {
                    onRemoveBooking(booking.id);
                  }
                }}
                title={`Ocupado por ${booking.customer_name} - Click para liberar`}
              >
                <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center mb-1">
                  <Users className="w-3 h-3 text-red-400" />
                </div>
                <span className="text-[10px] uppercase font-bold text-red-200 truncate w-full px-1">
                  {booking.customer_name.split(" ")[0]}
                </span>
                <span className="text-[9px] text-red-200/60 font-medium">
                  {booking.pax}p • {booking.booking_time}
                </span>
              </button>
            ) : (
              <div className="text-center group pointer-events-none">
                <span className={`block font-bold text-sm mb-0.5 ${isOver ? "text-blue-200" : "text-white/60 group-hover:text-white"}`}>
                  {table.name}
                </span>
                <span className={`text-[10px] uppercase tracking-wider ${isOver ? "text-blue-300/60" : "text-white/30"}`}>
                  {table.seats} PAX
                </span>
              </div>
            )}
          </div>
        );
      }}
    </Droppable>
  );
});
