// ============================================================================
// Avalon — Typed Contract Interaction Layer
// Provides typed wrappers around viem contract instances for all Avalon contracts.
// ============================================================================

import { getContract, type GetContractReturnType, type PublicClient, type WalletClient } from 'viem';
import { ChronosBattleABI } from './abis/ChronosBattle';
import { AgentRegistryABI } from './abis/AgentRegistry';
import { LootVRFABI } from './abis/LootVRF';
import { StablecoinEconomyABI } from './abis/StablecoinEconomy';
import { GameFactoryABI } from './abis/GameFactory';
import type { Address } from '@/types';

// ---------------------------------------------------------------------------
// Contract Address Registry
// ---------------------------------------------------------------------------

export interface ContractAddresses {
  gameFactory: Address;
  chronosBattle: Address;
  agentRegistry: Address;
  lootVRF: Address;
  stablecoinEconomy: Address;
}

// Default addresses — overridden at runtime when L1 deploys
const DEFAULT_ADDRESSES: ContractAddresses = {
  gameFactory: '0x0000000000000000000000000000000000000000' as Address,
  chronosBattle: '0x0000000000000000000000000000000000000000' as Address,
  agentRegistry: '0x0000000000000000000000000000000000000000' as Address,
  lootVRF: '0x0000000000000000000000000000000000000000' as Address,
  stablecoinEconomy: '0x0000000000000000000000000000000000000000' as Address,
};

let _addresses: ContractAddresses = { ...DEFAULT_ADDRESSES };

export function setContractAddresses(addresses: Partial<ContractAddresses>) {
  _addresses = { ..._addresses, ...addresses };
}

export function getContractAddresses(): ContractAddresses {
  return { ..._addresses };
}

// ---------------------------------------------------------------------------
// Contract Getters
// ---------------------------------------------------------------------------

export function getGameFactoryContract(
  client: PublicClient | WalletClient,
  address?: Address,
) {
  return getContract({
    address: address ?? _addresses.gameFactory,
    abi: GameFactoryABI,
    client,
  });
}

export function getChronosBattleContract(
  client: PublicClient | WalletClient,
  address?: Address,
) {
  return getContract({
    address: address ?? _addresses.chronosBattle,
    abi: ChronosBattleABI,
    client,
  });
}

export function getAgentRegistryContract(
  client: PublicClient | WalletClient,
  address?: Address,
) {
  return getContract({
    address: address ?? _addresses.agentRegistry,
    abi: AgentRegistryABI,
    client,
  });
}

export function getLootVRFContract(
  client: PublicClient | WalletClient,
  address?: Address,
) {
  return getContract({
    address: address ?? _addresses.lootVRF,
    abi: LootVRFABI,
    client,
  });
}

export function getStablecoinEconomyContract(
  client: PublicClient | WalletClient,
  address?: Address,
) {
  return getContract({
    address: address ?? _addresses.stablecoinEconomy,
    abi: StablecoinEconomyABI,
    client,
  });
}

// ---------------------------------------------------------------------------
// Re-exports
// ---------------------------------------------------------------------------

export { GameFactoryABI } from './abis/GameFactory';
export { ChronosBattleABI } from './abis/ChronosBattle';
export { AgentRegistryABI } from './abis/AgentRegistry';
export { LootVRFABI } from './abis/LootVRF';
export { StablecoinEconomyABI } from './abis/StablecoinEconomy';

export type GameFactoryContract = ReturnType<typeof getGameFactoryContract>;
export type ChronosBattleContract = ReturnType<typeof getChronosBattleContract>;
export type AgentRegistryContract = ReturnType<typeof getAgentRegistryContract>;
export type LootVRFContract = ReturnType<typeof getLootVRFContract>;
export type StablecoinEconomyContract = ReturnType<typeof getStablecoinEconomyContract>;
