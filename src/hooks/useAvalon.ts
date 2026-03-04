"use client";

// ============================================================================
// useAvalon — Master React hook for the Avalon SDK
// Gives any component access to L1, agents, VRF, economy, and wallet state.
// ============================================================================

import { useAccount, useChainId, usePublicClient, useWalletClient } from "wagmi";
import { useMemo } from "react";
import {
  getChronosBattleContract,
  getAgentRegistryContract,
  getLootVRFContract,
  getStablecoinEconomyContract,
  getContractAddresses,
} from "@/lib/contracts";
import { useUserStore } from "@/stores/userStore";

export function useAvalon() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  // Sync wallet state to userStore
  const userStore = useUserStore();

  // Contract instances (read-only via publicClient)
  const contracts = useMemo(() => {
    if (!publicClient) return null;
    const addresses = getContractAddresses();
    return {
      chronosBattle: getChronosBattleContract(publicClient),
      agentRegistry: getAgentRegistryContract(publicClient),
      lootVRF: getLootVRFContract(publicClient),
      stablecoinEconomy: getStablecoinEconomyContract(publicClient),
      addresses,
    };
  }, [publicClient]);

  // Write-capable contract instances (require wallet)
  const writeContracts = useMemo(() => {
    if (!walletClient) return null;
    return {
      chronosBattle: getChronosBattleContract(walletClient),
      agentRegistry: getAgentRegistryContract(walletClient),
      lootVRF: getLootVRFContract(walletClient),
      stablecoinEconomy: getStablecoinEconomyContract(walletClient),
    };
  }, [walletClient]);

  return {
    // Wallet
    address,
    isConnected,
    chainId,

    // Clients
    publicClient,
    walletClient,

    // Read contracts
    contracts,

    // Write contracts (requires connected wallet)
    writeContracts,

    // Shorthand accessors
    l1: {
      chainId,
      isConnected,
      publicClient,
    },
    agents: contracts?.agentRegistry ?? null,
    vrf: contracts?.lootVRF ?? null,
    economy: contracts?.stablecoinEconomy ?? null,
    wallet: {
      address,
      isConnected,
      chainId,
      balance: userStore.balance,
    },
  };
}
