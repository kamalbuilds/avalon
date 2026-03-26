// ============================================================
// @avalon/sdk Type Definitions
// All TypeScript interfaces for the Avalon Gaming SDK
// ============================================================

export type Address = `0x${string}`;

// --- L1 Module Types ---

export interface L1Config {
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
  explorerUrl: string;
}

// --- Agent Module Types (ERC-8004) ---

export interface AgentConfig {
  name: string;
  archetype: AgentArchetype;
  traits?: Partial<PersonalityTraits>;
  walletAddress?: Address;
}

export type AgentArchetype = 'merchant' | 'warrior' | 'guardian' | 'trickster' | 'scholar';

export interface PersonalityTraits {
  aggression: number;   // 0-100
  courage: number;
  greed: number;
  sociability: number;
  cunning: number;
  loyalty: number;
  curiosity: number;
  patience: number;
}

export interface AgentIdentity {
  tokenId: bigint;
  name: string;
  archetype: AgentArchetype;
  walletAddress: Address;
  reputation: number;     // 0-10000 basis points
  behaviorHash: string;
  owner: Address;
}

// --- VRF Module Types ---

export interface LootTable {
  gameId: string;
  items: LootTableEntry[];
}

export interface LootTableEntry {
  name: string;
  rarity: LootRarity;
  weight: number;       // relative weight for drop chance
  metadata?: string;
}

export type LootRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface LootDrop {
  requestId: bigint;
  randomWord: bigint;
  item: LootTableEntry;
  rarity: LootRarity;
  player: Address;
  timestamp: number;
  txHash?: string;
}

// --- Economy Module Types ---

export interface EconomyConfig {
  stablecoin: Address;
  entryFee: bigint;
  platformFeeBps: number;  // basis points (500 = 5%)
  prizePoolBps: number;
}

export interface EconomyStats {
  totalDeposits: bigint;
  totalPrizes: bigint;
  totalFees: bigint;
  acceptedTokens: Address[];
}

// --- SDK Config ---

export interface AvalonConfig {
  network: 'fuji' | 'mainnet' | 'local';
  rpcUrl?: string;
  privateKey?: string;
}

export interface AvalonModules {
  l1: L1Module;
  agents: AgentsModule;
  vrf: VRFModule;
  economy: EconomyModule;
}

// --- Module Interfaces ---

export interface L1Module {
  deploy(config: L1Config): Promise<L1Status>;
  status(): Promise<L1Status>;
}

export interface AgentsModule {
  create(config: AgentConfig): Promise<AgentIdentity>;
  get(tokenId: bigint): Promise<AgentIdentity | null>;
  totalAgents(): Promise<number>;
  updateReputation(tokenId: bigint, delta: number): Promise<void>;
}

export interface VRFModule {
  roll(player: Address, tableId?: string): Promise<LootDrop>;
  configureLootTable(table: LootTable): Promise<void>;
  getLastDrop(player: Address): Promise<LootDrop | null>;
}

export interface EconomyModule {
  configure(config: EconomyConfig): Promise<void>;
  stats(): Promise<EconomyStats>;
  deposit(player: Address, amount: bigint): Promise<string>;
  isTokenAccepted(token: Address): Promise<boolean>;
}
