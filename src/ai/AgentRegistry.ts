// ============================================================
// Avalon AI Agent Registry (ERC-8004 Interface)
// On-chain identity registration for AI NPCs
// Each NPC is a tokenized agent with verifiable capabilities
// ============================================================

import type { Address, TokenId, Timestamp, AgentIdentity } from '@/types';
import type { NpcArchetype } from './PersonalitySystem';

// --- ERC-8004 Agent Metadata ---

export interface ERC8004AgentMeta {
  tokenId: TokenId;
  contractAddress: Address;
  owner: Address;
  name: string;
  archetype: NpcArchetype;
  capabilities: AgentCapability[];
  modelUri: string;
  personality: string;     // JSON-encoded personality traits
  registeredAt: Timestamp;
  lastActiveAt: Timestamp;
  isActive: boolean;
  version: number;
}

export type AgentCapability =
  | 'trade'
  | 'combat'
  | 'dialogue'
  | 'craft'
  | 'patrol'
  | 'quest_give'
  | 'heal'
  | 'guard'
  | 'scout'
  | 'teach';

export interface AgentRegistration {
  name: string;
  archetype: NpcArchetype;
  capabilities: AgentCapability[];
  modelUri: string;
  personality: string;
  owner: Address;
}

// --- Registry Events ---

export interface RegistryEvent {
  type: RegistryEventType;
  agentId: TokenId;
  data: Record<string, unknown>;
  timestamp: Timestamp;
  blockNumber?: number;
}

export type RegistryEventType =
  | 'registered'
  | 'deregistered'
  | 'updated'
  | 'transferred'
  | 'capability_added'
  | 'capability_removed';

// --- Agent Registry ---

export class AgentRegistry {
  private agents = new Map<TokenId, ERC8004AgentMeta>();
  private agentsByOwner = new Map<Address, Set<TokenId>>();
  private nextTokenId = 1;
  private contractAddress: Address;
  private eventLog: RegistryEvent[] = [];

  constructor(contractAddress: Address) {
    this.contractAddress = contractAddress;
  }

  // --- Registration ---

  registerAgent(registration: AgentRegistration): ERC8004AgentMeta {
    const tokenId = `${this.nextTokenId++}` as TokenId;
    const now = Date.now();

    const agent: ERC8004AgentMeta = {
      tokenId,
      contractAddress: this.contractAddress,
      owner: registration.owner,
      name: registration.name,
      archetype: registration.archetype,
      capabilities: [...registration.capabilities],
      modelUri: registration.modelUri,
      personality: registration.personality,
      registeredAt: now,
      lastActiveAt: now,
      isActive: true,
      version: 1,
    };

    this.agents.set(tokenId, agent);

    // Track by owner
    if (!this.agentsByOwner.has(registration.owner)) {
      this.agentsByOwner.set(registration.owner, new Set());
    }
    this.agentsByOwner.get(registration.owner)!.add(tokenId);

    this.logEvent('registered', tokenId, { name: agent.name, archetype: agent.archetype });
    return agent;
  }

  deregisterAgent(tokenId: TokenId): boolean {
    const agent = this.agents.get(tokenId);
    if (!agent) return false;

    agent.isActive = false;
    this.logEvent('deregistered', tokenId, {});
    return true;
  }

  // --- Query ---

  getAgent(tokenId: TokenId): ERC8004AgentMeta | undefined {
    return this.agents.get(tokenId);
  }

  getAgentsByOwner(owner: Address): ERC8004AgentMeta[] {
    const tokenIds = this.agentsByOwner.get(owner);
    if (!tokenIds) return [];
    const result: ERC8004AgentMeta[] = [];
    for (const id of tokenIds) {
      const agent = this.agents.get(id);
      if (agent) result.push(agent);
    }
    return result;
  }

  getActiveAgents(): ERC8004AgentMeta[] {
    const result: ERC8004AgentMeta[] = [];
    for (const agent of this.agents.values()) {
      if (agent.isActive) result.push(agent);
    }
    return result;
  }

