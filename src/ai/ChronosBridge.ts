// ============================================================
// Avalon AI Chronos Bridge
// Translates BehaviorTree decisions into Chronos Battle moves
// Personality shapes which moves the AI prefers
// ============================================================

import type { ChronosGameState, PlayerId } from '@/engine/chronos/ChronosEngine';
import { canAffordMove } from '@/engine/chronos/ChronosEngine';
import { type ChronosMoveType, MOVES, MOVE_LIST } from '@/engine/chronos/moves';
import type { ChronosNPCProfile } from './npcs/chronos-npcs';
import { type Mood, type MoodState, ARCHETYPES } from './PersonalitySystem';

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

// --- Battle Mood Engine ---
// Tracks NPC mood across battle ticks and modifies decisions accordingly

const npcMoodStates = new Map<string, MoodState>();

function getOrCreateMood(npc: ChronosNPCProfile): MoodState {
  const existing = npcMoodStates.get(npc.id);
  if (existing) return existing;
  const archDef = ARCHETYPES[npc.archetype];
  const initial: MoodState = {
    current: archDef?.defaultMood ?? 'calm',
    intensity: 50,
    duration: Infinity,
    previous: archDef?.defaultMood ?? 'calm',
  };
  npcMoodStates.set(npc.id, initial);
  return initial;
}

function setNpcMood(npcId: string, mood: Mood, intensity: number, duration: number): void {
  const state = npcMoodStates.get(npcId);
  if (!state) return;
  state.previous = state.current;
  state.current = mood;
  state.intensity = Math.max(0, Math.min(100, intensity));
  state.duration = duration;
}

/** Update mood based on battle events visible in game state */
function updateBattleMood(state: ChronosGameState, npc: ChronosNPCProfile): MoodState {
  const mood = getOrCreateMood(npc);
  const hpPercent = state.ai.hp / state.ai.maxHp;
  const playerHpPercent = state.player.hp / state.player.maxHp;

  // Tick down duration
  if (mood.duration !== Infinity) {
    mood.duration--;
    if (mood.duration <= 0) {
      const archDef = ARCHETYPES[npc.archetype];
      mood.previous = mood.current;
      mood.current = archDef?.defaultMood ?? 'calm';
      mood.intensity = 50;
      mood.duration = Infinity;
    }
  }

  // React to HP thresholds
  if (hpPercent < 0.25 && mood.current !== 'angry' && mood.current !== 'afraid') {
    if (npc.traits.courage > 60) {
      setNpcMood(npc.id, 'angry', 80, 8);
    } else {
      setNpcMood(npc.id, 'afraid', 70, 6);
    }
  }

  // Dominating: feel excited or happy
  if (playerHpPercent < 0.3 && hpPercent > 0.6 && mood.current !== 'excited') {
    if (npc.traits.sociability > 50) {
      setNpcMood(npc.id, 'excited', 70, 5);
    } else {
      setNpcMood(npc.id, 'happy', 60, 5);
    }
  }

  // Stalemate detection: bored if long match with little damage
  if (state.currentBlock > 15 && hpPercent > 0.7 && playerHpPercent > 0.7) {
    if (npc.traits.patience < 40 && mood.current !== 'bored') {
      setNpcMood(npc.id, 'bored', 50, 4);
    }
  }

  return mood;
}

/** Reset mood when a new match starts */
export function resetNpcMood(npcId: string): void {
  npcMoodStates.delete(npcId);
}

