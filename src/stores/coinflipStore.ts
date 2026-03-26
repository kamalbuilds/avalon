// ============================================================
// Avalanche Coinflip Zustand Store
// State management for the prediction/coinflip game
// ============================================================

import { create } from 'zustand';
import {
  type CoinflipState,
  type CoinflipPrediction,
  createInitialState,
  resolveCoinflip,
  generateDemoRandom,
  calculatePayout,
  getStreakMultiplier,
} from '@/engine/coinflip/CoinflipEngine';

interface CoinflipStore extends CoinflipState {
  // Actions
  setBet: (amount: number) => void;
  flip: (prediction: CoinflipPrediction) => void;
  reset: () => void;
  continuePlay: () => void;
}

const FLIP_DURATION = 1500; // ms

export const useCoinflipStore = create<CoinflipStore>((set, get) => ({
  ...createInitialState(),

  setBet: (amount: number) => {
    const state = get();
    if (state.phase !== 'idle' && state.phase !== 'result') return;
    const clamped = Math.max(1, Math.min(amount, state.balance));
    set({ currentBet: clamped });
  },

  flip: (prediction: CoinflipPrediction) => {
    const state = get();
    if (state.phase !== 'idle' && state.phase !== 'result') return;
    if (state.currentBet > state.balance) return;

    // Deduct bet and start flipping
    set({
      phase: 'flipping',
      prediction,
      balance: state.balance - state.currentBet,
      flipProgress: 0,
      flipNumber: null,
    });

    // Animate the flip with random numbers
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / FLIP_DURATION, 1);
      set({ flipProgress: progress, flipNumber: Math.floor(Math.random() * 100) + 1 });

      if (progress >= 1) {
        clearInterval(interval);
        // Resolve with actual random number
        const finalNumber = generateDemoRandom();
        const currentState = get();
        const newState = resolveCoinflip(currentState, finalNumber);
        set({
          ...newState,
          // Keep store-only fields
          setBet: currentState.setBet,
          flip: currentState.flip,
          reset: currentState.reset,
          continuePlay: currentState.continuePlay,
        });
      }
    }, 50);
  },

  continuePlay: () => {
    const state = get();
    if (state.phase !== 'result') return;
    if (state.balance <= 0) {
      // Out of coins, reset
      set(createInitialState());
      return;
    }
    set({
      phase: 'idle',
      prediction: null,
      flipNumber: null,
      flipProgress: 0,
      currentBet: Math.min(state.currentBet, state.balance),
    });
  },

  reset: () => {
    set(createInitialState());
  },
}));
