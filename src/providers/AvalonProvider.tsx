"use client";

// ============================================================================
// AvalonProvider — Wraps Web3Provider + Avalon SDK context
// All pages get access to Avalon features through this provider.
// ============================================================================

import { createContext, useContext, useEffect, type ReactNode } from "react";
import { useAccount, useBalance, useChainId } from "wagmi";
import { useUserStore } from "@/stores/userStore";
import { useGameStore } from "@/stores/gameStore";
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

  const userStore = useUserStore();
  const gameStore = useGameStore();

  // Sync wallet connection state → userStore
  useEffect(() => {
    if (isConnected && address) {
      userStore.setAddress(address as Address);
      userStore.setConnected(true);
      userStore.setChainId(chainId);
    } else {
      userStore.disconnect();
    }
  }, [isConnected, address, chainId]);

  // Sync balance
  useEffect(() => {
    if (balanceData) {
      // Format from bigint → string with decimals
      const formatted = (Number(balanceData.value) / 10 ** balanceData.decimals).toFixed(4);
      userStore.setBalance(formatted);
    }
  }, [balanceData]);

  // Load initial game data (mock for now, will be API later)
  useEffect(() => {
    if (gameStore.games.length === 0) {
      gameStore.setGames(MOCK_GAMES);
    }
  }, []);

  return (
    <AvalonContext.Provider value={{ isReady: true }}>
      {children}
    </AvalonContext.Provider>
  );
}
