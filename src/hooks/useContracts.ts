"use client";

import { useReadContract, useWriteContract } from "wagmi";
import { type Address } from "viem";
import { ChronosBattleABI } from "@/lib/contracts/abis/ChronosBattle";
import { AgentRegistryABI } from "@/lib/contracts/abis/AgentRegistry";
import { StablecoinEconomyABI } from "@/lib/contracts/abis/StablecoinEconomy";
import { LootVRFABI } from "@/lib/contracts/abis/LootVRF";
import { CONTRACT_ADDRESSES } from "@/lib/contracts/addresses";

// ============================================================================
// Chronos Battle
// ============================================================================

export function useChronosBattle() {
  const { writeContract, isPending: isWritePending, data: txHash } = useWriteContract();

  const { data: matchCount } = useReadContract({
    address: CONTRACT_ADDRESSES.chronosBattle,
    abi: ChronosBattleABI,
    functionName: "matchCount",
  });

  const { data: entryFee } = useReadContract({
    address: CONTRACT_ADDRESSES.chronosBattle,
    abi: ChronosBattleABI,
    functionName: "entryFee",
  });

  const createMatch = (fee: bigint) => {
    writeContract({
      address: CONTRACT_ADDRESSES.chronosBattle,
      abi: ChronosBattleABI,
      functionName: "createMatch",
      value: fee,
    });
  };

  const joinMatch = (matchId: bigint, fee: bigint) => {
    writeContract({
      address: CONTRACT_ADDRESSES.chronosBattle,
      abi: ChronosBattleABI,
      functionName: "joinMatch",
      args: [matchId],
      value: fee,
    });
  };

  const submitMove = (matchId: bigint, moveType: number, moveData: `0x${string}`) => {
    writeContract({
      address: CONTRACT_ADDRESSES.chronosBattle,
      abi: ChronosBattleABI,
      functionName: "submitMove",
      args: [matchId, moveType, moveData],
    });
  };

  const executeMove = (matchId: bigint, player: Address, moveIndex: bigint) => {
    writeContract({
      address: CONTRACT_ADDRESSES.chronosBattle,
      abi: ChronosBattleABI,
      functionName: "executeMove",
      args: [matchId, player, moveIndex],
    });
  };

  return {
    matchCount: matchCount as bigint | undefined,
    entryFee: entryFee as bigint | undefined,
    createMatch,
    joinMatch,
    submitMove,
    executeMove,
    isWritePending,
    txHash,
  };
}

/** Read a specific match by ID — proper hook (call at top level only) */
export function useMatch(matchId: bigint | undefined) {
  return useReadContract({
    address: CONTRACT_ADDRESSES.chronosBattle,
    abi: ChronosBattleABI,
    functionName: "getMatch",
    args: matchId !== undefined ? [matchId] : undefined,
    query: { enabled: matchId !== undefined },
  });
}

// ============================================================================
// Agent Registry (ERC-8004)
// ============================================================================

export function useAgentRegistry() {
  const { writeContract, isPending: isWritePending } = useWriteContract();

  const { data: totalSupply } = useReadContract({
    address: CONTRACT_ADDRESSES.agentRegistry,
    abi: AgentRegistryABI,
    functionName: "totalSupply",
  });

  const registerAgent = (name: string, agentURI: string) => {
    writeContract({
      address: CONTRACT_ADDRESSES.agentRegistry,
      abi: AgentRegistryABI,
      functionName: "registerAgent",
      args: [name, agentURI],
    });
  };

  return {
    totalAgents: totalSupply as bigint | undefined,
    registerAgent,
    isWritePending,
  };
}

/** Read a specific agent by token ID */
export function useAgent(tokenId: bigint | undefined) {
  return useReadContract({
    address: CONTRACT_ADDRESSES.agentRegistry,
    abi: AgentRegistryABI,
    functionName: "getAgent",
    args: tokenId !== undefined ? [tokenId] : undefined,
    query: { enabled: tokenId !== undefined },
  });
}

/** Read agents owned by an address */
export function useAgentsByOwner(owner: Address | undefined) {
  return useReadContract({
    address: CONTRACT_ADDRESSES.agentRegistry,
    abi: AgentRegistryABI,
    functionName: "getAgentsByOwner",
    args: owner ? [owner] : undefined,
    query: { enabled: !!owner },
  });
}

// ============================================================================
// Stablecoin Economy
// ============================================================================

export function useStablecoinEconomy() {
  const { writeContract, isPending: isWritePending } = useWriteContract();

  const { data: acceptedTokens } = useReadContract({
    address: CONTRACT_ADDRESSES.stablecoinEconomy,
    abi: StablecoinEconomyABI,
    functionName: "getAcceptedTokens",
  });

  const payEntryFee = (gameId: bigint, token: Address, amount: bigint) => {
    writeContract({
      address: CONTRACT_ADDRESSES.stablecoinEconomy,
      abi: StablecoinEconomyABI,
      functionName: "payEntryFee",
      args: [gameId, token, amount],
    });
  };

  return {
    acceptedTokens: acceptedTokens as Address[] | undefined,
    payEntryFee,
    isWritePending,
  };
}

/** Read prize pool for a specific game/token pair */
export function usePrizePool(gameId: bigint | undefined, token: Address | undefined) {
  return useReadContract({
    address: CONTRACT_ADDRESSES.stablecoinEconomy,
    abi: StablecoinEconomyABI,
    functionName: "getPrizePool",
    args: gameId !== undefined && token ? [gameId, token] : undefined,
    query: { enabled: gameId !== undefined && !!token },
  });
}

// ============================================================================
// Loot VRF
// ============================================================================

export function useLootVRF() {
  const { data: totalDrops } = useReadContract({
    address: CONTRACT_ADDRESSES.lootVRF,
    abi: LootVRFABI,
    functionName: "totalDrops",
  });

  return {
    totalDrops: totalDrops as bigint | undefined,
  };
}

/** Read loot drops for a specific player */
export function usePlayerDrops(player: Address | undefined) {
  return useReadContract({
    address: CONTRACT_ADDRESSES.lootVRF,
    abi: LootVRFABI,
    functionName: "getPlayerDrops",
    args: player ? [player] : undefined,
    query: { enabled: !!player },
  });
}
