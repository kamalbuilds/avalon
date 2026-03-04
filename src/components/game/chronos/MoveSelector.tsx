'use client';

import { motion } from 'framer-motion';
import { MOVES, MOVE_LIST, type ChronosMoveType } from '@/engine/chronos/moves';
import { useChronosStore } from '@/stores/chronosStore';

export function MoveSelector() {
  const playerMove = useChronosStore(s => s.playerMove);
  const canAfford = useChronosStore(s => s.canPlayerAfford);
  const game = useChronosStore(s => s.game);
  const isPlaying = game.phase === 'playing';

  return (
    <div className="grid grid-cols-5 gap-2">
      {MOVE_LIST.map((moveType, index) => {
        const move = MOVES[moveType];
        const affordable = canAfford(moveType);
        const disabled = !isPlaying || !affordable;

        return (
          <motion.button
            key={moveType}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => playerMove(moveType)}
            disabled={disabled}
            className={`
              relative flex flex-col items-center gap-1 p-3 rounded-xl border
              transition-all duration-200 group
              ${disabled
                ? 'border-border bg-surface opacity-40 cursor-not-allowed'
                : 'border-border-bright bg-surface-2 hover:bg-surface-3 cursor-pointer'
              }
            `}
            whileHover={disabled ? {} : { scale: 1.05, y: -2 }}
            whileTap={disabled ? {} : { scale: 0.95 }}
            style={{
              boxShadow: disabled ? 'none' : `0 0 0 1px ${move.color}20, 0 4px 20px ${move.glowColor}`,
            }}
          >
            {/* Hover glow */}
            {!disabled && (
              <div
                className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ boxShadow: `inset 0 0 30px ${move.glowColor}, 0 0 30px ${move.glowColor}` }}
              />
            )}

            {/* Icon */}
            <span className="text-2xl relative z-10">{move.icon}</span>

            {/* Name */}
            <span className="text-[11px] font-bold text-text-primary relative z-10 leading-tight text-center">
              {move.name}
            </span>

            {/* Cost + Delay */}
            <div className="flex items-center gap-2 text-[10px] font-mono relative z-10">
              <span className="text-neon-yellow">{move.cost}{'\uD83E\uDE99'}</span>
              {move.delay > 0 ? (
                <span className="text-text-muted">{move.delay}b</span>
              ) : (
                <span className="text-neon-cyan">instant</span>
              )}
            </div>

            {/* Damage */}
            <span
              className="text-[10px] font-mono font-bold relative z-10"
              style={{ color: move.color }}
            >
              {move.damage > 0 ? `${move.damage} DMG` : move.type === 'counter' ? '2x DMG' : 'BLOCK'}
            </span>

            {/* Keyboard hint */}
            <div className="absolute -top-1 -right-1 w-5 h-5 rounded bg-surface-3 border border-border flex items-center justify-center">
              <span className="text-[9px] font-mono text-text-muted">{index + 1}</span>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
