"use client";

import { useReadContract, useWriteContract, useWatchContractEvent } from "wagmi";
import { parseEther, type Address } from "viem";
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

  const getMatch = (matchId: bigint) =>
    useReadContract({
      address: CONTRACT_ADDRESSES.chronosBattle,
      abi: ChronosBattleABI,
      functionName: "getMatch",
      args: [matchId],
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
    getMatch,
    createMatch,
    joinMatch,
    submitMove,
    executeMove,
    isWritePending,
    txHash,
  };
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

  const getAgent = (tokenId: bigint) =>
    useReadContract({
      address: CONTRACT_ADDRESSES.agentRegistry,
      abi: AgentRegistryABI,
      functionName: "getAgent",
      args: [tokenId],
    });

  const getAgentsByOwner = (owner: Address) =>
    useReadContract({
      address: CONTRACT_ADDRESSES.agentRegistry,
      abi: AgentRegistryABI,
      functionName: "getAgentsByOwner",
      args: [owner],
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
    getAgent,
    getAgentsByOwner,
    registerAgent,
    isWritePending,
  };
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

  const getPrizePool = (gameId: bigint, token: Address) =>
    useReadContract({
      address: CONTRACT_ADDRESSES.stablecoinEconomy,
      abi: StablecoinEconomyABI,
      functionName: "getPrizePool",
      args: [gameId, token],
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
    getPrizePool,
    payEntryFee,
    isWritePending,
  };
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

  const getPlayerDrops = (player: Address) =>
    useReadContract({
      address: CONTRACT_ADDRESSES.lootVRF,
      abi: LootVRFABI,
      functionName: "getPlayerDrops",
      args: [player],
    });

  return {
    totalDrops: totalDrops as bigint | undefined,
    getPlayerDrops,
  };
}
