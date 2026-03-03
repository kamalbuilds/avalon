// ============================================================================
// Chronos Battle — Named AI Opponents
// Each opponent has personality, archetype, ERC-8004 identity, and stats
// ============================================================================

import type { NpcArchetype, PersonalityTraits } from '@/ai/PersonalitySystem';
import type { Address, Rarity } from '@/types';

export interface ChronosOpponent {
  id: string;
  name: string;
  title: string;
  archetype: NpcArchetype;
  description: string;
  avatar: string;        // emoji
  color: string;         // neon color
  glowColor: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert' | 'legendary';
  traitOverrides?: Partial<PersonalityTraits>;
  // ERC-8004 on-chain identity
  identity: {
    tokenId: string;
    contractAddress: Address;
    owner: Address;
    reputationScore: number;  // 0-100
    totalWins: number;
    totalLosses: number;
    walletBalance: string;    // USDT
    registeredAt: number;
  };
  // Economy
  entryFee: string;     // USDT
  prizePool: string;    // USDT for winner
  // Personality radar chart data (0-100 for display)
  radarStats: {
    aggression: number;
    defense: number;
    economy: number;
    speed: number;
    cunning: number;
  };
  // Flavor
  taunt: string;        // What they say before match
  winQuote: string;
  loseQuote: string;
}

export const CHRONOS_OPPONENTS: ChronosOpponent[] = [
  {
    id: 'aria',
    name: 'Aria',
    title: 'The Merchant',
    archetype: 'merchant',
    description: 'A shrewd trader who fights like she invests — cautiously, with calculated risks. Hoards coins and strikes when the economy favors her.',
    avatar: '\uD83D\uDC69\u200D\uD83D\uDCBC',
    color: '#FFE600',
    glowColor: 'rgba(255, 230, 0, 0.3)',
    difficulty: 'easy',
    traitOverrides: { aggression: 20, patience: 90, greed: 85, cunning: 70 },
    identity: {
      tokenId: '8004-001',
      contractAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18',
      owner: '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B',
      reputationScore: 72,
      totalWins: 1847,
      totalLosses: 923,
      walletBalance: '4,250.00',
      registeredAt: Date.now() - 90 * 86400000,
    },
    entryFee: '1.00',
    prizePool: '1.80',
    radarStats: { aggression: 20, defense: 60, economy: 95, speed: 30, cunning: 70 },
    taunt: '"Every coin you spend carelessly is a coin I\'ll profit from."',
    winQuote: '"A profitable engagement. Thank you for your investment."',
    loseQuote: '"...the market has spoken. I\'ll adjust my portfolio."',
  },
  {
    id: 'kael',
    name: 'Kael',
    title: 'The Warrior',
    archetype: 'warrior',
    description: 'A relentless fighter who believes in overwhelming force. Spends coins aggressively on high-damage moves. High risk, high reward.',
    avatar: '\u2694\uFE0F',
    color: '#FF1744',
    glowColor: 'rgba(255, 23, 68, 0.3)',
    difficulty: 'medium',
    traitOverrides: { aggression: 90, courage: 95, patience: 15, cunning: 30 },
    identity: {
      tokenId: '8004-002',
      contractAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18',
      owner: '0xdD870fA1b7C4700F2BD7f44238821C26f7392148',
      reputationScore: 85,
      totalWins: 3421,
      totalLosses: 1567,
      walletBalance: '8,120.00',
      registeredAt: Date.now() - 120 * 86400000,
    },
    entryFee: '2.00',
    prizePool: '3.60',
    radarStats: { aggression: 95, defense: 15, economy: 25, speed: 80, cunning: 30 },
    taunt: '"Your shield won\'t save you. Nothing will."',
    winQuote: '"Another falls. Who\'s next?"',
    loseQuote: '"...I underestimated you. It won\'t happen again."',
  },
  {
    id: 'nova',
    name: 'Nova',
    title: 'The Trickster',
    archetype: 'trickster',
    description: 'Chaos incarnate. Uses counters and unpredictable patterns to confuse opponents. You never know what she\'ll do next.',
    avatar: '\uD83C\uDFAD',
    color: '#B026FF',
    glowColor: 'rgba(176, 38, 255, 0.3)',
    difficulty: 'hard',
    traitOverrides: { cunning: 95, aggression: 40, patience: 20, courage: 60 },
    identity: {
      tokenId: '8004-003',
      contractAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18',
      owner: '0x1aE0EA34a72D944a8C7603FfB3eC30a6669E454C',
      reputationScore: 91,
      totalWins: 2156,
      totalLosses: 789,
      walletBalance: '12,450.00',
      registeredAt: Date.now() - 60 * 86400000,
    },
    entryFee: '3.00',
    prizePool: '5.40',
    radarStats: { aggression: 50, defense: 40, economy: 45, speed: 70, cunning: 95 },
    taunt: '"You think you can predict me? That\'s adorable."',
    winQuote: '"Wasn\'t that fun? Let\'s do it again!"',
    loseQuote: '"Hmm, you got lucky. Or did you...?"',
  },
  {
    id: 'sage',
    name: 'Sage',
    title: 'The Scholar',
    archetype: 'scholar',
    description: 'Studies your patterns and adapts mid-match. The longer the fight goes, the smarter Sage becomes. End it fast or pay the price.',
    avatar: '\uD83E\uDDD9',
    color: '#00F0FF',
    glowColor: 'rgba(0, 240, 255, 0.3)',
    difficulty: 'expert',
    traitOverrides: { cunning: 80, patience: 90, curiosity: 95, aggression: 25 },
    identity: {
      tokenId: '8004-004',
      contractAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18',
      owner: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
      reputationScore: 96,
      totalWins: 4892,
      totalLosses: 1203,
      walletBalance: '22,340.00',
      registeredAt: Date.now() - 180 * 86400000,
    },
    entryFee: '5.00',
    prizePool: '9.00',
    radarStats: { aggression: 40, defense: 65, economy: 70, speed: 45, cunning: 90 },
    taunt: '"I\'ve analyzed 10,000 matches. Your strategy has a 23% win rate against me."',
    winQuote: '"As calculated. Your pattern was clear by block 4."',
    loseQuote: '"Fascinating. I must recalibrate my models."',
  },
  {
    id: 'iron',
    name: 'Iron Guardian',
    title: 'The Immovable',
    archetype: 'guardian',
    description: 'An unbreakable wall. Shields constantly, counters everything, and waits for you to run out of coins. Patience is your only weapon.',
    avatar: '\uD83D\uDEE1\uFE0F',
    color: '#39FF14',
    glowColor: 'rgba(57, 255, 20, 0.3)',
    difficulty: 'legendary',
    traitOverrides: { courage: 95, loyalty: 95, patience: 95, aggression: 20 },
    identity: {
      tokenId: '8004-005',
      contractAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18',
      owner: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      reputationScore: 99,
      totalWins: 7234,
      totalLosses: 412,
      walletBalance: '51,200.00',
      registeredAt: Date.now() - 365 * 86400000,
    },
    entryFee: '10.00',
    prizePool: '18.00',
    radarStats: { aggression: 15, defense: 98, economy: 80, speed: 20, cunning: 75 },
    taunt: '"I have stood for a thousand blocks. You will not move me."',
    winQuote: '"The wall stands. As it always has."',
    loseQuote: '"...impossible. You found a crack."',
  },
];

