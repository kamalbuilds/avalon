"use client";

import { motion, AnimatePresence } from "framer-motion";

interface DamagePopupProps {
  damages: Array<{
    id: string;
    value: number;
    x: number;
    y: number;
    isCritical?: boolean;
    isHeal?: boolean;
    isBlock?: boolean;
  }>;
}

export function DamagePopup({ damages }: DamagePopupProps) {
  return (
    <AnimatePresence>
      {damages.map((dmg) => (
        <motion.div
          key={dmg.id}
          className="pointer-events-none absolute z-50"
          style={{ left: dmg.x, top: dmg.y }}
          initial={{ opacity: 1, y: 0, scale: 0.5 }}
          animate={{
            opacity: [1, 1, 0],
            y: -80,
            scale: dmg.isCritical ? [0.5, 1.4, 1.2] : [0.5, 1.1, 1],
            x: Math.random() * 40 - 20,
          }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        >
          <span
            className={`font-mono font-black text-2xl ${
              dmg.isBlock
                ? "text-accent"
                : dmg.isHeal
                ? "text-neon-green"
                : dmg.isCritical
                ? "text-neon-yellow text-3xl"
                : "text-neon-red"
            }`}
            style={{
              textShadow: dmg.isCritical
                ? "0 0 20px #FFE600, 0 0 40px #FFE60080"
                : dmg.isBlock
                ? "0 0 15px #818cf8, 0 0 30px #818cf880"
                : dmg.isHeal
                ? "0 0 15px #39FF14, 0 0 30px #39FF1480"
                : "0 0 15px #FF1744, 0 0 30px #FF174480",
            }}
          >
            {dmg.isBlock ? "BLOCKED" : dmg.isHeal ? `+${dmg.value}` : `-${dmg.value}`}
            {dmg.isCritical && " CRIT!"}
          </span>
        </motion.div>
      ))}
    </AnimatePresence>
  );
}
