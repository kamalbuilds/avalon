"use client";

import { type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { motion, type HTMLMotionProps } from "framer-motion";
import { forwardRef } from "react";

type GlowColor = "cyan" | "red" | "purple" | "green" | "gold" | "magenta";

interface GlowCardProps extends Omit<HTMLMotionProps<"div">, "ref" | "children"> {
  glowColor?: GlowColor;
  intensity?: "subtle" | "medium" | "strong";
  animated?: boolean;
  children?: ReactNode;
}

const glowClasses: Record<GlowColor, { border: string; shadow: string; hoverShadow: string }> = {
  cyan: {
    border: "border-neon-cyan/20",
    shadow: "shadow-[0_0_15px_rgba(0,240,255,0.08)]",
    hoverShadow: "hover:shadow-[0_0_25px_rgba(0,240,255,0.2)] hover:border-neon-cyan/40",
  },
  red: {
    border: "border-avalanche/20",
    shadow: "shadow-[0_0_15px_rgba(232,65,66,0.08)]",
    hoverShadow: "hover:shadow-[0_0_25px_rgba(232,65,66,0.2)] hover:border-avalanche/40",
  },
  purple: {
    border: "border-neon-purple/20",
    shadow: "shadow-[0_0_15px_rgba(176,38,255,0.08)]",
    hoverShadow: "hover:shadow-[0_0_25px_rgba(176,38,255,0.2)] hover:border-neon-purple/40",
  },
  green: {
    border: "border-neon-green/20",
    shadow: "shadow-[0_0_15px_rgba(57,255,20,0.08)]",
    hoverShadow: "hover:shadow-[0_0_25px_rgba(57,255,20,0.2)] hover:border-neon-green/40",
  },
  gold: {
    border: "border-gold/20",
    shadow: "shadow-[0_0_15px_rgba(245,158,11,0.08)]",
    hoverShadow: "hover:shadow-[0_0_25px_rgba(245,158,11,0.2)] hover:border-gold/40",
  },
  magenta: {
    border: "border-neon-magenta/20",
    shadow: "shadow-[0_0_15px_rgba(255,0,229,0.08)]",
    hoverShadow: "hover:shadow-[0_0_25px_rgba(255,0,229,0.2)] hover:border-neon-magenta/40",
  },
};

export const GlowCard = forwardRef<HTMLDivElement, GlowCardProps>(
  ({ glowColor = "cyan", animated = true, className, children, ...props }, ref) => {
    const glow = glowClasses[glowColor];

    return (
      <motion.div
        ref={ref}
        whileHover={animated ? { y: -4, scale: 1.01 } : undefined}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className={cn(
          "relative rounded-xl border bg-card-gradient p-6 transition-all duration-300",
          glow.border,
          glow.shadow,
          glow.hoverShadow,
          className
        )}
        style={{ background: "linear-gradient(135deg, #0f0f18 0%, #151520 100%)" }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

GlowCard.displayName = "GlowCard";
