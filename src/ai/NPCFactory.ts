// ============================================================
// Avalon AI NPC Factory
// Create fully wired NPCs from archetypes
// Merchant, Guardian, Trickster, Scholar, Warrior
// Each NPC: wallet + reputation + behavior tree + personality
// ============================================================

import { EventEmitter } from '@/engine/EventEmitter';
import type { Address, Vector2 } from '@/types';
import { AgentCore, type AgentConfig, type AgentPerception, type AgentMemory, type AgentDecision } from './AgentCore';
import {
  BehaviorTreeRunner,
  SelectorNode,
  SequenceNode,
  ConditionNode,
  DecisionNode,
} from './BehaviorTree';
import { PersonalitySystem, type NpcArchetype } from './PersonalitySystem';
import { EconomicAgent } from './EconomicAgent';
import { AgentRegistry, type AgentRegistration, type AgentCapability } from './AgentRegistry';
import { DialogueSystem } from './DialogueSystem';

// --- NPC Bundle ---

export interface NPC {
  id: string;
  name: string;
  archetype: NpcArchetype;
  core: AgentCore;
  personality: PersonalitySystem;
  economy: EconomicAgent;
  dialogue: DialogueSystem;
  behaviorTree: BehaviorTreeRunner;
  walletAddress: Address;
  homePosition: Vector2;
  isAlive: boolean;
}

export interface NPCSpawnConfig {
  name: string;
  archetype: NpcArchetype;
  walletAddress: Address;
  homePosition: Vector2;
  ownerAddress: Address;
  initialBalance?: number;
  perceptionRadius?: number;
  decisionInterval?: number;
  traitOverrides?: Partial<import('./PersonalitySystem').PersonalityTraits>;
}

// --- Archetype Capability Maps ---

const ARCHETYPE_CAPABILITIES: Record<NpcArchetype, AgentCapability[]> = {
  merchant: ['trade', 'dialogue'],
  guardian: ['combat', 'guard', 'patrol'],
  trickster: ['dialogue', 'trade', 'scout'],
  scholar: ['dialogue', 'quest_give', 'teach'],
  warrior: ['combat', 'patrol', 'guard'],
};

// --- Behavior Tree Builders ---

function buildMerchantTree(): BehaviorTreeRunner {
  const root = new SelectorNode('merchant-root', [
    // Priority 1: Flee if in danger and low health
    new SequenceNode('flee-if-danger', [
      new ConditionNode('low-health', (p) => (p.selfHealth / p.selfMaxHealth) < 0.25),
      new ConditionNode('has-threats', (p) => p.threats.length > 0),
      new DecisionNode({ name: 'flee', action: 'flee', priority: 10, confidence: 0.95, reasoning: 'Merchant fleeing health critical' }),
    ]),
    // Priority 2: Trade if someone is nearby and friendly
    new SequenceNode('trade-opportunity', [
      new ConditionNode('has-opportunities', (p) => p.opportunities.length > 0),
      new DecisionNode({
        name: 'trade',
        action: 'trade',
        priority: 7,
        confidence: 0.8,
        reasoning: 'Potential trade partner nearby',
        targetFn: (p) => p.opportunities[0]?.entityId,
      }),
    ]),
    // Priority 3: Dialogue with nearby entities
    new SequenceNode('talk', [
      new ConditionNode('someone-nearby', (p) => p.nearbyEntities.length > 0),
      new DecisionNode({
        name: 'dialogue',
        action: 'dialogue',
        priority: 5,
        confidence: 0.7,
        reasoning: 'Someone to talk to',
        targetFn: (p) => p.nearbyEntities[0]?.entityId,
      }),
    ]),
    // Fallback: Idle
    new DecisionNode({ name: 'idle', action: 'idle', priority: 1, confidence: 1, reasoning: 'No customers, waiting' }),
  ]);

  return new BehaviorTreeRunner(root);
}

