// ============================================================================
// Chronos Battle Zustand Game Store (v2)
// Named opponents, USDT economy, match history, loot drops
// ============================================================================

import { create } from 'zustand';
import {
  type ChronosGameState,
  type GameEvent,
  type PlayerId,
  type MatchStats,
  createInitialState,
  launchMove,
  processBlock,
  canAffordMove,
  BLOCK_INTERVAL_MS,
} from '@/engine/chronos/ChronosEngine';
import { type ChronosMoveType } from '@/engine/chronos/moves';
import { type AIPersonality, getAIDecision, getAIReactionTime } from '@/engine/chronos/ChronosAI';
import {
  type ChronosOpponent,
  type LootItem,
  type LootEffectType,
  CHRONOS_OPPONENTS,
  rollLoot,
  opponentToPersonality,
  rollLootFromVRF,
} from '@/engine/chronos/opponents';
import { type ChronosNPCProfile, CHRONOS_NPCS, getChronosNPC } from '@/ai/npcs/chronos-npcs';
import { type AIThinkingState, getChronosBridgeDecision, getNPCReactionTime, resetNpcMood } from '@/ai/ChronosBridge';

// --- Types ---

interface ScreenShake {
  intensity: number;
  duration: number;
  startTime: number;
}

export interface MatchRecord {
  id: string;
  opponentId: string;
  opponentName: string;
  result: 'win' | 'loss';
  playerStats: MatchStats;
  aiStats: MatchStats;
  playerHpRemaining: number;
  aiHpRemaining: number;
  totalBlocks: number;
  entryFee: string;
  prizeWon: string;
  lootDrop?: LootItem;
  events: GameEvent[];
  timestamp: number;
}

export type GameScreen = 'lobby' | 'playing' | 'game_over' | 'loot_reveal' | 'history' | 'leaderboard';

// --- Opponent ↔ NPC Profile mapping ---
// ChronosOpponent.id = 'aria', ChronosNPCProfile.id = 'aria-merchant'
const OPPONENT_TO_NPC_ID: Record<string, string> = {
  aria: 'aria-merchant',
  kael: 'kael-warrior',
  nova: 'nova-trickster',
  sage: 'sage-scholar',
  iron: 'iron-guardian',
};

export function getNPCForOpponent(opponent: ChronosOpponent): ChronosNPCProfile | null {
  const npcId = OPPONENT_TO_NPC_ID[opponent.id];
  return npcId ? (getChronosNPC(npcId) ?? null) : null;
}

// --- Leaderboard ---

export interface LeaderboardEntry {
  rank: number;
  playerName: string;
  playerAddress: string;
  wins: number;
  losses: number;
  earnings: string;
  winStreak: number;
}

export const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, playerName: 'CryptoKing', playerAddress: '0xaaaa...1111', wins: 87, losses: 12, earnings: '1,247.50', winStreak: 14 },
  { rank: 2, playerName: 'AvalancheHero', playerAddress: '0xbbbb...2222', wins: 79, losses: 18, earnings: '1,023.00', winStreak: 8 },
  { rank: 3, playerName: 'NpcSlayer', playerAddress: '0xcccc...3333', wins: 71, losses: 23, earnings: '892.40', winStreak: 5 },
  { rank: 4, playerName: 'ChainWarrior', playerAddress: '0xdddd...4444', wins: 65, losses: 29, earnings: '654.20', winStreak: 3 },
  { rank: 5, playerName: 'BlockBuster', playerAddress: '0xeeee...5555', wins: 60, losses: 31, earnings: '501.80', winStreak: 7 },
  { rank: 6, playerName: 'TimeLord', playerAddress: '0xffff...6666', wins: 55, losses: 35, earnings: '445.00', winStreak: 4 },
  { rank: 7, playerName: 'VoidWalker', playerAddress: '0x1111...7777', wins: 48, losses: 40, earnings: '312.50', winStreak: 2 },
  { rank: 8, playerName: 'ShieldMaiden', playerAddress: '0x2222...8888', wins: 42, losses: 45, earnings: '267.30', winStreak: 3 },
];

// --- Store ---

interface ChronosStore {
  // Screens
  screen: GameScreen;

  // Game state
  game: ChronosGameState;
  aiPersonality: AIPersonality;
  isPaused: boolean;

  // Opponent
  selectedOpponent: ChronosOpponent | null;
  opponents: ChronosOpponent[];

  // Economy
  playerBalance: string;   // USDT
  matchEntryFee: string;
  matchPrize: string;

  // NPC profile (from ai/npcs for dialogue hooks and bridge)
  npcProfile: ChronosNPCProfile | null;
  aiThinking: AIThinkingState | null;

