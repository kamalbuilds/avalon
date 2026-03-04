'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { MatchHistoryList } from '@/components/game/chronos/MatchHistoryList';
import { Leaderboard } from '@/components/game/chronos/Leaderboard';

export default function MatchHistoryPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-4">
          <Link
            href="/play/chronos"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card hover:border-accent/30 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <motion.h1
              className="text-xl font-bold tracking-tight"
              style={{
                background: 'linear-gradient(135deg, #00F0FF, #FF00E5)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              MATCH HISTORY
            </motion.h1>
            <p className="text-xs text-text-muted font-mono">Chronos Battle &middot; Avalon</p>
          </div>
        </div>
        <Link
          href="/play/chronos"
          className="px-4 py-2 rounded-lg bg-neon-cyan text-black font-bold text-sm
                     shadow-[0_0_15px_rgba(0,240,255,0.3)] hover:shadow-[0_0_25px_rgba(0,240,255,0.5)]
                     transition-shadow"
        >
          PLAY NOW
        </Link>
      </header>

      {/* Content */}
      <div className="flex gap-6 p-4 max-w-6xl mx-auto">
        <div className="flex-1">
          <MatchHistoryList />
        </div>
        <div className="w-80 shrink-0">
          <div className="bg-surface rounded-xl border border-border p-4 sticky top-4">
            <Leaderboard />
          </div>
        </div>
      </div>
    </div>
  );
}
