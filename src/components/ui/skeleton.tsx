/**
 * Skeleton Loading Components
 * 
 * Provides consistent loading states across the application.
 * Uses the project's design system colors.
 */

import { cn } from "@/lib/utils";

/**
 * Base skeleton props
 */
interface SkeletonProps {
  /** Additional CSS classes */
  className?: string;
}

/**
 * Animated skeleton component with shimmer animation
 */
export function Skeleton({ className }: Readonly<SkeletonProps>) {
  return (
    <div
      className={cn(
        "rounded-md bg-white/10 animate-pulse",
        className
      )}
    />
  );
}

/**
 * Card skeleton for reservation cards
 */
export function CardSkeleton({ className }: Readonly<SkeletonProps>) {
  return (
    <div className={cn("bg-black/40 backdrop-blur-md rounded-2xl p-4 border border-white/10", className)}>
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-5 w-16" />
      </div>
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-12" />
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-white/10">
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}

/**
 * Table row skeleton
 */
export function TableRowSkeleton({ columns = 4, className }: Readonly<{ columns?: number } & SkeletonProps>) {
  return (
    <tr className={cn("border-b border-white/5", className)}>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={`col-${i}`} className="py-4 px-4">
          <Skeleton className="h-4 w-full max-w-[120px]" />
        </td>
      ))}
    </tr>
  );
}

/**
 * Data table skeleton
 */
export function TableSkeleton({
  rows = 5,
  columns = 4,
  className,
}: Readonly<{
  rows?: number;
  columns?: number;
} & SkeletonProps>) {
  return (
    <div className={cn("rounded-lg border border-white/10 overflow-hidden", className)}>
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/10">
            {Array.from({ length: columns }).map((_, i) => (
              <th key={`header-${i}`} className="py-3 px-4 text-left">
                <Skeleton className="h-4 w-20" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <TableRowSkeleton key={`row-${i}`} columns={columns} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Button skeleton
 */
export function ButtonSkeleton({ className }: Readonly<SkeletonProps>) {
  return (
    <Skeleton className={cn("h-10 w-24 rounded-lg", className)} />
  );
}

/**
 * Input skeleton
 */
export function InputSkeleton({ className }: Readonly<SkeletonProps>) {
  return (
    <Skeleton className={cn("h-10 w-full rounded-md", className)} />
  );
}

/**
 * Form skeleton with multiple inputs
 */
export function FormSkeleton({
  fields = 3,
  includeButton = true,
  className,
}: Readonly<{
  fields?: number;
  includeButton?: boolean;
} & SkeletonProps>) {
  return (
    <div className={cn("space-y-4", className)}>
      {Array.from({ length: fields }).map((_, i) => (
        <div key={`field-${i}`}>
          <Skeleton className="h-4 w-16 mb-2" />
          <InputSkeleton />
        </div>
      ))}
      {includeButton && (
        <div className="pt-2">
          <ButtonSkeleton className="w-full" />
        </div>
      )}
    </div>
  );
}

/**
 * KPI Card skeleton for dashboard
 */
export function KPICardSkeleton({ className }: Readonly<SkeletonProps>) {
  return (
    <div className={cn("bg-black/40 backdrop-blur-md rounded-xl p-6 border border-white/10", className)}>
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      <Skeleton className="h-8 w-16 mb-2" />
      <Skeleton className="h-3 w-24" />
    </div>
  );
}

/**
 * Dashboard grid skeleton
 */
export function DashboardSkeleton({ className }: Readonly<SkeletonProps>) {
  return (
    <div className={cn("grid gap-4 md:grid-cols-2 lg:grid-cols-4", className)}>
      <KPICardSkeleton />
      <KPICardSkeleton />
      <KPICardSkeleton />
      <KPICardSkeleton />
    </div>
  );
}

/**
 * Booking wizard step skeleton
 */
export function WizardStepSkeleton({ className }: Readonly<SkeletonProps>) {
  return (
    <div className={cn("space-y-6", className)}>
      <div className="text-center">
        <Skeleton className="h-8 w-64 mx-auto mb-2" />
        <Skeleton className="h-4 w-96 mx-auto" />
      </div>
      <FormSkeleton fields={4} />
    </div>
  );
}

/**
 * Calendar skeleton
 */
export function CalendarSkeleton({ className }: Readonly<SkeletonProps>) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 35 }).map((_, i) => (
          <Skeleton key={`day-${i}`} className="h-10 w-10" />
        ))}
      </div>
    </div>
  );
}

/**
 * Timeline skeleton for service timeline
 */
export function TimelineSkeleton({ items = 5, className }: Readonly<{ items?: number } & SkeletonProps>) {
  return (
    <div className={cn("space-y-4", className)}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={`timeline-${i}`} className="flex gap-4">
          <div className="flex flex-col items-center">
            <Skeleton className="h-3 w-3 rounded-full" />
            <Skeleton className="h-8 w-px my-1" />
          </div>
          <div className="flex-1">
            <Skeleton className="h-4 w-32 mb-1" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Detail view skeleton
 */
export function DetailSkeleton({ className }: Readonly<SkeletonProps>) {
  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-6 w-20" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={`detail-${i}`}>
            <Skeleton className="h-3 w-24 mb-1" />
            <Skeleton className="h-5 w-40" />
          </div>
        ))}
      </div>
      <div className="pt-4 border-t border-white/10">
        <Skeleton className="h-4 w-20 mb-2" />
        <Skeleton className="h-20 w-full" />
      </div>
    </div>
  );
}

/**
 * List skeleton for reservations list
 */
export function ReservationListSkeleton({
  items = 5,
  className,
}: Readonly<{
  items?: number;
} & SkeletonProps>) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: items }).map((_, i) => (
        <CardSkeleton key={`reservation-${i}`} />
      ))}
    </div>
  );
}
