// ============================================================
// Avalon SDK — Match Manager
// Match lifecycle state machine:
//   LOBBY → READY → COUNTDOWN → ACTIVE → COMPLETED → SETTLED
// ============================================================

import { EventEmitter } from './EventEmitter';
import { StateManager } from './StateManager';
import { EntitySystem } from './EntitySystem';
import { CombatSystem } from './CombatSystem';
import { EconomySystem } from './EconomySystem';
import {
  EngineMatchPhase, EngineEntityType,
  type MatchId, type PlayerId, type MatchConfig,
  type EnginePlayerState, type EngineMatchResult, type PrizeEntry,
  type HealthComp, type CombatComp, type PositionComp,
} from './types';
import type { Address } from '@/types';

// Valid state transitions
const VALID_TRANSITIONS: Record<EngineMatchPhase, EngineMatchPhase[]> = {
  [EngineMatchPhase.LOBBY]:     [EngineMatchPhase.READY],
  [EngineMatchPhase.READY]:     [EngineMatchPhase.COUNTDOWN, EngineMatchPhase.LOBBY],
  [EngineMatchPhase.COUNTDOWN]: [EngineMatchPhase.ACTIVE],
  [EngineMatchPhase.ACTIVE]:    [EngineMatchPhase.PAUSED, EngineMatchPhase.COMPLETED],
  [EngineMatchPhase.PAUSED]:    [EngineMatchPhase.ACTIVE, EngineMatchPhase.COMPLETED],
  [EngineMatchPhase.COMPLETED]: [EngineMatchPhase.SETTLED],
  [EngineMatchPhase.SETTLED]:   [],
};

interface MatchTimeout {
  timer: ReturnType<typeof setTimeout>;
  deadline: number;
}

export class MatchManager {
  private events: EventEmitter;
  private stateManager: StateManager;
  private entitySystem: EntitySystem;
  private combatSystem: CombatSystem;
  private economySystem: EconomySystem;
  private config: MatchConfig | null = null;
  private turnTimeout: MatchTimeout | null = null;
  private matchStartTime: number = 0;
  private matchResult: EngineMatchResult | null = null;

  constructor(
    events: EventEmitter,
    stateManager: StateManager,
    entitySystem: EntitySystem,
    combatSystem: CombatSystem,
    economySystem: EconomySystem,
  ) {
    this.events = events;
    this.stateManager = stateManager;
    this.entitySystem = entitySystem;
    this.combatSystem = combatSystem;
    this.economySystem = economySystem;
  }

  // --- SDK API (matches docs) ---

  /** createMatch(config) — Create a new match in LOBBY phase */
  createMatch(config: MatchConfig): MatchId {
    this.config = config;
    this.matchResult = null;
    this.stateManager.initialize(config.matchId);
    this.entitySystem.clear();
    this.economySystem.reset(0);

    if (config.currency) {
      this.economySystem.configure({ currency: config.currency });
    }

    // initialize() already sets phase to LOBBY — no transition needed
    this.events.emit('match:created', { matchId: config.matchId, createdBy: config.createdBy });
    return config.matchId;
  }

