// ============================================================
// Avalon SDK State Manager
// On-chain state sync with local state. Immutable updates,
// state diffing, subscriber system, chain synchronization.
// ============================================================

import { EventEmitter } from './EventEmitter';
import type {
  EngineState, EngineMatchPhase, MatchId,
  SerializedState, SerializedEconomyState, SerializedEntity,
  StateDiff, StatePatch, StateSubscriber, ChainSyncConfig,
  EngineEntity, EnginePlayerState, QueuedMove, EngineEconomyState,
  EntityId, PlayerId, PlayerBalance,
} from './types';

const MAX_HISTORY = 100;

export class StateManager {
  private state: EngineState;
  private history: EngineState[] = [];
  private events: EventEmitter;
  private subscribers = new Set<StateSubscriber>();
  private chainSyncConfig: ChainSyncConfig | null = null;
  private syncTimer: ReturnType<typeof setInterval> | null = null;
  private lastSyncedState: SerializedState | null = null;
  private pendingDiffs: StateDiff[] = [];

  constructor(events: EventEmitter) {
    this.events = events;
    this.state = this.createEmptyState('');
  }

  private createEmptyState(matchId: MatchId): EngineState {
    return {
      matchId,
      tick: 0,
      blockNumber: 0,
      phase: 'LOBBY' as EngineMatchPhase,
      entities: new Map(),
      players: new Map(),
      moveQueue: [],
      economy: {
        prizePool: 0,
        totalWagered: 0,
        platformFee: 500,
        creatorFee: 1000,
        currency: 'USDT',
        lootDrops: [],
        playerBalances: new Map(),
      },
      turnNumber: 0,
      timestamp: Date.now(),
    };
  }

  // --- Core API (matches SDK docs: avalon.state.*) ---

  /** avalon.state.get() Get current game state */
  getState(): EngineState {
    return this.state;
  }

  /** avalon.state.update(diff) Apply a state update with diffing */
  updateState(updater: (state: EngineState) => Partial<EngineState>): EngineState {
    const before = this.serialize();
    this.pushHistory();
    const partial = updater(this.state);
    this.state = { ...this.state, ...partial, timestamp: Date.now() };
    const after = this.serialize();

    // Compute diff
    const diff = this.diff(before, after);
    if (diff.changes.length > 0) {
      this.pendingDiffs.push(diff);
    }

    // Notify subscribers
    this.notifySubscribers(diff);
    this.events.emit('state:changed', { tick: this.state.tick, changes: diff.changes.length });
    return this.state;
  }

  /** avalon.state.history() Get state history for replay */
  getHistory(): EngineState[] {
    return [...this.history];
  }

  /** Subscribe to state changes callback fires with new state + diff */
  subscribeToState(callback: StateSubscriber): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  /** Configure and start on-chain state synchronization */
  syncWithChain(config: ChainSyncConfig): void {
    this.chainSyncConfig = config;

    if (config.autoSync && config.syncInterval > 0) {
      this.stopChainSync();
      this.syncTimer = setInterval(() => this.pushToChain(), config.syncInterval);
    }

    if (config.onChainEvents.length > 0) {
      this.events.setOnChainEvents(config.onChainEvents);
    }
  }

  stopChainSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }

  /** Push pending diffs to chain (called by auto-sync or manually) */
  async pushToChain(): Promise<StateDiff[]> {
    if (this.pendingDiffs.length === 0) return [];

    const diffs = [...this.pendingDiffs];
    this.pendingDiffs = [];
    this.lastSyncedState = this.serialize();

    this.events.emit('state:synced', {
      diffs: diffs.length,
      totalChanges: diffs.reduce((sum, d) => sum + d.changes.length, 0),
      blockNumber: this.state.blockNumber,
    });

    return diffs;
  }

  getPendingDiffs(): StateDiff[] {
    return [...this.pendingDiffs];
  }

  // --- Phase Management ---

  initialize(matchId: MatchId): void {
    this.state = this.createEmptyState(matchId);
    this.history = [];
    this.pendingDiffs = [];
    this.lastSyncedState = null;
    this.events.setMatchContext(matchId, 0);
  }

  setPhase(phase: EngineMatchPhase): void {
    this.pushHistory();
    this.state = { ...this.state, phase, timestamp: Date.now() };
    this.events.emit('match:phaseChanged', { phase, matchId: this.state.matchId });
    this.notifySubscribers(null);
  }

  incrementTick(): number {
    this.state = { ...this.state, tick: this.state.tick + 1, timestamp: Date.now() };
    return this.state.tick;
  }

  setBlockNumber(blockNumber: number): void {
    this.state = { ...this.state, blockNumber, timestamp: Date.now() };
    this.events.setMatchContext(this.state.matchId, blockNumber);
    this.events.emit('chain:blockAdvanced', { blockNumber });
  }

  incrementTurn(): number {
    this.state = { ...this.state, turnNumber: this.state.turnNumber + 1, timestamp: Date.now() };
    return this.state.turnNumber;
  }

  // --- Entity State ---

  setEntities(entities: Map<EntityId, EngineEntity>): void {
    this.state = { ...this.state, entities: new Map(entities), timestamp: Date.now() };
  }

  // --- Player State ---

  setPlayer(id: PlayerId, player: EnginePlayerState): void {
    const players = new Map(this.state.players);
    players.set(id, player);
    this.state = { ...this.state, players, timestamp: Date.now() };
  }

  removePlayer(id: PlayerId): void {
    const players = new Map(this.state.players);
    players.delete(id);
    this.state = { ...this.state, players, timestamp: Date.now() };
  }

  getPlayer(id: PlayerId): EnginePlayerState | undefined {
    return this.state.players.get(id);
  }

  // --- Move Queue ---

  setMoveQueue(queue: QueuedMove[]): void {
    this.state = { ...this.state, moveQueue: [...queue], timestamp: Date.now() };
  }

  // --- Economy ---

  setEconomy(economy: EngineEconomyState): void {
    this.state = { ...this.state, economy: { ...economy, playerBalances: new Map(economy.playerBalances) }, timestamp: Date.now() };
  }

  // --- History (Undo/Replay) ---

  private pushHistory(): void {
    this.history.push(this.cloneState(this.state));
    if (this.history.length > MAX_HISTORY) {
      this.history.shift();
    }
  }

  undo(): EngineState | null {
    const prev = this.history.pop();
    if (!prev) return null;
    this.state = prev;
    this.events.emit('state:changed', { tick: this.state.tick, reason: 'undo' });
    this.notifySubscribers(null);
    return this.state;
  }

  getHistoryLength(): number {
    return this.history.length;
  }

  // --- Serialization ---

  serialize(): SerializedState {
    const entities: [string, SerializedEntity][] = [];
    for (const [id, entity] of this.state.entities) {
      entities.push([id, {
        id: entity.id,
        type: entity.type,
        components: Array.from(entity.components.entries()),
        active: entity.active,
        createdAt: entity.createdAt,
      }]);
    }

    const eco = this.state.economy;
    const serializedEconomy: SerializedEconomyState = {
      prizePool: eco.prizePool,
      totalWagered: eco.totalWagered,
      platformFee: eco.platformFee,
      creatorFee: eco.creatorFee,
      currency: eco.currency,
      lootDrops: eco.lootDrops,
      playerBalances: Array.from(eco.playerBalances.entries()),
    };

    return {
      matchId: this.state.matchId,
      tick: this.state.tick,
      blockNumber: this.state.blockNumber,
      phase: this.state.phase,
      entities,
      players: Array.from(this.state.players.entries()),
      moveQueue: this.state.moveQueue,
      economy: serializedEconomy,
      turnNumber: this.state.turnNumber,
      timestamp: this.state.timestamp,
    };
  }

  deserialize(data: SerializedState): void {
    const entities = new Map<EntityId, EngineEntity>();
    for (const [id, se] of data.entities) {
      entities.set(id, {
        id: se.id,
        type: se.type,
        components: new Map(se.components),
        active: se.active,
        createdAt: se.createdAt,
      });
    }

    const eco = data.economy;
    const economyState: EngineEconomyState = {
      prizePool: eco.prizePool,
      totalWagered: eco.totalWagered,
      platformFee: eco.platformFee,
      creatorFee: eco.creatorFee,
      currency: eco.currency,
      lootDrops: eco.lootDrops,
      playerBalances: new Map(eco.playerBalances),
    };

    this.state = {
      matchId: data.matchId,
      tick: data.tick,
      blockNumber: data.blockNumber,
      phase: data.phase,
      entities,
      players: new Map(data.players),
      moveQueue: data.moveQueue,
      economy: economyState,
      turnNumber: data.turnNumber,
      timestamp: data.timestamp,
    };
  }

  // --- State Diffing ---

  diff(oldState: SerializedState, newState: SerializedState): StateDiff {
    const changes: StatePatch[] = [];

    const scalars: (keyof Pick<SerializedState, 'tick' | 'blockNumber' | 'phase' | 'turnNumber'>)[] =
      ['tick', 'blockNumber', 'phase', 'turnNumber'];

    for (const key of scalars) {
      if (oldState[key] !== newState[key]) {
        changes.push({ path: key, op: 'replace', value: newState[key], oldValue: oldState[key] });
      }
    }

    // Player changes
    const oldPlayers = new Map(oldState.players);
    const newPlayers = new Map(newState.players);
    for (const [id, player] of newPlayers) {
      if (!oldPlayers.has(id)) {
        changes.push({ path: `players.${id}`, op: 'add', value: player });
      } else if (JSON.stringify(oldPlayers.get(id)) !== JSON.stringify(player)) {
        changes.push({ path: `players.${id}`, op: 'replace', value: player, oldValue: oldPlayers.get(id) });
      }
    }
    for (const [id] of oldPlayers) {
      if (!newPlayers.has(id)) {
        changes.push({ path: `players.${id}`, op: 'remove', oldValue: oldPlayers.get(id) });
      }
    }

    // Entity changes
    const oldEntities = new Map(oldState.entities);
    const newEntities = new Map(newState.entities);
    for (const [id, entity] of newEntities) {
      if (!oldEntities.has(id)) {
        changes.push({ path: `entities.${id}`, op: 'add', value: entity });
      } else if (JSON.stringify(oldEntities.get(id)) !== JSON.stringify(entity)) {
        changes.push({ path: `entities.${id}`, op: 'replace', value: entity, oldValue: oldEntities.get(id) });
      }
    }
    for (const [id] of oldEntities) {
      if (!newEntities.has(id)) {
        changes.push({ path: `entities.${id}`, op: 'remove', oldValue: oldEntities.get(id) });
      }
    }

    // Economy changes
    if (JSON.stringify(oldState.economy) !== JSON.stringify(newState.economy)) {
      changes.push({ path: 'economy', op: 'replace', value: newState.economy, oldValue: oldState.economy });
    }

    return { tick: newState.tick, changes };
  }

  // --- Helpers ---

  private notifySubscribers(diff: StateDiff | null): void {
    for (const sub of this.subscribers) {
      try {
        sub(this.state, diff);
      } catch (err) {
        console.error('[Avalon StateManager] Subscriber error:', err);
      }
    }
  }

  private cloneState(state: EngineState): EngineState {
    return {
      ...state,
      entities: new Map(Array.from(state.entities.entries()).map(
        ([id, e]) => [id, { ...e, components: new Map(e.components) }]
      )),
      players: new Map(state.players),
      moveQueue: [...state.moveQueue],
      economy: {
        ...state.economy,
        lootDrops: [...state.economy.lootDrops],
        playerBalances: new Map(state.economy.playerBalances),
      },
    };
  }
}
