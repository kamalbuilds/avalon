# Avalon Architecture

## System Overview

Avalon is a blockchain gaming SDK built as middleware between game engines (Unity, Unreal, React) and the Avalanche blockchain. The architecture follows a layered approach: SDK API → Smart Contracts → Avalanche L1.

```
┌─────────────────────────────────────────────────────────┐
│                    GAME ENGINE                          │
│              (Unity / Unreal / React)                   │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│                  AVALON SDK                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│  │ L1 Module│ │AI Agents │ │ VRF Loot │ │ Economy  │    │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘    │
└───────┼────────────┼────────────┼────────────┼──────────┘
        │            │            │            │
┌───────▼────────────▼────────────▼────────────▼──────────┐
│               SMART CONTRACT LAYER                      │
│  ┌────────────┐ ┌──────────────┐ ┌──────────────────┐   │
│  │GameFactory │ │AgentRegistry │ │StablecoinEconomy │   │
│  └────────────┘ └──────────────┘ └──────────────────┘   │
│  ┌────────────┐ ┌──────────────┐ ┌──────────────────┐   │
│  │AvalonGame  │ │   LootVRF    │ │ ChronosBattle    │   │
│  └────────────┘ └──────────────┘ └──────────────────┘   │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│              AVALANCHE L1 (Per-Game)                    │
│          Custom block time, gas token, validators       │
└─────────────────────────────────────────────────────────┘
```

---

## Layer 1: Smart Contracts

Six Solidity contracts deployed on each game's Avalanche L1:

### GameFactory.sol
- Deploys new game instances with configurable parameters
- Registers games in on-chain registry
- Manages game lifecycle (active, paused, ended)

### AgentRegistry.sol (ERC-8004)
- ERC-721 based NPC identity tokens
- Each NPC gets: on-chain wallet, reputation score (0-10000), behavior hash
- Validators can authorize NPC actions
- Compatible with Avalanche's Trustless Agents standard (1,600+ agents on C-Chain)

### LootVRF.sol
- Chainlink VRF v2.5 consumer for provably fair randomness
- Configurable loot tables per game
- Rarity tiers: Common (50%), Uncommon (25%), Rare (15%), Epic (7.5%), Legendary (2.5%)
- On-chain proof of every drop — players can verify

### StablecoinEconomy.sol (Tether WDK)
- USDT entry fees, prize pools, platform fees
- SafeERC20 with basis point math (decimal-agnostic, works with 6-decimal USDT)
- Automatic prize distribution on match completion
- Platform fee collection (configurable, default 5%)

### ChronosBattle.sol
- On-chain match logic for the showcase game
- Move types: FAST (30 energy, 1 block delay), MEDIUM (20e, 3 blocks), SLOW (10e, 6 blocks)
- Energy regeneration: 2 per block
- Prize pool splitting with platform fee

### AvalonGame.sol
- Base contract for all Avalon games
- Player registration, score tracking, game state machine
- VRF and stablecoin hook points

---

## Layer 2: AI NPC System (`src/ai/`)

### BehaviorTree.ts
Production-grade decision tree framework:
- **Selector** — tries children until one succeeds (OR logic)
- **Sequence** — runs children until one fails (AND logic)
- **Decorators** — Inverter, Repeat, AlwaysSucceed
- **DecisionNode** — produces typed AgentDecision objects

### PersonalitySystem.ts
Trait-driven NPC behavior:
- **8 traits**: aggression, courage, greed, sociability, cunning, loyalty, curiosity, patience
- **5 archetypes**: Merchant, Guardian, Trickster, Scholar, Warrior
- **Mood system**: calm, alert, angry, afraid, happy, suspicious, excited, bored
- **Decision modifiers**: personality affects economic choices, combat strategy, dialogue

### ChronosBridge.ts
Translates personality-driven decisions into Chronos Battle moves:
- Scores each move (Quick Strike, Power Blow, Devastating, Shield, Counter) based on personality traits
- High aggression → prefers expensive damage moves
- High patience → prefers shields and counters
- Cunning → reads opponent patterns and counters

