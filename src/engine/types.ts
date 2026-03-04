// ============================================================
// Avalon SDK Engine Internal Types
// The blockchain layer for any game. Extends core types with
// engine-specific structures for state, combat, economy, chain sync.
// ============================================================

import type {
  Timestamp, Vector2, MoveType, MoveSpeed, Address,
  GameConfig, StablecoinType, L1Config,
} from '@/types';

// --- Identifiers ---

export type EntityId = string;
export type PlayerId = string;
export type MatchId = string;
export type ComponentName = string;

// --- Entity-Component System ---

export interface EngineEntity {
  id: EntityId;
  type: EngineEntityType;
  components: Map<ComponentName, EngineComponent>;
  active: boolean;
  createdAt: Timestamp;
}

export enum EngineEntityType {
  PLAYER = 'PLAYER',
  NPC = 'NPC',
  PROJECTILE = 'PROJECTILE',
  ITEM = 'ITEM',
  EFFECT = 'EFFECT',
}

export interface EngineComponent {
  name: ComponentName;
  [key: string]: unknown;
}

export interface HealthComp extends EngineComponent {
  name: 'health';
  current: number;
  max: number;
  shield: number;
}

export interface PositionComp extends EngineComponent {
  name: 'position';
  x: number;
  y: number;
}

export interface CombatComp extends EngineComponent {
  name: 'combat';
  attack: number;
  defense: number;
  moveHistory: MoveType[];
  comboCounter: number;
  lastMoveBlock: number;
}

export interface InventoryComp extends EngineComponent {
  name: 'inventory';
  items: { id: string; name: string; quantity: number }[];
  maxSlots: number;
}

export interface AIComp extends EngineComponent {
  name: 'ai';
  behavior: 'idle' | 'patrol' | 'aggressive' | 'defensive';
  targetId: EntityId | null;
  aggroRange: number;
}

// --- Engine State ---

export interface EngineState {
  matchId: MatchId;
  tick: number;
  blockNumber: number;
  phase: EngineMatchPhase;
  entities: Map<EntityId, EngineEntity>;
  players: Map<PlayerId, EnginePlayerState>;
  moveQueue: QueuedMove[];
  economy: EngineEconomyState;
  turnNumber: number;
  timestamp: Timestamp;
}

export enum EngineMatchPhase {
  LOBBY = 'LOBBY',
  READY = 'READY',
  COUNTDOWN = 'COUNTDOWN',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  SETTLED = 'SETTLED',
}

export interface EnginePlayerState {
  id: PlayerId;
  entityId: EntityId;
  name: string;
  address?: Address;
  connected: boolean;
  ready: boolean;
  currency: number;
  score: number;
}

// --- Economy (SDK-level with stablecoin integration) ---

export interface EngineEconomyState {
  prizePool: number;
  totalWagered: number;
  platformFee: number;        // basis points (250 = 2.5%)
  creatorFee: number;         // basis points
  currency: StablecoinType;
  lootDrops: EngineLootDrop[];
  playerBalances: Map<PlayerId, PlayerBalance>;
}

export interface PlayerBalance {
  playerId: PlayerId;
  address?: Address;
  deposited: number;
  withdrawn: number;
  inGame: number;
  available: number;
}

export interface EngineLootDrop {
  id: string;
  amount: number;
  claimedBy: PlayerId | null;
  blockNumber: number;
}

// --- Move System ---

export interface GameAction {
  id: string;
  playerId: PlayerId;
  type: MoveType;
  speed: MoveSpeed;
  targetId?: EntityId;
  position?: Vector2;
  data?: Record<string, unknown>;
  submittedAt: Timestamp;
  submittedBlock: number;
}

export interface QueuedMove {
  action: GameAction;
  executeAtBlock: number;
  visible: boolean;
  resolved: boolean;
}

export interface MoveResult {
  action: GameAction;
  success: boolean;
  damage: number;
  blocked: boolean;
  countered: boolean;
  combo: number;
  effects: MoveEffect[];
}

export interface MoveEffect {
  type: 'DAMAGE' | 'HEAL' | 'SHIELD' | 'STUN';
  targetId: EntityId;
  value: number;
  duration?: number;
}

// --- Match ---

export interface MatchConfig {
  gameConfig: GameConfig;
  matchId: MatchId;
  createdBy: PlayerId;
  wagerAmount: number;
  currency?: StablecoinType;
}

