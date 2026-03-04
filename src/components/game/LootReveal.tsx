"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ExternalLink, X, Sparkles } from "lucide-react";

type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

interface LootItem {
  name: string;
  rarity: Rarity;
  icon: string; // emoji
  description: string;
}

interface LootRevealProps {
  isOpen: boolean;
  onClose: () => void;
  item: LootItem | null;
  vrfRequestId?: string;
  vrfProofUrl?: string;
}

const rarityConfig: Record<Rarity, { color: string; glow: string; bg: string; label: string; particles: string[] }> = {
  common: {
    color: "text-[#9CA3AF]",
    glow: "0 0 30px rgba(156,163,175,0.3)",
    bg: "from-[#9CA3AF]/10 to-transparent",
    label: "Common",
    particles: ["#9CA3AF", "#6B7280", "#D1D5DB"],
  },
  uncommon: {
    color: "text-[#22C55E]",
    glow: "0 0 40px rgba(34,197,94,0.4)",
    bg: "from-[#22C55E]/10 to-transparent",
    label: "Uncommon",
    particles: ["#22C55E", "#16A34A", "#4ADE80"],
  },
  rare: {
    color: "text-[#3B82F6]",
    glow: "0 0 50px rgba(59,130,246,0.5)",
    bg: "from-[#3B82F6]/10 to-transparent",
    label: "Rare",
    particles: ["#3B82F6", "#2563EB", "#60A5FA"],
  },
  epic: {
    color: "text-[#A855F7]",
    glow: "0 0 60px rgba(168,85,247,0.5), 0 0 120px rgba(168,85,247,0.2)",
    bg: "from-[#A855F7]/15 to-transparent",
    label: "Epic",
    particles: ["#A855F7", "#9333EA", "#C084FC"],
  },
  legendary: {
    color: "text-[#F59E0B]",
    glow: "0 0 80px rgba(245,158,11,0.6), 0 0 160px rgba(245,158,11,0.3)",
    bg: "from-[#F59E0B]/20 to-transparent",
    label: "Legendary",
    particles: ["#F59E0B", "#D97706", "#FBBF24", "#FDE68A"],
  },
};

function RevealParticles({ rarity }: { rarity: Rarity }) {
  const config = rarityConfig[rarity];
  const particleCount = rarity === "legendary" ? 30 : rarity === "epic" ? 20 : 12;

  return (
    <>
      {Array.from({ length: particleCount }).map((_, i) => {
        const angle = (Math.PI * 2 * i) / particleCount;
        const distance = 80 + Math.random() * 120;
        const size = Math.random() * 6 + 2;
        const color = config.particles[Math.floor(Math.random() * config.particles.length)];

        return (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: size,
              height: size,
              backgroundColor: color,
              boxShadow: `0 0 ${size * 3}px ${color}`,
              left: "50%",
              top: "50%",
            }}
            initial={{ opacity: 0, x: 0, y: 0, scale: 0 }}
            animate={{
              opacity: [0, 1, 1, 0],
              x: Math.cos(angle) * distance,
              y: Math.sin(angle) * distance,
              scale: [0, 1.5, 1, 0],
            }}
            transition={{
              duration: 1.5,
              delay: 0.3 + Math.random() * 0.3,
              ease: "easeOut",
            }}
          />
        );
      })}
    </>
  );
}

export function LootReveal({ isOpen, onClose, item, vrfRequestId, vrfProofUrl }: LootRevealProps) {
  const [phase, setPhase] = useState<"chest" | "opening" | "reveal">("chest");

  useEffect(() => {
    if (isOpen && item) {
      setPhase("chest");
      const t1 = setTimeout(() => setPhase("opening"), 800);
      const t2 = setTimeout(() => setPhase("reveal"), 1800);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, [isOpen, item]);

  if (!item) return null;
  const config = rarityConfig[item.rarity];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={phase === "reveal" ? onClose : undefined}
          />

          <div className="relative flex flex-col items-center">
            {/* Chest phase */}
            <AnimatePresence mode="wait">
              {phase === "chest" && (
                <motion.div
                  key="chest"
                  className="text-8xl"
                  initial={{ scale: 0, rotate: -10 }}
                  animate={{ scale: 1, rotate: [0, -3, 3, -1, 0] }}
                  exit={{ scale: 1.2, opacity: 0 }}
                  transition={{ duration: 0.6, ease: "backOut" }}
                >
                  🎁
                </motion.div>
              )}

              {phase === "opening" && (
                <motion.div
                  key="opening"
                  className="relative text-8xl"
                  animate={{
                    scale: [1, 1.1, 1.2, 1.3],
                    rotate: [0, -5, 5, -8, 8, 0],
                  }}
                  transition={{ duration: 1, ease: "easeInOut" }}
                >
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{ boxShadow: config.glow }}
                    animate={{ scale: [1, 2, 3], opacity: [0.5, 0.8, 0] }}
                    transition={{ duration: 1 }}
                  />
                  ✨
                </motion.div>
              )}

              {phase === "reveal" && (
                <motion.div
                  key="reveal"
                  className="relative flex flex-col items-center"
                  initial={{ scale: 0, y: 40 }}
                  animate={{ scale: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                >
                  {/* Burst particles */}
                  <div className="absolute inset-0">
                    <RevealParticles rarity={item.rarity} />
                  </div>

                  {/* Item icon */}
                  <motion.div
                    className="relative text-7xl"
                    style={{ filter: `drop-shadow(${config.glow})` }}
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    {item.icon}
                  </motion.div>

                  {/* Rarity badge */}
                  <motion.div
                    className={cn("mt-4 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest", config.color)}
                    style={{
                      background: `linear-gradient(135deg, ${config.particles[0]}15, transparent)`,
                      border: `1px solid ${config.particles[0]}30`,
                    }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    {config.label}
                  </motion.div>

                  {/* Item name */}
                  <motion.h3
                    className={cn("mt-3 text-2xl font-black", config.color)}
                    style={{ textShadow: config.glow }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    {item.name}
                  </motion.h3>

                  {/* Description */}
                  <motion.p
                    className="mt-2 max-w-xs text-center text-sm text-muted"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    {item.description}
                  </motion.p>

                  {/* VRF proof */}
                  {vrfRequestId && (
                    <motion.div
                      className="mt-4 flex items-center gap-2 rounded-lg bg-surface px-3 py-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      <Sparkles className="h-3.5 w-3.5 text-neon-cyan" />
                      <span className="text-xs font-mono text-muted">
                        VRF: {vrfRequestId.slice(0, 8)}...{vrfRequestId.slice(-6)}
                      </span>
                      {vrfProofUrl && (
                        <a href={vrfProofUrl} target="_blank" rel="noopener noreferrer" className="text-neon-cyan hover:text-neon-cyan/80">
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </motion.div>
                  )}

                  {/* Close hint */}
                  <motion.button
                    onClick={onClose}
                    className="mt-6 flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm text-muted transition-colors hover:text-foreground hover:border-accent/30 cursor-pointer"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                  >
                    <X className="h-3.5 w-3.5" />
                    Close
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