  /** joinMatch(matchId, playerId, name, address?) — Join an existing match */
  joinMatch(playerId: PlayerId, name: string, address?: Address): boolean {
    if (!this.config) return false;

    const state = this.stateManager.getState();
    if (state.phase !== EngineMatchPhase.LOBBY && state.phase !== EngineMatchPhase.READY) {
      return false;
    }
    if (state.players.size >= this.config.gameConfig.maxPlayers) return false;
    if (state.players.has(playerId)) return false;

    // Create entity for player
    const entity = this.entitySystem.createEntity(EngineEntityType.PLAYER, [
      { name: 'health', current: 100, max: 100, shield: 0 } as HealthComp,
      { name: 'combat', attack: 10, defense: 5, moveHistory: [], comboCounter: 0, lastMoveBlock: 0 } as CombatComp,
      { name: 'position', x: 0, y: 0 } as PositionComp,
    ]);

    const startingCurrency = parseInt(this.config.gameConfig.entryFee || '100', 10) || 100;
    const playerState: EnginePlayerState = {
      id: playerId,
      entityId: entity.id,
      name,
      address,
      connected: true,
      ready: false,
      currency: startingCurrency,
      score: 0,
    };

    this.stateManager.setPlayer(playerId, playerState);

    // Register in economy
    this.economySystem.deposit(playerId, startingCurrency, address);

    this.events.emit('player:joined', { playerId, name, entityId: entity.id, address });

    // If wager configured, record it
    if (this.config.wagerAmount > 0) {
      const afterWager = this.economySystem.recordWager(playerState, this.config.wagerAmount);
      if (afterWager) {
        this.stateManager.setPlayer(playerId, afterWager);
      }
    }

    // Auto-transition to READY when full
    if (state.players.size + 1 >= this.config.gameConfig.maxPlayers) {
      this.transition(EngineMatchPhase.READY);
    }

    return true;
  }

  /** startMatch(matchId) — Manually start a match (if all ready or forced) */
  startMatch(): boolean {
    const state = this.stateManager.getState();
    if (state.phase !== EngineMatchPhase.READY) return false;
    if (state.players.size < 2) return false;

    this.beginCountdown();
    return true;
  }

  /** endMatch(matchId, result) — End match and compute results */
  endMatch(winnerId: PlayerId | null): EngineMatchResult {
    return this.finishMatch(winnerId);
  }

  /** settleMatch() — Settle on-chain after match completion */
  settleMatch(): EngineMatchResult | null {
    const state = this.stateManager.getState();
    if (state.phase !== EngineMatchPhase.COMPLETED) return null;
    if (!this.matchResult) return null;

    this.transition(EngineMatchPhase.SETTLED);
    this.matchResult = { ...this.matchResult, settled: true };

    this.events.emit('match:settled', {
      matchId: state.matchId,
      result: this.matchResult,
    });

    return this.matchResult;
  }

  // --- Player Actions ---

  leaveMatch(playerId: PlayerId): boolean {
    const state = this.stateManager.getState();
    const player = state.players.get(playerId);
    if (!player) return false;

    this.entitySystem.destroyEntity(player.entityId);
    this.stateManager.removePlayer(playerId);
    this.events.emit('player:left', { playerId });

    // If active match and player leaves, other player wins
    if (state.phase === EngineMatchPhase.ACTIVE && state.players.size <= 2) {
      const remaining = Array.from(state.players.keys()).find(id => id !== playerId);
      if (remaining) {
        this.finishMatch(remaining);
      }
    }

    // If lobby empties, stay in lobby
    return true;
  }

  setPlayerReady(playerId: PlayerId): boolean {
    const state = this.stateManager.getState();
    const player = state.players.get(playerId);
    if (!player) return false;

    this.stateManager.setPlayer(playerId, { ...player, ready: true });
    this.events.emit('player:ready', { playerId });

    // Auto-start if all ready
    const updatedState = this.stateManager.getState();
    const allReady = Array.from(updatedState.players.values()).every(p => p.ready);
    if (allReady && updatedState.players.size >= 2) {
      if (updatedState.phase === EngineMatchPhase.LOBBY) {
        this.transition(EngineMatchPhase.READY);
      }
      this.beginCountdown();
    }

    return true;
  }

  // --- State Machine ---

  private transition(to: EngineMatchPhase): boolean {
    const from = this.stateManager.getState().phase;
    const allowed = VALID_TRANSITIONS[from];

    if (!allowed.includes(to)) {
      console.warn(`[Avalon MatchManager] Invalid transition: ${from} → ${to}`);
      return false;
    }

    this.stateManager.setPhase(to);
    return true;
  }