### Named NPCs (`npcs/chronos-npcs.ts`)
5 opponents with full ERC-8004 identity:
| NPC | Archetype | Key Traits | Strategy |
|-----|-----------|-----------|----------|
| Aria | Merchant | greed=0.8, loyalty=0.6 | Cost-efficient, economic |
| Kael | Warrior | aggression=0.9, courage=0.8 | All-in devastating attacks |
| Nova | Trickster | cunning=0.9, patience=0.3 | Counter-heavy, chaotic |
| Sage | Scholar | curiosity=0.9, patience=0.8 | Adaptive, pattern-learning |
| Iron Guardian | Guardian | loyalty=0.9, courage=0.7 | Shield walls, attrition |

### Dialogue System
- 12 dialogue triggers (pre-match taunt, damage dealt, low HP, win, lose, etc.)
- 60+ lines per NPC, personality-driven
- Mood-reactive responses

---

## Layer 3: Game Engine (`src/engine/`)

### AvalonSDK (`sdk/AvalonSDK.ts`)
The developer-facing SDK class:
```typescript
const avalon = new Avalon({ network: 'fuji', apiKey: '...' });
avalon.l1.deploy(config);      // Deploy L1 chain
avalon.agents.create(npc);     // Register ERC-8004 NPC
avalon.vrf.roll(params);       // VRF loot drop
avalon.economy.deposit(amt);   // USDT operations
avalon.matches.create(cfg);    // Create match
```

### Chronos Battle Engine (`chronos/`)
- **ChronosEngine.ts** — State machine: move launch → in-flight → damage resolution → game over
- **ChronosAI.ts** — Three difficulty tiers with personality-driven decision trees
- **moves.ts** — 5 move types with energy costs, block delays, damage values
- **opponents.ts** — Named opponent roster with stat cards

### Core Systems
- **GameEngine.ts** — Initialize, start, stop lifecycle
- **StateManager.ts** — On-chain ↔ local state sync with diffing
- **EconomySystem.ts** — Balance tracking, entry fees, prize pools
- **MatchManager.ts** — Match lifecycle state machine (lobby → active → completed → settled)
- **EventEmitter.ts** — Typed events for UI and on-chain logging

---

## Layer 4: Frontend (`src/app/`)

### Routes
| Route | Purpose |
|-------|---------|
| `/` | Landing page — SDK pitch, features, code examples |
| `/sdk` | SDK documentation with TypeScript + Unity examples |
| `/dashboard` | Developer dashboard — L1 chains, AI agents, economies |
| `/games` | Game browser |
| `/games/[gameId]` | Game detail page |
| `/play/chronos` | Chronos Battle — playable demo |
| `/play/chronos/history` | Match history and replays |
| `/play/[gameId]` | Generic game player |

### State Management (Zustand)
- **chronosStore** — Full Chronos Battle state: HP, moves, blocks, AI, effects
- **gameStore** — Active matches, player stats, pending transactions
- **userStore** — Wallet, balance, chain, connection status

### Web3 Integration
- **AvalonProvider** — Wraps wagmi + RainbowKit + Avalon SDK context
- **useAvalon()** — Master hook: `{ l1, agents, vrf, economy, wallet }`
- **useContracts()** — Typed contract read/write hooks
- **useWallet()** — Wallet state, balance, chain detection, network switching

### Component Architecture
```
components/
├── ui/                    # Design system (15 components)
│   ├── GlowCard          # Neon-bordered cards
│   ├── GlowButton        # Animated CTA buttons
│   ├── Skeleton           # Loading states
│   ├── EmptyState         # Empty data states
│   ├── TransactionPending # Tx confirmation overlay
│   └── WalletModal        # Connect wallet drawer
├── game/
│   ├── NPCCard           # NPC personality radar chart + stats
│   ├── LootReveal        # VRF loot chest animation
│   └── chronos/          # Chronos Battle components (14)
│       ├── BattleArena    # Two-sided arena with VFX
│       ├── MoveSelector   # 5 moves with keyboard shortcuts
│       ├── ParticleEffect # Hit/damage particles
│       ├── DamagePopup    # Floating damage numbers
│       ├── OpponentCard   # AI personality display
│       ├── Leaderboard    # Top players
│       └── MatchResult    # Post-game stats
└── dashboard/
    └── GameCard           # Game info card
```

---

## Data Flow

