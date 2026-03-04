'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { MOVES } from '@/engine/chronos/moves';
import type { MoveInFlight as MoveInFlightType } from '@/engine/chronos/ChronosEngine';

interface MoveInFlightProps {
  move: MoveInFlightType;
}

export function MoveInFlightVisual({ move }: MoveInFlightProps) {
  const moveDef = MOVES[move.type];
  const progress = 1 - (move.blocksRemaining / move.totalBlocks);
  const isPlayerMove = move.owner === 'player';

  // Projectile moves from owner side to target side
  const startX = isPlayerMove ? 5 : 95;
  const endX = isPlayerMove ? 95 : 5;
  const currentX = startX + (endX - startX) * progress;

  // Y position — stable per move instance, with sine wave for organic movement
  const baseY = useMemo(() => 30 + Math.random() * 40, [move.id]);
  const yOffset = Math.sin(progress * Math.PI) * 15;

  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{
        left: `${currentX}%`,
        top: `${baseY + yOffset}%`,
        transform: 'translate(-50%, -50%)',
      }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 2, opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Glow aura */}
      <motion.div
        className="absolute inset-0 rounded-full blur-xl"
        style={{
          background: moveDef.glowColor,
          width: move.type === 'devastating_attack' ? 80 : move.type === 'power_blow' ? 60 : 40,
          height: move.type === 'devastating_attack' ? 80 : move.type === 'power_blow' ? 60 : 40,
          transform: 'translate(-50%, -50%)',
          left: '50%',
          top: '50%',
        }}
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.6, 1, 0.6],
        }}
        transition={{ repeat: Infinity, duration: 0.5 }}
      />

      {/* Trail */}
      <motion.div
        className="absolute h-1 rounded-full"
        style={{
          background: `linear-gradient(${isPlayerMove ? 'to right' : 'to left'}, transparent, ${moveDef.color})`,
          width: move.type === 'devastating_attack' ? 60 : 40,
          top: '50%',
          transform: 'translateY(-50%)',
          [isPlayerMove ? 'right' : 'left']: '100%',
        }}
      />

      {/* Projectile icon */}
      <motion.div
        className="relative z-10 flex items-center justify-center rounded-full border-2"
        style={{
          borderColor: moveDef.color,
          width: move.type === 'devastating_attack' ? 48 : move.type === 'power_blow' ? 40 : 32,
          height: move.type === 'devastating_attack' ? 48 : move.type === 'power_blow' ? 40 : 32,
          background: `radial-gradient(circle, ${moveDef.glowColor}, transparent)`,
          boxShadow: `0 0 20px ${moveDef.glowColor}, 0 0 40px ${moveDef.glowColor}`,
        }}
        animate={{
          rotate: move.type === 'shield' ? 0 : [0, 360],
          scale: [1, 1.1, 1],
        }}
        transition={{
          rotate: { repeat: Infinity, duration: 1, ease: 'linear' },
          scale: { repeat: Infinity, duration: 0.6 },
        }}
      >
        <span className="text-lg">{moveDef.icon}</span>
      </motion.div>

      {/* Blocks remaining label */}
      <motion.div
        className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] font-mono font-bold whitespace-nowrap"
        style={{ color: moveDef.color }}
      >
        {move.blocksRemaining}b
      </motion.div>
    </motion.div>
  );
}