  private beginCountdown(): void {
    this.matchStartTime = Date.now();
    this.transition(EngineMatchPhase.COUNTDOWN);

    setTimeout(() => {
      this.transition(EngineMatchPhase.ACTIVE);
      this.stateManager.incrementTurn();
      this.events.emit('match:started', { matchId: this.config?.matchId, turnNumber: 1 });
      this.startTurnTimer();
    }, 3000);
  }

  // --- Turns ---

  advanceTurn(): void {
    const state = this.stateManager.getState();
    if (state.phase !== EngineMatchPhase.ACTIVE) return;

    this.clearTurnTimer();

    // Check win condition
    const winner = this.combatSystem.checkWinCondition(state.players);
    if (winner) {
      this.finishMatch(winner);
      return;
    }

    // Loot drops
    if (this.config?.gameConfig.enableLootDrops) {
      this.economySystem.tryLootDrop(state.blockNumber, 0.15, 1, 5);
    }

    const newTurn = this.stateManager.incrementTurn();
    this.events.emit('state:changed', { event: 'turnStart', turnNumber: newTurn });
    this.startTurnTimer();
  }

  private startTurnTimer(): void {
    if (!this.config) return;

    const duration = this.config.gameConfig.tickRate > 0
      ? Math.floor(1000 / this.config.gameConfig.tickRate) * 60
      : 30000;

    this.turnTimeout = {
      timer: setTimeout(() => this.advanceTurn(), duration),
      deadline: Date.now() + duration,
    };
  }

  private clearTurnTimer(): void {
    if (this.turnTimeout) {
      clearTimeout(this.turnTimeout.timer);
      this.turnTimeout = null;
    }
  }

  // --- Match Completion ---

  private finishMatch(winnerId: PlayerId | null): EngineMatchResult {
    this.clearTurnTimer();
    this.transition(EngineMatchPhase.COMPLETED);

    const state = this.stateManager.getState();
    const duration = Date.now() - this.matchStartTime;

    // Distribute prizes with fee split
    const prizeDistribution: PrizeEntry[] = [];
    if (winnerId) {
      const winner = state.players.get(winnerId);
      if (winner) {
        const result = this.economySystem.distributePrize(state.matchId, winnerId, winner);
        this.stateManager.setPlayer(winnerId, result.player);
        prizeDistribution.push({
          playerId: winnerId,
          address: winner.address,
          amount: result.winnerPrize,
          reason: 'WIN',
        });
      }
    } else {
      // Draw — refund all players
      for (const [id, player] of state.players) {
        if (this.config?.wagerAmount) {
          const refunded = this.economySystem.addCurrency(player, this.config.wagerAmount, 'refund');
          this.stateManager.setPlayer(id, refunded);
          prizeDistribution.push({ playerId: id, address: player.address, amount: this.config.wagerAmount, reason: 'REFUND' });
        }
      }
    }

    const loserId = winnerId
      ? Array.from(state.players.keys()).find(id => id !== winnerId) ?? null
      : null;

    this.matchResult = {
      matchId: state.matchId,
      winnerId,
      loserId,
      isDraw: winnerId === null,
      duration,
      totalTurns: state.turnNumber,
      prizeDistribution,
      settled: false,
    };

    this.events.emit('match:ended', this.matchResult);
    return this.matchResult;
  }

  forceEndMatch(winnerId: PlayerId | null = null): EngineMatchResult {
    return this.finishMatch(winnerId);
  }

  // --- Queries ---

  getPhase(): EngineMatchPhase {
    return this.stateManager.getState().phase;
  }

  getConfig(): MatchConfig | null {
    return this.config;
  }

  getResult(): EngineMatchResult | null {
    return this.matchResult;
  }

  isActive(): boolean {
    return this.stateManager.getState().phase === EngineMatchPhase.ACTIVE;
  }

  getTurnTimeRemaining(): number {
    if (!this.turnTimeout) return 0;
    return Math.max(0, this.turnTimeout.deadline - Date.now());
  }
}
