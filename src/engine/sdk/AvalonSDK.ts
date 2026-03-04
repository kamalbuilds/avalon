// ============================================================
// Avalon SDK — Main Entry Point
// This is THE class that developers import:
//   import { Avalon } from '@avalon/sdk';
//   const avalon = new Avalon({ apiKey, network });
//
// Modules: avalon.l1, avalon.agents, avalon.vrf,
//          avalon.economy, avalon.state, avalon.onboard
// ============================================================

import { GameEngine } from '../GameEngine';
import { EventEmitter } from '../EventEmitter';
import { StateManager } from '../StateManager';
import { EconomySystem } from '../EconomySystem';
import { MatchManager } from '../MatchManager';
import type {
  AvalonSDKConfig, AvalonEventType, AvalonEventHandler,
  MatchConfig, EngineState, SerializedState, StateDiff,
  StateSubscriber, PlayerId, MatchId, PlayerBalance,
} from '../types';
import type {
  GameConfig, L1Config, StablecoinType, Address,
  AgentIdentity, LootTable, LootDrop, VRFRequest,
} from '@/types';

// --- L1 Module ---

export interface L1DeployConfig {
  name: string;
  blockTime?: number;
  gasToken?: string;
  validatorSet?: Address[];
}

export interface L1Status {
  chainId: number;
  name: string;
  blockHeight: number;
  isHealthy: boolean;
  rpcUrl: string;
  wsUrl: string;
}

class L1Module {
  private config: L1Config | null = null;

  async deploy(opts: L1DeployConfig): Promise<L1Status> {
    // In production, this calls the Avalanche L1 deployment API.
    // For the SDK, we return a simulated L1 status.
    this.config = {
      chainId: 43114 + Math.floor(Math.random() * 10000),
      chainName: opts.name,
      subnetId: `subnet-${Date.now().toString(36)}`,
      rpcUrl: `https://${opts.name.toLowerCase().replace(/\s/g, '-')}.avax.network/rpc`,
      wsUrl: `wss://${opts.name.toLowerCase().replace(/\s/g, '-')}.avax.network/ws`,
      explorerUrl: `https://explorer.avax.network/subnet/${opts.name.toLowerCase().replace(/\s/g, '-')}`,
      blockTime: {
        targetBlockTime: opts.blockTime ?? 2,
        minBlockTime: 1,
        maxBlockTime: 5,
      },
      nativeCurrency: {
        name: opts.gasToken ?? 'AVAX',
        symbol: opts.gasToken ?? 'AVAX',
        decimals: 18,
      },
      contracts: {
        gameRegistry: '0x0000000000000000000000000000000000000000' as Address,
        npcRegistry: '0x0000000000000000000000000000000000000000' as Address,
        lootContract: '0x0000000000000000000000000000000000000000' as Address,
        vrfCoordinator: '0x0000000000000000000000000000000000000000' as Address,
        stablecoinBridge: '0x0000000000000000000000000000000000000000' as Address,
        tournamentManager: '0x0000000000000000000000000000000000000000' as Address,
      },
    };

    return {
      chainId: this.config.chainId,
      name: this.config.chainName,
      blockHeight: 0,
      isHealthy: true,
      rpcUrl: this.config.rpcUrl,
      wsUrl: this.config.wsUrl,
    };
  }

  configure(config: Partial<L1Config>): void {
    if (this.config) {
      this.config = { ...this.config, ...config };
    }
  }

  status(): L1Status | null {
    if (!this.config) return null;
    return {
      chainId: this.config.chainId,
      name: this.config.chainName,
      blockHeight: 0,
      isHealthy: true,
      rpcUrl: this.config.rpcUrl,
      wsUrl: this.config.wsUrl,
    };
  }

  getConfig(): L1Config | null {
    return this.config;
  }
}

// --- Agents Module (ERC-8004) ---

export interface CreateAgentConfig {
  name: string;
  archetype: string;
  personality: Record<string, number>;
  wallet?: { initialBalance: string };
  behaviors?: string[];
}

export interface AgentHandle {
  agentId: string;
  identity: AgentIdentity;
  setPersonality(traits: Record<string, number>): void;
  getWallet(): { address: Address; balance: string };
}

