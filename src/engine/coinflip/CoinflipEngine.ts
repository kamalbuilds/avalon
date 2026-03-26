// ============================================================
// Avalanche Coinflip Game Engine
// Simple prediction game: bet coins, pick HIGH or LOW
// Proves the Avalon SDK works for multiple game types
// ============================================================

export type CoinflipPrediction = 'high' | 'low';
export type CoinflipPhase = 'betting' | 'flipping' | 'result' | 'idle';

export interface CoinflipResult {
  number: number;       // 1-100
  prediction: CoinflipPrediction;
  won: boolean;
  betAmount: number;
  payout: number;
  streak: number;
  multiplier: number;
}

export interface CoinflipState {
  phase: CoinflipPhase;
  balance: number;
  currentBet: number;
  prediction: CoinflipPrediction | null;
  lastResult: CoinflipResult | null;
  streak: number;
  maxStreak: number;
  totalWins: number;
  totalLosses: number;
  totalWagered: number;
  totalWon: number;
  history: CoinflipResult[];
  flipNumber: number | null;      // the random number during flip animation
  flipProgress: number;            // 0-1 for animation
}

export function createInitialState(startingBalance = 100): CoinflipState {
  return {
    phase: 'idle',
    balance: startingBalance,
    currentBet: 1,
    prediction: null,
    lastResult: null,
    streak: 0,
    maxStreak: 0,
    totalWins: 0,
    totalLosses: 0,
    totalWagered: 0,
    totalWon: 0,
    history: [],
    flipNumber: null,
    flipProgress: 0,
  };
}

export function getStreakMultiplier(streak: number): number {
  if (streak >= 7) return 5;
  if (streak >= 5) return 3;
  if (streak >= 3) return 2;
  return 1;
}

export function calculatePayout(betAmount: number, streak: number): number {
  const multiplier = getStreakMultiplier(streak);
  return betAmount * 2 * multiplier;
}

export function resolveCoinflip(
  state: CoinflipState,
  randomNumber: number // 1-100
): CoinflipState {
  if (!state.prediction || state.phase !== 'flipping') return state;

  const won = state.prediction === 'high' ? randomNumber > 50 : randomNumber <= 50;
  const newStreak = won ? state.streak + 1 : 0;
  const payout = won ? calculatePayout(state.currentBet, state.streak) : 0;
  const multiplier = getStreakMultiplier(state.streak);

  const result: CoinflipResult = {
    number: randomNumber,
    prediction: state.prediction,
    won,
    betAmount: state.currentBet,
    payout,
    streak: newStreak,
    multiplier,
  };

  return {
    ...state,
    phase: 'result',
    balance: state.balance + payout,
    lastResult: result,
    streak: newStreak,
    maxStreak: Math.max(state.maxStreak, newStreak),
    totalWins: state.totalWins + (won ? 1 : 0),
    totalLosses: state.totalLosses + (won ? 0 : 1),
    totalWon: state.totalWon + payout,
    history: [...state.history.slice(-19), result],
    flipNumber: randomNumber,
    flipProgress: 1,
  };
}

// Demo mode: generate a pseudo-random number
export function generateDemoRandom(): number {
  return Math.floor(Math.random() * 100) + 1;
}

// VRF mode: this would call the LootVRF contract
// For now, returns the demo random as fallback
export function generateVRFRandom(): Promise<number> {
  // In production, this calls Chainlink VRF via the LootVRF contract
  return Promise.resolve(generateDemoRandom());
}
