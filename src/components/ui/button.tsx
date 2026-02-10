import * as React from "react";

import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30 disabled:pointer-events-none disabled:opacity-50 active:scale-95",
  {
    variants: {
      variant: {
        default: "bg-white text-black shadow hover:bg-white/90",
        glass:
          "bg-white/10 text-white backdrop-blur-md border border-white/10 hover:bg-white/20 hover:border-white/20 shadow-lg",
        outline:
          "border border-white/20 bg-transparent shadow-sm hover:bg-white/10 text-white",
        ghost: "hover:bg-white/10 text-white",
        link: "text-white underline-offset-4 hover:underline",
      },
      size: {
        default: "h-12 px-6 py-2", // Taller for luxury feel
        sm: "h-9 rounded-lg px-3 text-xs",
        lg: "h-14 rounded-2xl px-10 text-base",
        icon: "h-10 w-10",
        round: "h-16 w-16 rounded-full p-0 flex flex-col gap-1", // Custom for quantity
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  ),
);
Button.displayName = "Button";

export { Button, buttonVariants };
