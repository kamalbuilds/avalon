"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  angle: number;
  speed: number;
  lifetime: number;
}

interface ParticleEffectProps {
  trigger: number; // increment to trigger burst
  x: number;
  y: number;
  count?: number;
  colors?: string[];
  type?: "burst" | "sparkle" | "impact";
}

export function ParticleEffect({
  trigger,
  x,
  y,
  count = 12,
  colors = ["#FF1744", "#FF6B00", "#FFE600"],
  type = "burst",
}: ParticleEffectProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (trigger === 0) return;
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      newParticles.push({
        id: Date.now() + i,
        x,
        y,
        size: type === "sparkle" ? Math.random() * 4 + 2 : Math.random() * 6 + 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        angle,
        speed: type === "impact" ? Math.random() * 100 + 60 : Math.random() * 80 + 40,
        lifetime: type === "sparkle" ? 1.5 : 0.8,
      });
    }
    setParticles(newParticles);
    const timer = setTimeout(() => setParticles([]), 1500);
    return () => clearTimeout(timer);
  }, [trigger, x, y, count, colors, type]);

  return (
    <AnimatePresence>
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="pointer-events-none absolute z-40 rounded-full"
          style={{
            left: p.x,
            top: p.y,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
          }}
          initial={{ opacity: 1, scale: 1 }}
          animate={{
            opacity: [1, 0.8, 0],
            scale: [1, 0.5],
            x: Math.cos(p.angle) * p.speed,
            y: Math.sin(p.angle) * p.speed,
          }}
          exit={{ opacity: 0 }}
          transition={{ duration: p.lifetime, ease: "easeOut" }}
        />
      ))}
    </AnimatePresence>
  );
}
