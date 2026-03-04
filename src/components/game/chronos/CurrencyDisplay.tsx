'use client';

import { motion } from 'framer-motion';

interface CurrencyDisplayProps {
  coins: number;
  maxCoins: number;
  side: 'left' | 'right';
}

export function CurrencyDisplay({ coins, maxCoins, side }: CurrencyDisplayProps) {
  const isFull = coins >= maxCoins;
  const isLow = coins <= 2;

  return (
    <div className={`flex items-center gap-2 ${side === 'right' ? 'flex-row-reverse' : ''}`}>
      <motion.span
        className="text-xl"
        animate={isFull ? { scale: [1, 1.2, 1] } : {}}
        transition={{ repeat: isFull ? Infinity : 0, duration: 1.5 }}
      >
        {'\uD83E\uDE99'}
      </motion.span>
      <div className="flex items-center gap-1">
        <motion.span
          key={coins}
          initial={{ scale: 1.3, color: '#FFE600' }}
          animate={{ scale: 1, color: isLow ? '#FF1744' : '#FFE600' }}
          transition={{ duration: 0.3 }}
          className="font-mono font-bold text-lg"
        >
          {coins}
        </motion.span>
        <span className="font-mono text-xs text-text-muted">/{maxCoins}</span>
      </div>
      {/* Coin pips */}
      <div className="flex gap-0.5">
        {Array.from({ length: Math.min(maxCoins, 10) }).map((_, i) => (
          <div
            key={i}
            className={`w-1.5 h-3 rounded-sm transition-colors duration-200 ${
              i < Math.min(coins, 10)
                ? 'bg-neon-yellow shadow-[0_0_4px_rgba(255,230,0,0.5)]'
                : 'bg-surface-3'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
