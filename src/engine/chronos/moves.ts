// ============================================================================
// Chronos Battle — Move Definitions
// Blockchain latency IS the mechanic: cheap = slow, expensive = fast
// ============================================================================

export type ChronosMoveType =
  | 'quick_strike'
  | 'power_blow'
  | 'devastating_attack'
  | 'shield'
  | 'counter';

export interface ChronosMove {
  type: ChronosMoveType;
  name: string;
  description: string;
  cost: number;        // coins
  delay: number;       // blocks before execution (0 = instant)
  damage: number;      // HP damage dealt
  isDefensive: boolean;
  icon: string;        // emoji for quick display
  color: string;       // neon color for visual
  glowColor: string;   // glow effect color
}

export const MOVES: Record<ChronosMoveType, ChronosMove> = {
  quick_strike: {
    type: 'quick_strike',
    name: 'Quick Strike',
    description: 'Instant but weak. Opponent cannot react.',
    cost: 1,
    delay: 0,
    damage: 10,
    isDefensive: false,
    icon: '\u26A1',
    color: '#00F0FF',
    glowColor: 'rgba(0, 240, 255, 0.4)',
  },
  power_blow: {
    type: 'power_blow',
    name: 'Power Blow',
    description: '3-block delay. Visible to opponent. Medium damage.',
    cost: 2,
    delay: 3,
    damage: 25,
    isDefensive: false,
    icon: '\uD83D\uDCA5',
    color: '#FF6B00',
    glowColor: 'rgba(255, 107, 0, 0.4)',
  },
  devastating_attack: {
    type: 'devastating_attack',
    name: 'Devastating Attack',
    description: '6-block delay. Very visible. Massive damage.',
    cost: 3,
    delay: 6,
    damage: 50,
    isDefensive: false,
    icon: '\uD83D\uDD25',
    color: '#FF1744',
    glowColor: 'rgba(255, 23, 68, 0.4)',
  },
  shield: {
    type: 'shield',
    name: 'Shield',
    description: '2-block activation. Blocks the next incoming attack.',
    cost: 1,
    delay: 2,
    damage: 0,
    isDefensive: true,
    icon: '\uD83D\uDEE1\uFE0F',
    color: '#39FF14',
    glowColor: 'rgba(57, 255, 20, 0.4)',
  },
  counter: {
    type: 'counter',
    name: 'Counter',
    description: 'Instant. Deals double damage IF opponent has a move in flight.',
    cost: 2,
    delay: 0,
    damage: 0, // dynamic — doubles the incoming move's damage
    isDefensive: false,
    icon: '\uD83D\uDD04',
    color: '#B026FF',
    glowColor: 'rgba(176, 38, 255, 0.4)',
  },
};

export const MOVE_LIST: ChronosMoveType[] = [
  'quick_strike',
  'power_blow',
  'devastating_attack',
  'shield',
  'counter',
];

// Game constants
export const STARTING_HP = 100;
export const STARTING_COINS = 10;
export const COINS_PER_BLOCK = 1;
export const BLOCK_INTERVAL_MS = 2000; // 2 seconds per simulated block
export const MAX_COINS = 20;
export const COUNTER_MULTIPLIER = 2;
