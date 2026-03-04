// ============================================================
// Avalon SDK — Game Engine (SDK Entry Point)
// The core engine that developers use to power their games.
// Exposes: initialize(), start(), stop(), getMatchManager(),
// getEconomySystem(), state management, and event system.
// ============================================================

import { EventEmitter } from './EventEmitter';
import { EntitySystem } from './EntitySystem';
import { StateManager } from './StateManager';
import { MoveSystem } from './MoveSystem';
import { CombatSystem } from './CombatSystem';
import { EconomySystem } from './EconomySystem';
import { MatchManager } from './MatchManager';
import {
  EngineMatchPhase,
  type GameAction, type MatchConfig, type EngineState,
  type PlayerId, type MatchId,
  type AvalonEventType, type AvalonEventHandler,
  type MoveResult, type SerializedState,
  type ChainSyncConfig, type StateSubscriber,
} from './types';
import type { GameConfig, StablecoinType } from '@/types';

export class GameEngine {
  readonly events: EventEmitter;
  readonly entities: EntitySystem;
  readonly state: StateManager;
  readonly moves: MoveSystem;
  readonly combat: CombatSystem;
  readonly economy: EconomySystem;
  readonly matches: MatchManager;

  private loopHandle: ReturnType<typeof setInterval> | null = null;
  private tickRate: number = 20;
  private lastTickTime: number = 0;
  private running: boolean = false;
  private blockSimInterval: ReturnType<typeof setInterval> | null = null;
  private gameConfig: GameConfig | null = null;

  constructor() {
    this.events = new EventEmitter();
    this.entities = new EntitySystem(this.events);
    this.state = new StateManager(this.events);
    this.moves = new MoveSystem(this.events);
    this.combat = new CombatSystem(this.entities, this.events);
    this.economy = new EconomySystem(this.events);
    this.matches = new MatchManager(
      this.events, this.state, this.entities, this.combat, this.economy,
    );
  }

  // --- SDK Entry Points ---

  /** Initialize the engine with game configuration */
  initialize(config: GameConfig): void {
    this.gameConfig = config;
    this.tickRate = config.tickRate || 20;

    // Configure economy from game config
    if (config.entryFee || config.rewardPool) {
      this.economy.configure({
        currency: 'USDT' as StablecoinType,
      });
    }
  }

  /** Start the game loop and block simulation */
  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTickTime = performance.now();

    const intervalMs = Math.floor(1000 / this.tickRate);
    this.loopHandle = setInterval(() => this.update(), intervalMs);

