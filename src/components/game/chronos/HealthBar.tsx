'use client';

import { motion } from 'framer-motion';

interface HealthBarProps {
  current: number;
  max: number;
  label: string;
  side: 'left' | 'right';
  isFlashing?: boolean;
  shieldActive?: boolean;
}

export function HealthBar({ current, max, label, side, isFlashing, shieldActive }: HealthBarProps) {
  const percentage = Math.max(0, (current / max) * 100);
  const isLow = percentage <= 25;
  const isCritical = percentage <= 10;

  const barColor = isCritical
    ? 'bg-neon-red'
    : isLow
      ? 'bg-neon-orange'
      : side === 'left'
        ? 'bg-neon-cyan'
        : 'bg-neon-magenta';

  const glowColor = isCritical
    ? 'shadow-[0_0_20px_rgba(255,23,68,0.6)]'
    : isLow
      ? 'shadow-[0_0_20px_rgba(255,107,0,0.6)]'
      : side === 'left'
        ? 'shadow-[0_0_20px_rgba(0,240,255,0.4)]'
        : 'shadow-[0_0_20px_rgba(255,0,229,0.4)]';

  return (
    <div className={`flex flex-col gap-1 ${side === 'right' ? 'items-end' : 'items-start'}`}>
      <div className="flex items-center gap-2 w-full justify-between">
        <span className="text-xs font-mono text-text-secondary uppercase tracking-wider">
          {label}
        </span>
        <div className="flex items-center gap-1.5">
          {shieldActive && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-sm"
              title="Shield Active"
            >
              {'\uD83D\uDEE1\uFE0F'}
            </motion.span>
          )}
          <span className={`text-sm font-mono font-bold ${isLow ? 'text-neon-red' : 'text-text-primary'}`}>
            {current}
            <span className="text-text-muted">/{max}</span>
          </span>
        </div>
      </div>

      <div className={`w-full h-4 rounded-full bg-surface-2 border border-border overflow-hidden relative ${glowColor}`}>
        {/* Background pulse for low HP */}
        {isLow && (
          <motion.div
            className="absolute inset-0 bg-neon-red/10"
            animate={{ opacity: [0, 0.3, 0] }}
            transition={{ repeat: Infinity, duration: 0.8 }}
          />
        )}

        {/* Health fill */}
        <motion.div
          className={`h-full rounded-full relative overflow-hidden ${barColor}`}
          initial={{ width: '100%' }}
          animate={{ width: `${percentage}%` }}
          transition={{ type: 'spring', stiffness: 100, damping: 15 }}
          style={{ direction: side === 'right' ? 'rtl' : 'ltr' }}
        >
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2s_infinite]" />
        </motion.div>

        {/* Flash on hit */}
        {isFlashing && (
          <motion.div
            className="absolute inset-0 bg-white"
            initial={{ opacity: 0.8 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </div>
    </div>
  );
}
