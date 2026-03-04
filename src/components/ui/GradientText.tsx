"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

type GradientPreset = "cyan-purple" | "red-orange" | "green-cyan" | "rainbow" | "gold" | "avalanche";

interface GradientTextProps {
  children: React.ReactNode;
  gradient?: GradientPreset;
  className?: string;
  animated?: boolean;
  as?: "span" | "h1" | "h2" | "h3" | "h4" | "p";
}

const gradientMap: Record<GradientPreset, string> = {
  "cyan-purple": "from-neon-cyan via-neon-purple to-neon-magenta",
  "red-orange": "from-avalanche via-neon-orange to-gold",
  "green-cyan": "from-neon-green via-neon-cyan to-accent",
  rainbow: "from-neon-cyan via-neon-purple to-avalanche",
  gold: "from-gold via-neon-yellow to-neon-orange",
  avalanche: "from-avalanche via-neon-red to-neon-orange",
};

export function GradientText({
  children,
  gradient = "cyan-purple",
  className,
  animated = false,
  as: Tag = "span",
}: GradientTextProps) {
  const gradientClass = gradientMap[gradient];

  if (animated) {
    return (
      <motion.span
        className={cn(
          "bg-gradient-to-r bg-clip-text text-transparent",
          gradientClass,
          "animate-shimmer bg-[length:200%_100%]",
          className
        )}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        {children}
      </motion.span>
    );
  }

  return (
    <Tag
      className={cn(
        "bg-gradient-to-r bg-clip-text text-transparent",
        gradientClass,
        className
      )}
    >
      {children}
    </Tag>
  );
}
