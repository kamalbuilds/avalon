// ============================================================================
// Chronos Battle Game Engine
// Core game loop, block simulation, move processing
// ============================================================================

import {
  type ChronosMoveType,
  MOVES,
  STARTING_HP,
  STARTING_COINS,
  COINS_PER_BLOCK,
  BLOCK_INTERVAL_MS,
  MAX_COINS,
  COUNTER_MULTIPLIER,
} from './moves';
import type { LootEffectType } from './opponents';

export type PlayerId = 'player' | 'ai';

export interface MoveInFlight {
  id: string;
  owner: PlayerId;
  type: ChronosMoveType;
  blocksRemaining: number;
  totalBlocks: number;
  damage: number;
  timestamp: number;
}

export interface ActiveLootEffects {
  speedRune: boolean;       // reduce move delay by 1 block
  powerCrystal: boolean;    // +5 damage on next attack (consumed on use)
  shieldFragment: boolean;  // block 50% of next incoming damage (consumed on use)
}

export interface BattlerState {
  hp: number;
  maxHp: number;
  coins: number;
  shieldActive: boolean;
  shieldBlocksRemaining: number;
  lootEffects: ActiveLootEffects;
}

export interface MatchStats {
  movesPlayed: number;
  damageDealt: number;
  damageBlocked: number;
  coinsSpent: number;
  countersLanded: number;
  shieldsUsed: number;
  duration: number; // seconds
}

export interface GameEvent {
  id: string;
  type: 'move_launched' | 'move_landed' | 'move_blocked' | 'counter_success' | 'counter_miss' | 'shield_activated' | 'coin_earned' | 'game_over';
  owner: PlayerId;
  target?: PlayerId;
  moveType?: ChronosMoveType;
  damage?: number;
  message: string;
  timestamp: number;
  block: number;
}

export type GamePhase = 'waiting' | 'playing' | 'game_over';

export interface ChronosGameState {
  phase: GamePhase;
  currentBlock: number;
  player: BattlerState;
  ai: BattlerState;
  movesInFlight: MoveInFlight[];
  events: GameEvent[];
  playerStats: MatchStats;
  aiStats: MatchStats;
  winner: PlayerId | null;
  startTime: number;
}

let eventCounter = 0;
function nextEventId(): string {
  return `evt_${++eventCounter}`;
}

let moveCounter = 0;
function nextMoveId(): string {
  return `move_${++moveCounter}`;
}

function createEmptyLootEffects(): ActiveLootEffects {
  return { speedRune: false, powerCrystal: false, shieldFragment: false };
}

/** Build active loot effects from an array of effect keys the player has collected */
export function buildLootEffects(effects: LootEffectType[]): ActiveLootEffects {
  const active = createEmptyLootEffects();
  for (const e of effects) {
    if (e === 'speed_rune') active.speedRune = true;
    if (e === 'power_crystal') active.powerCrystal = true;
    if (e === 'shield_fragment') active.shieldFragment = true;
    // chronos_crown is handled at match start (adds coins) not here
  }
  return active;
}

export function createInitialState(playerLootEffects?: LootEffectType[]): ChronosGameState {
  const playerEffects = playerLootEffects ? buildLootEffects(playerLootEffects) : createEmptyLootEffects();
  // Chronos Crown: grant +2 starting coins
  const bonusCoins = playerLootEffects?.includes('chronos_crown') ? 2 : 0;

  return {
    phase: 'waiting',
    currentBlock: 0,
    player: {
      hp: STARTING_HP,
      maxHp: STARTING_HP,
      coins: Math.min(MAX_COINS, STARTING_COINS + bonusCoins),
      shieldActive: false,
      shieldBlocksRemaining: 0,
      lootEffects: playerEffects,
    },
    ai: {
      hp: STARTING_HP,
      maxHp: STARTING_HP,
      coins: STARTING_COINS,
      shieldActive: false,
      shieldBlocksRemaining: 0,
      lootEffects: createEmptyLootEffects(),
    },
    movesInFlight: [],
    events: [],
    playerStats: createEmptyStats(),
    aiStats: createEmptyStats(),
    winner: null,
    startTime: Date.now(),
  };
}

function createEmptyStats(): MatchStats {
  return {
    movesPlayed: 0,
    damageDealt: 0,
    damageBlocked: 0,
    coinsSpent: 0,
    countersLanded: 0,
    shieldsUsed: 0,
    duration: 0,
  };
}

export function canAffordMove(state: ChronosGameState, owner: PlayerId, moveType: ChronosMoveType): boolean {
  const move = MOVES[moveType];
  const battler = state[owner];
  return battler.coins >= move.cost;
}

