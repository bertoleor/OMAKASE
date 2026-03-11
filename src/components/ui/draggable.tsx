"use client";

import React from "react";
import { useDraggable, UseDraggableArguments } from "@dnd-kit/core";
import { cn } from "@/lib/utils";

interface DraggableProps {
  readonly id: string;
  readonly data?: UseDraggableArguments["data"];
  readonly children: React.ReactNode | ((args: { isDragging: boolean }) => React.ReactNode);
  readonly className?: string;
  readonly disabled?: boolean;
}

export function Draggable({
  id,
  data,
  children,
  className,
  disabled = false,
}: Readonly<DraggableProps>) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id,
      data,
      disabled,
    });

  // We must use inline styles for performant drag and drop transforms
  // The linter warning is suppressed because this is a specific requirement for dnd-kit
  const style = {
    "--drag-x": transform ? `${transform.x}px` : "0px",
    "--drag-y": transform ? `${transform.y}px` : "0px",
  } as React.CSSProperties;

  return (
    <div
      ref={setNodeRef}
      {...{ style }}
      {...listeners}
      {...attributes}
      className={cn(
        className,
        isDragging ? "z-50" : "",
        "translate-x-[var(--drag-x)] translate-y-[var(--drag-y)]"
      )}
    >
      {typeof children === "function" ? children({ isDragging }) : children}
    </div>
  );
}
