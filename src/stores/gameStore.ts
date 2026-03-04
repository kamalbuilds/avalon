import { create } from "zustand";
import type {
  Address,
  ChainId,
  Game,
  GameStatus,
  MatchState,
  Transaction,
  TransactionStatus,
} from "@/types";

// ---------------------------------------------------------------------------
// Game Store — tracks active matches, player stats, chain, pending txns
// ---------------------------------------------------------------------------

interface PendingTransaction {
  hash: string;
  description: string;
  status: TransactionStatus;
  submittedAt: number;
}

interface GameStore {
  // Games
  games: Game[];
  currentGame: Game | null;

  // Matches
  currentMatch: MatchState | null;
  matchHistory: MatchState[];

  // Chain state
  connectedChainId: ChainId | null;
  isL1Connected: boolean;

  // Transactions
  pendingTransactions: PendingTransaction[];

  // UI state
  isLoading: boolean;
  filter: {
    genre: string;
    status: GameStatus | "all";
    search: string;
    sortBy: "newest" | "popular" | "rating";
  };

  // Actions — Games
  setGames: (games: Game[]) => void;
  setCurrentGame: (game: Game | null) => void;
  addGame: (game: Game) => void;
  updateGame: (id: string, updates: Partial<Game>) => void;

  // Actions — Matches
  setCurrentMatch: (match: MatchState | null) => void;
  addMatchToHistory: (match: MatchState) => void;

  // Actions — Chain
  setConnectedChainId: (chainId: ChainId | null) => void;
  setL1Connected: (connected: boolean) => void;

  // Actions — Transactions
  addPendingTransaction: (tx: PendingTransaction) => void;
  updateTransactionStatus: (hash: string, status: TransactionStatus) => void;
  clearCompletedTransactions: () => void;

  // Actions — UI
  setLoading: (loading: boolean) => void;
  setFilter: (filter: Partial<GameStore["filter"]>) => void;
}

export const useGameStore = create<GameStore>((set) => ({
  // Initial state
  games: [],
  currentGame: null,
  currentMatch: null,
  matchHistory: [],
  connectedChainId: null,
  isL1Connected: false,
  pendingTransactions: [],
  isLoading: false,
  filter: {
    genre: "all",
    status: "all",
    search: "",
    sortBy: "newest",
  },

  // Games
  setGames: (games) => set({ games }),
  setCurrentGame: (currentGame) => set({ currentGame }),
  addGame: (game) => set((s) => ({ games: [...s.games, game] })),
  updateGame: (id, updates) =>
    set((s) => ({
      games: s.games.map((g) => (g.id === id ? { ...g, ...updates } : g)),
    })),

  // Matches
  setCurrentMatch: (currentMatch) => set({ currentMatch }),
  addMatchToHistory: (match) =>
    set((s) => ({ matchHistory: [match, ...s.matchHistory].slice(0, 50) })),

  // Chain
  setConnectedChainId: (connectedChainId) => set({ connectedChainId }),
  setL1Connected: (isL1Connected) => set({ isL1Connected }),

  // Transactions
  addPendingTransaction: (tx) =>
    set((s) => ({ pendingTransactions: [tx, ...s.pendingTransactions] })),
  updateTransactionStatus: (hash, status) =>
    set((s) => ({
      pendingTransactions: s.pendingTransactions.map((tx) =>
        tx.hash === hash ? { ...tx, status } : tx
      ),
    })),
  clearCompletedTransactions: () =>
    set((s) => ({
      pendingTransactions: s.pendingTransactions.filter(
        (tx) => tx.status === "pending"
      ),
    })),

  // UI
  setLoading: (isLoading) => set({ isLoading }),
  setFilter: (filter) =>
    set((s) => ({ filter: { ...s.filter, ...filter } })),
}));
