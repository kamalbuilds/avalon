// ============================================================
// Avalon AI Agent Core
// Base agent with perceive-think-act pipeline
// Every NPC runs this loop: sense the world, decide, act
// ============================================================

import { EventEmitter } from '@/engine/EventEmitter';
import type { EntityId, EngineEntity, PositionComp, HealthComp } from '@/engine/types';
import type { Vector2, Timestamp, Address } from '@/types';

// --- Agent State ---

export interface AgentPerception {
  nearbyEntities: PerceivedEntity[];
  threats: PerceivedEntity[];
  opportunities: PerceivedEntity[];
  selfHealth: number;
  selfMaxHealth: number;
  selfPosition: Vector2;
  currentTick: number;
  timestamp: Timestamp;
}

export interface PerceivedEntity {
  entityId: EntityId;
  type: string;
  position: Vector2;
  distance: number;
  health?: number;
  isThreat: boolean;
  isAlly: boolean;
  lastSeen: Timestamp;
}

export interface AgentDecision {
  action: AgentAction;
  target?: EntityId;
  position?: Vector2;
  priority: number;
  confidence: number;
  reasoning: string;
}

export type AgentAction =
  | 'idle'
  | 'patrol'
  | 'chase'
  | 'attack'
  | 'flee'
  | 'trade'
  | 'dialogue'
  | 'heal'
  | 'guard'
  | 'wander'
  | 'interact'
  | 'gather';

export interface AgentMemory {
  shortTerm: MemoryEntry[];
  longTerm: MemoryEntry[];
  knownEntities: Map<EntityId, EntityKnowledge>;
  maxShortTerm: number;
  maxLongTerm: number;
}

export interface MemoryEntry {
  event: string;
  entityId?: EntityId;
  position?: Vector2;
  timestamp: Timestamp;
  importance: number;
  data?: Record<string, unknown>;
}

export interface EntityKnowledge {
  entityId: EntityId;
  lastPosition: Vector2;
  lastSeen: Timestamp;
  interactionCount: number;
  reputation: number; // -100 to 100
  tags: string[];
}

// --- Agent Config ---

export interface AgentConfig {
  id: string;
  entityId: EntityId;
  name: string;
  walletAddress: Address;
  perceptionRadius: number;
  decisionInterval: number; // ms between think cycles
  memoryCapacity: { shortTerm: number; longTerm: number };
}

// --- Agent Core ---

export type AgentPhase = 'idle' | 'perceiving' | 'thinking' | 'acting';

export class AgentCore {
  readonly config: AgentConfig;
  private phase: AgentPhase = 'idle';
  private lastDecision: AgentDecision | null = null;
  private lastPerception: AgentPerception | null = null;
  private memory: AgentMemory;
  private events: EventEmitter;
  private running = false;
  private tickTimer: ReturnType<typeof setInterval> | null = null;

  // Extension points set by subsystems (PersonalitySystem, EconomicAgent, etc.)
  private thinkFn: ((perception: AgentPerception, memory: AgentMemory) => AgentDecision) | null = null;
  private actFn: ((decision: AgentDecision) => void) | null = null;
  private perceiveFn: ((selfEntity: { position: Vector2; health: number; maxHealth: number }, nearbyEntities: PerceivedEntity[], tick: number) => AgentPerception) | null = null;

  // Reputation tracker
  private reputation = 50; // 0-100 neutral start

  constructor(config: AgentConfig, events: EventEmitter) {
    this.config = config;
    this.events = events;
    this.memory = {
      shortTerm: [],
      longTerm: [],
      knownEntities: new Map(),
      maxShortTerm: config.memoryCapacity.shortTerm,
      maxLongTerm: config.memoryCapacity.longTerm,
    };
  }

  // --- Extension Registration ---

  setThinkFunction(fn: (perception: AgentPerception, memory: AgentMemory) => AgentDecision): void {
    this.thinkFn = fn;
  }

  setActFunction(fn: (decision: AgentDecision) => void): void {
    this.actFn = fn;
  }

  setPerceiveFunction(fn: (selfEntity: { position: Vector2; health: number; maxHealth: number }, nearbyEntities: PerceivedEntity[], tick: number) => AgentPerception): void {
    this.perceiveFn = fn;
  }

  // --- Lifecycle ---

  start(): void {
    if (this.running) return;
    this.running = true;
    this.tickTimer = setInterval(() => this.tick(0), this.config.decisionInterval);
    this.events.emit('entity:created', { entityId: this.config.entityId, type: 'NPC' });
  }

  stop(): void {
    this.running = false;
    if (this.tickTimer) {
      clearInterval(this.tickTimer);
      this.tickTimer = null;
    }
  }