/** Apply mood-based score modifiers to a move */
function applyMoodModifiers(
  moveType: ChronosMoveType,
  move: (typeof MOVES)[ChronosMoveType],
  mood: MoodState,
  factors: ThinkingFactor[]
): number {
  let mod = 0;
  const intensity = mood.intensity / 100; // 0-1

  switch (mood.current) {
    case 'angry':
      // Angry NPCs prefer attacks, hate defense
      if (!move.isDefensive && moveType !== 'counter') {
        mod += 12 * intensity;
        factors.push({ factor: 'mood:angry', influence: 'positive', weight: mod, detail: 'Anger fuels aggression' });
      }
      if (moveType === 'shield') {
        mod -= 10 * intensity;
        factors.push({ factor: 'mood:angry', influence: 'negative', weight: 10 * intensity, detail: 'Too angry to defend' });
      }
      break;
    case 'afraid':
      // Afraid NPCs want shields
      if (moveType === 'shield') {
        mod += 15 * intensity;
        factors.push({ factor: 'mood:afraid', influence: 'positive', weight: mod, detail: 'Fear drives defensive play' });
      }
      if (!move.isDefensive && move.cost >= 3) {
        mod -= 8 * intensity;
      }
      break;
    case 'excited':
      // Excited: more random, favor big moves
      if (move.cost >= 2) {
        mod += 8 * intensity;
        factors.push({ factor: 'mood:excited', influence: 'positive', weight: mod, detail: 'Excitement amplifies bold plays' });
      }
      break;
    case 'bored':
      // Bored: avoid cheap moves, try something different
      if (moveType === 'quick_strike') {
        mod -= 10 * intensity;
        factors.push({ factor: 'mood:bored', influence: 'negative', weight: 10 * intensity, detail: 'Bored of basic moves' });
      }
      if (move.cost >= 3) {
        mod += 6 * intensity;
      }
      break;
    case 'suspicious':
      // Suspicious: favor counters
      if (moveType === 'counter') {
        mod += 10 * intensity;
        factors.push({ factor: 'mood:suspicious', influence: 'positive', weight: mod, detail: 'Suspicion leads to countering' });
      }
      break;
    case 'happy':
      // Happy: slight confidence boost, no strong bias
      mod += 3 * intensity;
      break;
  }

  return mod;
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

  // Update and read battle mood (affects scoring below)
  const mood = updateBattleMood(state, npc);

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

    // --- Sociability: social NPCs engage more (favor counters for interaction) ---
    if (moveType === 'counter') {
      const socialBonus = (traits.sociability / 100) * 12;
      score += socialBonus;
      if (socialBonus > 6) {
        factors.push({ factor: 'sociability', influence: 'positive', weight: socialBonus, detail: `Social personality (${traits.sociability}) engages with counters` });
      }
    }
    // Antisocial NPCs avoid reactive plays, prefer solo strikes
    if (traits.sociability < 35 && !move.isDefensive && moveType !== 'counter') {
      const loneWolfBonus = ((100 - traits.sociability) / 100) * 8;
      score += loneWolfBonus;
      if (loneWolfBonus > 4) {
        factors.push({ factor: 'sociability', influence: 'positive', weight: loneWolfBonus, detail: 'Lone wolf prefers direct attacks' });
      }
    }

    // --- Curiosity: curious NPCs try different moves more often ---
    // Penalize repeating the same move type the AI just used
    if (traits.curiosity > 50) {
      const lastAiMoves = state.events
        .filter(e => e.type === 'move_launched' && e.owner === 'ai')
        .slice(-3);
      const recentSameType = lastAiMoves.filter(e => e.moveType === moveType).length;
      if (recentSameType >= 2) {
        const curiosityPenalty = (traits.curiosity / 100) * 15;
        score -= curiosityPenalty;
        factors.push({ factor: 'curiosity', influence: 'negative', weight: curiosityPenalty, detail: `Curious mind (${traits.curiosity}) avoids repeating ${move.name}` });
      }
    }
    // Bonus for moves NOT recently used (curiosity drives variety)
    if (traits.curiosity > 60) {
      const recentMoveTypes = state.events
        .filter(e => e.type === 'move_launched' && e.owner === 'ai')
        .slice(-5)
        .map(e => e.moveType);
      if (!recentMoveTypes.includes(moveType)) {
        const varietyBonus = (traits.curiosity / 100) * 10;
        score += varietyBonus;
        if (varietyBonus > 5) {
          factors.push({ factor: 'curiosity', influence: 'positive', weight: varietyBonus, detail: `Curious wants to try ${move.name}` });
        }
      }
    }

    // --- Loyalty: loyal NPCs stick to their preferred strategy ---
    if (traits.loyalty > 60 && npc.preferredMoves.includes(moveType)) {
      const loyaltyBonus = (traits.loyalty / 100) * 12;
      score += loyaltyBonus;
      if (loyaltyBonus > 7) {
        factors.push({ factor: 'loyalty', influence: 'positive', weight: loyaltyBonus, detail: `Loyal to strategy (${traits.loyalty}) sticks with ${move.name}` });
      }
    }
    // Low loyalty: fickle NPCs switch strategies often
    if (traits.loyalty < 30 && npc.preferredMoves.includes(moveType)) {
      const ficklePenalty = ((100 - traits.loyalty) / 100) * 8;
      score -= ficklePenalty;
      factors.push({ factor: 'loyalty', influence: 'negative', weight: ficklePenalty, detail: 'Fickle personality deviates from preferred moves' });
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

    // --- Mood modifiers from battle mood engine ---
    const moodMod = applyMoodModifiers(moveType, move, mood, factors);
    score += moodMod;

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
