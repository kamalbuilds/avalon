'use client';

import { motion } from 'framer-motion';
import type { ChronosOpponent } from '@/engine/chronos/opponents';
import { RadarChart } from './RadarChart';

interface OpponentCardProps {
  opponent: ChronosOpponent;
  isSelected: boolean;
  onClick: () => void;
}

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: '#39FF14',
  medium: '#FFE600',
  hard: '#FF6B00',
  expert: '#FF1744',
  legendary: '#B026FF',
};

export function OpponentCard({ opponent, isSelected, onClick }: OpponentCardProps) {
  const diffColor = DIFFICULTY_COLORS[opponent.difficulty] || '#fff';
  const winRate = Math.round((opponent.identity.totalWins / (opponent.identity.totalWins + opponent.identity.totalLosses)) * 100);

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.03, y: -4 }}
      whileTap={{ scale: 0.98 }}
      className={`relative text-left w-full p-4 rounded-xl border transition-all duration-200 ${
        isSelected
          ? 'bg-surface-3 border-2'
          : 'bg-surface-2 border-border hover:border-border-bright'
      }`}
      style={{
        borderColor: isSelected ? opponent.color : undefined,
        boxShadow: isSelected ? `0 0 30px ${opponent.glowColor}, inset 0 0 30px ${opponent.glowColor}` : undefined,
      }}
    >
      {/* Difficulty badge */}
      <div
        className="absolute -top-2 right-3 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase"
        style={{ background: `${diffColor}20`, color: diffColor, border: `1px solid ${diffColor}40` }}
      >
        {opponent.difficulty}
      </div>

      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center border-2 text-xl"
          style={{
            borderColor: opponent.color,
            background: `radial-gradient(circle, ${opponent.glowColor}, transparent)`,
            boxShadow: `0 0 15px ${opponent.glowColor}`,
          }}
        >
          {opponent.avatar}
        </div>
        <div>
          <h3 className="font-bold text-text-primary text-sm">{opponent.name}</h3>
          <p className="text-[10px] font-mono" style={{ color: opponent.color }}>
            {opponent.title}
          </p>
        </div>
      </div>

      {/* Description */}
      <p className="text-[11px] text-text-secondary leading-relaxed mb-3 line-clamp-2">
        {opponent.description}
      </p>

      {/* ERC-8004 Identity */}
      <div className="flex items-center gap-2 mb-3 py-1.5 px-2 rounded bg-surface border border-border">
        <span className="text-[9px] font-mono text-text-muted">ERC-8004</span>
        <span className="text-[9px] font-mono text-neon-cyan">#{opponent.identity.tokenId}</span>
        <span className="text-[9px] font-mono text-text-muted ml-auto">Rep: {opponent.identity.reputationScore}</span>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-3 mb-3 text-[10px] font-mono">
        <span className="text-neon-green">{opponent.identity.totalWins}W</span>
        <span className="text-neon-red">{opponent.identity.totalLosses}L</span>
        <span className="text-text-secondary">{winRate}%</span>
        <span className="text-neon-yellow ml-auto">${opponent.identity.walletBalance}</span>
      </div>

      {/* Radar chart */}
      <div className="flex justify-center mb-3">
        <RadarChart stats={opponent.radarStats} color={opponent.color} size={100} />
      </div>

      {/* Economy */}
      <div className="flex items-center justify-between text-[10px] font-mono pt-2 border-t border-border">
        <div>
          <span className="text-text-muted">Entry: </span>
          <span className="text-neon-yellow font-bold">${opponent.entryFee} USDT</span>
        </div>
        <div>
          <span className="text-text-muted">Prize: </span>
          <span className="text-neon-green font-bold">${opponent.prizePool} USDT</span>
        </div>
      </div>

      {/* Taunt */}
      <p className="text-[9px] italic text-text-muted mt-2 text-center">
        {opponent.taunt}
      </p>
    </motion.button>
  );
}