class AgentsModule {
  private agents = new Map<string, AgentHandle>();
  private events: EventEmitter;

  constructor(events: EventEmitter) {
    this.events = events;
  }

  async create(config: CreateAgentConfig): Promise<AgentHandle> {
    const agentId = `agent_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    const address = `0x${Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}` as Address;

    const identity: AgentIdentity = {
      tokenId: agentId,
      contractAddress: '0x0000000000000000000000000000000000000000' as Address,
      owner: address,
      name: config.name,
      personality: JSON.stringify(config.personality),
      capabilities: config.behaviors ?? [],
      modelUri: '',
      registeredAt: Date.now(),
    };

    let currentPersonality = { ...config.personality };
    const walletBalance = config.wallet?.initialBalance ?? '0';

    const handle: AgentHandle = {
      agentId,
      identity,
      setPersonality(traits: Record<string, number>) {
        currentPersonality = { ...currentPersonality, ...traits };
        identity.personality = JSON.stringify(currentPersonality);
      },
      getWallet() {
        return { address, balance: walletBalance };
      },
    };

    this.agents.set(agentId, handle);
    this.events.emit('entity:created', { agentId, name: config.name, archetype: config.archetype });
    return handle;
  }

  get(agentId: string): AgentHandle | undefined {
    return this.agents.get(agentId);
  }

  list(): AgentHandle[] {
    return Array.from(this.agents.values());
  }
}

// --- VRF Module (Chainlink VRF v2.5) ---

export interface LootTableConfig {
  name: string;
  drops: { item: string; rarity: string; weight: number }[];
}

export interface LootRollResult {
  requestId: string;
  item: string;
  rarity: string;
  verified: boolean;
}

class VRFModule {
  private tables = new Map<string, LootTableConfig>();
  private events: EventEmitter;

  constructor(events: EventEmitter) {
    this.events = events;
  }

  configureTable(config: LootTableConfig): void {
    this.tables.set(config.name, config);
  }

  async rollLoot(tableName: string): Promise<LootRollResult> {
    const table = this.tables.get(tableName);
    if (!table) throw new Error(`Loot table "${tableName}" not found`);

    const totalWeight = table.drops.reduce((sum, d) => sum + d.weight, 0);
    let roll = Math.random() * totalWeight;

    for (const drop of table.drops) {
      roll -= drop.weight;
      if (roll <= 0) {
        const result: LootRollResult = {
          requestId: `vrf_${Date.now().toString(36)}`,
          item: drop.item,
          rarity: drop.rarity,
          verified: true,
        };
        this.events.emit('loot:dropped', result);
        return result;
      }
    }

    // Fallback to last item
    const last = table.drops[table.drops.length - 1];
    return {
      requestId: `vrf_${Date.now().toString(36)}`,
      item: last.item,
      rarity: last.rarity,
      verified: true,
    };
  }

  verify(requestId: string): boolean {
    // In production, verifies the VRF proof on-chain
    return true;
  }

  getTable(name: string): LootTableConfig | undefined {
    return this.tables.get(name);
  }
}

// --- Economy Module (SDK wrapper) ---

export interface EconomyConfig {
  currency: StablecoinType;
  entryFee?: string;
  prizePool?: boolean;
  platformFee?: number;    // 0-1 (0.025 = 2.5%)
  creatorFee?: number;
}

class EconomyModule {
  private economySystem: EconomySystem;
  private events: EventEmitter;
  private config: EconomyConfig | null = null;

  constructor(economySystem: EconomySystem, events: EventEmitter) {
    this.economySystem = economySystem;
    this.events = events;
  }

  configure(config: EconomyConfig): void {
    this.config = config;
    this.economySystem.configure({
      currency: config.currency,
      platformFee: config.platformFee ? Math.floor(config.platformFee * 10000) : undefined,
      creatorFee: config.creatorFee ? Math.floor(config.creatorFee * 10000) : undefined,
    });
  }

  createPool(amount: number): void {
    this.economySystem.addToPrizePool(amount);
  }

  transfer(from: PlayerId, to: PlayerId, amount: number): boolean {
    return this.economySystem.transfer(from, to, amount);
  }

  getBalance(playerId: PlayerId): PlayerBalance | undefined {
    return this.economySystem.getBalance(playerId);
  }

  deposit(playerId: PlayerId, amount: number, address?: Address): PlayerBalance {
    return this.economySystem.deposit(playerId, amount, address);
  }

  withdraw(playerId: PlayerId, amount: number): PlayerBalance | null {
    return this.economySystem.withdraw(playerId, amount);
  }
}

// --- State Module (SDK wrapper) ---

class StateModule {
  private stateManager: StateManager;

  constructor(stateManager: StateManager) {
    this.stateManager = stateManager;
  }

  get(): EngineState {
    return this.stateManager.getState();
  }

  update(updater: (state: EngineState) => Partial<EngineState>): EngineState {
    return this.stateManager.updateState(updater);
  }

  history(): EngineState[] {
    return this.stateManager.getHistory();
  }

  subscribe(callback: StateSubscriber): () => void {
    return this.stateManager.subscribeToState(callback);
  }

  serialize(): SerializedState {
    return this.stateManager.serialize();
  }

  deserialize(data: SerializedState): void {
    this.stateManager.deserialize(data);
  }
}

// --- Onboarding Module ---

export interface OnboardConfig {
  displayName: string;
  avatar?: string;
  socialProvider?: 'google' | 'apple' | 'twitter' | 'discord';
}

export interface OnboardedPlayer {
  playerId: PlayerId;
  address: Address;
  displayName: string;
  walletCreated: boolean;
  gasAbstracted: boolean;
}

class OnboardModule {
  private events: EventEmitter;

  constructor(events: EventEmitter) {
    this.events = events;
  }

  async create(config: OnboardConfig): Promise<OnboardedPlayer> {
    const address = `0x${Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}` as Address;
    const playerId = `player_${Date.now().toString(36)}`;

    const player: OnboardedPlayer = {
      playerId,
      address,
      displayName: config.displayName,
      walletCreated: true,
      gasAbstracted: true,
    };

    this.events.emit('player:joined', { playerId, displayName: config.displayName, address });
    return player;
  }

  async socialLogin(provider: 'google' | 'apple' | 'twitter' | 'discord'): Promise<OnboardedPlayer> {
    return this.create({ displayName: `${provider}_user`, socialProvider: provider });
  }

  abstractGas(): boolean {
    // In production, enables paymaster/gas sponsorship on the L1
    return true;
  }
}

// ============================================================
// Avalon — Main SDK Class
// ============================================================

export class Avalon {
  readonly l1: L1Module;
  readonly agents: AgentsModule;
  readonly vrf: VRFModule;
  readonly economy: EconomyModule;
  readonly state: StateModule;
  readonly onboard: OnboardModule;

  private engine: GameEngine;
  private config: AvalonSDKConfig;

  constructor(config: AvalonSDKConfig) {
    this.config = config;
    this.engine = new GameEngine();

    // Modules
    this.l1 = new L1Module();
    this.agents = new AgentsModule(this.engine.events);
    this.vrf = new VRFModule(this.engine.events);
    this.economy = new EconomyModule(this.engine.economy, this.engine.events);
    this.state = new StateModule(this.engine.state);
    this.onboard = new OnboardModule(this.engine.events);

    // Apply L1 config if provided
    if (config.l1Config) {
      this.l1.configure(config.l1Config);
    }

    // Initialize engine with game config if provided
    if (config.gameConfig) {
      this.engine.initialize(config.gameConfig);
    }
  }

  /** Get the underlying game engine for advanced usage */
  getEngine(): GameEngine {
    return this.engine;
  }

  /** Subscribe to any SDK event */
  on<T = unknown>(event: AvalonEventType, handler: AvalonEventHandler<T>): () => void {
    return this.engine.on(event, handler);
  }

  /** Subscribe to all events */
  onAny(handler: AvalonEventHandler): () => void {
    return this.engine.onAny(handler);
  }

  /** Get SDK configuration */
  getConfig(): AvalonSDKConfig {
    return this.config;
  }

  /** Get network name */
  getNetwork(): string {
    return this.config.network;
  }
}

export default Avalon;
