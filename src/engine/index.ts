// ============================================================
// Avalon SDK — Public API
// ============================================================

// SDK entry point
export { Avalon, default as AvalonSDK } from './sdk/AvalonSDK';
export type {
  L1DeployConfig, L1Status,
  CreateAgentConfig, AgentHandle,
  LootTableConfig, LootRollResult,
  EconomyConfig,
  OnboardConfig, OnboardedPlayer,
} from './sdk/AvalonSDK';

// Core engine
export { GameEngine } from './GameEngine';
export { EventEmitter } from './EventEmitter';
export { EntitySystem } from './EntitySystem';
export { StateManager } from './StateManager';
export { MoveSystem } from './MoveSystem';
export { CombatSystem } from './CombatSystem';
export { EconomySystem } from './EconomySystem';
export { MatchManager } from './MatchManager';

// Types
export type {
  EntityId, PlayerId, MatchId, ComponentName,
  EngineEntity, EngineComponent,
  HealthComp, PositionComp, CombatComp, InventoryComp, AIComp,
  EngineState, EnginePlayerState,
  EngineEconomyState, EngineLootDrop, PlayerBalance,
  GameAction, QueuedMove, MoveResult, MoveEffect,
  MatchConfig, EngineMatchResult, PrizeEntry,
  AvalonEventType, AvalonEvent, AvalonEventHandler,
  AvalonSDKConfig, ChainSyncConfig, StateSubscriber,
  SerializedState, SerializedEconomyState, SerializedEntity,
  StateDiff, StatePatch,
} from './types';

export { EngineEntityType, EngineMatchPhase } from './types';

export {
  MOVE_BLOCK_DELAYS, MOVE_COSTS, MOVE_VISIBILITY,
  DEFAULT_PLATFORM_FEE, DEFAULT_CREATOR_FEE,
} from './types';
