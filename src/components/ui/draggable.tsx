"use client";

import React from "react";
import { useDraggable, UseDraggableArguments } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";

interface DraggableProps {
  id: string;
  data?: UseDraggableArguments["data"];
  children: React.ReactNode | ((args: { isDragging: boolean }) => React.ReactNode);
  className?: string;
  disabled?: boolean;
}

export function Draggable({
  id,
  data,
  children,
  className,
  disabled = false,
}: DraggableProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id,
      data,
      disabled,
    });

  // We must use inline styles for performant drag and drop transforms
  // The linter warning is suppressed because this is a specific requirement for dnd-kit
  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(className, isDragging ? "z-50" : "")}
    >
      {typeof children === "function" ? children({ isDragging }) : children}
    </div>
  );
}