### Player Match Flow
```
Player clicks "Play"
  → useWallet checks connection + chain (Fuji 43113)
  → USDT approve() for entry fee
  → ChronosBattle.createMatch() on-chain
  → chronosStore initializes game state
  → ChronosEngine runs move loop (2s block intervals)
  → AI opponent makes decisions via ChronosBridge
  → Match ends → ChronosBattle.endMatch() on-chain
  → Prize distributed via StablecoinEconomy
  → LootVRF.requestRandomWords() for loot chest
  → VRF callback resolves loot → LootReveal animation
```

### Developer SDK Flow
```
Developer installs @avalon/sdk
  → Avalon.init({ network, apiKey })
  → avalon.l1.deploy() → GameFactory.createGame()
  → avalon.agents.create() → AgentRegistry.mint()
  → avalon.vrf.configureTable() → LootVRF.setLootTable()
  → avalon.economy.configure() → StablecoinEconomy.initialize()
  → Game is live on its own L1
```

---

## Key Design Decisions

1. **SDK not Engine** — Game devs already love Unity/Unreal. We don't compete with graphics engines. We handle the blockchain layer only.

2. **Per-game L1** — Each game gets its own Avalanche L1 chain. No shared chain congestion, custom block time, custom gas token.

3. **ERC-8004 for NPCs** — Using Avalanche's Trustless Agents standard gives NPCs real on-chain identity. They own wallets, build reputation, persist across sessions.

4. **VRF for Fairness** — Every loot drop is provably random via Chainlink VRF v2.5. Players can verify on-chain. No "rigged" drop tables.

5. **USDT not Custom Token** — Real stablecoins (Tether WDK) for real economies. No worthless game tokens. Players earn and spend actual USDT.

6. **Personality-Driven AI** — NPCs aren't random. Each has an archetype, 8 personality traits, mood system, and behavior tree. Their economic and combat decisions reflect who they are.

7. **Chronos Battle as Proof** — Instead of a generic demo, we built a game where blockchain mechanics ARE the game design. Latency isn't a bug — it's the core mechanic.

---

## Environment

| Variable | Description |
|----------|-----------|
| `NEXT_PUBLIC_ALCHEMY_ID` | Alchemy API key for RPC |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | WalletConnect project ID |
| `NEXT_PUBLIC_CHAIN_ID` | Target chain (43113 for Fuji) |
| `DEPLOYER_PRIVATE_KEY` | Contract deployer private key |
| `VRF_SUBSCRIPTION_ID` | Chainlink VRF subscription ID |

---

## Deployed Contracts — Avalanche Fuji Testnet

All contracts deployed and verified on [Snowtrace](https://testnet.snowtrace.io).

| Contract | Address | Snowtrace |
|----------|---------|-----------|
| **GameFactory** | `0x3f7FC08150709C22F1741A230351B59c36bCCc8a` | [View](https://testnet.snowtrace.io/address/0x3f7FC08150709C22F1741A230351B59c36bCCc8a) |
| **AgentRegistry** | `0x2636Ed9F3Aa33589810BE07B48ad9Be79de3Fd7F` | [View](https://testnet.snowtrace.io/address/0x2636Ed9F3Aa33589810BE07B48ad9Be79de3Fd7F) |
| **LootVRF** | `0xcd8D3bFb6757504896a9320Dcb451e20d4baa74B` | [View](https://testnet.snowtrace.io/address/0xcd8D3bFb6757504896a9320Dcb451e20d4baa74B) |
| **StablecoinEconomy** | `0x95B4b7d7a23d954BF92FeDF2e00A374E22208D69` | [View](https://testnet.snowtrace.io/address/0x95B4b7d7a23d954BF92FeDF2e00A374E22208D69) |
| **ChronosBattle** | `0xafA4230B7154d95F1c8Bc13AD443b2e50bde7C57` | [View](https://testnet.snowtrace.io/address/0xafA4230B7154d95F1c8Bc13AD443b2e50bde7C57) |

Network: Avalanche Fuji Testnet (Chain ID: 43113)
Deployed: 2026-03-04 · Verified on Snowtrace ✓

> **TODO**: Set up Chainlink VRF subscription at [vrf.chain.link](https://vrf.chain.link), add LootVRF as consumer, fund with LINK.

## Build

```bash
npm run build    # Next.js production build
npm run dev      # Development server (localhost:3000)
npx hardhat compile  # Compile Solidity contracts
npx hardhat run contracts/scripts/deploy.ts --network fuji  # Deploy
```