export function launchMove(
  state: ChronosGameState,
  owner: PlayerId,
  moveType: ChronosMoveType
): { state: ChronosGameState; events: GameEvent[] } {
  const move = MOVES[moveType];
  const newState = structuredClone(state);
  const battler = newState[owner];
  const target: PlayerId = owner === 'player' ? 'ai' : 'player';
  const newEvents: GameEvent[] = [];

  // Deduct cost
  battler.coins -= move.cost;

  // Update stats
  const stats = owner === 'player' ? newState.playerStats : newState.aiStats;
  stats.movesPlayed++;
  stats.coinsSpent += move.cost;

  if (moveType === 'counter') {
    // Counter is instant check if opponent has moves in flight
    const opponentMoves = newState.movesInFlight.filter(m => m.owner === target);
    if (opponentMoves.length > 0) {
      // Counter succeeds: deal double damage of the strongest incoming move
      const strongestMove = opponentMoves.reduce((a, b) => a.damage > b.damage ? a : b);
      const counterDamage = strongestMove.damage * COUNTER_MULTIPLIER;

      const targetBattler = newState[target];
      if (targetBattler.shieldActive) {
        targetBattler.shieldActive = false;
        stats.damageBlocked += counterDamage;
        newEvents.push({
          id: nextEventId(),
          type: 'move_blocked',
          owner: target,
          moveType: 'counter',
          damage: 0,
          message: `${target === 'player' ? 'Your' : 'AI\'s'} shield blocked the counter!`,
          timestamp: Date.now(),
          block: newState.currentBlock,
        });
      } else {
        targetBattler.hp = Math.max(0, targetBattler.hp - counterDamage);
        stats.damageDealt += counterDamage;
        stats.countersLanded++;
        newEvents.push({
          id: nextEventId(),
          type: 'counter_success',
          owner,
          target,
          moveType: 'counter',
          damage: counterDamage,
          message: `${owner === 'player' ? 'You' : 'AI'} countered for ${counterDamage} damage!`,
          timestamp: Date.now(),
          block: newState.currentBlock,
        });
      }
    } else {
      // Counter misses: no moves in flight
      newEvents.push({
        id: nextEventId(),
        type: 'counter_miss',
        owner,
        moveType: 'counter',
        damage: 0,
        message: `${owner === 'player' ? 'Your' : 'AI\'s'} counter whiffed no moves to counter!`,
        timestamp: Date.now(),
        block: newState.currentBlock,
      });
    }
  } else if (moveType === 'shield') {
    // Shield has a delay before activating
    if (move.delay === 0) {
      battler.shieldActive = true;
      stats.shieldsUsed++;
      newEvents.push({
        id: nextEventId(),
        type: 'shield_activated',
        owner,
        moveType: 'shield',
        message: `${owner === 'player' ? 'Your' : 'AI\'s'} shield is up!`,
        timestamp: Date.now(),
        block: newState.currentBlock,
      });
    } else {
      newState.movesInFlight.push({
        id: nextMoveId(),
        owner,
        type: 'shield',
        blocksRemaining: move.delay,
        totalBlocks: move.delay,
        damage: 0,
        timestamp: Date.now(),
      });
      newEvents.push({
        id: nextEventId(),
        type: 'move_launched',
        owner,
        moveType: 'shield',
        message: `${owner === 'player' ? 'You' : 'AI'} started raising a shield (${move.delay} blocks)`,
        timestamp: Date.now(),
        block: newState.currentBlock,
      });
    }
  } else if (move.delay === 0) {
    // Instant attack (quick_strike)
    const targetBattler = newState[target];
    // Power Crystal: +5 damage on attack (consumed after use)
    let effectiveDamage = move.damage;
    if (battler.lootEffects.powerCrystal && !move.isDefensive) {
      effectiveDamage += 5;
      battler.lootEffects.powerCrystal = false;
    }
    if (targetBattler.shieldActive) {
      targetBattler.shieldActive = false;
      stats.damageBlocked += effectiveDamage;
      newEvents.push({
        id: nextEventId(),
        type: 'move_blocked',
        owner: target,
        moveType,
        damage: 0,
        message: `${target === 'player' ? 'Your' : 'AI\'s'} shield absorbed the ${move.name}!`,
        timestamp: Date.now(),
        block: newState.currentBlock,
      });
    } else {
      // Shield Fragment: block 50% of incoming damage (consumed)
      let finalDamage = effectiveDamage;
      if (targetBattler.lootEffects.shieldFragment) {
        finalDamage = Math.ceil(effectiveDamage * 0.5);
        targetBattler.lootEffects.shieldFragment = false;
      }
      targetBattler.hp = Math.max(0, targetBattler.hp - finalDamage);
      stats.damageDealt += finalDamage;
      newEvents.push({
        id: nextEventId(),
        type: 'move_landed',
        owner,
        target,
        moveType,
        damage: finalDamage,
        message: `${owner === 'player' ? 'You' : 'AI'} landed a ${move.name} for ${finalDamage} damage!`,
        timestamp: Date.now(),
        block: newState.currentBlock,
      });
    }
  } else {
    // Delayed move add to flight
    // Power Crystal: +5 damage on attack (consumed)
    let effectiveDamage = move.damage;
    if (battler.lootEffects.powerCrystal && !move.isDefensive) {
      effectiveDamage += 5;
      battler.lootEffects.powerCrystal = false;
    }
    // Speed Rune: reduce delay by 1 block (min 1)
    let effectiveDelay = move.delay;
    if (battler.lootEffects.speedRune) {
      effectiveDelay = Math.max(1, move.delay - 1);
    }
    newState.movesInFlight.push({
      id: nextMoveId(),
      owner,
      type: moveType,
      blocksRemaining: effectiveDelay,
      totalBlocks: effectiveDelay,
      damage: effectiveDamage,
      timestamp: Date.now(),
    });
    newEvents.push({
      id: nextEventId(),
      type: 'move_launched',
      owner,
      moveType,
      message: `${owner === 'player' ? 'You' : 'AI'} launched a ${move.name}! (${move.delay} blocks)`,
      timestamp: Date.now(),
      block: newState.currentBlock,
    });
  }

  // Check for game over
  if (newState.player.hp <= 0 || newState.ai.hp <= 0) {
    newState.phase = 'game_over';
    newState.winner = newState.player.hp <= 0 ? 'ai' : 'player';
    const elapsed = (Date.now() - newState.startTime) / 1000;
    newState.playerStats.duration = elapsed;
    newState.aiStats.duration = elapsed;
    newEvents.push({
      id: nextEventId(),
      type: 'game_over',
      owner: newState.winner,
      message: newState.winner === 'player' ? 'Victory! You destroyed the AI!' : 'Defeat! The AI wins!',
      timestamp: Date.now(),
      block: newState.currentBlock,
    });
  }

  newState.events = [...newState.events, ...newEvents];
  return { state: newState, events: newEvents };
}

