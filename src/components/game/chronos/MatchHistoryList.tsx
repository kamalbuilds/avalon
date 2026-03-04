'use client';

import { motion } from 'framer-motion';
import { useChronosStore, type MatchRecord } from '@/stores/chronosStore';

const RARITY_COLORS: Record<string, string> = {
  common: '#9CA3AF',
  uncommon: '#22C55E',
  rare: '#3B82F6',
  epic: '#A855F7',
  legendary: '#F59E0B',
};

function MatchEntry({ record, index }: { record: MatchRecord; index: number }) {
  const isWin = record.result === 'win';
  const date = new Date(record.timestamp);
  const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="flex items-center gap-3 p-3 rounded-lg bg-surface-2 border border-border"
    >
      {/* Result indicator */}
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold ${
          isWin ? 'bg-neon-green/10 text-neon-green border border-neon-green/20' : 'bg-neon-red/10 text-neon-red border border-neon-red/20'
        }`}
      >
        {isWin ? 'WIN' : 'LOSS'}
      </div>

      {/* Match info */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-text-primary truncate">
          vs {record.opponentName}
        </p>
        <div className="flex items-center gap-2 text-[10px] font-mono text-text-muted">
          <span>{record.totalBlocks} blocks</span>
          <span>&middot;</span>
          <span>{timeStr}</span>
          <span>&middot;</span>
          <span>HP: {record.playerHpRemaining} vs {record.aiHpRemaining}</span>
        </div>
      </div>

      {/* Economy */}
      <div className="text-right shrink-0">
        {isWin && (
          <p className="text-xs font-mono font-bold text-neon-green">+${record.prizeWon}</p>
        )}
        <p className="text-[9px] font-mono text-text-muted">-${record.entryFee} fee</p>
      </div>

      {/* Loot drop */}
      {record.lootDrop && (
        <div className="shrink-0 text-center">
          <span className="text-lg">{record.lootDrop.icon}</span>
          <p className="text-[8px] font-mono" style={{ color: RARITY_COLORS[record.lootDrop.rarity] }}>
            {record.lootDrop.rarity}
          </p>
        </div>
      )}

      {/* Stats summary */}
      <div className="shrink-0 text-[10px] font-mono text-text-muted text-right">
        <p>{record.playerStats.movesPlayed} moves</p>
        <p>{record.playerStats.damageDealt} dmg</p>
      </div>
    </motion.div>
  );
}

export function MatchHistoryList() {
  const matchHistory = useChronosStore(s => s.matchHistory);

  if (matchHistory.length === 0) {
    return (
      <div className="text-center py-12">
        <span className="text-4xl mb-3 block">{'\uD83D\uDCDC'}</span>
        <p className="text-sm text-text-muted font-mono">No matches played yet</p>
        <p className="text-xs text-text-muted mt-1">Choose an opponent and start fighting!</p>
      </div>
    );
  }

  const wins = matchHistory.filter(m => m.result === 'win').length;
  const losses = matchHistory.filter(m => m.result === 'loss').length;
  const totalEarnings = matchHistory.reduce((sum, m) => sum + parseFloat(m.prizeWon), 0);
  const totalFees = matchHistory.reduce((sum, m) => sum + parseFloat(m.entryFee), 0);

  return (
    <div className="space-y-3">
      {/* Summary */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <div className="bg-surface-2 rounded-lg p-2 text-center border border-border">
          <p className="text-lg font-bold text-neon-green">{wins}</p>
          <p className="text-[9px] font-mono text-text-muted">WINS</p>
        </div>
        <div className="bg-surface-2 rounded-lg p-2 text-center border border-border">
          <p className="text-lg font-bold text-neon-red">{losses}</p>
          <p className="text-[9px] font-mono text-text-muted">LOSSES</p>
        </div>
        <div className="bg-surface-2 rounded-lg p-2 text-center border border-border">
          <p className="text-lg font-bold text-neon-yellow">${totalEarnings.toFixed(2)}</p>
          <p className="text-[9px] font-mono text-text-muted">EARNED</p>
        </div>
        <div className="bg-surface-2 rounded-lg p-2 text-center border border-border">
          <p className="text-lg font-bold text-text-secondary">${(totalEarnings - totalFees).toFixed(2)}</p>
          <p className="text-[9px] font-mono text-text-muted">NET P/L</p>
        </div>
      </div>

      {/* Match list */}
      {matchHistory.map((record, index) => (
        <MatchEntry key={record.id} record={record} index={index} />
      ))}
    </div>
  );
}
