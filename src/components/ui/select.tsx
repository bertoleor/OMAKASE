import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

// Simplified Select for now to avoid Radix dependency complexity if not installed.
// Will behave as a styled native select which is more robust for minimal setups, 
// OR a custom div-based one if interaction is needed. 
// Given the "Senior" requirement, native select is often uglier but accessible. 
// Let's make a beautiful native wrapper first to ensure compatibility.

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div className="relative w-full">
        <select
          className={cn(
            "flex h-12 w-full appearance-none rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white shadow-sm transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30 disabled:cursor-not-allowed disabled:opacity-50 hover:bg-black/30 hover:border-white/20",
            className
          )}
          ref={ref}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50 pointer-events-none" />
      </div>
    );
  }
);
Select.displayName = "Select";

export { Select };
