'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChronosStore } from '@/stores/chronosStore';

const RARITY_COLORS: Record<string, { color: string; glow: string; bg: string }> = {
  common: { color: '#9CA3AF', glow: 'rgba(156, 163, 175, 0.3)', bg: 'rgba(156, 163, 175, 0.1)' },
  uncommon: { color: '#22C55E', glow: 'rgba(34, 197, 94, 0.3)', bg: 'rgba(34, 197, 94, 0.1)' },
  rare: { color: '#3B82F6', glow: 'rgba(59, 130, 246, 0.3)', bg: 'rgba(59, 130, 246, 0.1)' },
  epic: { color: '#A855F7', glow: 'rgba(168, 85, 247, 0.4)', bg: 'rgba(168, 85, 247, 0.1)' },
  legendary: { color: '#F59E0B', glow: 'rgba(245, 158, 11, 0.5)', bg: 'rgba(245, 158, 11, 0.15)' },
};

const FALLBACK_LOOT = {
  name: 'Scrap Metal',
  rarity: 'common' as const,
  icon: '\uD83D\uDD29',
  description: 'A fragment of discarded armor. Worth something to the right trader.',
  value: 0.10,
};

export function LootReveal() {
  const storeLootDrop = useChronosStore(s => s.lootDrop);
  const vrfRequestId = useChronosStore(s => s.vrfRequestId);
  const returnToLobby = useChronosStore(s => s.returnToLobby);
  const startMatch = useChronosStore(s => s.startMatch);
  const screen = useChronosStore(s => s.screen);
  const [isOpened, setIsOpened] = useState(false);

  if (screen !== 'loot_reveal') return null;

  // Use store loot or fallback common item
  const lootDrop = storeLootDrop ?? FALLBACK_LOOT;

  const rarity = RARITY_COLORS[lootDrop.rarity] || RARITY_COLORS.common;
  const isLegendary = lootDrop.rarity === 'legendary';
  const isEpic = lootDrop.rarity === 'epic';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm"
    >
      <div className="flex flex-col items-center gap-6 max-w-sm mx-4">
        {/* Title */}
        <motion.h2
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-2xl font-bold text-neon-yellow"
          style={{ textShadow: '0 0 20px rgba(255, 230, 0, 0.5)' }}
        >
          VRF LOOT DROP
        </motion.h2>

        {/* Chest / Revealed item */}
        <AnimatePresence mode="wait">
          {!isOpened ? (
            <motion.button
              key="chest"
              onClick={() => setIsOpened(true)}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0, rotateY: 180 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="relative w-32 h-32 rounded-2xl border-2 border-neon-yellow flex items-center justify-center cursor-pointer"
              style={{
                background: 'radial-gradient(circle, rgba(255, 230, 0, 0.15), transparent)',
                boxShadow: '0 0 40px rgba(255, 230, 0, 0.3), 0 0 80px rgba(255, 230, 0, 0.1)',
              }}
            >
              <motion.span
                className="text-6xl"
                animate={{ rotate: [0, -5, 5, -5, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                {'\uD83C\uDF81'}
              </motion.span>
              <motion.p
                className="absolute -bottom-8 text-xs font-mono text-neon-yellow"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                Click to open!
              </motion.p>
            </motion.button>
          ) : (
            <motion.div
              key="item"
              initial={{ scale: 0, rotateY: -180 }}
              animate={{ scale: 1, rotateY: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="relative w-48 p-6 rounded-2xl border-2 flex flex-col items-center gap-3 text-center"
              style={{
                borderColor: rarity.color,
                background: `radial-gradient(circle, ${rarity.bg}, var(--surface))`,
                boxShadow: `0 0 40px ${rarity.glow}, 0 0 80px ${rarity.glow}`,
              }}
            >
              {/* Legendary particles */}
              {(isLegendary || isEpic) && (
                <motion.div
                  className="absolute inset-0 rounded-2xl"
                  style={{ boxShadow: `inset 0 0 40px ${rarity.glow}` }}
                  animate={{ opacity: [0.3, 0.7, 0.3] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                />
              )}

              <motion.span
                className="text-5xl relative z-10"
                animate={isLegendary ? { scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] } : {}}
                transition={{ repeat: isLegendary ? Infinity : 0, duration: 2 }}
              >
                {lootDrop.icon}
              </motion.span>

              <div className="relative z-10">
                <h3 className="font-bold text-sm" style={{ color: rarity.color }}>
                  {lootDrop.name}
                </h3>
                <p
                  className="text-[10px] font-mono font-bold uppercase mt-0.5"
                  style={{ color: rarity.color }}
                >
                  {lootDrop.rarity}
                </p>
              </div>

              <p className="text-[11px] text-text-secondary relative z-10">
                {lootDrop.description}
              </p>

              <div className="text-sm font-mono font-bold text-neon-yellow relative z-10">
                ${lootDrop.value} USDT
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* VRF proof */}
        {isOpened && vrfRequestId && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-center space-y-1"
          >
            <p className="text-[9px] font-mono text-text-muted">Chainlink VRF Proof</p>
            <p className="text-[8px] font-mono text-neon-cyan break-all max-w-xs">
              {vrfRequestId}
            </p>
          </motion.div>
        )}

        {/* Action buttons */}
        {isOpened && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="flex gap-3"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={startMatch}
              className="px-6 py-2 rounded-xl bg-neon-cyan text-black font-bold text-sm
                         shadow-[0_0_20px_rgba(0,240,255,0.3)] hover:shadow-[0_0_30px_rgba(0,240,255,0.5)]
                         transition-shadow"
            >
              PLAY AGAIN
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={returnToLobby}
              className="px-6 py-2 rounded-xl font-bold text-sm border border-border-bright
                         text-text-secondary hover:text-text-primary hover:border-primary-dim transition-colors"
            >
              BACK TO LOBBY
            </motion.button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
