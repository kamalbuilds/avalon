'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useChronosStore } from '@/stores/chronosStore';

export function MatchTimer() {
  const game = useChronosStore(s => s.game);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (game.phase !== 'playing') return;
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - game.startTime) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [game.phase, game.startTime]);

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;

  return (
    <div className="flex flex-col items-center gap-1">
      {/* Block counter */}
      <motion.div
        key={game.currentBlock}
        initial={{ scale: 1.2 }}
        animate={{ scale: 1 }}
        className="flex items-center gap-1.5"
      >
        <div className="w-2 h-2 rounded-full bg-neon-cyan animate-pulse" />
        <span className="font-mono text-xs text-text-secondary">
          BLOCK
        </span>
        <span className="font-mono text-sm font-bold text-neon-cyan">
          #{game.currentBlock}
        </span>
      </motion.div>

      {/* Timer */}
      <span className="font-mono text-lg font-bold text-text-primary tabular-nums">
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </span>
    </div>
  );
}
