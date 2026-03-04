// ============================================================
// Avalon SDK — Move System
// Block-timed move queue, visibility, cost calculation, execution
// ============================================================

import { EventEmitter } from './EventEmitter';
import type {
  GameAction, QueuedMove, MoveResult, MoveEffect,
  PlayerId, EntityId,
  EnginePlayerState,
} from './types';
import { MOVE_BLOCK_DELAYS, MOVE_COSTS, MOVE_VISIBILITY } from './types';
import type { MoveSpeed } from '@/types';

export class MoveSystem {
  private queue: QueuedMove[] = [];
  private events: EventEmitter;

  constructor(events: EventEmitter) {
    this.events = events;
  }

  submitMove(action: GameAction, currentBlock: number): QueuedMove | null {
    const delay = MOVE_BLOCK_DELAYS[action.speed];
    const visible = MOVE_VISIBILITY[action.speed];

    const queued: QueuedMove = {
      action,
      executeAtBlock: currentBlock + delay,
      visible,
      resolved: false,
    };

    this.queue.push(queued);
    this.queue.sort((a, b) => a.executeAtBlock - b.executeAtBlock);
    this.events.emit('move:submitted', { action, executeAtBlock: queued.executeAtBlock });
    return queued;
  }

  getMoveCost(speed: MoveSpeed): number {
    return MOVE_COSTS[speed];
  }

  canAffordMove(player: EnginePlayerState, speed: MoveSpeed): boolean {
    return player.currency >= MOVE_COSTS[speed];
  }

  getVisibleMoves(forPlayerId: PlayerId): QueuedMove[] {
    return this.queue.filter(m =>
      !m.resolved && m.visible && m.action.playerId !== forPlayerId
    );
  }

  getPlayerPendingMoves(playerId: PlayerId): QueuedMove[] {
    return this.queue.filter(m => !m.resolved && m.action.playerId === playerId);
  }

  resolveMovesAtBlock(
    blockNumber: number,
    getHealth: (entityId: EntityId) => { current: number; max: number; shield: number } | undefined,
    getCombat: (entityId: EntityId) => { attack: number; defense: number; comboCounter: number; moveHistory: string[] } | undefined,
  ): MoveResult[] {
    const results: MoveResult[] = [];
    const toResolve = this.queue.filter(m => !m.resolved && m.executeAtBlock <= blockNumber);

    for (const queued of toResolve) {
      queued.resolved = true;
      const { action } = queued;
      const result = this.executeAction(action, getHealth, getCombat);
      results.push(result);

      if (result.success) {
        this.events.emit('move:executed', result);
      } else {
        this.events.emit('move:failed', result);
      }
    }

    // Clean up resolved moves
    this.queue = this.queue.filter(m => !m.resolved);
    return results;
  }

  private executeAction(
    action: GameAction,
    getHealth: (entityId: EntityId) => { current: number; max: number; shield: number } | undefined,
    getCombat: (entityId: EntityId) => { attack: number; defense: number; comboCounter: number; moveHistory: string[] } | undefined,
  ): MoveResult {
    const effects: MoveEffect[] = [];
    let damage = 0;
    let blocked = false;
    let countered = false;
    let combo = 0;
    let success = true;

    const targetId = action.targetId;

    switch (action.type) {
      case 'attack': {
        if (!targetId) { success = false; break; }
        const attackerCombat = getCombat(action.playerId);
        const defenderHealth = getHealth(targetId);
        if (!attackerCombat || !defenderHealth) { success = false; break; }

        damage = attackerCombat.attack;
        combo = attackerCombat.comboCounter;

        // Combo bonus: each consecutive attack adds 20% damage
        if (combo > 0) {
          damage = Math.floor(damage * (1 + combo * 0.2));
          this.events.emit('combat:combo', { playerId: action.playerId, combo, damage });
        }

        // Apply to shield first, then health
        if (defenderHealth.shield > 0) {
          const shieldDmg = Math.min(damage, defenderHealth.shield);
          damage -= shieldDmg;
          effects.push({ type: 'DAMAGE', targetId, value: shieldDmg });
        }

        if (damage > 0) {
          effects.push({ type: 'DAMAGE', targetId, value: damage });
        }
        break;
      }

      case 'defend': {
        // Defending grants a shield equal to combat defense stat
        const defenderCombat = getCombat(action.playerId);
        if (!defenderCombat) { success = false; break; }
        effects.push({ type: 'SHIELD', targetId: action.playerId, value: defenderCombat.defense });
        break;
      }

      case 'cast_spell': {
        if (!targetId) { success = false; break; }
        const casterCombat = getCombat(action.playerId);
        if (!casterCombat) { success = false; break; }

        damage = Math.floor(casterCombat.attack * 1.5);
        effects.push({ type: 'DAMAGE', targetId, value: damage });
        effects.push({ type: 'STUN', targetId, value: 1, duration: 1 });
        break;
      }

      case 'use_item': {
        // Heal the user
        effects.push({ type: 'HEAL', targetId: action.playerId, value: 20 });
        break;
      }

      default:
        // walk, run, trade, interact, emote — no combat effects
        break;
    }

    return { action, success, damage, blocked, countered, combo, effects };
  }

  getQueue(): QueuedMove[] {
    return [...this.queue];
  }

  clearQueue(): void {
    this.queue = [];
  }

  getQueueLength(): number {
    return this.queue.length;
  }
}