  isRunning(): boolean {
    return this.running;
  }

  getPhase(): AgentPhase {
    return this.phase;
  }

  // --- Perceive-Think-Act Pipeline ---

  tick(currentTick: number): void {
    if (!this.running) return;

    // 1. PERCEIVE
    this.phase = 'perceiving';
    const perception = this.perceive(currentTick);
    this.lastPerception = perception;

    // 2. THINK
    this.phase = 'thinking';
    const decision = this.think(perception);
    this.lastDecision = decision;

    // 3. ACT
    this.phase = 'acting';
    this.act(decision);

    this.phase = 'idle';
  }

  private perceive(currentTick: number): AgentPerception {
    const selfData = {
      position: { x: 0, y: 0 } as Vector2,
      health: 100,
      maxHealth: 100,
    };

    const nearbyEntities: PerceivedEntity[] = [];

    if (this.perceiveFn) {
      return this.perceiveFn(selfData, nearbyEntities, currentTick);
    }

    // Default perception return what we know
    return {
      nearbyEntities,
      threats: nearbyEntities.filter(e => e.isThreat),
      opportunities: nearbyEntities.filter(e => !e.isThreat && !e.isAlly),
      selfHealth: selfData.health,
      selfMaxHealth: selfData.maxHealth,
      selfPosition: selfData.position,
      currentTick,
      timestamp: Date.now(),
    };
  }

  private think(perception: AgentPerception): AgentDecision {
    if (this.thinkFn) {
      return this.thinkFn(perception, this.memory);
    }

    // Default think idle behavior
    const healthPercent = (perception.selfHealth / perception.selfMaxHealth) * 100;

    // Flee if low health
    if (healthPercent < 20 && perception.threats.length > 0) {
      return {
        action: 'flee',
        priority: 10,
        confidence: 0.9,
        reasoning: 'Low health, threats nearby retreat',
      };
    }

    // Attack if threat nearby
    if (perception.threats.length > 0) {
      const nearest = perception.threats[0];
      return {
        action: 'attack',
        target: nearest.entityId,
        position: nearest.position,
        priority: 8,
        confidence: 0.7,
        reasoning: `Threat detected: ${nearest.entityId}`,
      };
    }

    // Wander by default
    return {
      action: 'wander',
      priority: 1,
      confidence: 0.5,
      reasoning: 'No threats, wandering',
    };
  }

  private act(decision: AgentDecision): void {
    if (this.actFn) {
      this.actFn(decision);
      return;
    }

    // Emit events for the action
    this.events.emit('move:submitted', {
      entityId: this.config.entityId,
      action: decision.action,
      target: decision.target,
      position: decision.position,
      timestamp: Date.now(),
    });
  }

  // --- Memory ---

  remember(entry: Omit<MemoryEntry, 'timestamp'>): void {
    const memoryEntry: MemoryEntry = { ...entry, timestamp: Date.now() };

    this.memory.shortTerm.push(memoryEntry);

    // Promote important memories to long-term
    if (entry.importance >= 7) {
      this.memory.longTerm.push(memoryEntry);
    }

    // Trim short-term memory
    if (this.memory.shortTerm.length > this.memory.maxShortTerm) {
      this.memory.shortTerm.shift();
    }

    // Trim long-term memory (remove least important)
    if (this.memory.longTerm.length > this.memory.maxLongTerm) {
      this.memory.longTerm.sort((a, b) => a.importance - b.importance);
      this.memory.longTerm.shift();
    }
  }

  updateEntityKnowledge(entityId: EntityId, position: Vector2, tags?: string[]): void {
    const existing = this.memory.knownEntities.get(entityId);
    if (existing) {
      existing.lastPosition = position;
      existing.lastSeen = Date.now();
      existing.interactionCount++;
      if (tags) existing.tags = [...new Set([...existing.tags, ...tags])];
    } else {
      this.memory.knownEntities.set(entityId, {
        entityId,
        lastPosition: position,
        lastSeen: Date.now(),
        interactionCount: 1,
        reputation: 0,
        tags: tags ?? [],
      });
    }
  }

  getEntityKnowledge(entityId: EntityId): EntityKnowledge | undefined {
    return this.memory.knownEntities.get(entityId);
  }

  // --- Reputation ---

  getReputation(): number {
    return this.reputation;
  }

  adjustReputation(delta: number): void {
    this.reputation = Math.max(0, Math.min(100, this.reputation + delta));
  }

  // --- Accessors ---

  getLastDecision(): AgentDecision | null {
    return this.lastDecision;
  }

  getLastPerception(): AgentPerception | null {
    return this.lastPerception;
  }

  getMemory(): Readonly<AgentMemory> {
    return this.memory;
  }
}
