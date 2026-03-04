// ============================================================
// Avalon AI — NPC Personality Hook
// React hook exposing personality, mood, and economic data
// for NPC profile cards and battle UI
// ============================================================

import { useState, useCallback, useMemo } from 'react';
import type { ChronosNPCProfile } from './npcs/chronos-npcs';
import type { Mood } from './PersonalitySystem';

// --- NPC Wallet Stats ---

export interface NPCWalletStats {
  balance: number;
  totalEarnings: number;
  totalLosses: number;
  matchesPlayed: number;
  matchesWon: number;
  matchesLost: number;
  winStreak: number;
  bestWinStreak: number;
}

// --- NPC Live State ---

export interface NPCLiveState {
  mood: Mood;
  moodIntensity: number;
  reputation: number;
  wallet: NPCWalletStats;
  isActive: boolean;
  lastMatchResult: 'win' | 'loss' | null;
}

// --- Hook Return ---

export interface UseNPCPersonalityReturn {
  profile: ChronosNPCProfile;
  liveState: NPCLiveState;
  recordWin: (earnings: number) => void;
  recordLoss: (losses: number) => void;
  setMood: (mood: Mood, intensity: number) => void;
  adjustReputation: (delta: number) => void;
  getTraitDescription: (trait: string) => string;
  getArchetypeColor: () => string;
}

// --- Trait Descriptions ---

function describeTraitLevel(value: number): string {
  if (value >= 80) return 'Very High';
  if (value >= 60) return 'High';
  if (value >= 40) return 'Moderate';
  if (value >= 20) return 'Low';
  return 'Very Low';
}

const ARCHETYPE_COLORS: Record<string, string> = {
  merchant: '#FFD700',
  warrior: '#FF4444',
  trickster: '#B026FF',
  scholar: '#00CCFF',
  guardian: '#39FF14',
};

// --- Hook ---

export function useNPCPersonality(npc: ChronosNPCProfile): UseNPCPersonalityReturn {
  const [liveState, setLiveState] = useState<NPCLiveState>({
    mood: 'calm',
    moodIntensity: 50,
    reputation: npc.reputation,
    wallet: {
      balance: 100,
      totalEarnings: npc.earnings,
      totalLosses: npc.losses,
      matchesPlayed: npc.totalMatches,
      matchesWon: Math.round(npc.totalMatches * npc.winRate),
      matchesLost: Math.round(npc.totalMatches * (1 - npc.winRate)),
      winStreak: 0,
      bestWinStreak: 0,
    },
    isActive: true,
    lastMatchResult: null,
  });

  const recordWin = useCallback((earnings: number) => {
    setLiveState(prev => {
      const newStreak = prev.wallet.winStreak + 1;
      return {
        ...prev,
        mood: 'happy' as Mood,
        moodIntensity: 70,
        lastMatchResult: 'win',
        wallet: {
          ...prev.wallet,
          balance: prev.wallet.balance + earnings,
          totalEarnings: prev.wallet.totalEarnings + earnings,
          matchesPlayed: prev.wallet.matchesPlayed + 1,
          matchesWon: prev.wallet.matchesWon + 1,
          winStreak: newStreak,
          bestWinStreak: Math.max(prev.wallet.bestWinStreak, newStreak),
        },
      };
    });
  }, []);

  const recordLoss = useCallback((losses: number) => {
    setLiveState(prev => ({
      ...prev,
      mood: (npc.traits.aggression > 60 ? 'angry' : 'calm') as Mood,
      moodIntensity: 60,
      lastMatchResult: 'loss',
      wallet: {
        ...prev.wallet,
        balance: Math.max(0, prev.wallet.balance - losses),
        totalLosses: prev.wallet.totalLosses + losses,
        matchesPlayed: prev.wallet.matchesPlayed + 1,
        matchesLost: prev.wallet.matchesLost + 1,
        winStreak: 0,
      },
    }));
  }, [npc.traits.aggression]);

  const setMood = useCallback((mood: Mood, intensity: number) => {
    setLiveState(prev => ({ ...prev, mood, moodIntensity: Math.max(0, Math.min(100, intensity)) }));
  }, []);

  const adjustReputation = useCallback((delta: number) => {
    setLiveState(prev => ({
      ...prev,
      reputation: Math.max(0, Math.min(100, prev.reputation + delta)),
    }));
  }, []);

  const getTraitDescription = useCallback((trait: string): string => {
    const value = (npc.traits as unknown as Record<string, number>)[trait];
    if (value === undefined) return 'Unknown';
    return describeTraitLevel(value);
  }, [npc.traits]);

  const getArchetypeColor = useCallback((): string => {
    return ARCHETYPE_COLORS[npc.archetype] ?? '#FFFFFF';
  }, [npc.archetype]);

  return {
    profile: npc,
    liveState,
    recordWin,
    recordLoss,
    setMood,
    adjustReputation,
    getTraitDescription,
    getArchetypeColor,
  };
}
