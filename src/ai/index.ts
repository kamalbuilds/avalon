// ============================================================
// Avalon AI — Barrel Export
// The complete AI NPC system for Avalon SDK
// ============================================================

// --- Core Agent ---
export { AgentCore } from './AgentCore';
export type {
  AgentConfig,
  AgentPerception,
  AgentDecision,
  AgentAction,
  AgentMemory,
  AgentPhase,
  PerceivedEntity,
  MemoryEntry,
  EntityKnowledge,
} from './AgentCore';

// --- Behavior Tree ---
export {
  BehaviorTreeRunner,
  SelectorNode,
  SequenceNode,
  ConditionNode,
  ActionNode,
  DecisionNode,
  InverterNode,
  RepeatNode,
  AlwaysSucceedNode,
} from './BehaviorTree';
export type { BehaviorNode, NodeStatus } from './BehaviorTree';

// --- Personality ---
export { PersonalitySystem, ARCHETYPES } from './PersonalitySystem';
export type {
  PersonalityTraits,
  Mood,
  MoodState,
  NpcArchetype,
  ArchetypeDefinition,
  DialogueStyle,
  EconomicBias,
} from './PersonalitySystem';

// --- Economics ---
export { EconomicAgent } from './EconomicAgent';
export type {
  NpcWallet,
  TradeItem,
  TradeOffer,
  TradeStatus,
  TradeDecision,
  PriceMemory,
} from './EconomicAgent';

// --- ERC-8004 Registry ---
export { AgentRegistry } from './AgentRegistry';
export type {
  ERC8004AgentMeta,
  AgentCapability,
  AgentRegistration,
  RegistryEvent,
  RegistryEventType,
} from './AgentRegistry';

// --- Dialogue ---
export { DialogueSystem } from './DialogueSystem';
export type {
  DialogueLine,
  DialogueCategory,
  DialogueTemplate,
} from './DialogueSystem';

// --- NPC Factory ---
export { NPCFactory } from './NPCFactory';
export type { NPC, NPCSpawnConfig } from './NPCFactory';

// --- Chronos Battle NPCs ---
export {
  CHRONOS_NPCS,
  ARIA_THE_MERCHANT,
  KAEL_THE_WARRIOR,
  NOVA_THE_TRICKSTER,
  SAGE_THE_SCHOLAR,
  IRON_GUARDIAN,
  getChronosNPC,
  getChronosNPCByName,
  getChronosNPCsByDifficulty,
} from './npcs/chronos-npcs';
export type { ChronosNPCProfile } from './npcs/chronos-npcs';

// --- Chronos Bridge (BT → Game Moves) ---
export {
  getChronosBridgeDecision,
  getNPCReactionTime,
} from './ChronosBridge';
export type { AIThinkingState, ThinkingFactor } from './ChronosBridge';

// --- React Hooks ---
export { useNPCDialogue, getNPCDialogue } from './useNPCDialogue';
export type { UseNPCDialogueReturn, NPCDialogueLine, DialogueMoment } from './useNPCDialogue';

export { useNPCPersonality } from './useNPCPersonality';
export type { UseNPCPersonalityReturn, NPCLiveState, NPCWalletStats } from './useNPCPersonality';
