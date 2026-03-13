# Avalon

**Blockchain Gaming SDK for Avalanche**

> Unity builds the graphics. Avalon powers the economy.

Avalon is a blockchain gaming SDK that gives game developers a unified TypeScript API for Avalanche deployment, autonomous NPC identity (ERC-8004), Chainlink VRF loot, and stablecoin economies. Game developers keep building in Unity, Unreal, or React. Avalon handles everything on-chain.

Built for the [Avalanche Build Games 2026](https://www.avax.network/buildgames).

---

## What's New

**Chronos Battle is fully playable.** Pick an opponent, fight, earn loot in a single session with no wallet required.

- **Battle System** 5 move types (Quick Strike, Power Blow, Devastating Attack, Shield, Counter) with hit sounds, floating damage popups, HP flash effects, and victory confetti on win
- **5 Autonomous NPCs with ERC-8004 Identity** Each opponent has a radar chart showing traits (aggression, defense, economy, speed, cunning), contextual mid-battle dialogue driven by personality and game state, and unique play styles shaped by 8 personality traits including mood-driven behavior shifts
- **Chainlink VRF Loot** Real VRF integration with on-chain proof verification. Demo mode uses client-side fallback for instant gameplay; wallet-connected mode calls the deployed LootVRF contract for verifiable fairness
- **Loot Effects** Speed Rune (-1 block delay), Power Crystal (+5 damage), Shield Fragment (50% damage reduction), Chronos Crown (+2 starting coins) all functional in the game engine
- **39 Smart Contract Tests** Full Hardhat test suite covering all 5 move types, shield/counter mechanics, prize distribution, cancel/refund, and admin access control
- **Judge Demo Mode** Visit `/play/chronos?demo=true` to bypass wallet connection and play instantly
- **Match History + Leaderboard** Track every match result, damage dealt, coins spent, and loot earned

---

## The Problem

Game developers want blockchain features (real economies, verifiable randomness, autonomous NPCs with wallets) but integration costs 6-12 months of blockchain engineering. Most studios give up or ship half-baked integrations.

## The Solution

Avalon is middleware. **Stripe for on-chain games.** Drop in the SDK and get:

- **Dedicated On-Chain Backend** Your game gets its own smart contract suite on Avalanche, with architecture designed for per-game L1 deployment
- **ERC-8004 Autonomous NPCs** NPCs with on-chain wallets, reputation scores, and trait-driven behavior trees powered by 8 personality dimensions
- **Chainlink VRF v2.5** Provably fair loot drops with on-chain proof verification via deployed LootVRF contract
- **Stablecoin Economy** ERC-20 payment infrastructure with entry fees, prize pools, and platform revenue splits

```typescript
import { Avalon } from '@avalon/sdk';

const avalon = new Avalon({ network: 'fuji' });
const chain = await avalon.l1.deploy({ name: 'My Game', blockTime: 1 });
const npc = await avalon.agents.create({ name: 'Iron Merchant', archetype: 'merchant' });
const loot = await avalon.vrf.roll({ player: '0x...', table: 'epic-chest' });
```

## Chronos Battle Demo Game

**Chronos Battle** is our showcase game where blockchain latency IS the core mechanic:

- **Cheap moves land instantly** but deal low damage (Quick Strike: 1 coin, instant, 10 dmg)
- **Expensive moves hit hard** but take blocks to arrive (Devastating Attack: 3 coins, 6 blocks, 50 dmg)
- **Shield** blocks the next incoming attack (1 coin, 2-block activation)
- **Counter** reflects double damage on opponent's in-flight moves (2 coins, instant)
- Autonomous NPC opponents with trait-driven decisions, mood system, and contextual dialogue
- Loot rewards with real gameplay effects (Speed Rune, Power Crystal, Shield Fragment, Chronos Crown)

**Play it in 30 seconds** at `/play/chronos?demo=true`.

---

## Smart Contracts (Fuji Testnet)

All contracts deployed and verified on Avalanche Fuji (Chain ID: 43113):

| Contract | Address | Verified |
|----------|---------|----------|
| GameFactory | `0x3f7FC08150709C22F1741A230351B59c36bCCc8a` | [Snowtrace](https://testnet.snowtrace.io/address/0x3f7FC08150709C22F1741A230351B59c36bCCc8a) |
| ChronosBattle | `0x5BFb2b211d20FC6F811f869184546910FB45985e` | [Snowtrace](https://testnet.snowtrace.io/address/0x5BFb2b211d20FC6F811f869184546910FB45985e) |
| AgentRegistry (ERC-8004) | `0x2636Ed9F3Aa33589810BE07B48ad9Be79de3Fd7F` | [Snowtrace](https://testnet.snowtrace.io/address/0x2636Ed9F3Aa33589810BE07B48ad9Be79de3Fd7F) |
| StablecoinEconomy | `0x95B4b7d7a23d954BF92FeDF2e00A374E22208D69` | [Snowtrace](https://testnet.snowtrace.io/address/0x95B4b7d7a23d954BF92FeDF2e00A374E22208D69) |
| LootVRF (Chainlink VRF v2.5) | `0x00aabA40e80d9C64d650C0f99063754944C1F05E` | [Snowtrace](https://testnet.snowtrace.io/address/0x00aabA40e80d9C64d650C0f99063754944C1F05E) |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, TypeScript, Tailwind CSS 4, Framer Motion |
| State | Zustand stores (game, user, chronos) |
| Web3 | wagmi v2, viem, RainbowKit |
| Contracts | Solidity 0.8.27, Hardhat, OpenZeppelin, Chainlink VRF v2.5 |
| AI | Behavior trees, personality system (8 traits), mood engine, ERC-8004 identity |
| Testing | Hardhat + Chai (39 tests) |
| Network | Avalanche Fuji Testnet (Chain ID: 43113) |

## Project Structure

```
avaforge/
├── contracts/              # Solidity smart contracts (6 contracts)
│   ├── GameFactory.sol     # Deploy new game instances
│   ├── AgentRegistry.sol   # ERC-8004 NPC identity registry
│   ├── LootVRF.sol         # Chainlink VRF v2.5 loot system
│   ├── StablecoinEconomy.sol # ERC-20 economy module
│   ├── ChronosBattle.sol   # 5-move combat (coins, shield, counter)
│   └── AvalonGame.sol      # Base game contract
├── test/                   # Smart contract tests (39 tests)
├── src/
│   ├── ai/                 # NPC system (behavior trees, personality, mood)
│   ├── engine/             # Game engine + SDK
│   ├── app/                # Next.js pages (9 routes)
│   ├── components/         # React components (35+ files)
│   ├── hooks/              # React hooks (useContracts, useVRFLoot, etc.)
│   ├── lib/                # Utilities + contract ABIs
│   ├── stores/             # Zustand state stores
│   └── types/              # TypeScript types
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Install & Run

```bash
git clone https://github.com/kamalbuilds/avalon.git
cd avalon/avaforge

npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the landing page.

### Run Tests

```bash
TS_NODE_PROJECT=tsconfig.hardhat.json npx hardhat test
```

### Compile Smart Contracts

```bash
TS_NODE_PROJECT=tsconfig.hardhat.json npx hardhat compile
```

### Deploy to Fuji Testnet

```bash
TS_NODE_PROJECT=tsconfig.hardhat.json npx hardhat run contracts/scripts/deploy.ts --network fuji
```

## Integration Partners

| Partner | Integration | Status |
|---------|------------|--------|
| **Chainlink** | VRF v2.5 | Deployed, contract verified, frontend integrated |
| **Avalanche** | Fuji Testnet | 5 contracts deployed and verified |
| **ERC-8004** | Agent Identity | AgentRegistry deployed with reputation system |

## AI NPC Characters

Chronos Battle features 5 autonomous opponents, each with unique ERC-8004 identity and personality:

| NPC | Archetype | Personality | Play Style |
|-----|-----------|-------------|------------|
| **Aria** | Merchant | Greedy, cautious | Economic plays, cost-efficient moves |
| **Kael** | Warrior | Aggressive, brave | High-cost devastating attacks |
| **Nova** | Trickster | Cunning, impatient | Counter-heavy, unpredictable |
| **Sage** | Scholar | Curious, patient | Adaptive, pattern-learning |
| **Iron Guardian** | Guardian | Loyal, brave | Shield-focused, defensive walls |

NPCs use 8 personality traits (aggression, patience, courage, cunning, greed, sociability, curiosity, loyalty) plus a mood engine (calm, angry, afraid, excited, bored, suspicious) that shifts behavior during battle.

## Team

- **Kamal Nayan Singh** Builder

## License

MIT
