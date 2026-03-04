'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useChronosStore } from '@/stores/chronosStore';

const CONFETTI_COLORS = ['#39FF14', '#00F0FF', '#FFE600', '#B026FF', '#FF00E5'];
const DEFEAT_PARTICLE_COLORS = ['#FF1744', '#8B0000', '#4A0000', '#CC2200', '#FF4444'];

function VictoryConfetti({ count = 40 }: { count?: number }) {
  const particles = useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 1.5,
      duration: 2 + Math.random() * 1.5,
      size: 3 + Math.random() * 5,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      rotation: Math.random() * 360,
      drift: (Math.random() - 0.5) * 60,
    })), [count]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-[60]">
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-sm"
          style={{
            left: `${p.x}%`,
            top: -10,
            width: p.size,
            height: p.size * 1.5,
            backgroundColor: p.color,
            boxShadow: `0 0 ${p.size}px ${p.color}40`,
          }}
          initial={{ y: -20, x: 0, rotate: 0, opacity: 1 }}
          animate={{
            y: '110vh',
            x: p.drift,
            rotate: p.rotation + 720,
            opacity: [1, 1, 0.8, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: 'easeIn',
          }}
        />
      ))}
    </div>
  );
}

function DefeatParticles({ count = 35 }: { count?: number }) {
  const particles = useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 2.5,
      duration: 3 + Math.random() * 2,
      size: 2 + Math.random() * 5,
      color: DEFEAT_PARTICLE_COLORS[Math.floor(Math.random() * DEFEAT_PARTICLE_COLORS.length)],
      rotation: Math.random() * 360,
      drift: (Math.random() - 0.5) * 30,
      repeatDelay: Math.random() * 2 + 0.5,
    })), [count]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-[60]">
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-[1px]"
          style={{
            left: `${p.x}%`,
            top: -10,
            width: p.size,
            height: p.size * 2,
            backgroundColor: p.color,
            boxShadow: `0 0 ${p.size}px ${p.color}80`,
          }}
          initial={{ y: -20, x: 0, rotate: 0, opacity: 0.7 }}
          animate={{
            y: '110vh',
            x: p.drift,
            rotate: p.rotation + 540,
            opacity: [0.7, 0.5, 0.3, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: 'easeIn',
            repeat: Infinity,
            repeatDelay: p.repeatDelay,
          }}
        />
      ))}
    </div>
  );
}

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
      {/* Victory confetti rain */}
      {isVictory && <VictoryConfetti />}

      {/* Defeat falling embers */}
      {!isVictory && <DefeatParticles />}

      {/* Dramatic background pulse */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: isVictory
            ? 'radial-gradient(ellipse at center, rgba(57,255,20,0.08) 0%, transparent 60%)'
            : 'radial-gradient(ellipse at center, rgba(255,23,68,0.08) 0%, transparent 60%)',
        }}
        animate={{
          opacity: [0.5, 1, 0.5],
        }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Shake wrapper on defeat */}
      <motion.div
        animate={!isVictory ? { x: [0, -10, 10, -7, 7, -3, 3, 0] } : { x: 0 }}
        transition={!isVictory ? { duration: 0.55, delay: 0.15 } : {}}
        className="relative w-full max-w-md mx-4"
      >
      <motion.div
        initial={{ scale: 0.8, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="p-6 rounded-2xl border bg-surface overflow-hidden"
        style={{
          borderColor: isVictory ? '#39FF14' : '#FF1744',
        }}
      >
        {/* Animated glow pulse on the card itself */}
        <motion.div
          className="absolute inset-0 pointer-events-none rounded-2xl"
          animate={{
            boxShadow: isVictory
              ? [
                  '0 0 40px rgba(57, 255, 20, 0.2), 0 0 80px rgba(57, 255, 20, 0.05), inset 0 0 30px rgba(57, 255, 20, 0.03)',
                  '0 0 80px rgba(57, 255, 20, 0.4), 0 0 160px rgba(57, 255, 20, 0.1), inset 0 0 60px rgba(57, 255, 20, 0.06)',
                  '0 0 40px rgba(57, 255, 20, 0.2), 0 0 80px rgba(57, 255, 20, 0.05), inset 0 0 30px rgba(57, 255, 20, 0.03)',
                ]
              : [
                  '0 0 40px rgba(255, 23, 68, 0.2), 0 0 80px rgba(255, 23, 68, 0.05), inset 0 0 30px rgba(255, 23, 68, 0.03)',
                  '0 0 80px rgba(255, 23, 68, 0.4), 0 0 160px rgba(255, 23, 68, 0.1), inset 0 0 60px rgba(255, 23, 68, 0.06)',
                  '0 0 40px rgba(255, 23, 68, 0.2), 0 0 80px rgba(255, 23, 68, 0.05), inset 0 0 30px rgba(255, 23, 68, 0.03)',
                ],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Top gradient accent */}
        <div
          className="absolute top-0 left-0 right-0 h-32 pointer-events-none"
          style={{
            background: isVictory
              ? 'linear-gradient(to bottom, rgba(57,255,20,0.06), transparent)'
              : 'linear-gradient(to bottom, rgba(255,23,68,0.06), transparent)',
          }}
        />

        {/* Title with pulsing glow */}
        <motion.h2
          className={`relative text-center text-4xl font-black mb-1 ${isVictory ? 'text-neon-green' : 'text-neon-red'}`}
          animate={{
            textShadow: isVictory
              ? [
                  '0 0 20px rgba(57, 255, 20, 0.6), 0 0 40px rgba(57, 255, 20, 0.3)',
                  '0 0 40px rgba(57, 255, 20, 0.9), 0 0 80px rgba(57, 255, 20, 0.5), 0 0 120px rgba(57, 255, 20, 0.2)',
                  '0 0 20px rgba(57, 255, 20, 0.6), 0 0 40px rgba(57, 255, 20, 0.3)',
                ]
              : [
                  '0 0 20px rgba(255, 23, 68, 0.6), 0 0 40px rgba(255, 23, 68, 0.3)',
                  '0 0 40px rgba(255, 23, 68, 0.9), 0 0 80px rgba(255, 23, 68, 0.5), 0 0 120px rgba(255, 23, 68, 0.2)',
                  '0 0 20px rgba(255, 23, 68, 0.6), 0 0 40px rgba(255, 23, 68, 0.3)',
                ],
            scale: [1, 1.05, 1],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          {isVictory ? 'VICTORY' : 'DEFEAT'}
        </motion.h2>

        {/* Opponent quote */}
        {selectedOpponent && (
          <p className="relative text-center text-xs text-text-muted italic mb-4">
            {isVictory ? selectedOpponent.loseQuote : selectedOpponent.winQuote}
          </p>
        )}

        {/* Prize info */}
        {isVictory && selectedOpponent && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 300, damping: 15 }}
            className="relative text-center mb-4 py-2 px-4 rounded-lg bg-neon-green/10 border border-neon-green/20"
          >
            <motion.div
              className="absolute inset-0 rounded-lg"
              animate={{
                boxShadow: [
                  'inset 0 0 10px rgba(57, 255, 20, 0.05)',
                  'inset 0 0 20px rgba(57, 255, 20, 0.1)',
                  'inset 0 0 10px rgba(57, 255, 20, 0.05)',
                ],
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <p className="text-xs text-text-muted font-mono">PRIZE WON</p>
            <motion.p
              className="text-xl font-bold text-neon-green font-mono"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: 'spring' }}
            >
              +${selectedOpponent.prizePool} USDT
            </motion.p>
          </motion.div>
        )}

        {/* Stats grid */}
        <div className="relative grid grid-cols-2 gap-3 mb-4">
          <StatCard label="Your Stats" stats={stats} color="#00F0FF" />
          <StatCard label={selectedOpponent ? selectedOpponent.name : 'AI Stats'} stats={aiStats} color="#FF00E5" />
        </div>

        {/* HP remaining */}
        <div className="relative flex items-center justify-center gap-4 mb-4 py-2 bg-surface-2 rounded-lg">
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
        <p className="relative text-center text-xs text-text-muted font-mono mb-4">
          {Math.floor(stats.duration / 60)}m {Math.floor(stats.duration % 60)}s &middot; {game.currentBlock} blocks
        </p>

        {/* Actions */}
        <div className="relative flex gap-3">
          {isVictory && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={revealLoot}
              className="flex-1 py-3 rounded-xl font-bold text-sm bg-neon-yellow text-black cursor-pointer transition-shadow"
              animate={{
                boxShadow: [
                  '0 0 20px rgba(255,230,0,0.3)',
                  '0 0 35px rgba(255,230,0,0.5), 0 0 60px rgba(255,230,0,0.2)',
                  '0 0 20px rgba(255,230,0,0.3)',
                ],
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              {'\uD83C\uDF81'} OPEN LOOT CHEST
            </motion.button>
          )}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={startMatch}
            className={`${isVictory ? '' : 'flex-1'} py-3 px-4 rounded-xl font-bold text-sm bg-neon-cyan text-black cursor-pointer
                       shadow-[0_0_20px_rgba(0,240,255,0.3)] hover:shadow-[0_0_30px_rgba(0,240,255,0.5)]
                       transition-shadow`}
          >
            REMATCH
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={returnToLobby}
            className="px-4 py-3 rounded-xl font-bold text-sm border border-border-bright cursor-pointer
                       text-text-secondary hover:text-text-primary hover:border-primary-dim transition-colors"
          >
            LOBBY
          </motion.button>
        </div>
      </motion.div>
      </motion.div>
    </motion.div>
  );
}

function StatCard({ label, stats, color }: {
  label: string;
  stats: { movesPlayed: number; damageDealt: number; damageBlocked: number; countersLanded: number; coinsSpent: number; shieldsUsed: number; duration: number };
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
