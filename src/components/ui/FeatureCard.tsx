"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { type LucideIcon } from "lucide-react";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  color?: "cyan" | "red" | "purple" | "green" | "gold" | "magenta";
  className?: string;
  index?: number;
}

const colorMap = {
  cyan: {
    iconBg: "bg-neon-cyan/10",
    iconColor: "text-neon-cyan",
    borderHover: "hover:border-neon-cyan/30",
    glowHover: "hover:shadow-[0_0_30px_rgba(0,240,255,0.08)]",
  },
  red: {
    iconBg: "bg-avalanche/10",
    iconColor: "text-avalanche",
    borderHover: "hover:border-avalanche/30",
    glowHover: "hover:shadow-[0_0_30px_rgba(232,65,66,0.08)]",
  },
  purple: {
    iconBg: "bg-neon-purple/10",
    iconColor: "text-neon-purple",
    borderHover: "hover:border-neon-purple/30",
    glowHover: "hover:shadow-[0_0_30px_rgba(176,38,255,0.08)]",
  },
  green: {
    iconBg: "bg-neon-green/10",
    iconColor: "text-neon-green",
    borderHover: "hover:border-neon-green/30",
    glowHover: "hover:shadow-[0_0_30px_rgba(57,255,20,0.08)]",
  },
  gold: {
    iconBg: "bg-gold/10",
    iconColor: "text-gold",
    borderHover: "hover:border-gold/30",
    glowHover: "hover:shadow-[0_0_30px_rgba(245,158,11,0.08)]",
  },
  magenta: {
    iconBg: "bg-neon-magenta/10",
    iconColor: "text-neon-magenta",
    borderHover: "hover:border-neon-magenta/30",
    glowHover: "hover:shadow-[0_0_30px_rgba(255,0,229,0.08)]",
  },
};

export function FeatureCard({
  icon: Icon,
  title,
  description,
  color = "cyan",
  className,
  index = 0,
}: FeatureCardProps) {
  const c = colorMap[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay: index * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -5 }}
      className={cn(
        "group relative rounded-xl border border-border bg-card p-6 transition-all duration-300",
        c.borderHover,
        c.glowHover,
        className
      )}
      style={{ background: "linear-gradient(135deg, #0f0f18 0%, #151520 100%)" }}
    >
      {/* Subtle top-line accent */}
      <div
        className={cn(
          "absolute top-0 left-6 right-6 h-px opacity-0 transition-opacity duration-300 group-hover:opacity-100",
          color === "cyan" && "bg-gradient-to-r from-transparent via-neon-cyan to-transparent",
          color === "red" && "bg-gradient-to-r from-transparent via-avalanche to-transparent",
          color === "purple" && "bg-gradient-to-r from-transparent via-neon-purple to-transparent",
          color === "green" && "bg-gradient-to-r from-transparent via-neon-green to-transparent",
          color === "gold" && "bg-gradient-to-r from-transparent via-gold to-transparent",
          color === "magenta" && "bg-gradient-to-r from-transparent via-neon-magenta to-transparent"
        )}
      />

      <div className={cn("mb-4 flex h-12 w-12 items-center justify-center rounded-xl", c.iconBg)}>
        <Icon className={cn("h-6 w-6", c.iconColor)} />
      </div>

      <h3 className="text-lg font-bold text-foreground">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted">{description}</p>
    </motion.div>
  );
}
