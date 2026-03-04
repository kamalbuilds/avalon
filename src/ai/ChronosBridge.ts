// ============================================================
// Avalon AI Chronos Bridge
// Translates BehaviorTree decisions into Chronos Battle moves
// Personality shapes which moves the AI prefers
// ============================================================

import type { ChronosGameState, PlayerId } from '@/engine/chronos/ChronosEngine';
import { canAffordMove } from '@/engine/chronos/ChronosEngine';
import { type ChronosMoveType, MOVES, MOVE_LIST } from '@/engine/chronos/moves';
import type { ChronosNPCProfile } from './npcs/chronos-npcs';

// --- Thinking Visualization ---

export interface ThinkingFactor {
  factor: string;
  influence: 'positive' | 'negative' | 'neutral';
  weight: number;
  detail: string;
}

export interface AIThinkingState {
  npcId: string;
  npcName: string;
  chosenMove: ChronosMoveType;
  reasoning: string;
  factors: ThinkingFactor[];
  confidence: number;
  alternativesConsidered: { move: ChronosMoveType; score: number; reason: string }[];
  timestamp: number;
}

// --- Move Scoring ---

interface MoveScore {
  move: ChronosMoveType;
  score: number;
  factors: ThinkingFactor[];
  reason: string;
}

// --- Bridge ---