  // Loot
  lootDrop: LootItem | null;
  vrfRequestId: string | null;
  vrfProofHash: string | null;
  vrfTxHash: string | null;
  vrfIsDemoMode: boolean;
  playerInventory: LootItem[];

  // Match history
  matchHistory: MatchRecord[];

  // Visual effects
  screenShake: ScreenShake | null;
  hitFlash: PlayerId | null;
  lastEvents: GameEvent[];

  // Timers
  blockTimerId: ReturnType<typeof setInterval> | null;
  aiTimerId: ReturnType<typeof setTimeout> | null;

  // Actions
  setScreen: (screen: GameScreen) => void;
  selectOpponent: (opponent: ChronosOpponent) => void;
  startMatch: () => void;
  playerMove: (moveType: ChronosMoveType) => void;
  canPlayerAfford: (moveType: ChronosMoveType) => boolean;
  tick: () => void;
  scheduleAIMove: () => void;
  triggerScreenShake: (intensity: number) => void;
  triggerHitFlash: (target: PlayerId) => void;
  revealLoot: () => void;
  setVRFLoot: (item: LootItem, vrfRequestId: string | null, vrfProofHash: string | null, vrfTxHash: string | null, isDemoMode: boolean) => void;
  returnToLobby: () => void;
  cleanup: () => void;
}

let matchCounter = 0;