function buildGuardianTree(): BehaviorTreeRunner {
  const root = new SelectorNode('guardian-root', [
    // Priority 1: Attack threats
    new SequenceNode('engage-threat', [
      new ConditionNode('has-threats', (p) => p.threats.length > 0),
      new DecisionNode({
        name: 'attack-threat',
        action: 'attack',
        priority: 9,
        confidence: 0.85,
        reasoning: 'Threat detected engaging',
        targetFn: (p) => p.threats[0]?.entityId,
        positionFn: (p) => p.threats[0]?.position,
      }),
    ]),
    // Priority 2: Chase fleeing threats
    new SequenceNode('chase-threat', [
      new ConditionNode('threat-far', (p) => p.threats.some(t => t.distance > 100)),
      new DecisionNode({
        name: 'chase',
        action: 'chase',
        priority: 8,
        confidence: 0.7,
        reasoning: 'Pursuing threat',
        targetFn: (p) => p.threats.find(t => t.distance > 100)?.entityId,
      }),
    ]),
    // Priority 3: Patrol
    new DecisionNode({ name: 'patrol', action: 'patrol', priority: 4, confidence: 0.9, reasoning: 'Patrolling perimeter' }),
    // Fallback: Guard position
    new DecisionNode({ name: 'guard', action: 'guard', priority: 3, confidence: 1, reasoning: 'Holding position' }),
  ]);

  return new BehaviorTreeRunner(root);
}

function buildTricksterTree(): BehaviorTreeRunner {
  const root = new SelectorNode('trickster-root', [
    // Priority 1: Flee from overwhelming threats
    new SequenceNode('flee-danger', [
      new ConditionNode('many-threats', (p) => p.threats.length >= 2),
      new DecisionNode({ name: 'flee', action: 'flee', priority: 10, confidence: 0.9, reasoning: 'Too many threats, disappearing' }),
    ]),
    // Priority 2: Interact/trick nearby entities
    new SequenceNode('trick', [
      new ConditionNode('has-targets', (p) => p.nearbyEntities.length > 0),
      new DecisionNode({
        name: 'interact',
        action: 'interact',
        priority: 7,
        confidence: 0.75,
        reasoning: 'Time for some mischief',
        targetFn: (p) => p.nearbyEntities[0]?.entityId,
      }),
    ]),
    // Priority 3: Trade shady deals
    new SequenceNode('shady-trade', [
      new ConditionNode('opportunity', (p) => p.opportunities.length > 0),
      new DecisionNode({
        name: 'trade',
        action: 'trade',
        priority: 6,
        confidence: 0.65,
        reasoning: 'I\'ve got a deal for you...',
        targetFn: (p) => p.opportunities[0]?.entityId,
      }),
    ]),
    // Fallback: Wander and cause chaos
    new DecisionNode({ name: 'wander', action: 'wander', priority: 3, confidence: 0.8, reasoning: 'Looking for trouble' }),
  ]);

  return new BehaviorTreeRunner(root);
}

function buildScholarTree(): BehaviorTreeRunner {
  const root = new SelectorNode('scholar-root', [
    // Priority 1: Flee if threatened
    new SequenceNode('flee', [
      new ConditionNode('has-threats', (p) => p.threats.length > 0),
      new DecisionNode({ name: 'flee', action: 'flee', priority: 9, confidence: 0.9, reasoning: 'Discretion is the better part of valor' }),
    ]),
    // Priority 2: Dialogue with visitors
    new SequenceNode('share-knowledge', [
      new ConditionNode('has-visitors', (p) => p.nearbyEntities.length > 0),
      new DecisionNode({
        name: 'dialogue',
        action: 'dialogue',
        priority: 7,
        confidence: 0.85,
        reasoning: 'A student approaches time to teach',
        targetFn: (p) => p.nearbyEntities[0]?.entityId,
      }),
    ]),
    // Priority 3: Gather knowledge / research
    new DecisionNode({ name: 'gather', action: 'gather', priority: 5, confidence: 0.8, reasoning: 'Continuing research' }),
    // Fallback: Wander and observe
    new DecisionNode({ name: 'wander', action: 'wander', priority: 2, confidence: 0.7, reasoning: 'Observing the world' }),
  ]);

  return new BehaviorTreeRunner(root);
}

function buildWarriorTree(): BehaviorTreeRunner {
  const root = new SelectorNode('warrior-root', [
    // Priority 1: Attack nearest threat
    new SequenceNode('fight', [
      new ConditionNode('has-threats', (p) => p.threats.length > 0),
      new DecisionNode({
        name: 'attack',
        action: 'attack',
        priority: 9,
        confidence: 0.9,
        reasoning: 'FIGHT!',
        targetFn: (p) => p.threats[0]?.entityId,
        positionFn: (p) => p.threats[0]?.position,
      }),
    ]),
    // Priority 2: Flee only at very low health
    new SequenceNode('tactical-retreat', [
      new ConditionNode('near-death', (p) => (p.selfHealth / p.selfMaxHealth) < 0.1),
      new DecisionNode({ name: 'flee', action: 'flee', priority: 8, confidence: 0.6, reasoning: 'Live to fight another day...' }),
    ]),
    // Priority 3: Patrol looking for fights
    new DecisionNode({ name: 'patrol', action: 'patrol', priority: 5, confidence: 0.85, reasoning: 'Seeking worthy opponents' }),
    // Fallback: Guard
    new DecisionNode({ name: 'guard', action: 'guard', priority: 3, confidence: 0.9, reasoning: 'Standing ready' }),
  ]);

  return new BehaviorTreeRunner(root);
}

