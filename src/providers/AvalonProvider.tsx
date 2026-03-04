"use client";

// ============================================================================
// AvalonProvider — Wraps Web3Provider + Avalon SDK context
// All pages get access to Avalon features through this provider.
// ============================================================================

import { createContext, useContext, useEffect, type ReactNode } from "react";
import { useAccount, useBalance, useChainId } from "wagmi";
import { useUserStore } from "@/stores/userStore";
import { useGameStore } from "@/stores/gameStore";
import { setContractAddresses } from "@/lib/contracts";
import { CONTRACT_ADDRESSES } from "@/lib/contracts/addresses";
import { MOCK_GAMES } from "@/lib/mockData";
import type { Address } from "@/types";

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface AvalonContextValue {
  isReady: boolean;
}

const AvalonContext = createContext<AvalonContextValue>({ isReady: false });

export function useAvalonContext() {
  return useContext(AvalonContext);
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AvalonProvider({ children }: { children: ReactNode }) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { data: balanceData } = useBalance({
    address: address as Address | undefined,
  });

  // Sync Fuji contract addresses into the viem contract layer
  useEffect(() => {
    setContractAddresses(CONTRACT_ADDRESSES);
  }, []);

  // Sync wallet connection state → userStore
  useEffect(() => {
    if (isConnected && address) {
      useUserStore.getState().setAddress(address as Address);
      useUserStore.getState().setConnected(true);
      useUserStore.getState().setChainId(chainId);
    } else {
      useUserStore.getState().disconnect();
    }
  }, [isConnected, address, chainId]);

  // Sync balance
  useEffect(() => {
    if (balanceData) {
      const formatted = (Number(balanceData.value) / 10 ** balanceData.decimals).toFixed(4);
      useUserStore.getState().setBalance(formatted);
    }
  }, [balanceData]);

  // Load initial game data (mock for now, will be API later)
  useEffect(() => {
    if (useGameStore.getState().games.length === 0) {
      useGameStore.getState().setGames(MOCK_GAMES);
    }
  }, []);

  return (
    <AvalonContext.Provider value={{ isReady: true }}>
      {children}
    </AvalonContext.Provider>
  );
}
