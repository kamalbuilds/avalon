import { create } from "zustand";
import type { Address, ChainId, TransactionStatus } from "@/types";

// ---------------------------------------------------------------------------
// User Store — wallet address, balance, chain, connected status, tx history
// ---------------------------------------------------------------------------

interface TransactionRecord {
  hash: string;
  description: string;
  status: TransactionStatus;
  timestamp: number;
  chainId: ChainId;
  value?: string;
}

interface UserStore {
  // Wallet
  address: Address | null;
  displayName: string;
  isConnected: boolean;
  chainId: ChainId | null;

  // Balances
  balance: string; // native token (AVAX)
  usdtBalance: string; // USDT stablecoin
  tokenBalances: Record<string, string>; // token address → balance

  // Transaction history
  transactions: TransactionRecord[];

  // Actions — Wallet
  setAddress: (address: Address | null) => void;
  setDisplayName: (name: string) => void;
  setConnected: (connected: boolean) => void;
  setChainId: (chainId: ChainId | null) => void;

  // Actions — Balances
  setBalance: (balance: string) => void;
  setUsdtBalance: (balance: string) => void;
  setTokenBalance: (token: string, balance: string) => void;

  // Actions — Transactions
  addTransaction: (tx: TransactionRecord) => void;
  updateTransactionStatus: (hash: string, status: TransactionStatus) => void;

  // Actions — Session
  disconnect: () => void;
}

export const useUserStore = create<UserStore>((set) => ({
  // Initial state
  address: null,
  displayName: "",
  isConnected: false,
  chainId: null,
  balance: "0",
  usdtBalance: "0",
  tokenBalances: {},
  transactions: [],

  // Wallet
  setAddress: (address) => set({ address }),
  setDisplayName: (displayName) => set({ displayName }),
  setConnected: (isConnected) => set({ isConnected }),
  setChainId: (chainId) => set({ chainId }),

  // Balances
  setBalance: (balance) => set({ balance }),
  setUsdtBalance: (usdtBalance) => set({ usdtBalance }),
  setTokenBalance: (token, balance) =>
    set((s) => ({ tokenBalances: { ...s.tokenBalances, [token]: balance } })),

  // Transactions
  addTransaction: (tx) =>
    set((s) => ({ transactions: [tx, ...s.transactions].slice(0, 100) })),
  updateTransactionStatus: (hash, status) =>
    set((s) => ({
      transactions: s.transactions.map((tx) =>
        tx.hash === hash ? { ...tx, status } : tx
      ),
    })),

  // Session
  disconnect: () =>
    set({
      address: null,
      displayName: "",
      isConnected: false,
      chainId: null,
      balance: "0",
      usdtBalance: "0",
      tokenBalances: {},
    }),
}));