// Loot table for VRF drops
export interface LootItem {
  id: string;
  name: string;
  rarity: Rarity;
  description: string;
  icon: string;
  value: string; // USDT equivalent
}

export const LOOT_TABLE: { rarity: Rarity; weight: number; items: LootItem[] }[] = [
  {
    rarity: 'common',
    weight: 50,
    items: [
      { id: 'coin-pouch', name: 'Coin Pouch', rarity: 'common', description: 'A small bag of coins', icon: '\uD83D\uDCB0', value: '0.10' },
      { id: 'minor-shard', name: 'Minor Chronos Shard', rarity: 'common', description: 'A fragment of time energy', icon: '\uD83D\uDD39', value: '0.05' },
    ],
  },
  {
    rarity: 'uncommon',
    weight: 25,
    items: [
      { id: 'chrono-crystal', name: 'Chrono Crystal', rarity: 'uncommon', description: 'Stores temporal energy', icon: '\uD83D\uDC8E', value: '0.50' },
      { id: 'speed-rune', name: 'Speed Rune', rarity: 'uncommon', description: 'Reduces move delay by 1 block', icon: '\u26A1', value: '0.75' },
    ],
  },
  {
    rarity: 'rare',
    weight: 15,
    items: [
      { id: 'time-blade', name: 'Temporal Blade', rarity: 'rare', description: 'A weapon forged from frozen time', icon: '\uD83D\uDDE1\uFE0F', value: '2.00' },
      { id: 'shield-of-ages', name: 'Shield of Ages', rarity: 'rare', description: 'Ancient shield that absorbs 2 hits', icon: '\uD83D\uDEE1\uFE0F', value: '2.50' },
    ],
  },
  {
    rarity: 'epic',
    weight: 7.5,
    items: [
      { id: 'chronos-crown', name: 'Chronos Crown', rarity: 'epic', description: 'Grants +2 starting coins', icon: '\uD83D\uDC51', value: '10.00' },
      { id: 'void-cloak', name: 'Void Cloak', rarity: 'epic', description: 'Makes your next slow move invisible', icon: '\uD83E\uDDE5', value: '12.00' },
    ],
  },
  {
    rarity: 'legendary',
    weight: 2.5,
    items: [
      { id: 'infinity-gauntlet', name: 'Infinity Gauntlet', rarity: 'legendary', description: 'One free instant Devastating Attack per match', icon: '\u270A', value: '50.00' },
      { id: 'time-lords-ring', name: "Time Lord's Ring", rarity: 'legendary', description: 'See opponent moves 1 block earlier', icon: '\uD83D\uDC8D', value: '75.00' },
    ],
  },
];

// Simulate VRF loot drop
export function rollLoot(): LootItem {
  const totalWeight = LOOT_TABLE.reduce((sum, t) => sum + t.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const tier of LOOT_TABLE) {
    roll -= tier.weight;
    if (roll <= 0) {
      const items = tier.items;
      return items[Math.floor(Math.random() * items.length)];
    }
  }
  return LOOT_TABLE[0].items[0];
}

// Map opponent archetype to AI personality for the engine
export function opponentToPersonality(opponent: ChronosOpponent): 'aggressive' | 'defensive' | 'balanced' {
  switch (opponent.archetype) {
    case 'warrior': return 'aggressive';
    case 'guardian': return 'defensive';
    case 'merchant': return 'defensive'; // plays safe, economical
    case 'trickster': return 'balanced'; // unpredictable
    case 'scholar': return 'balanced';   // adaptive
    default: return 'balanced';
  }
}