export function processBlock(state: ChronosGameState): { state: ChronosGameState; events: GameEvent[] } {
  const newState = structuredClone(state);
  const newEvents: GameEvent[] = [];

  newState.currentBlock++;

  // Award coins to both players
  for (const id of ['player', 'ai'] as PlayerId[]) {
    const battler = newState[id];
    if (battler.coins < MAX_COINS) {
      battler.coins = Math.min(MAX_COINS, battler.coins + COINS_PER_BLOCK);
    }
  }

  // Process moves in flight
  const remaining: MoveInFlight[] = [];
  for (const mif of newState.movesInFlight) {
    mif.blocksRemaining--;

    if (mif.blocksRemaining <= 0) {
      const target: PlayerId = mif.owner === 'player' ? 'ai' : 'player';
      const ownerStats = mif.owner === 'player' ? newState.playerStats : newState.aiStats;

      if (mif.type === 'shield') {
        // Shield activates
        newState[mif.owner].shieldActive = true;
        ownerStats.shieldsUsed++;
        newEvents.push({
          id: nextEventId(),
          type: 'shield_activated',
          owner: mif.owner,
          moveType: 'shield',
          message: `${mif.owner === 'player' ? 'Your' : 'AI\'s'} shield is now active!`,
          timestamp: Date.now(),
          block: newState.currentBlock,
        });
      } else {
        // Attack lands
        const targetBattler = newState[target];
        if (targetBattler.shieldActive) {
          targetBattler.shieldActive = false;
          ownerStats.damageBlocked += mif.damage;
          newEvents.push({
            id: nextEventId(),
            type: 'move_blocked',
            owner: target,
            moveType: mif.type,
            damage: 0,
            message: `${target === 'player' ? 'Your' : 'AI\'s'} shield blocked the ${MOVES[mif.type].name}!`,
            timestamp: Date.now(),
            block: newState.currentBlock,
          });
        } else {
          // Shield Fragment: block 50% of incoming damage (consumed)
          let finalDamage = mif.damage;
          if (targetBattler.lootEffects.shieldFragment) {
            finalDamage = Math.ceil(mif.damage * 0.5);
            targetBattler.lootEffects.shieldFragment = false;
          }
          targetBattler.hp = Math.max(0, targetBattler.hp - finalDamage);
          ownerStats.damageDealt += finalDamage;
          newEvents.push({
            id: nextEventId(),
            type: 'move_landed',
            owner: mif.owner,
            target,
            moveType: mif.type,
            damage: finalDamage,
            message: `${mif.owner === 'player' ? 'Your' : 'AI\'s'} ${MOVES[mif.type].name} landed for ${finalDamage} damage!`,
            timestamp: Date.now(),
            block: newState.currentBlock,
          });
        }
      }
    } else {
      remaining.push(mif);
    }
  }

  newState.movesInFlight = remaining;

  // Check for game over
  if (newState.player.hp <= 0 || newState.ai.hp <= 0) {
    newState.phase = 'game_over';
    newState.winner = newState.player.hp <= 0 ? 'ai' : 'player';
    const elapsed = (Date.now() - newState.startTime) / 1000;
    newState.playerStats.duration = elapsed;
    newState.aiStats.duration = elapsed;
    newEvents.push({
      id: nextEventId(),
      type: 'game_over',
      owner: newState.winner,
      message: newState.winner === 'player' ? 'Victory! You destroyed the AI!' : 'Defeat! The AI wins!',
      timestamp: Date.now(),
      block: newState.currentBlock,
    });
  }

  newState.events = [...newState.events, ...newEvents];
  return { state: newState, events: newEvents };
}

export { BLOCK_INTERVAL_MS };
