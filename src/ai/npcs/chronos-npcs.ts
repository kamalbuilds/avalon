// ============================================================
// Avalon AI Chronos Battle Named NPCs
// 5 unique AI opponents with distinct personalities, wallets,
// ERC-8004 identities, and combat styles
// ============================================================

import type { Address } from '@/types';
import type { NpcArchetype, PersonalityTraits } from '../PersonalitySystem';

// --- NPC Profile ---

export interface ChronosNPCProfile {
  id: string;
  name: string;
  title: string;
  archetype: NpcArchetype;
  traits: PersonalityTraits;
  agentId: string;
  walletAddress: Address;
  reputation: number;
  profileImage: string;
  description: string;
  playstyle: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert' | 'legendary';
  preferredMoves: string[];
  catchphrase: string;
  winRate: number;
  totalMatches: number;
  earnings: number;
  losses: number;
}

// --- The Five Champions ---

export const ARIA_THE_MERCHANT: ChronosNPCProfile = {
  id: 'aria-merchant',
  name: 'Aria',
  title: 'The Merchant',
  archetype: 'merchant',
  traits: {
    aggression: 20,
    courage: 35,
    greed: 80,
    sociability: 85,
    cunning: 75,
    loyalty: 60,
    curiosity: 50,
    patience: 80,
  },
  agentId: 'erc8004-aria-0x001',
  walletAddress: '0x1111111111111111111111111111111111111111' as Address,
  reputation: 72,
  profileImage: '/npc/aria-merchant.png',
  description: 'A shrewd trader who fights like she haggles cautiously, always calculating the cost. Every move is an investment.',
  playstyle: 'Cautious and economical. Hoards coins, uses cheap moves, waits for the perfect expensive strike.',
  difficulty: 'easy',
  preferredMoves: ['quick_strike', 'shield', 'counter'],
  catchphrase: 'Everything has a price. Your defeat? Surprisingly affordable.',
  winRate: 0.55,
  totalMatches: 0,
  earnings: 0,
  losses: 0,
};

export const KAEL_THE_WARRIOR: ChronosNPCProfile = {
  id: 'kael-warrior',
  name: 'Kael',
  title: 'The Warrior',
  archetype: 'warrior',
  traits: {
    aggression: 90,
    courage: 80,
    greed: 40,
    sociability: 30,
    cunning: 25,
    loyalty: 70,
    curiosity: 15,
    patience: 20,
  },
  agentId: 'erc8004-kael-0x002',
  walletAddress: '0x2222222222222222222222222222222222222222' as Address,
  reputation: 85,
  profileImage: '/npc/kael-warrior.png',
  description: 'Born to fight. Kael burns through coins fast, launching devastating attacks without hesitation.',
  playstyle: 'Aggressive and expensive. Prefers Power Blow and Devastating Attack. Rarely shields.',
  difficulty: 'medium',
  preferredMoves: ['power_blow', 'devastating_attack', 'quick_strike'],
  catchphrase: 'Shields are for cowards. Let your fists speak.',
  winRate: 0.62,
  totalMatches: 0,
  earnings: 0,
  losses: 0,
};

export const NOVA_THE_TRICKSTER: ChronosNPCProfile = {
  id: 'nova-trickster',
  name: 'Nova',
  title: 'The Trickster',
  archetype: 'trickster',
  traits: {
    aggression: 45,
    courage: 55,
    greed: 60,
    sociability: 80,
    cunning: 90,
    loyalty: 20,
    curiosity: 85,
    patience: 30,
  },
  agentId: 'erc8004-nova-0x003',
  walletAddress: '0x3333333333333333333333333333333333333333' as Address,
  reputation: 58,
  profileImage: '/npc/nova-trickster.png',
  description: 'Unpredictable and counter-heavy. Nova reads your moves and punishes every mistake with wicked timing.',
  playstyle: 'Counter-heavy and unpredictable. Mixes cheap strikes with well-timed counters. Impossible to read.',
  difficulty: 'hard',
  preferredMoves: ['counter', 'quick_strike', 'power_blow'],
  catchphrase: 'Predictable players make the best punching bags.',
  winRate: 0.68,
  totalMatches: 0,
  earnings: 0,
  losses: 0,
};

export const SAGE_THE_SCHOLAR: ChronosNPCProfile = {
  id: 'sage-scholar',
  name: 'Sage',
  title: 'The Scholar',
  archetype: 'scholar',
  traits: {
    aggression: 15,
    courage: 40,
    greed: 20,
    sociability: 60,
    cunning: 70,
    loyalty: 65,
    curiosity: 90,
    patience: 80,
  },
  agentId: 'erc8004-sage-0x004',
  walletAddress: '0x4444444444444444444444444444444444444444' as Address,
  reputation: 90,
  profileImage: '/npc/sage-scholar.png',
  description: 'Studies your patterns and adapts. Sage gets stronger the longer the fight goes. Early aggression is your best bet.',
  playstyle: 'Adaptive and pattern-learning. Starts defensive, then exploits your habits with surgical precision.',
  difficulty: 'expert',
  preferredMoves: ['shield', 'counter', 'quick_strike'],
  catchphrase: 'I have studied a thousand battles. Yours will be a footnote.',
  winRate: 0.65,
  totalMatches: 0,
  earnings: 0,
  losses: 0,
};

export const IRON_GUARDIAN: ChronosNPCProfile = {
  id: 'iron-guardian',
  name: 'Iron Guardian',
  title: 'The Protector',
  archetype: 'guardian',
  traits: {
    aggression: 30,
    courage: 70,
    greed: 10,
    sociability: 35,
    cunning: 40,
    loyalty: 90,
    curiosity: 20,
    patience: 85,
  },
  agentId: 'erc8004-iron-0x005',
  walletAddress: '0x5555555555555555555555555555555555555555' as Address,
  reputation: 95,
  profileImage: '/npc/iron-guardian.png',
  description: 'An immovable wall. Iron Guardian shields constantly and counter-punches when you overextend.',
  playstyle: 'Shield-focused and defensive. Wears you down with patience, then finishes with precise strikes.',
  difficulty: 'legendary',
  preferredMoves: ['shield', 'counter', 'power_blow'],
  catchphrase: 'You may strike me. You will not break me.',
  winRate: 0.58,
  totalMatches: 0,
  earnings: 0,
  losses: 0,
};

// --- Registry ---

export const CHRONOS_NPCS: ChronosNPCProfile[] = [
  ARIA_THE_MERCHANT,
  KAEL_THE_WARRIOR,
  NOVA_THE_TRICKSTER,
  SAGE_THE_SCHOLAR,
  IRON_GUARDIAN,
];

export function getChronosNPC(id: string): ChronosNPCProfile | undefined {
  return CHRONOS_NPCS.find(n => n.id === id);
}

export function getChronosNPCByName(name: string): ChronosNPCProfile | undefined {
  return CHRONOS_NPCS.find(n => n.name.toLowerCase() === name.toLowerCase());
}

export function getChronosNPCsByDifficulty(difficulty: ChronosNPCProfile['difficulty']): ChronosNPCProfile[] {
  return CHRONOS_NPCS.filter(n => n.difficulty === difficulty);
}
