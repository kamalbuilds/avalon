"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Bot, Wallet, TrendingUp, Shield, Swords, Eye } from "lucide-react";

interface PersonalityTraits {
  aggression: number;
  loyalty: number;
  greed: number;
  curiosity: number;
  defensiveness: number;
}

interface NPCCardProps {
  name: string;
  archetype: "merchant" | "warrior" | "guardian" | "trickster" | "sage";
  personality: PersonalityTraits;
  reputation: number;
  walletBalance: string;
  level?: number;
  isActive?: boolean;
  className?: string;
}

const archetypeConfig = {
  merchant: { icon: Wallet, color: "text-gold", bg: "bg-gold/10", border: "border-gold/20", glow: "shadow-[0_0_20px_rgba(245,158,11,0.15)]" },
  warrior: { icon: Swords, color: "text-neon-red", bg: "bg-neon-red/10", border: "border-neon-red/20", glow: "shadow-[0_0_20px_rgba(255,23,68,0.15)]" },
  guardian: { icon: Shield, color: "text-neon-cyan", bg: "bg-neon-cyan/10", border: "border-neon-cyan/20", glow: "shadow-[0_0_20px_rgba(0,240,255,0.15)]" },
  trickster: { icon: Eye, color: "text-neon-purple", bg: "bg-neon-purple/10", border: "border-neon-purple/20", glow: "shadow-[0_0_20px_rgba(176,38,255,0.15)]" },
  sage: { icon: TrendingUp, color: "text-neon-green", bg: "bg-neon-green/10", border: "border-neon-green/20", glow: "shadow-[0_0_20px_rgba(57,255,20,0.15)]" },
};

function RadarChart({ traits, color }: { traits: PersonalityTraits; color: string }) {
  const traitEntries = Object.entries(traits) as [string, number][];
  const size = 120;
  const center = size / 2;
  const maxRadius = size / 2 - 15;
  const angleStep = (Math.PI * 2) / traitEntries.length;

  const getPoint = (index: number, value: number) => {
    const angle = angleStep * index - Math.PI / 2;
    const r = maxRadius * value;
    return { x: center + r * Math.cos(angle), y: center + r * Math.sin(angle) };
  };

  const polygonPoints = traitEntries
    .map((_, i) => {
      const p = getPoint(i, traitEntries[i][1]);
      return `${p.x},${p.y}`;
    })
    .join(" ");

  const gridLevels = [0.25, 0.5, 0.75, 1];
  const traitLabels = ["AGG", "LOY", "GRD", "CUR", "DEF"];
  const colorHex = color.includes("gold") ? "#f59e0b"
    : color.includes("red") ? "#FF1744"
    : color.includes("cyan") ? "#00F0FF"
    : color.includes("purple") ? "#B026FF"
    : "#39FF14";

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Grid rings */}
      {gridLevels.map((level) => (
        <polygon
          key={level}
          points={traitEntries
            .map((_, i) => {
              const p = getPoint(i, level);
              return `${p.x},${p.y}`;
            })
            .join(" ")}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="1"
        />
      ))}
      {/* Axis lines */}
      {traitEntries.map((_, i) => {
        const p = getPoint(i, 1);
        return (
          <line key={i} x1={center} y1={center} x2={p.x} y2={p.y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
        );
      })}
      {/* Data polygon */}
      <polygon points={polygonPoints} fill={`${colorHex}20`} stroke={colorHex} strokeWidth="2" />
      {/* Data points */}
      {traitEntries.map((_, i) => {
        const p = getPoint(i, traitEntries[i][1]);
        return <circle key={i} cx={p.x} cy={p.y} r="3" fill={colorHex} />;
      })}
      {/* Labels */}
      {traitEntries.map((_, i) => {
        const p = getPoint(i, 1.25);
        return (
          <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle" fill="rgba(255,255,255,0.4)" fontSize="8" fontFamily="monospace">
            {traitLabels[i]}
          </text>
        );
      })}
    </svg>
  );
}

export function NPCCard({
  name,
  archetype,
  personality,
  reputation,
  walletBalance,
  level = 1,
  isActive = false,
  className,
}: NPCCardProps) {
  const config = archetypeConfig[archetype];
  const Icon = config.icon;

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={cn(
        "relative rounded-xl border bg-card p-5 transition-all duration-300",
        config.border,
        config.glow,
        isActive && "ring-1 ring-neon-green/30",
        className
      )}
      style={{ background: "linear-gradient(135deg, #0f0f18 0%, #151520 100%)" }}
    >
      {/* Active indicator */}
      {isActive && (
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-neon-green animate-pulse" />
          <span className="text-[10px] font-mono text-neon-green">ACTIVE</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start gap-4">
        <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-xl", config.bg)}>
          <Icon className={cn("h-6 w-6", config.color)} />
        </div>
        <div className="min-w-0">
          <h3 className="font-bold text-foreground truncate">{name}</h3>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={cn("text-xs font-medium capitalize", config.color)}>{archetype}</span>
            <span className="text-xs text-muted">Lv.{level}</span>
          </div>
        </div>
      </div>

      {/* Radar Chart */}
      <div className="mt-4 flex items-center justify-center">
        <RadarChart traits={personality} color={config.color} />
      </div>

      {/* Stats */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-surface p-2.5">
          <p className="text-[10px] uppercase tracking-wider text-muted">Reputation</p>
          <div className="mt-1 flex items-center gap-2">
            <div className="h-1.5 flex-1 rounded-full bg-border">
              <div
                className="h-full rounded-full bg-accent transition-all duration-500"
                style={{ width: `${reputation}%` }}
              />
            </div>
            <span className="text-xs font-mono font-bold">{reputation}</span>
          </div>
        </div>
        <div className="rounded-lg bg-surface p-2.5">
          <p className="text-[10px] uppercase tracking-wider text-muted">Wallet</p>
          <p className="mt-1 text-sm font-mono font-bold text-gold">{walletBalance}</p>
        </div>
      </div>

      {/* ERC-8004 badge */}
      <div className="mt-3 flex items-center justify-center gap-1.5 rounded-lg bg-surface py-1.5 text-[10px] font-mono text-muted">
        <Bot className="h-3 w-3" />
        ERC-8004 Autonomous Agent
      </div>
    </motion.div>
  );
}
