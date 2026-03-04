'use client';

import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChronosStore } from '@/stores/chronosStore';
import { MOVES } from '@/engine/chronos/moves';
import type { GameEvent } from '@/engine/chronos/ChronosEngine';

function EventEntry({ event }: { event: GameEvent }) {
  const moveDef = event.moveType ? MOVES[event.moveType] : null;
  const isPlayer = event.owner === 'player';

  const typeColors: Record<string, string> = {
    move_launched: 'text-neon-cyan',
    move_landed: 'text-neon-red',
    move_blocked: 'text-neon-green',
    counter_success: 'text-neon-purple',
    counter_miss: 'text-text-muted',
    shield_activated: 'text-neon-green',
    coin_earned: 'text-neon-yellow',
    game_over: 'text-neon-yellow',
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10, height: 0 }}
      animate={{ opacity: 1, x: 0, height: 'auto' }}
      className="flex items-start gap-2 py-1 border-b border-border/50 last:border-0"
    >
      {moveDef && <span className="text-xs mt-0.5 shrink-0">{moveDef.icon}</span>}
      <div className="flex-1 min-w-0">
        <p className={`text-[11px] font-mono leading-tight ${typeColors[event.type] || 'text-text-secondary'}`}>
          {event.message}
        </p>
        <span className="text-[9px] text-text-muted font-mono">
          Block #{event.block}
        </span>
      </div>
      {event.damage !== undefined && event.damage > 0 && (
        <span className="text-[11px] font-mono font-bold text-neon-red shrink-0">
          -{event.damage}
        </span>
      )}
    </motion.div>
  );
}

export function MoveHistory() {
  const events = useChronosStore(s => s.game.events);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events.length]);

  // Show last 30 events
  const recentEvents = events.slice(-30);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
        <div className="w-1.5 h-1.5 rounded-full bg-neon-cyan animate-pulse" />
        <span className="text-xs font-mono text-text-secondary uppercase tracking-wider">
          Battle Log
        </span>
        <span className="text-[10px] font-mono text-text-muted ml-auto">
          {events.length} events
        </span>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-1">
        <AnimatePresence initial={false}>
          {recentEvents.map(event => (
            <EventEntry key={event.id} event={event} />
          ))}
        </AnimatePresence>

        {events.length === 0 && (
          <p className="text-xs text-text-muted text-center py-4 font-mono">
            Start a match to see battle events...
          </p>
        )}
      </div>
    </div>
  );
}