export interface EngineMatchResult {
  matchId: MatchId;
  winnerId: PlayerId | null;
  loserId: PlayerId | null;
  isDraw: boolean;
  duration: number;
  totalTurns: number;
  prizeDistribution: PrizeEntry[];
  settled: boolean;
}

export interface PrizeEntry {
  playerId: PlayerId;
  address?: Address;
  amount: number;
  reason: 'WIN' | 'DRAW' | 'LOOT' | 'REFUND';
}

// --- Events (SDK-level: UI + on-chain logging) ---

export type AvalonEventType =
  // State
  | 'state:changed'
  | 'state:synced'
  // Moves
  | 'move:submitted'
  | 'move:executed'
  | 'move:failed'
  // Combat
  | 'combat:damage'
  | 'combat:heal'
  | 'combat:combo'
  | 'combat:kill'
  // Match
  | 'match:created'
  | 'match:started'
  | 'match:ended'
  | 'match:settled'
  | 'match:phaseChanged'
  // Player
  | 'player:joined'
  | 'player:left'
  | 'player:ready'
  // Economy
  | 'economy:deposit'
  | 'economy:withdraw'
  | 'economy:transfer'
  | 'economy:prizeDistributed'
  // Loot
  | 'loot:dropped'
  | 'loot:claimed'
  // Entity
  | 'entity:created'
  | 'entity:destroyed'
  // Chain
  | 'chain:blockAdvanced'
  | 'chain:synced'
  | 'chain:error';

export interface AvalonEvent<T = unknown> {
  type: AvalonEventType;
  timestamp: Timestamp;
  blockNumber?: number;
  matchId?: MatchId;
  data: T;
  onChain: boolean;  // whether this event should be logged on-chain
}

export type AvalonEventHandler<T = unknown> = (event: AvalonEvent<T>) => void;

// --- On-Chain State Sync ---

export type StateSubscriber = (state: EngineState, diff: StateDiff | null) => void;

export interface ChainSyncConfig {
  l1Config?: L1Config;
  syncInterval: number;      // ms between sync attempts
  autoSync: boolean;
  onChainEvents: AvalonEventType[];  // which events to log on-chain
}

// --- Serialization ---

export interface SerializedState {
  matchId: string;
  tick: number;
  blockNumber: number;
  phase: EngineMatchPhase;
  entities: [string, SerializedEntity][];
  players: [string, EnginePlayerState][];
  moveQueue: QueuedMove[];
  economy: SerializedEconomyState;
  turnNumber: number;
  timestamp: number;
}

// Aliases for backward compatibility with index.ts re-exports
export type EngineEventType = AvalonEventType;
export type EngineEvent<T = unknown> = AvalonEvent<T>;
export type EngineEventHandler<T = unknown> = AvalonEventHandler<T>;

export interface SerializedEconomyState {
  prizePool: number;
  totalWagered: number;
  platformFee: number;
  creatorFee: number;
  currency: StablecoinType;
  lootDrops: EngineLootDrop[];
  playerBalances: [string, PlayerBalance][];
}

export interface SerializedEntity {
  id: string;
  type: EngineEntityType;
  components: [string, EngineComponent][];
  active: boolean;
  createdAt: number;
}

export interface StateDiff {
  tick: number;
  changes: StatePatch[];
}

export interface StatePatch {
  path: string;
  op: 'add' | 'remove' | 'replace';
  value?: unknown;
  oldValue?: unknown;
}

// --- SDK Config ---

export interface AvalonSDKConfig {
  apiKey?: string;
  network: 'mainnet' | 'fuji' | 'local';
  l1Config?: L1Config;
  gameConfig?: GameConfig;
}

// --- Block time mapping for move speeds ---

export const MOVE_BLOCK_DELAYS: Record<MoveSpeed, number> = {
  instant: 0,
  fast: 1,
  normal: 3,
  slow: 6,
};

export const MOVE_COSTS: Record<MoveSpeed, number> = {
  instant: 5,
  fast: 3,
  normal: 2,
  slow: 1,
};

export const MOVE_VISIBILITY: Record<MoveSpeed, boolean> = {
  instant: false,
  fast: false,
  normal: true,
  slow: true,
};

// Revenue split defaults (basis points 10000 = 100%)
export const DEFAULT_PLATFORM_FEE = 500;   // 5%
export const DEFAULT_CREATOR_FEE = 1000;   // 10%
// Remaining 85% goes to prize pool
