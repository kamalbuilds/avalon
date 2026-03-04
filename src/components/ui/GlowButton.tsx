"use client";

import { type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { motion, type HTMLMotionProps } from "framer-motion";
import { forwardRef } from "react";

type GlowVariant = "primary" | "avalanche" | "cyan" | "purple" | "green" | "ghost";
type ButtonSize = "sm" | "md" | "lg" | "xl";

interface GlowButtonProps extends Omit<HTMLMotionProps<"button">, "ref" | "children"> {
  variant?: GlowVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  icon?: ReactNode;
  children?: ReactNode;
}

const variantStyles: Record<GlowVariant, string> = {
  primary:
    "bg-gradient-to-r from-accent to-accent-hover text-white shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_35px_rgba(99,102,241,0.5)]",
  avalanche:
    "bg-gradient-to-r from-avalanche to-neon-purple text-white shadow-[0_0_20px_rgba(232,65,66,0.3)] hover:shadow-[0_0_35px_rgba(232,65,66,0.5)]",
  cyan:
    "bg-gradient-to-r from-neon-cyan to-primary-dim text-black shadow-[0_0_20px_rgba(0,240,255,0.3)] hover:shadow-[0_0_35px_rgba(0,240,255,0.5)]",
  purple:
    "bg-gradient-to-r from-neon-purple to-neon-magenta text-white shadow-[0_0_20px_rgba(176,38,255,0.3)] hover:shadow-[0_0_35px_rgba(176,38,255,0.5)]",
  green:
    "bg-gradient-to-r from-neon-green/80 to-neon-cyan/80 text-black shadow-[0_0_20px_rgba(57,255,20,0.2)] hover:shadow-[0_0_35px_rgba(57,255,20,0.4)]",
  ghost:
    "bg-transparent border border-border text-muted-foreground hover:text-foreground hover:border-accent/50 hover:bg-card",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs gap-1.5",
  md: "px-4 py-2 text-sm gap-2",
  lg: "px-6 py-3 text-base gap-2",
  xl: "px-8 py-4 text-lg gap-3",
};

export const GlowButton = forwardRef<HTMLButtonElement, GlowButtonProps>(
  ({ variant = "primary", size = "md", isLoading, icon, className, children, disabled, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        className={cn(
          "relative inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-300 cursor-pointer",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : icon ? (
          icon
        ) : null}
        {children}
      </motion.button>
    );
  }
);

GlowButton.displayName = "GlowButton";