    // Simulate block advancement (~2s per block like Avalanche L1)
    this.blockSimInterval = setInterval(() => {
      const currentState = this.state.getState();
      this.state.setBlockNumber(currentState.blockNumber + 1);
      this.processBlock(currentState.blockNumber + 1);
    }, 2000);
  }

  /** Pause the game loop */
  pause(): void {
    if (!this.running) return;
    this.running = false;
    this.clearTimers();
    this.state.setPhase(EngineMatchPhase.PAUSED);
  }

  /** Resume from pause */
  resume(): void {
    if (this.running) return;
    this.state.setPhase(EngineMatchPhase.ACTIVE);
    this.start();
  }

  /** Stop the engine completely */
  stop(): void {
    this.running = false;
    this.clearTimers();
    this.state.stopChainSync();
    this.events.removeAllListeners();
  }

  // --- SDK Accessors ---

  /** Get the match manager for creating/managing matches */
  getMatchManager(): MatchManager {
    return this.matches;
  }

  /** Get the economy system for managing balances and prizes */
  getEconomySystem(): EconomySystem {
    return this.economy;
  }

  /** Get the state manager for state sync and subscriptions */
  getStateManager(): StateManager {
    return this.state;
  }

  /** Get the entity system for ECS operations */
  getEntitySystem(): EntitySystem {
    return this.entities;
  }

  /** Get the combat system */
  getCombatSystem(): CombatSystem {
    return this.combat;
  }

  /** Get the move system */
  getMoveSystem(): MoveSystem {
    return this.moves;
  }

  // --- Match Shortcuts ---

  createMatch(config: MatchConfig): MatchId {
    return this.matches.createMatch(config);
  }

  // --- State Sync ---

  /** Configure on-chain state synchronization */
  configureChainSync(config: ChainSyncConfig): void {
    this.state.syncWithChain(config);
  }

  /** Subscribe to state changes */
  subscribeToState(callback: StateSubscriber): () => void {
    return this.state.subscribeToState(callback);
  }

  // --- Game Loop ---

  private update(): void {
    if (!this.running) return;

    const now = performance.now();
    this.lastTickTime = now;

    const currentState = this.state.getState();
    if (currentState.phase !== EngineMatchPhase.ACTIVE) return;

    this.state.incrementTick();
    this.state.setEntities(this.entities.getAllEntities());
  }

  private processBlock(blockNumber: number): void {
    const currentState = this.state.getState();
    if (currentState.phase !== EngineMatchPhase.ACTIVE) return;

    // Resolve moves due at this block
    const results = this.moves.resolveMovesAtBlock(
      blockNumber,
      (entityId) => {
        const h = this.combat.getHealth(entityId);
        return h ? { current: h.current, max: h.max, shield: h.shield } : undefined;
      },
      (entityId) => {
        const c = this.combat.getCombat(entityId);
        return c ? { attack: c.attack, defense: c.defense, comboCounter: c.comboCounter, moveHistory: c.moveHistory } : undefined;
      },
    );

    for (const result of results) {
      this.combat.applyMoveResult(result);
    }

    // Check win condition
    const updatedState = this.state.getState();
    const winner = this.combat.checkWinCondition(updatedState.players);
    if (winner) {
      this.matches.forceEndMatch(winner);
    }

    // Sync subsystems to state
    this.state.setMoveQueue(this.moves.getQueue());
    this.state.setEconomy(this.economy.getEconomy());
  }

  private clearTimers(): void {
    if (this.loopHandle) {
      clearInterval(this.loopHandle);
      this.loopHandle = null;
    }
    if (this.blockSimInterval) {
      clearInterval(this.blockSimInterval);
      this.blockSimInterval = null;
    }
  }

  // --- Actions ---

  submitAction(action: GameAction): MoveResult | null {
    const currentState = this.state.getState();
    if (currentState.phase !== EngineMatchPhase.ACTIVE) return null;

    const player = currentState.players.get(action.playerId);
    if (!player) return null;

    if (!this.moves.canAffordMove(player, action.speed)) return null;

    const updated = this.economy.deductMoveCost(player, action.speed);
    if (!updated) return null;
    this.state.setPlayer(action.playerId, updated);

    this.moves.submitMove(action, currentState.blockNumber);

    // Instant moves resolve immediately
    if (action.speed === 'instant') {
      const results = this.moves.resolveMovesAtBlock(
        currentState.blockNumber,
        (entityId) => {
          const h = this.combat.getHealth(entityId);
          return h ? { current: h.current, max: h.max, shield: h.shield } : undefined;
        },
        (entityId) => {
          const c = this.combat.getCombat(entityId);
          return c ? { attack: c.attack, defense: c.defense, comboCounter: c.comboCounter, moveHistory: c.moveHistory } : undefined;
        },
      );

      if (results.length > 0) {
        for (const result of results) {
          this.combat.applyMoveResult(result);
        }
        this.state.setMoveQueue(this.moves.getQueue());
        return results[0];
      }
    }

    return null;
  }

  // --- Queries ---

  getState(): EngineState {
    return this.state.getState();
  }

  serialize(): SerializedState {
    return this.state.serialize();
  }

  deserialize(data: SerializedState): void {
    this.state.deserialize(data);
  }

  isRunning(): boolean {
    return this.running;
  }

  getConfig(): GameConfig | null {
    return this.gameConfig;
  }

  // --- Events ---

  on<T = unknown>(event: AvalonEventType, handler: AvalonEventHandler<T>): () => void {
    return this.events.on(event, handler);
  }

  off<T = unknown>(event: AvalonEventType, handler: AvalonEventHandler<T>): void {
    this.events.off(event, handler);
  }

  once<T = unknown>(event: AvalonEventType, handler: AvalonEventHandler<T>): () => void {
    return this.events.once(event, handler);
  }

  /** Subscribe to all events (useful for analytics/replays) */
  onAny(handler: AvalonEventHandler): () => void {
    return this.events.onAny(handler);
  }
}
