"use client";

import React from "react";
import { useDroppable, UseDroppableArguments } from "@dnd-kit/core";
import { cn } from "@/lib/utils";

interface DroppableProps {
  readonly id: string;
  readonly data?: UseDroppableArguments["data"];
  readonly children: React.ReactNode | ((args: { isOver: boolean }) => React.ReactNode);
  readonly className?: string;
  readonly disabled?: boolean;
}

export function Droppable({
  id,
  data,
  children,
  className,
  disabled = false,
}: Readonly<DroppableProps>) {
  const { isOver, setNodeRef } = useDroppable({
    id,
    data,
    disabled,
  });

  return (
    <div ref={setNodeRef} className={cn(className)}>
      {typeof children === "function" ? children({ isOver }) : children}
    </div>
  );
}
