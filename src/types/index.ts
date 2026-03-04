// ============================================================================
// Avalon — Core Type Definitions
// The blockchain layer for any game. Deploy on your own Avalanche L1
// with AI NPCs, Chainlink VRF, and stablecoin economies.
// ============================================================================

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

export type Address = `0x${string}`;
export type ChainId = number;
export type TokenId = string;
export type Timestamp = number;
export type Wei = bigint;

// ---------------------------------------------------------------------------
// Game
// ---------------------------------------------------------------------------

export interface Game {
  id: string;
  name: string;
  slug: string;
  description: string;
  creatorAddress: Address;
  config: GameConfig;
  state: GameState;
  chainConfig: L1Config;
  economy: StablecoinEconomy;
  assets: GameAsset[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface GameConfig {
  maxPlayers: number;
  tickRate: number; // game loop ticks per second
  worldWidth: number;
  worldHeight: number;
  enableAINpcs: boolean;
  enableLootDrops: boolean;
  enableTournaments: boolean;
  vrfEnabled: boolean;
  entryFee: string; // stablecoin amount as string for precision
  rewardPool: string;
  metadata: Record<string, unknown>;
}

export type GameStatus = 'draft' | 'deploying' | 'live' | 'paused' | 'archived';

export interface GameState {
  status: GameStatus;
  currentTick: number;
  playerCount: number;
  npcCount: number;
  activeMatches: number;
  l1Deployed: boolean;
  contractsDeployed: boolean;
  lastSync: Timestamp;
}

export interface GameAsset {
  id: string;
  gameId: string;
  type: AssetType;
  name: string;
  uri: string; // IPFS or CDN URI
  metadata: Record<string, unknown>;
  tokenId?: TokenId; // on-chain token ID if minted
}

export type AssetType =
  | 'sprite'
  | 'tilemap'
  | 'audio'
  | 'model3d'
  | 'animation'
  | 'shader'
  | 'script'
  | 'item'
  | 'npc_model';

// ---------------------------------------------------------------------------
// Player
// ---------------------------------------------------------------------------

export interface Player {
  id: string;
  address: Address;
  displayName: string;
  avatar: string;
  wallet: WDKWallet;
  inventory: PlayerInventory;
  state: PlayerState;
  stats: PlayerStats;
  joinedAt: Timestamp;
}

export interface PlayerState {
  gameId: string;
  position: Vector2;
  health: number;
  maxHealth: number;
  level: number;
  xp: number;
  isAlive: boolean;
  currentMatchId?: string;
  lastAction: Timestamp;
}

export interface PlayerInventory {
  items: InventoryItem[];
  maxSlots: number;
  equippedWeapon?: string;
  equippedArmor?: string;
}

export interface InventoryItem {
  id: string;
  assetId: string;
  name: string;
  quantity: number;
  rarity: Rarity;
  tokenId?: TokenId;
  metadata: Record<string, unknown>;
}

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface PlayerStats {
  totalGamesPlayed: number;
  totalWins: number;
  totalLosses: number;
  totalEarnings: string;
  killDeathRatio: number;
  highestLevel: number;
}

// ---------------------------------------------------------------------------
// AI NPCs — ERC-8004 Agent Identity
// ---------------------------------------------------------------------------

export interface AgentIdentity {
  tokenId: TokenId;
  contractAddress: Address;
  owner: Address;
  name: string;
  personality: string;
  capabilities: string[];
  modelUri: string; // pointer to AI model weights/config
  registeredAt: Timestamp;
}

export interface AINpc {
  id: string;
  gameId: string;
  identity: AgentIdentity;
  behavior: NpcBehavior;
  strategy: NpcStrategy;
  position: Vector2;
  health: number;
  isActive: boolean;
  lastDecision: Timestamp;
  memoryLog: NpcMemoryEntry[];
}

export interface NpcBehavior {
  type: NpcBehaviorType;
  aggressionLevel: number; // 0-100
  friendliness: number; // 0-100
  tradingEnabled: boolean;
  dialogueEnabled: boolean;
  patrolPath?: Vector2[];
  homePosition: Vector2;
  detectionRadius: number;
}

export type NpcBehaviorType =
  | 'passive'
  | 'aggressive'
  | 'defensive'
  | 'merchant'
  | 'quest_giver'
  | 'companion'
  | 'boss';

export interface NpcStrategy {
  combatStyle: CombatStyle;
  retreatThreshold: number; // HP percentage to retreat
  targetPriority: TargetPriority;
  decisionInterval: number; // ms between AI decisions
  adaptToPlayer: boolean; // learns from player behavior
}

export type CombatStyle = 'melee' | 'ranged' | 'magic' | 'hybrid' | 'support';
export type TargetPriority = 'nearest' | 'weakest' | 'strongest' | 'random' | 'player_focus';

export interface NpcMemoryEntry {
  timestamp: Timestamp;
  event: string;
  playerAddress?: Address;
  outcome: string;
}

// ---------------------------------------------------------------------------
// Blockchain — Avalanche L1 Configuration
// ---------------------------------------------------------------------------

export interface L1Config {
  chainId: ChainId;
  chainName: string;
  subnetId: string;
  rpcUrl: string;
  wsUrl: string;
  explorerUrl: string;
  blockTime: BlockTimeConfig;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  contracts: DeployedContracts;
}

export interface ChainConfig {
  avalancheMainnet: { rpcUrl: string; chainId: ChainId };
  avalancheFuji: { rpcUrl: string; chainId: ChainId };
  gameL1?: L1Config;
}

export interface BlockTimeConfig {
  targetBlockTime: number; // seconds
  minBlockTime: number;
  maxBlockTime: number;
}

export interface DeployedContracts {
  gameRegistry: Address;
  npcRegistry: Address; // ERC-8004
  lootContract: Address;
  vrfCoordinator: Address;
  stablecoinBridge: Address;
  tournamentManager: Address;
}

// ---------------------------------------------------------------------------
// Loot & VRF (Chainlink)
// ---------------------------------------------------------------------------

export interface LootTable {
  id: string;
  gameId: string;
  name: string;
  drops: LootDrop[];
  totalWeight: number;
}

export interface LootDrop {
  id: string;
  assetId: string;
  name: string;
  rarity: Rarity;
  weight: number; // probability weight
  minQuantity: number;
  maxQuantity: number;
  requiresVRF: boolean;
}

export interface VRFRequest {
  requestId: string;
  gameId: string;
  requester: Address;
  lootTableId: string;
  randomWord?: bigint;
  fulfilled: boolean;
  txHash?: string;
  requestedAt: Timestamp;
  fulfilledAt?: Timestamp;
}

// ---------------------------------------------------------------------------
// Transactions & Moves
// ---------------------------------------------------------------------------

export type MoveType =
  | 'walk'
  | 'run'
  | 'attack'
  | 'defend'
  | 'cast_spell'
  | 'use_item'
  | 'trade'
  | 'interact'
  | 'emote';

export type MoveSpeed = 'instant' | 'fast' | 'normal' | 'slow';

export interface Move {
  id: string;
  type: MoveType;
  speed: MoveSpeed;
  playerId: string;
  targetId?: string;
  position?: Vector2;
  data?: Record<string, unknown>;
  timestamp: Timestamp;
}

export interface Transaction {
  hash: string;
  from: Address;
  to: Address;
  value: string;
  data: string;
  chainId: ChainId;
  status: TransactionStatus;
  blockNumber?: number;
  gasUsed?: string;
  timestamp: Timestamp;
}

export type TransactionStatus = 'pending' | 'confirmed' | 'failed' | 'reverted';

// ---------------------------------------------------------------------------
// Editor
// ---------------------------------------------------------------------------

export interface EditorState {
  gameId: string;
  activeTool: EditorTool;
  selectedObjectIds: string[];
  sceneObjects: SceneObject[];
  camera: CameraState;
  gridSize: number;
  snapToGrid: boolean;
  showColliders: boolean;
  isPlaying: boolean; // in-editor preview mode
  undoStack: EditorAction[];
  redoStack: EditorAction[];
}

export type EditorTool =
  | 'select'
  | 'move'
  | 'rotate'
  | 'scale'
  | 'draw'
  | 'erase'
  | 'paint'
  | 'place_npc'
  | 'place_item'
  | 'set_spawn'
  | 'define_zone';

export interface SceneObject {
  id: string;
  type: SceneObjectType;
  name: string;
  position: Vector2;
  rotation: number;
  scale: Vector2;
  layer: number;
  visible: boolean;
  locked: boolean;
  assetId?: string;
  npcId?: string;
  properties: Record<string, unknown>;
  children: string[]; // child object IDs
}

export type SceneObjectType =
  | 'sprite'
  | 'tile'
  | 'collider'
  | 'trigger'
  | 'spawn_point'
  | 'npc'
  | 'item_drop'
  | 'zone'
  | 'light'
  | 'particle'
  | 'camera';

export interface CameraState {
  position: Vector2;
  zoom: number;
  minZoom: number;
  maxZoom: number;
}

export interface EditorAction {
  type: string;
  objectIds: string[];
  previousState: Record<string, unknown>;
  newState: Record<string, unknown>;
  timestamp: Timestamp;
}

// ---------------------------------------------------------------------------
// Stablecoin Economy — Tether WDK
// ---------------------------------------------------------------------------

export interface StablecoinEconomy {
  gameId: string;
  treasuryAddress: Address;
  totalDeposited: string;
  totalWithdrawn: string;
  activeBalance: string;
  feePercentage: number; // basis points (e.g., 250 = 2.5%)
  minDeposit: string;
  maxWithdrawal: string;
  currency: StablecoinType;
}

export type StablecoinType = 'USDT' | 'USDC' | 'DAI';

export interface TokenBalance {
  address: Address;
  token: StablecoinType;
  balance: string;
  lockedInGame: string;
  available: string;
  lastUpdated: Timestamp;
}

export interface WDKWallet {
  address: Address;
  provider: 'tether_wdk';
  isConnected: boolean;
  balances: TokenBalance[];
  pendingTransactions: Transaction[];
}

// ---------------------------------------------------------------------------
// Matches & Tournaments
// ---------------------------------------------------------------------------

export type MatchStatus = 'waiting' | 'starting' | 'in_progress' | 'completed' | 'cancelled';

export interface MatchState {
  id: string;
  gameId: string;
  status: MatchStatus;
  players: MatchPlayer[];
  maxPlayers: number;
  currentRound: number;
  totalRounds: number;
  startedAt?: Timestamp;
  endedAt?: Timestamp;
  settings: Record<string, unknown>;
}

export interface MatchPlayer {
  playerId: string;
  address: Address;
  score: number;
  kills: number;
  deaths: number;
  isEliminated: boolean;
  joinedAt: Timestamp;
}

export interface MatchResult {
  matchId: string;
  gameId: string;
  winner: Address;
  rankings: MatchRanking[];
  totalDuration: number; // seconds
  rewardsDistributed: RewardPayout[];
  completedAt: Timestamp;
}

export interface MatchRanking {
  position: number;
  playerId: string;
  address: Address;
  score: number;
  reward: string;
}

export interface RewardPayout {
  address: Address;
  amount: string;
  token: StablecoinType;
  txHash?: string;
  status: TransactionStatus;
}

export interface Tournament {
  id: string;
  gameId: string;
  name: string;
  description: string;
  entryFee: string;
  prizePool: string;
  maxParticipants: number;
  currentParticipants: number;
  status: TournamentStatus;
  bracket: TournamentBracket;
  startsAt: Timestamp;
  endsAt: Timestamp;
  createdAt: Timestamp;
}

export type TournamentStatus =
  | 'registration'
  | 'in_progress'
  | 'finals'
  | 'completed'
  | 'cancelled';

export interface TournamentBracket {
  rounds: TournamentRound[];
  currentRound: number;
}

export interface TournamentRound {
  roundNumber: number;
  matches: string[]; // match IDs
  isComplete: boolean;
}

// ---------------------------------------------------------------------------
// Common Geometry
// ---------------------------------------------------------------------------

export interface Vector2 {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

// ---------------------------------------------------------------------------
// API Response Wrappers
// ---------------------------------------------------------------------------

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  timestamp: Timestamp;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ---------------------------------------------------------------------------
// Integration Types — Contract Layer & Wallet State
// ---------------------------------------------------------------------------

export interface ContractAddresses {
  chronosBattle: Address;
  agentRegistry: Address;
  lootVRF: Address;
  stablecoinEconomy: Address;
}

export interface WalletState {
  address: Address | null;
  isConnected: boolean;
  chainId: ChainId | null;
  balance: string;
  usdtBalance: string;
}

export interface NPCProfile {
  tokenId: string;
  name: string;
  agentURI: string;
  reputationScore: number;
  validated: boolean;
  validator: Address;
  registeredAt: number;
  lastActive: number;
  owner: Address;
}

export interface OnChainMatchData {
  player1: Address;
  player2: Address;
  state: number; // 0=Waiting, 1=Active, 2=Completed
  winner: Address;
  prizePool: bigint;
  startBlock: bigint;
}

export interface OnChainPlayerState {
  health: bigint;
  energy: bigint;
  registered: boolean;
  movesSubmitted: bigint;
}

export interface OnChainMoveInFlight {
  moveType: number;
  moveData: string;
  executeBlock: bigint;
  executed: boolean;
  damage: bigint;
}

export interface OnChainLootDrop {
  gameId: bigint;
  player: Address;
  rarity: number;
  lootId: bigint;
  fulfilled: boolean;
  randomWord: bigint;
}
