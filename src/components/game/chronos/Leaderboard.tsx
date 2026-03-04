'use client';

import { motion } from 'framer-motion';
import { MOCK_LEADERBOARD } from '@/stores/chronosStore';

const RANK_STYLES: Record<number, { color: string; icon: string }> = {
  1: { color: '#F59E0B', icon: '\uD83E\uDD47' },
  2: { color: '#9CA3AF', icon: '\uD83E\uDD48' },
  3: { color: '#CD7F32', icon: '\uD83E\uDD49' },
};

export function Leaderboard() {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">{'\uD83C\uDFC6'}</span>
        <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">
          Leaderboard
        </h3>
      </div>

      {MOCK_LEADERBOARD.map((entry, index) => {
        const rankStyle = RANK_STYLES[entry.rank];
        return (
          <motion.div
            key={entry.rank}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center gap-3 p-2.5 rounded-lg bg-surface-2 border border-border hover:border-border-bright transition-colors"
          >
            {/* Rank */}
            <div className="w-8 text-center shrink-0">
              {rankStyle ? (
                <span className="text-lg">{rankStyle.icon}</span>
              ) : (
                <span className="text-xs font-mono text-text-muted">#{entry.rank}</span>
              )}
            </div>

            {/* Player info */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-text-primary truncate">
                {entry.playerName}
              </p>
              <p className="text-[9px] font-mono text-text-muted truncate">
                {entry.playerAddress}
              </p>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-3 shrink-0 text-[10px] font-mono">
              <div className="text-right">
                <span className="text-neon-green">{entry.wins}W</span>
                <span className="text-text-muted">/</span>
                <span className="text-neon-red">{entry.losses}L</span>
              </div>
              <div className="text-right min-w-[60px]">
                <p className="text-neon-yellow font-bold">${entry.earnings}</p>
              </div>
              <div className="text-right min-w-[30px]">
                <p className="text-neon-orange">{entry.winStreak}{'\uD83D\uDD25'}</p>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
