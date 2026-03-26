// ============================================================
// @avalon/sdk - Blockchain Gaming SDK for Avalanche
//
// Usage:
//   import { Avalon } from '@avalon/sdk';
//   const avalon = new Avalon({ network: 'fuji' });
//
//   // Deploy a per-game L1 chain
//   const chain = await avalon.l1.deploy({ name: 'My Game', blockTime: 1 });
//
//   // Create an AI NPC with on-chain identity (ERC-8004)
//   const npc = await avalon.agents.create({ name: 'Merchant', archetype: 'merchant' });
//
//   // Roll for loot using Chainlink VRF v2.5
//   const loot = await avalon.vrf.roll(playerAddress);
//
//   // Check stablecoin economy stats
//   const stats = await avalon.economy.stats();
// ============================================================

import { createPublicClient, http, type PublicClient, type WalletClient } from 'viem';
import { avalancheFuji } from 'viem/chains';
import { CHAIN_CONFIG } from './contracts/addresses';
import { createL1Module } from './modules/l1';
import { createAgentsModule } from './modules/agents';
import { createVRFModule } from './modules/vrf';
import { createEconomyModule } from './modules/economy';
import type {
  AvalonConfig,
  L1Module,
  AgentsModule,
  VRFModule,
  EconomyModule,
} from './types';

export class Avalon {
  readonly l1: L1Module;
  readonly agents: AgentsModule;
  readonly vrf: VRFModule;
  readonly economy: EconomyModule;

  private publicClient: PublicClient;
  private walletClient: WalletClient | null;

  constructor(config: AvalonConfig, walletClient?: WalletClient) {
    const chainConfig = CHAIN_CONFIG[config.network === 'local' ? 'fuji' : config.network];

    this.publicClient = createPublicClient({
      chain: avalancheFuji,
      transport: http(config.rpcUrl || chainConfig.rpcUrl),
    });

    this.walletClient = walletClient || null;

    const addresses = chainConfig.addresses;

    // Initialize all modules
    this.l1 = createL1Module(this.publicClient);
    this.agents = createAgentsModule(this.publicClient, this.walletClient, addresses.agentRegistry);
    this.vrf = createVRFModule(this.publicClient, this.walletClient, addresses.lootVRF);
    this.economy = createEconomyModule(this.publicClient, this.walletClient, addresses.stablecoinEconomy);
  }

  /** Get the underlying viem public client */
  getPublicClient(): PublicClient {
    return this.publicClient;
  }

  /** Get current network block number */
  async getBlockNumber(): Promise<number> {
    const block = await this.publicClient.getBlockNumber();
    return Number(block);
  }
}

// Re-export types
export type {
  AvalonConfig,
  L1Module,
  AgentsModule,
  VRFModule,
  EconomyModule,
  Address,
  AgentConfig,
  AgentIdentity,
  AgentArchetype,
  PersonalityTraits,
  LootTable,
  LootTableEntry,
  LootDrop,
  LootRarity,
  EconomyConfig,
  EconomyStats,
  L1Config,
  L1Status,
} from './types';