export const useChronosStore = create<ChronosStore>((set, get) => ({
  screen: 'lobby',
  game: createInitialState(),
  aiPersonality: 'balanced',
  isPaused: false,
  selectedOpponent: null,
  opponents: CHRONOS_OPPONENTS,
  playerBalance: '100.00',
  matchEntryFee: '0',
  matchPrize: '0',
  npcProfile: null,
  aiThinking: null,
  lootDrop: null,
  vrfRequestId: null,
  vrfProofHash: null,
  vrfTxHash: null,
  vrfIsDemoMode: true,
  playerInventory: [],
  matchHistory: [],
  screenShake: null,
  hitFlash: null,
  lastEvents: [],
  blockTimerId: null,
  aiTimerId: null,

  setScreen: (screen) => set({ screen }),

  selectOpponent: (opponent) => {
    const npcProfile = getNPCForOpponent(opponent);
    set({
      selectedOpponent: opponent,
      npcProfile,
      matchEntryFee: opponent.entryFee,
      matchPrize: opponent.prizePool,
    });
  },

  startMatch: () => {
    const { cleanup, selectedOpponent, playerBalance, playerInventory } = get();
    if (!selectedOpponent) return;

    cleanup();

    // Deduct entry fee
    const balance = parseFloat(playerBalance);
    const fee = parseFloat(selectedOpponent.entryFee);
    if (balance < fee) return;

    // Collect active loot effects from player inventory
    const activeEffects: LootEffectType[] = playerInventory
      .map(item => item.effect)
      .filter((e): e is LootEffectType => e !== 'none');

    const newState = createInitialState(activeEffects);
    newState.phase = 'playing';
    newState.startTime = Date.now();

    const personality = opponentToPersonality(selectedOpponent);

    // Reset NPC mood for fresh match
    const npcId = OPPONENT_TO_NPC_ID[selectedOpponent.id];
    if (npcId) resetNpcMood(npcId);

    set({
      game: newState,
      screen: 'playing',
      aiPersonality: personality,
      isPaused: false,
      screenShake: null,
      hitFlash: null,
      lastEvents: [],
      lootDrop: null,
      vrfRequestId: null,
      vrfProofHash: null,
      vrfTxHash: null,
      vrfIsDemoMode: true,
      playerBalance: (balance - fee).toFixed(2),
    });

    // Start block ticker
    const timerId = setInterval(() => {
      const store = get();
      if (!store.isPaused && store.game.phase === 'playing') {
        store.tick();
      }
    }, BLOCK_INTERVAL_MS);

    set({ blockTimerId: timerId });

    // Schedule first AI move
    setTimeout(() => get().scheduleAIMove(), 1500);
  },

  playerMove: (moveType: ChronosMoveType) => {
    const { game } = get();
    if (game.phase !== 'playing') return;
    if (!canAffordMove(game, 'player', moveType)) return;

    const result = launchMove(game, 'player', moveType);

    const damageEvents = result.events.filter(
      e => (e.type === 'move_landed' || e.type === 'counter_success') && e.damage && e.damage > 0
    );
    for (const evt of damageEvents) {
      if (evt.target) {
        get().triggerHitFlash(evt.target);
        get().triggerScreenShake(evt.damage! > 30 ? 12 : evt.damage! > 15 ? 8 : 4);
      }
    }

    set({ game: result.state, lastEvents: result.events });

    if (result.state.phase === 'playing') {
      get().scheduleAIMove();
    }

    // Handle game over
    if (result.state.phase === 'game_over') {
      get().cleanup();
      const isWin = result.state.winner === 'player';
      const { selectedOpponent, playerBalance, matchHistory } = get();

      // Award prize on win
      let newBalance = parseFloat(playerBalance);
      if (isWin && selectedOpponent) {
        newBalance += parseFloat(selectedOpponent.prizePool);
      }

      // Record match
      const record: MatchRecord = {
        id: `match_${++matchCounter}`,
        opponentId: selectedOpponent?.id || 'unknown',
        opponentName: selectedOpponent ? `${selectedOpponent.name} ${selectedOpponent.title}` : 'AI',
        result: isWin ? 'win' : 'loss',
        playerStats: result.state.playerStats,
        aiStats: result.state.aiStats,
        playerHpRemaining: result.state.player.hp,
        aiHpRemaining: result.state.ai.hp,
        totalBlocks: result.state.currentBlock,
        entryFee: selectedOpponent?.entryFee || '0',
        prizeWon: isWin ? (selectedOpponent?.prizePool || '0') : '0',
        events: result.state.events,
        timestamp: Date.now(),
      };

      set({
        screen: 'game_over',
        playerBalance: newBalance.toFixed(2),
        matchHistory: [record, ...matchHistory].slice(0, 50),
      });
    }
  },

  canPlayerAfford: (moveType: ChronosMoveType) => {
    return canAffordMove(get().game, 'player', moveType);
  },

  tick: () => {
    const { game } = get();
    if (game.phase !== 'playing') return;

    const result = processBlock(game);

    const damageEvents = result.events.filter(
      e => (e.type === 'move_landed' || e.type === 'counter_success') && e.damage && e.damage > 0
    );
    for (const evt of damageEvents) {
      if (evt.target) {
        get().triggerHitFlash(evt.target);
        get().triggerScreenShake(evt.damage! > 30 ? 12 : evt.damage! > 15 ? 8 : 4);
      }
    }

    set({ game: result.state, lastEvents: result.events });

    if (result.state.phase === 'game_over') {
      get().cleanup();
      const isWin = result.state.winner === 'player';
      const { selectedOpponent, playerBalance, matchHistory } = get();

      let newBalance = parseFloat(playerBalance);
      if (isWin && selectedOpponent) {
        newBalance += parseFloat(selectedOpponent.prizePool);
      }

      const record: MatchRecord = {
        id: `match_${++matchCounter}`,
        opponentId: selectedOpponent?.id || 'unknown',
        opponentName: selectedOpponent ? `${selectedOpponent.name} ${selectedOpponent.title}` : 'AI',
        result: isWin ? 'win' : 'loss',
        playerStats: result.state.playerStats,
        aiStats: result.state.aiStats,
        playerHpRemaining: result.state.player.hp,
        aiHpRemaining: result.state.ai.hp,
        totalBlocks: result.state.currentBlock,
        entryFee: selectedOpponent?.entryFee || '0',
        prizeWon: isWin ? (selectedOpponent?.prizePool || '0') : '0',
        events: result.state.events,
        timestamp: Date.now(),
      };

      set({
        screen: 'game_over',
        playerBalance: newBalance.toFixed(2),
        matchHistory: [record, ...matchHistory].slice(0, 50),
      });
    }
  },

  scheduleAIMove: () => {
    const store = get();
    if (store.game.phase !== 'playing') return;

    if (store.aiTimerId) clearTimeout(store.aiTimerId);

    // Use personality-aware reaction time when NPC profile is available
    const delay = store.npcProfile
      ? getNPCReactionTime(store.npcProfile)
      : getAIReactionTime(store.aiPersonality);

    const timerId = setTimeout(() => {
      const s = get();
      if (s.game.phase !== 'playing' || s.isPaused) return;

      // Use ChronosBridge for personality-driven AI when NPC profile exists
      let moveType: ChronosMoveType;
      if (s.npcProfile) {
        const bridgeDecision = getChronosBridgeDecision(s.game, s.npcProfile);
        moveType = bridgeDecision.chosenMove;
        set({ aiThinking: bridgeDecision });
      } else {
        const decision = getAIDecision(s.game, s.aiPersonality);
        if (!decision) return;
        moveType = decision.move;
        set({ aiThinking: null });
      }

      const result = launchMove(s.game, 'ai', moveType);

      const damageEvents = result.events.filter(
        e => (e.type === 'move_landed' || e.type === 'counter_success') && e.damage && e.damage > 0
      );
      for (const evt of damageEvents) {
        if (evt.target) {
          get().triggerHitFlash(evt.target);
          get().triggerScreenShake(evt.damage! > 30 ? 12 : evt.damage! > 15 ? 8 : 4);
        }
      }

      set({ game: result.state, lastEvents: result.events });

      if (result.state.phase === 'game_over') {
        get().cleanup();
        const isWin = result.state.winner === 'player';
        const { selectedOpponent, playerBalance, matchHistory } = get();

        let newBalance = parseFloat(playerBalance);
        if (isWin && selectedOpponent) {
          newBalance += parseFloat(selectedOpponent.prizePool);
        }

        const record: MatchRecord = {
          id: `match_${++matchCounter}`,
          opponentId: selectedOpponent?.id || 'unknown',
          opponentName: selectedOpponent ? `${selectedOpponent.name} ${selectedOpponent.title}` : 'AI',
          result: isWin ? 'win' : 'loss',
          playerStats: result.state.playerStats,
          aiStats: result.state.aiStats,
          playerHpRemaining: result.state.player.hp,
          aiHpRemaining: result.state.ai.hp,
          totalBlocks: result.state.currentBlock,
          entryFee: selectedOpponent?.entryFee || '0',
          prizeWon: isWin ? (selectedOpponent?.prizePool || '0') : '0',
          events: result.state.events,
          timestamp: Date.now(),
        };

        set({
          screen: 'game_over',
          playerBalance: newBalance.toFixed(2),
          matchHistory: [record, ...matchHistory].slice(0, 50),
        });
      } else if (result.state.phase === 'playing') {
        const nextDelay = 3000 + Math.random() * 2000;
        const nextTimerId = setTimeout(() => get().scheduleAIMove(), nextDelay);
        set({ aiTimerId: nextTimerId });
      }
    }, delay);

    set({ aiTimerId: timerId });
  },

  triggerScreenShake: (intensity: number) => {
    set({ screenShake: { intensity, duration: 300, startTime: Date.now() } });
    setTimeout(() => set({ screenShake: null }), 300);
  },

  triggerHitFlash: (target: PlayerId) => {
    set({ hitFlash: target });
    setTimeout(() => set({ hitFlash: null }), 200);
  },

  revealLoot: () => {
    // Demo fallback: uses Math.random() when setVRFLoot hasn't been called
    const loot = rollLoot();
    const vrfId = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;

    // Update latest match record with loot
    const { matchHistory } = get();
    if (matchHistory.length > 0) {
      const updated = [...matchHistory];
      updated[0] = { ...updated[0], lootDrop: loot };
      set({ matchHistory: updated });
    }

    // Add loot to player inventory (keep last 20 items)
    const { playerInventory } = get();
    const updatedInventory = [...playerInventory, loot].slice(-20);

    set({ lootDrop: loot, vrfRequestId: vrfId, vrfProofHash: null, vrfTxHash: null, vrfIsDemoMode: true, screen: 'loot_reveal', playerInventory: updatedInventory });
  },

  setVRFLoot: (item, vrfRequestId, vrfProofHash, vrfTxHash, isDemoMode) => {
    // Update latest match record with loot
    const { matchHistory } = get();
    if (matchHistory.length > 0) {
      const updated = [...matchHistory];
      updated[0] = { ...updated[0], lootDrop: item };
      set({ matchHistory: updated });
    }

    // Add loot to player inventory (keep last 20 items)
    const { playerInventory } = get();
    const updatedInventory = [...playerInventory, item].slice(-20);

    set({
      lootDrop: item,
      vrfRequestId,
      vrfProofHash,
      vrfTxHash,
      vrfIsDemoMode: isDemoMode,
      screen: 'loot_reveal',
      playerInventory: updatedInventory,
    });
  },

  returnToLobby: () => {
    get().cleanup();
    set({
      screen: 'lobby',
      game: createInitialState(),
      screenShake: null,
      hitFlash: null,
      lastEvents: [],
      lootDrop: null,
      vrfRequestId: null,
      vrfProofHash: null,
      vrfTxHash: null,
      vrfIsDemoMode: true,
      selectedOpponent: null,
      npcProfile: null,
      aiThinking: null,
    });
  },

  cleanup: () => {
    const { blockTimerId, aiTimerId } = get();
    if (blockTimerId) clearInterval(blockTimerId);
    if (aiTimerId) clearTimeout(aiTimerId);
    set({ blockTimerId: null, aiTimerId: null });
  },
}));
