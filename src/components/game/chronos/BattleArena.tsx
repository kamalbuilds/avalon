'use client';

import { useMemo, useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChronosStore } from '@/stores/chronosStore';
import { MoveInFlightVisual } from './MoveInFlight';

interface FloatingDamage {
  id: string;
  value: number;
  target: 'player' | 'ai';
  type: 'damage' | 'block' | 'counter';
}

export function BattleArena() {
  const game = useChronosStore(s => s.game);
  const screenShake = useChronosStore(s => s.screenShake);
  const hitFlash = useChronosStore(s => s.hitFlash);
  const lastEvents = useChronosStore(s => s.lastEvents);

  const [floatingDamages, setFloatingDamages] = useState<FloatingDamage[]>([]);
  const damageCounter = useRef(0);

  // Watch for damage events and spawn floating numbers
  const spawnDamagePopup = useCallback((value: number, target: 'player' | 'ai', type: 'damage' | 'block' | 'counter') => {
    const id = `dmg_${++damageCounter.current}_${Date.now()}`;
    setFloatingDamages(prev => [...prev, { id, value, target, type }]);
    setTimeout(() => {
      setFloatingDamages(prev => prev.filter(d => d.id !== id));
    }, 1200);
  }, []);

  useEffect(() => {
    if (!lastEvents || lastEvents.length === 0) return;
    for (const evt of lastEvents) {
      if ((evt.type === 'move_landed' || evt.type === 'counter_success') && evt.damage && evt.damage > 0 && evt.target) {
        spawnDamagePopup(
          evt.damage,
          evt.target as 'player' | 'ai',
          evt.type === 'counter_success' ? 'counter' : 'damage'
        );
      }
      if (evt.type === 'move_blocked' && evt.target) {
        spawnDamagePopup(0, evt.target as 'player' | 'ai', 'block');
      }
    }
  }, [lastEvents, spawnDamagePopup]);

  const shakeTransform = useMemo(() => {
    if (!screenShake) return { x: 0, y: 0 };
    const elapsed = Date.now() - screenShake.startTime;
    const progress = elapsed / screenShake.duration;
    const decay = 1 - progress;
    return {
      x: (Math.random() - 0.5) * screenShake.intensity * decay,
      y: (Math.random() - 0.5) * screenShake.intensity * decay,
    };
  }, [screenShake]);

  const playerMovesInFlight = game.movesInFlight.filter(m => m.owner === 'player');
  const aiMovesInFlight = game.movesInFlight.filter(m => m.owner === 'ai');

  return (
    <motion.div
      className="relative w-full h-full rounded-xl border border-border overflow-hidden bg-surface"
      animate={screenShake ? shakeTransform : { x: 0, y: 0 }}
      transition={{ duration: 0.05 }}
    >
      {/* Background grid */}
      <div className="absolute inset-0 opacity-10">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--neon-cyan)" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Horizontal center divider */}
      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-border-bright to-transparent" />

      {/* Player side (left) */}
      <div className={`absolute left-0 top-0 bottom-0 w-1/2 transition-colors duration-200 ${
        hitFlash === 'player' ? 'bg-neon-red/20' : ''
      }`}>
        <div className="absolute bottom-4 left-4 flex flex-col items-center gap-1">
          {/* Player avatar with hit flash ring */}
          <div className="relative">
            <motion.div
              className="w-16 h-16 rounded-full border-2 border-neon-cyan flex items-center justify-center bg-surface-2"
              style={{ boxShadow: '0 0 20px rgba(0, 240, 255, 0.3)' }}
              animate={
                hitFlash === 'player'
                  ? { borderColor: ['#FF1744', '#00F0FF'], boxShadow: ['0 0 30px rgba(255,23,68,0.6)', '0 0 20px rgba(0,240,255,0.3)'] }
                  : game.player.shieldActive
                  ? {
                      boxShadow: [
                        '0 0 20px rgba(57, 255, 20, 0.3), 0 0 40px rgba(57, 255, 20, 0.2)',
                        '0 0 30px rgba(57, 255, 20, 0.5), 0 0 60px rgba(57, 255, 20, 0.3)',
                        '0 0 20px rgba(57, 255, 20, 0.3), 0 0 40px rgba(57, 255, 20, 0.2)',
                      ]
                    }
                  : {}
              }
              transition={hitFlash === 'player' ? { duration: 0.3 } : { repeat: Infinity, duration: 1.5 }}
            >
              <span className="text-2xl">{'\u2694\uFE0F'}</span>
            </motion.div>

            {/* Hit flash burst ring */}
            <AnimatePresence>
              {hitFlash === 'player' && (
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-neon-red"
                  initial={{ scale: 1, opacity: 0.8 }}
                  animate={{ scale: 2, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                />
              )}
            </AnimatePresence>
          </div>
          <span className="text-[10px] font-mono text-neon-cyan font-bold uppercase">You</span>
        </div>

        {/* Shield visual indicator */}
        {game.player.shieldActive && (
          <motion.div
            className="absolute bottom-3 left-3 w-20 h-20 rounded-full border border-neon-green/50"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1.2, opacity: [0.3, 0.6, 0.3] }}
            transition={{ opacity: { repeat: Infinity, duration: 1.5 } }}
            style={{ boxShadow: '0 0 30px rgba(57, 255, 20, 0.3)' }}
          />
        )}
      </div>

      {/* AI side (right) */}
      <div className={`absolute right-0 top-0 bottom-0 w-1/2 transition-colors duration-200 ${
        hitFlash === 'ai' ? 'bg-neon-red/20' : ''
      }`}>
        <div className="absolute bottom-4 right-4 flex flex-col items-center gap-1">
          {/* AI avatar with hit flash ring */}
          <div className="relative">
            <motion.div
              className="w-16 h-16 rounded-full border-2 border-neon-magenta flex items-center justify-center bg-surface-2"
              style={{ boxShadow: '0 0 20px rgba(255, 0, 229, 0.3)' }}
              animate={
                hitFlash === 'ai'
                  ? { borderColor: ['#FF1744', '#FF00E5'], boxShadow: ['0 0 30px rgba(255,23,68,0.6)', '0 0 20px rgba(255,0,229,0.3)'] }
                  : game.ai.shieldActive
                  ? {
                      boxShadow: [
                        '0 0 20px rgba(57, 255, 20, 0.3), 0 0 40px rgba(57, 255, 20, 0.2)',
                        '0 0 30px rgba(57, 255, 20, 0.5), 0 0 60px rgba(57, 255, 20, 0.3)',
                        '0 0 20px rgba(57, 255, 20, 0.3), 0 0 40px rgba(57, 255, 20, 0.2)',
                      ]
                    }
                  : {}
              }
              transition={hitFlash === 'ai' ? { duration: 0.3 } : { repeat: Infinity, duration: 1.5 }}
            >
              <span className="text-2xl">{'\uD83E\uDD16'}</span>
            </motion.div>

            {/* Hit flash burst ring */}
            <AnimatePresence>
              {hitFlash === 'ai' && (
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-neon-red"
                  initial={{ scale: 1, opacity: 0.8 }}
                  animate={{ scale: 2, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                />
              )}
            </AnimatePresence>
          </div>
          <span className="text-[10px] font-mono text-neon-magenta font-bold uppercase">AI</span>
        </div>

        {/* Shield visual indicator */}
        {game.ai.shieldActive && (
          <motion.div
            className="absolute bottom-3 right-3 w-20 h-20 rounded-full border border-neon-green/50"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1.2, opacity: [0.3, 0.6, 0.3] }}
            transition={{ opacity: { repeat: Infinity, duration: 1.5 } }}
            style={{ boxShadow: '0 0 30px rgba(57, 255, 20, 0.3)' }}
          />
        )}
      </div>

      {/* Moves in flight */}
      <AnimatePresence>
        {game.movesInFlight.map(move => (
          <MoveInFlightVisual key={move.id} move={move} />
        ))}
      </AnimatePresence>

      {/* Floating damage numbers */}
      <AnimatePresence>
        {floatingDamages.map((dmg) => {
          const isLeft = dmg.target === 'player';
          const baseX = isLeft ? '15%' : '75%';
          return (
            <motion.div
              key={dmg.id}
              className="absolute z-50 pointer-events-none"
              style={{ left: baseX, bottom: '30%' }}
              initial={{ opacity: 1, y: 0, scale: 0.5 }}
              animate={{
                opacity: [1, 1, 0],
                y: -70,
                scale: dmg.type === 'counter' ? [0.5, 1.4, 1.2] : [0.5, 1.1, 1],
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
            >
              <span
                className={`font-mono font-black drop-shadow-lg ${
                  dmg.type === 'block'
                    ? 'text-accent text-lg'
                    : dmg.type === 'counter'
                    ? 'text-neon-yellow text-3xl'
                    : 'text-neon-red text-2xl'
                }`}
                style={{
                  textShadow:
                    dmg.type === 'block'
                      ? '0 0 15px #818cf8, 0 0 30px #818cf880'
                      : dmg.type === 'counter'
                      ? '0 0 20px #FFE600, 0 0 40px #FFE60080'
                      : '0 0 15px #FF1744, 0 0 30px #FF174480',
                }}
              >
                {dmg.type === 'block' ? 'BLOCKED' : `-${dmg.value}`}
                {dmg.type === 'counter' && ' COUNTER!'}
              </span>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* VS text in center */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        <motion.span
          className="text-3xl font-black text-border-bright/50 select-none"
          animate={{ opacity: [0.2, 0.4, 0.2] }}
          transition={{ repeat: Infinity, duration: 3 }}
        >
          VS
        </motion.span>
      </div>

      {/* Move count indicators */}
      <div className="absolute top-3 left-3 flex gap-1">
        {playerMovesInFlight.map(m => (
          <motion.div
            key={m.id}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-2 h-2 rounded-full bg-neon-cyan"
            style={{ boxShadow: '0 0 6px rgba(0, 240, 255, 0.6)' }}
          />
        ))}
      </div>
      <div className="absolute top-3 right-3 flex gap-1">
        {aiMovesInFlight.map(m => (
          <motion.div
            key={m.id}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-2 h-2 rounded-full bg-neon-magenta"
            style={{ boxShadow: '0 0 6px rgba(255, 0, 229, 0.6)' }}
          />
        ))}
      </div>

      {/* Waiting state */}
      {game.phase === 'waiting' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.p
            className="text-text-muted font-mono text-sm"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            Select a difficulty to begin...
          </motion.p>
        </div>
      )}
    </motion.div>
  );
}