  getAgentsByArchetype(archetype: NpcArchetype): ERC8004AgentMeta[] {
    const result: ERC8004AgentMeta[] = [];
    for (const agent of this.agents.values()) {
      if (agent.archetype === archetype && agent.isActive) result.push(agent);
    }
    return result;
  }

  getAgentsByCapability(capability: AgentCapability): ERC8004AgentMeta[] {
    const result: ERC8004AgentMeta[] = [];
    for (const agent of this.agents.values()) {
      if (agent.isActive && agent.capabilities.includes(capability)) {
        result.push(agent);
      }
    }
    return result;
  }

  getTotalRegistered(): number {
    return this.agents.size;
  }

  getTotalActive(): number {
    let count = 0;
    for (const agent of this.agents.values()) {
      if (agent.isActive) count++;
    }
    return count;
  }

  // --- Mutations ---

  updateAgent(tokenId: TokenId, updates: Partial<Pick<ERC8004AgentMeta, 'name' | 'modelUri' | 'personality'>>): boolean {
    const agent = this.agents.get(tokenId);
    if (!agent) return false;

    if (updates.name !== undefined) agent.name = updates.name;
    if (updates.modelUri !== undefined) agent.modelUri = updates.modelUri;
    if (updates.personality !== undefined) agent.personality = updates.personality;
    agent.version++;
    agent.lastActiveAt = Date.now();

    this.logEvent('updated', tokenId, updates);
    return true;
  }

  addCapability(tokenId: TokenId, capability: AgentCapability): boolean {
    const agent = this.agents.get(tokenId);
    if (!agent || agent.capabilities.includes(capability)) return false;

    agent.capabilities.push(capability);
    agent.version++;
    this.logEvent('capability_added', tokenId, { capability });
    return true;
  }

  removeCapability(tokenId: TokenId, capability: AgentCapability): boolean {
    const agent = this.agents.get(tokenId);
    if (!agent) return false;

    const idx = agent.capabilities.indexOf(capability);
    if (idx === -1) return false;

    agent.capabilities.splice(idx, 1);
    agent.version++;
    this.logEvent('capability_removed', tokenId, { capability });
    return true;
  }

  transferAgent(tokenId: TokenId, newOwner: Address): boolean {
    const agent = this.agents.get(tokenId);
    if (!agent) return false;

    const oldOwner = agent.owner;

    // Remove from old owner
    this.agentsByOwner.get(oldOwner)?.delete(tokenId);

    // Add to new owner
    if (!this.agentsByOwner.has(newOwner)) {
      this.agentsByOwner.set(newOwner, new Set());
    }
    this.agentsByOwner.get(newOwner)!.add(tokenId);

    agent.owner = newOwner;
    agent.version++;
    this.logEvent('transferred', tokenId, { from: oldOwner, to: newOwner });
    return true;
  }

  // --- Identity Conversion ---

  toAgentIdentity(tokenId: TokenId): AgentIdentity | undefined {
    const agent = this.agents.get(tokenId);
    if (!agent) return undefined;

    return {
      tokenId: agent.tokenId,
      contractAddress: agent.contractAddress,
      owner: agent.owner,
      name: agent.name,
      personality: agent.personality,
      capabilities: agent.capabilities,
      modelUri: agent.modelUri,
      registeredAt: agent.registeredAt,
    };
  }

  // --- Event Log ---

  private logEvent(type: RegistryEventType, agentId: TokenId, data: Record<string, unknown>): void {
    this.eventLog.push({
      type,
      agentId,
      data,
      timestamp: Date.now(),
    });
    // Keep last 500 events
    if (this.eventLog.length > 500) {
      this.eventLog = this.eventLog.slice(-500);
    }
  }

  getEventLog(limit = 50): ReadonlyArray<RegistryEvent> {
    return this.eventLog.slice(-limit);
  }

  getContractAddress(): Address {
    return this.contractAddress;
  }
}