const TREE_BUILDERS: Record<NpcArchetype, () => BehaviorTreeRunner> = {
  merchant: buildMerchantTree,
  guardian: buildGuardianTree,
  trickster: buildTricksterTree,
  scholar: buildScholarTree,
  warrior: buildWarriorTree,
};

// --- NPC Factory ---

export class NPCFactory {
  private events: EventEmitter;
  private registry: AgentRegistry;
  private npcs = new Map<string, NPC>();

  constructor(events: EventEmitter, registry: AgentRegistry) {
    this.events = events;
    this.registry = registry;
  }

  spawn(config: NPCSpawnConfig): NPC {
    const id = `npc_${config.archetype}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    // 1. Create personality
    const personality = new PersonalitySystem(config.archetype, config.traitOverrides);

    // 2. Create economic agent with wallet
    const economy = new EconomicAgent(config.walletAddress, personality, config.initialBalance ?? 100);

    // 3. Create dialogue system
    const dialogue = new DialogueSystem(config.name, personality);

    // 4. Build behavior tree for archetype
    const behaviorTree = TREE_BUILDERS[config.archetype]();

    // 5. Create agent core with perceive-think-act pipeline
    const agentConfig: AgentConfig = {
      id,
      entityId: id,
      name: config.name,
      walletAddress: config.walletAddress,
      perceptionRadius: config.perceptionRadius ?? 200,
      decisionInterval: config.decisionInterval ?? 500,
      memoryCapacity: { shortTerm: 50, longTerm: 200 },
    };

    const core = new AgentCore(agentConfig, this.events);

    // Wire the behavior tree into the think function
    core.setThinkFunction((perception: AgentPerception, memory: AgentMemory): AgentDecision => {
      // Run behavior tree to get base decision
      const baseDecision = behaviorTree.run(perception, memory);

      // Modify through personality
      const modifiedDecision = personality.modifyDecision(baseDecision, perception);

      // Tick mood
      personality.tickMood();

      // Run economic tick
      economy.economicTick();

      return modifiedDecision;
    });

    // 6. Register in ERC-8004 registry
    const registration: AgentRegistration = {
      name: config.name,
      archetype: config.archetype,
      capabilities: ARCHETYPE_CAPABILITIES[config.archetype],
      modelUri: `avaforge://npc/${config.archetype}/${id}`,
      personality: JSON.stringify(personality.getTraits()),
      owner: config.ownerAddress,
    };
    this.registry.registerAgent(registration);

    // 7. Assemble NPC
    const npc: NPC = {
      id,
      name: config.name,
      archetype: config.archetype,
      core,
      personality,
      economy,
      dialogue,
      behaviorTree,
      walletAddress: config.walletAddress,
      homePosition: config.homePosition,
      isAlive: true,
    };

    this.npcs.set(id, npc);
    return npc;
  }

  despawn(npcId: string): boolean {
    const npc = this.npcs.get(npcId);
    if (!npc) return false;

    npc.core.stop();
    npc.isAlive = false;
    this.npcs.delete(npcId);
    return true;
  }

  getNPC(npcId: string): NPC | undefined {
    return this.npcs.get(npcId);
  }

  getAllNPCs(): NPC[] {
    return Array.from(this.npcs.values());
  }

  getAliveNPCs(): NPC[] {
    return Array.from(this.npcs.values()).filter(n => n.isAlive);
  }

  getNPCsByArchetype(archetype: NpcArchetype): NPC[] {
    return Array.from(this.npcs.values()).filter(n => n.archetype === archetype && n.isAlive);
  }

  startAll(): void {
    for (const npc of this.npcs.values()) {
      if (npc.isAlive) npc.core.start();
    }
  }

  stopAll(): void {
    for (const npc of this.npcs.values()) {
      npc.core.stop();
    }
  }

  getCount(): number {
    return this.npcs.size;
  }
}
