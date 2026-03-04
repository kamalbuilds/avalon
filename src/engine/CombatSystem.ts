// ============================================================
// Avalon SDK Combat System
// Health, damage, move interactions, combos, win conditions
// ============================================================

import { EventEmitter } from './EventEmitter';
import { EntitySystem } from './EntitySystem';
import type {
  EntityId, PlayerId, MoveResult, MoveEffect,
  HealthComp, CombatComp, EnginePlayerState,
} from './types';
import type { MoveType } from '@/types';

// Move interaction table: [attacker move] vs [defender move] → modifier
const INTERACTION_TABLE: Record<string, Record<string, number>> = {
  attack: { defend: 0.5, attack: 1.0, cast_spell: 1.2, use_item: 1.5 },
  defend: { attack: 0.0, defend: 0.0, cast_spell: 0.3, use_item: 0.0 },
  cast_spell: { defend: 0.8, attack: 0.7, cast_spell: 1.0, use_item: 1.3 },
};

export class CombatSystem {
  private entitySystem: EntitySystem;
  private events: EventEmitter;

  constructor(entitySystem: EntitySystem, events: EventEmitter) {
    this.entitySystem = entitySystem;
    this.events = events;
  }

  applyMoveResult(result: MoveResult): void {
    for (const effect of result.effects) {
      this.applyEffect(effect);
    }

    // Update combo counter for attacker
    if (result.success && result.action.type === 'attack') {
      const combat = this.entitySystem.getComponent<CombatComp>(result.action.playerId, 'combat');
      if (combat) {
        this.entitySystem.setComponent(result.action.playerId, {
          ...combat,
          comboCounter: combat.comboCounter + 1,
          moveHistory: [...combat.moveHistory.slice(-9), result.action.type],
          lastMoveBlock: result.action.submittedBlock,
        });
      }
    } else if (result.success && result.action.type !== 'attack') {
      // Break combo on non-attack moves
      const combat = this.entitySystem.getComponent<CombatComp>(result.action.playerId, 'combat');
      if (combat) {
        this.entitySystem.setComponent(result.action.playerId, {
          ...combat,
          comboCounter: 0,
          moveHistory: [...combat.moveHistory.slice(-9), result.action.type],
          lastMoveBlock: result.action.submittedBlock,
        });
      }
    }
  }

  private applyEffect(effect: MoveEffect): void {
    const health = this.entitySystem.getComponent<HealthComp>(effect.targetId, 'health');
    if (!health) return;

    switch (effect.type) {
      case 'DAMAGE': {
        const newCurrent = Math.max(0, health.current - effect.value);
        this.entitySystem.setComponent(effect.targetId, {
          ...health,
          current: newCurrent,
        });
        this.events.emit('combat:damage', {
          entityId: effect.targetId,
          oldHealth: health.current,
          newHealth: newCurrent,
          change: -effect.value,
        });
        break;
      }

      case 'HEAL': {
        const newCurrent = Math.min(health.max, health.current + effect.value);
        this.entitySystem.setComponent(effect.targetId, {
          ...health,
          current: newCurrent,
        });
        this.events.emit('combat:heal', {
          entityId: effect.targetId,
          oldHealth: health.current,
          newHealth: newCurrent,
          change: effect.value,
        });
        break;
      }

      case 'SHIELD': {
        this.entitySystem.setComponent(effect.targetId, {
          ...health,
          shield: health.shield + effect.value,
        });
        break;
      }

      case 'STUN': {
        // Stun is tracked on the combat component
        const combat = this.entitySystem.getComponent<CombatComp>(effect.targetId, 'combat');
        if (combat) {
          this.entitySystem.setComponent(effect.targetId, {
            ...combat,
            comboCounter: 0, // stun breaks combo
          });
        }
        break;
      }
    }
  }

  resolveSimultaneous(moveA: MoveResult, moveB: MoveResult): { a: MoveResult; b: MoveResult } {
    const modA = this.getInteractionModifier(moveA.action.type, moveB.action.type);
    const modB = this.getInteractionModifier(moveB.action.type, moveA.action.type);

    const adjustedA: MoveResult = {
      ...moveA,
      damage: Math.floor(moveA.damage * modA),
      countered: modA === 0,
      blocked: modA < 1 && modA > 0,
    };

    const adjustedB: MoveResult = {
      ...moveB,
      damage: Math.floor(moveB.damage * modB),
      countered: modB === 0,
      blocked: modB < 1 && modB > 0,
    };

    // Adjust effects damage values
    adjustedA.effects = moveA.effects.map(e =>
      e.type === 'DAMAGE' ? { ...e, value: Math.floor(e.value * modA) } : e
    );
    adjustedB.effects = moveB.effects.map(e =>
      e.type === 'DAMAGE' ? { ...e, value: Math.floor(e.value * modB) } : e
    );

    return { a: adjustedA, b: adjustedB };
  }

  private getInteractionModifier(attackerMove: MoveType, defenderMove: MoveType): number {
    return INTERACTION_TABLE[attackerMove]?.[defenderMove] ?? 1.0;
  }

  isEntityDead(entityId: EntityId): boolean {
    const health = this.entitySystem.getComponent<HealthComp>(entityId, 'health');
    return health ? health.current <= 0 : true;
  }

  getHealth(entityId: EntityId): HealthComp | undefined {
    return this.entitySystem.getComponent<HealthComp>(entityId, 'health');
  }

  getCombat(entityId: EntityId): CombatComp | undefined {
    return this.entitySystem.getComponent<CombatComp>(entityId, 'combat');
  }

  checkWinCondition(players: Map<PlayerId, EnginePlayerState>): PlayerId | null {
    let aliveCount = 0;
    let lastAlive: PlayerId | null = null;

    for (const [id, player] of players) {
      const health = this.entitySystem.getComponent<HealthComp>(player.entityId, 'health');
      if (health && health.current > 0) {
        aliveCount++;
        lastAlive = id;
      }
    }

    // If only one player alive, they win
    if (aliveCount === 1) return lastAlive;
    return null;
  }

  resetEntity(entityId: EntityId, maxHealth: number): void {
    this.entitySystem.setComponent(entityId, {
      name: 'health',
      current: maxHealth,
      max: maxHealth,
      shield: 0,
    } as HealthComp);

    this.entitySystem.setComponent(entityId, {
      name: 'combat',
      attack: 10,
      defense: 5,
      moveHistory: [],
      comboCounter: 0,
      lastMoveBlock: 0,
    } as CombatComp);
  }
}