export function getChronosBridgeDecision(
  state: ChronosGameState,
  npc: ChronosNPCProfile
): AIThinkingState {
  const affordable = MOVE_LIST.filter(m => canAffordMove(state, 'ai', m));
  if (affordable.length === 0) {
    return {
      npcId: npc.id,
      npcName: npc.name,
      chosenMove: 'quick_strike',
      reasoning: 'No affordable moves waiting for coins',
      factors: [{ factor: 'economy', influence: 'negative', weight: 1, detail: 'Cannot afford any move' }],
      confidence: 0,
      alternativesConsidered: [],
      timestamp: Date.now(),
    };
  }

  const ai = state.ai;
  const player = state.player;
  const traits = npc.traits;
  const playerMovesInFlight = state.movesInFlight.filter(m => m.owner === 'player');
  const aiMovesInFlight = state.movesInFlight.filter(m => m.owner === 'ai');
  const hasIncoming = playerMovesInFlight.length > 0;
  const incomingDamage = playerMovesInFlight.reduce((sum, m) => sum + m.damage, 0);
  const hpPercent = ai.hp / ai.maxHp;
  const playerHpPercent = player.hp / player.maxHp;
  const coinAdvantage = ai.coins - player.coins;

  // Score each affordable move
  const scores: MoveScore[] = affordable.map(moveType => {
    const move = MOVES[moveType];
    let score = 50; // baseline
    const factors: ThinkingFactor[] = [];

    // --- Preferred moves bonus ---
    if (npc.preferredMoves.includes(moveType)) {
      score += 15;
      factors.push({ factor: 'preference', influence: 'positive', weight: 15, detail: `${npc.name} prefers ${move.name}` });
    }

    // --- Personality-driven scoring ---

    // Aggression: favor offensive moves
    if (!move.isDefensive && moveType !== 'counter') {
      const aggBonus = (traits.aggression / 100) * 20;
      score += aggBonus;
      if (aggBonus > 10) {
        factors.push({ factor: 'aggression', influence: 'positive', weight: aggBonus, detail: `High aggression (${traits.aggression}) → offensive bias` });
      }
    }

    // Courage: don't flee even when hurt
    if (moveType === 'shield' && hpPercent < 0.3) {
      const courageModifier = traits.courage > 60 ? -10 : 15;
      score += courageModifier;
      factors.push({
        factor: 'courage',
        influence: courageModifier > 0 ? 'positive' : 'negative',
        weight: Math.abs(courageModifier),
        detail: traits.courage > 60 ? 'Too brave to hide behind a shield' : 'Low HP detected → Shield preferred',
      });
    }

    // Greed: prefer expensive moves for more damage
    if (move.cost >= 3) {
      const greedBonus = (traits.greed / 100) * 15;
      score += greedBonus;
      if (greedBonus > 8) {
        factors.push({ factor: 'greed', influence: 'positive', weight: greedBonus, detail: `High greed → choosing expensive move for more damage` });
      }
    }

    // Cunning: favor counter when opportunity exists
    if (moveType === 'counter' && hasIncoming) {
      const cunningBonus = (traits.cunning / 100) * 25;
      score += cunningBonus;
      factors.push({ factor: 'cunning', influence: 'positive', weight: cunningBonus, detail: `Cunning (${traits.cunning}) → counter opportunity detected` });
    }
    // Counter without incoming is bad
    if (moveType === 'counter' && !hasIncoming) {
      score -= 30;
      factors.push({ factor: 'counter-whiff', influence: 'negative', weight: 30, detail: 'No incoming moves to counter risky' });
    }

    // Patience: willing to shield and wait
    if (moveType === 'shield') {
      const patienceBonus = (traits.patience / 100) * 15;
      score += patienceBonus;
      if (patienceBonus > 8) {
        factors.push({ factor: 'patience', influence: 'positive', weight: patienceBonus, detail: 'Patient willing to play defensive' });
      }
    }

    // --- Situational scoring ---

    // Low HP emergency
    if (hpPercent < 0.25) {
      if (moveType === 'shield' && !ai.shieldActive) {
        score += 20;
        factors.push({ factor: 'survival', influence: 'positive', weight: 20, detail: 'Critical HP need shield NOW' });
      }
      if (moveType === 'counter' && hasIncoming) {
        score += 15;
        factors.push({ factor: 'survival', influence: 'positive', weight: 15, detail: 'Critical HP counter to survive' });
      }
    }

    // Shield already active don't stack
    if (moveType === 'shield' && ai.shieldActive) {
      score -= 40;
      factors.push({ factor: 'redundant', influence: 'negative', weight: 40, detail: 'Shield already active no need for another' });
    }

    // Incoming damage threat
    if (hasIncoming && incomingDamage >= 25) {
      if (moveType === 'shield' && !ai.shieldActive) {
        score += 18;
        factors.push({ factor: 'threat', influence: 'positive', weight: 18, detail: `${incomingDamage} damage incoming shield up!` });
      }
      if (moveType === 'counter') {
        score += 20;
        factors.push({ factor: 'threat', influence: 'positive', weight: 20, detail: `${incomingDamage} damage incoming counter opportunity!` });
      }
    }

    // Finishing blow opportunity
    if (playerHpPercent <= 0.3 && move.damage >= player.hp) {
      score += 25;
      factors.push({ factor: 'finisher', influence: 'positive', weight: 25, detail: `Player at ${Math.round(playerHpPercent * 100)}% HP can finish with ${move.name}!` });
    }

    // Economy management don't overspend
    if (move.cost >= 3 && ai.coins <= 4) {
      const penalize = traits.greed > 60 ? 5 : 15;
      score -= penalize;
      factors.push({ factor: 'economy', influence: 'negative', weight: penalize, detail: `Low coins (${ai.coins}) expensive move risky` });
    }

    // Economy advantage be aggressive
    if (coinAdvantage > 3 && !move.isDefensive) {
      score += 8;
      factors.push({ factor: 'economy-lead', influence: 'positive', weight: 8, detail: `Coin advantage (+${coinAdvantage}) press the attack` });
    }

    return {
      move: moveType,
      score: Math.max(0, score),
      factors,
      reason: factors.length > 0 ? factors[0].detail : 'baseline decision',
    };
  });

  // Add randomness based on personality
  // Tricksters are more random, Warriors are more predictable
  const randomFactor = (100 - traits.patience + traits.cunning) / 200; // 0-1
  for (const s of scores) {
    s.score += (Math.random() - 0.5) * randomFactor * 30;
    s.score = Math.max(0, s.score);
  }

  // Sort by score descending
  scores.sort((a, b) => b.score - a.score);

  const best = scores[0];
  const maxScore = best.score;
  const confidence = maxScore > 0 ? Math.min(1, maxScore / 100) : 0.1;

  return {
    npcId: npc.id,
    npcName: npc.name,
    chosenMove: best.move,
    reasoning: best.reason,
    factors: best.factors,
    confidence,
    alternativesConsidered: scores.slice(1, 4).map(s => ({
      move: s.move,
      score: Math.round(s.score),
      reason: s.reason,
    })),
    timestamp: Date.now(),
  };
}

// --- Reaction Time by Personality ---

export function getNPCReactionTime(npc: ChronosNPCProfile): number {
  // Impatient/aggressive NPCs react faster
  const basetime = 600 + (npc.traits.patience / 100) * 800; // 600-1400ms
  const jitter = Math.random() * 400;
  return basetime + jitter;
}
