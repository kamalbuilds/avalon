// ============================================================================
// Chronos Battle — AI Opponent
// Smart AI that watches for incoming moves, manages economy, and adapts
// ============================================================================

import type { ChronosGameState, PlayerId } from './ChronosEngine';
import { canAffordMove } from './ChronosEngine';
import { type ChronosMoveType, MOVES, MOVE_LIST } from './moves';

export type AIPersonality = 'aggressive' | 'defensive' | 'balanced';

interface AIDecision {
  move: ChronosMoveType;
  reason: string;
}

export function getAIDecision(
  state: ChronosGameState,
  personality: AIPersonality
): AIDecision | null {
  const ai = state.ai;
  const player = state.player;

  // Get affordable moves
  const affordable = MOVE_LIST.filter(m => canAffordMove(state, 'ai', m));
  if (affordable.length === 0) return null;

  // Analyze the battlefield
  const playerMovesInFlight = state.movesInFlight.filter(m => m.owner === 'player');
  const aiMovesInFlight = state.movesInFlight.filter(m => m.owner === 'ai');
  const incomingDamage = playerMovesInFlight.reduce((sum, m) => sum + m.damage, 0);
  const hasIncoming = playerMovesInFlight.length > 0;
  const hasShield = ai.shieldActive;
  const hpPercentage = ai.hp / ai.maxHp;
  const playerHpPercentage = player.hp / player.maxHp;
  const coinAdvantage = ai.coins - player.coins;

  // Add some randomness to feel natural (15% chance of random move)
  if (Math.random() < 0.15 && affordable.length > 1) {
    const randomMove = affordable[Math.floor(Math.random() * affordable.length)];
    return { move: randomMove, reason: 'unpredictable play' };
  }

  switch (personality) {
    case 'aggressive':
      return aggressiveStrategy(affordable, {
        hasIncoming, incomingDamage, hasShield, hpPercentage,
        playerHpPercentage, coinAdvantage, ai, playerMovesInFlight, aiMovesInFlight,
      });
    case 'defensive':
      return defensiveStrategy(affordable, {
        hasIncoming, incomingDamage, hasShield, hpPercentage,
        playerHpPercentage, coinAdvantage, ai, playerMovesInFlight, aiMovesInFlight,
      });
    case 'balanced':
    default:
      return balancedStrategy(affordable, {
        hasIncoming, incomingDamage, hasShield, hpPercentage,
        playerHpPercentage, coinAdvantage, ai, playerMovesInFlight, aiMovesInFlight,
      });
  }
}

interface StrategyContext {
  hasIncoming: boolean;
  incomingDamage: number;
  hasShield: boolean;
  hpPercentage: number;
  playerHpPercentage: number;
  coinAdvantage: number;
  ai: { coins: number; hp: number; shieldActive: boolean };
  playerMovesInFlight: { damage: number; blocksRemaining: number }[];
  aiMovesInFlight: { type: ChronosMoveType }[];
}

function aggressiveStrategy(affordable: ChronosMoveType[], ctx: StrategyContext): AIDecision {
  // Counter if opponent has big move incoming
  if (ctx.hasIncoming && ctx.incomingDamage >= 25 && affordable.includes('counter')) {
    return { move: 'counter', reason: 'counter big incoming attack' };
  }

  // If can finish the player, go for devastating
  if (ctx.playerHpPercentage <= 0.5 && affordable.includes('devastating_attack')) {
    return { move: 'devastating_attack', reason: 'finish them off with devastation' };
  }

  // Prefer power blow for pressure
  if (affordable.includes('power_blow') && Math.random() < 0.6) {
    return { move: 'power_blow', reason: 'aggressive pressure' };
  }

  // Quick strikes for chip damage
  if (affordable.includes('quick_strike')) {
    return { move: 'quick_strike', reason: 'chip damage' };
  }

  return { move: affordable[0], reason: 'best available option' };
}

function defensiveStrategy(affordable: ChronosMoveType[], ctx: StrategyContext): AIDecision {
  // Shield up if big attack incoming and no shield
  if (ctx.hasIncoming && !ctx.hasShield && affordable.includes('shield')) {
    return { move: 'shield', reason: 'shield against incoming attack' };
  }

  // Counter if opponent has moves in flight
  if (ctx.hasIncoming && affordable.includes('counter')) {
    return { move: 'counter', reason: 'counter incoming moves' };
  }

  // Shield preemptively when HP is low
  if (ctx.hpPercentage < 0.4 && !ctx.hasShield && affordable.includes('shield')) {
    return { move: 'shield', reason: 'defensive shield at low HP' };
  }

  // Cheap poke damage
  if (affordable.includes('quick_strike') && Math.random() < 0.7) {
    return { move: 'quick_strike', reason: 'safe poke damage' };
  }

  // Occasionally go for power blow
  if (affordable.includes('power_blow') && Math.random() < 0.3) {
    return { move: 'power_blow', reason: 'calculated aggression' };
  }

  return { move: affordable[0], reason: 'safest option' };
}

function balancedStrategy(affordable: ChronosMoveType[], ctx: StrategyContext): AIDecision {
  // Counter if big attack incoming
  if (ctx.hasIncoming && ctx.incomingDamage >= 25 && affordable.includes('counter')) {
    return { move: 'counter', reason: 'counter big threat' };
  }

  // Shield if incoming and no shield
  if (ctx.hasIncoming && ctx.incomingDamage >= 20 && !ctx.hasShield && affordable.includes('shield')) {
    return { move: 'shield', reason: 'shield against medium threat' };
  }

  // If winning in HP, play safe
  if (ctx.hpPercentage > ctx.playerHpPercentage + 0.2) {
    if (affordable.includes('quick_strike')) {
      return { move: 'quick_strike', reason: 'safe play while ahead' };
    }
  }

  // Devastating if player is low and we have coins
  if (ctx.playerHpPercentage <= 0.5 && ctx.ai.coins >= 5 && affordable.includes('devastating_attack')) {
    return { move: 'devastating_attack', reason: 'going for the kill' };
  }

  // Mix of attacks based on economy
  const roll = Math.random();
  if (roll < 0.35 && affordable.includes('quick_strike')) {
    return { move: 'quick_strike', reason: 'balanced poke' };
  }
  if (roll < 0.65 && affordable.includes('power_blow')) {
    return { move: 'power_blow', reason: 'balanced pressure' };
  }
  if (roll < 0.8 && affordable.includes('shield') && !ctx.hasShield) {
    return { move: 'shield', reason: 'balanced defense' };
  }
  if (affordable.includes('devastating_attack') && ctx.ai.coins >= 6) {
    return { move: 'devastating_attack', reason: 'big play with economy lead' };
  }

  return { move: affordable[0], reason: 'best available' };
}

// AI decision timing — varies by personality to feel more human
export function getAIReactionTime(personality: AIPersonality): number {
  const base = {
    aggressive: 800,
    defensive: 1200,
    balanced: 1000,
  }[personality];

  // Add 0-500ms of random delay
  return base + Math.random() * 500;
}
