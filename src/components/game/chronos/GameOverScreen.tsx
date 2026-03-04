'use client';

import { motion } from 'framer-motion';
import { useChronosStore } from '@/stores/chronosStore';

export function GameOverScreen() {
  const game = useChronosStore(s => s.game);
  const screen = useChronosStore(s => s.screen);
  const selectedOpponent = useChronosStore(s => s.selectedOpponent);
  const startMatch = useChronosStore(s => s.startMatch);
  const returnToLobby = useChronosStore(s => s.returnToLobby);
  const revealLoot = useChronosStore(s => s.revealLoot);

  if (screen !== 'game_over' || game.phase !== 'game_over') return null;

  const isVictory = game.winner === 'player';
  const stats = game.playerStats;
  const aiStats = game.aiStats;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.8, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="relative w-full max-w-md mx-4 p-6 rounded-2xl border bg-surface"
        style={{
          borderColor: isVictory ? '#39FF14' : '#FF1744',
          boxShadow: isVictory
            ? '0 0 60px rgba(57, 255, 20, 0.3), 0 0 120px rgba(57, 255, 20, 0.1)'
            : '0 0 60px rgba(255, 23, 68, 0.3), 0 0 120px rgba(255, 23, 68, 0.1)',
        }}
      >
        {/* Title */}
        <motion.h2
          className={`text-center text-4xl font-bold mb-1 ${isVictory ? 'text-neon-green' : 'text-neon-red'}`}
          style={{
            textShadow: isVictory
              ? '0 0 30px rgba(57, 255, 20, 0.8)'
              : '0 0 30px rgba(255, 23, 68, 0.8)',
          }}
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          {isVictory ? 'VICTORY' : 'DEFEAT'}
        </motion.h2>

        {/* Opponent quote */}
        {selectedOpponent && (
          <p className="text-center text-xs text-text-muted italic mb-4">
            {isVictory ? selectedOpponent.loseQuote : selectedOpponent.winQuote}
          </p>
        )}

        {/* Prize info */}
        {isVictory && selectedOpponent && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center mb-4 py-2 px-4 rounded-lg bg-neon-green/10 border border-neon-green/20"
          >
            <p className="text-xs text-text-muted font-mono">PRIZE WON</p>
            <p className="text-xl font-bold text-neon-green font-mono">
              +${selectedOpponent.prizePool} USDT
            </p>
          </motion.div>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <StatCard label="Your Stats" stats={stats} color="#00F0FF" />
          <StatCard label={selectedOpponent ? selectedOpponent.name : 'AI Stats'} stats={aiStats} color="#FF00E5" />
        </div>

        {/* HP remaining */}
        <div className="flex items-center justify-center gap-4 mb-4 py-2 bg-surface-2 rounded-lg">
          <div className="text-center">
            <p className="text-2xl font-bold text-neon-cyan">{game.player.hp}</p>
            <p className="text-[10px] text-text-muted font-mono">YOUR HP</p>
          </div>
          <div className="text-text-muted font-mono text-sm">vs</div>
          <div className="text-center">
            <p className="text-2xl font-bold text-neon-magenta">{game.ai.hp}</p>
            <p className="text-[10px] text-text-muted font-mono">
              {selectedOpponent ? selectedOpponent.name.toUpperCase() : 'AI'} HP
            </p>
          </div>
        </div>

        {/* Duration */}
        <p className="text-center text-xs text-text-muted font-mono mb-4">
          {Math.floor(stats.duration / 60)}m {Math.floor(stats.duration % 60)}s &middot; {game.currentBlock} blocks
        </p>

        {/* Actions */}
        <div className="flex gap-3">
          {isVictory && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={revealLoot}
              className="flex-1 py-3 rounded-xl font-bold text-sm bg-neon-yellow text-black
                         shadow-[0_0_20px_rgba(255,230,0,0.3)] hover:shadow-[0_0_30px_rgba(255,230,0,0.5)]
                         transition-shadow"
            >
              {'\uD83C\uDF81'} OPEN LOOT CHEST
            </motion.button>
          )}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={startMatch}
            className={`${isVictory ? '' : 'flex-1'} py-3 px-4 rounded-xl font-bold text-sm bg-neon-cyan text-black
                       shadow-[0_0_20px_rgba(0,240,255,0.3)] hover:shadow-[0_0_30px_rgba(0,240,255,0.5)]
                       transition-shadow`}
          >
            REMATCH
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={returnToLobby}
            className="px-4 py-3 rounded-xl font-bold text-sm border border-border-bright
                       text-text-secondary hover:text-text-primary hover:border-primary-dim transition-colors"
          >
            LOBBY
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function StatCard({ label, stats, color }: {
  label: string;
  stats: { movesPlayed: number; damageDealt: number; damageBlocked: number; countersLanded: number; coinsSpent: number; shieldsUsed: number };
  color: string;
}) {
  return (
    <div className="bg-surface-2 rounded-lg p-3 border border-border">
      <h3 className="text-[10px] font-mono uppercase tracking-wider mb-2" style={{ color }}>{label}</h3>
      <div className="space-y-1">
        <StatRow label="Moves" value={stats.movesPlayed} />
        <StatRow label="Damage" value={stats.damageDealt} />
        <StatRow label="Blocked" value={stats.damageBlocked} />
        <StatRow label="Counters" value={stats.countersLanded} />
        <StatRow label="Coins" value={stats.coinsSpent} />
        <StatRow label="Shields" value={stats.shieldsUsed} />
      </div>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between text-xs font-mono">
      <span className="text-text-muted">{label}</span>
      <span className="text-text-primary font-bold">{value}</span>
    </div>
  );
}
