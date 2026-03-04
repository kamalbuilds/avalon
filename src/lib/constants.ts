import type { Address, ChainId, GameConfig, Rarity } from '@/types';

// ---------------------------------------------------------------------------
// Chain IDs
// ---------------------------------------------------------------------------

export const CHAIN_IDS = {
  AVALANCHE_MAINNET: 43114 as ChainId,
  AVALANCHE_FUJI: 43113 as ChainId,
  // Game L1 chains are dynamically assigned; this is the reserved range
  GAME_L1_MIN: 100000 as ChainId,
  GAME_L1_MAX: 199999 as ChainId,
} as const;

// ---------------------------------------------------------------------------
// Contract Addresses (Placeholders — updated at deploy time)
// ---------------------------------------------------------------------------

export const CONTRACTS = {
  // Avalanche Mainnet
  MAINNET: {
    GAME_FACTORY: '0x0000000000000000000000000000000000000000' as Address,
    NPC_REGISTRY: '0x0000000000000000000000000000000000000000' as Address,
    USDT: '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7' as Address, // real USDT on Avalanche
    VRF_COORDINATOR: '0x0000000000000000000000000000000000000000' as Address,
    LINK_TOKEN: '0x5947BB275c521040051D82396192181b413227A3' as Address, // real LINK on Avalanche
  },
  // Fuji Testnet — deployed 2026-03-04
  FUJI: {
    GAME_FACTORY: '0x3f7FC08150709C22F1741A230351B59c36bCCc8a' as Address,
    AGENT_REGISTRY: '0x2636Ed9F3Aa33589810BE07B48ad9Be79de3Fd7F' as Address,
    LOOT_VRF: '0xc39d9Ec925d3AA6E67FE760630406696408724f8' as Address,
    STABLECOIN_ECONOMY: '0x95B4b7d7a23d954BF92FeDF2e00A374E22208D69' as Address,
    CHRONOS_BATTLE: '0xafA4230B7154d95F1c8Bc13AD443b2e50bde7C57' as Address,
    USDT: '0x0000000000000000000000000000000000000000' as Address,
    VRF_COORDINATOR: '0x2eD832bA664535E5AB023B4EaDAb0E4F6F4A8B16' as Address,
    LINK_TOKEN: '0x0b9d5D9136855f6FEc3c0993feE6E9CE8a297846' as Address, // Fuji LINK
    VRF_KEY_HASH: '0x354d2f95da55398f44b7cff77da56283d9c6c829a4bdf1bbcaf2ad6a4d081f61',
    VRF_SUBSCRIPTION_ID: 0, // TODO: Set after creating VRF subscription
  },
} as const;

// ---------------------------------------------------------------------------
// RPC Endpoints
// ---------------------------------------------------------------------------

export const RPC_URLS = {
  AVALANCHE_MAINNET: 'https://api.avax.network/ext/bc/C/rpc',
  AVALANCHE_FUJI: 'https://api.avax-test.network/ext/bc/C/rpc',
} as const;

// ---------------------------------------------------------------------------
// Game Defaults
// ---------------------------------------------------------------------------

export const DEFAULT_GAME_CONFIG: GameConfig = {
  maxPlayers: 100,
  tickRate: 20,
  worldWidth: 2048,
  worldHeight: 2048,
  enableAINpcs: true,
  enableLootDrops: true,
  enableTournaments: false,
  vrfEnabled: true,
  entryFee: '0',
  rewardPool: '0',
  metadata: {},
};

export const GAME_LIMITS = {
  MAX_NPCS_PER_GAME: 50,
  MAX_LOOT_TABLES: 20,
  MAX_ASSETS_PER_GAME: 500,
  MAX_INVENTORY_SLOTS: 36,
  MAX_MATCH_PLAYERS: 64,
  MAX_TOURNAMENT_PARTICIPANTS: 256,
  MIN_TICK_RATE: 10,
  MAX_TICK_RATE: 60,
  MAX_WORLD_SIZE: 8192,
} as const;

// ---------------------------------------------------------------------------
// NPC Defaults
// ---------------------------------------------------------------------------

export const NPC_DEFAULTS = {
  DECISION_INTERVAL: 500, // ms
  DETECTION_RADIUS: 200, // px
  RETREAT_THRESHOLD: 20, // HP %
  MAX_MEMORY_ENTRIES: 100,
  AGGRESSION_DEFAULT: 50,
  FRIENDLINESS_DEFAULT: 50,
} as const;

// ---------------------------------------------------------------------------
// Economy
// ---------------------------------------------------------------------------

export const ECONOMY = {
  PLATFORM_FEE_BPS: 250, // 2.5%
  MIN_DEPOSIT: '1.00', // $1 USDT minimum
  MAX_WITHDRAWAL: '10000.00', // $10k max per tx
  DECIMALS: 6, // USDT decimals
} as const;

// ---------------------------------------------------------------------------
// VRF
// ---------------------------------------------------------------------------

export const VRF_CONFIG = {
  CALLBACK_GAS_LIMIT: 200000,
  NUM_WORDS: 1,
  REQUEST_CONFIRMATIONS: 3,
} as const;

// ---------------------------------------------------------------------------
// Rarity Weights (for loot tables)
// ---------------------------------------------------------------------------

export const RARITY_WEIGHTS: Record<Rarity, number> = {
  common: 50,
  uncommon: 30,
  rare: 15,
  epic: 4,
  legendary: 1,
};

export const RARITY_COLORS: Record<Rarity, string> = {
  common: '#9CA3AF',
  uncommon: '#22C55E',
  rare: '#3B82F6',
  epic: '#A855F7',
  legendary: '#F59E0B',
};

// ---------------------------------------------------------------------------
// Editor
// ---------------------------------------------------------------------------

export const EDITOR_DEFAULTS = {
  GRID_SIZE: 32,
  MIN_ZOOM: 0.25,
  MAX_ZOOM: 4,
  DEFAULT_ZOOM: 1,
  UNDO_LIMIT: 100,
} as const;

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

export const API_ROUTES = {
  GAMES: '/api/games',
  GAME_BY_ID: (id: string) => `/api/games/${id}`,
  PLAYERS: '/api/players',
  PLAYER_BY_ADDRESS: (address: string) => `/api/players/${address}`,
  MATCHES: '/api/matches',
  TOURNAMENTS: '/api/tournaments',
  ASSETS: '/api/assets',
  NPCS: '/api/npcs',
  LOOT: '/api/loot',
} as const;
