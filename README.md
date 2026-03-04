# Avalon

**Blockchain Gaming SDK for Avalanche**

> Unity builds the graphics. Avalon powers the economy.

Avalon is a blockchain gaming SDK that gives any game its own Avalanche L1 chain with AI NPCs (ERC-8004), provably fair loot (Chainlink VRF), and stablecoin economies (Tether WDK). Game developers keep building in Unity, Unreal, or React. Avalon handles everything on-chain.

Built for the [Avalanche Build Games 2026](https://www.avax.network/buildgames).

---

## What's New

**Chronos Battle is fully playable.** Pick an opponent, fight, earn loot in a single session with no wallet required.

- **Battle System** 5 move types (Quick Strike, Power Blow, Devastating Strike, Shield, Counter) with hit sounds, floating damage popups, HP flash effects, and victory confetti on win
- **5 AI NPCs with ERC-8004 Identity** Each opponent has a radar chart showing traits (aggression, patience, adaptability, courage, cunning), contextual mid-battle dialogue driven by personality and game state, and unique play styles
- **Judge Demo Mode** Visit `/play/chronos?demo=true` to bypass wallet connection and play instantly with a demo wallet. Designed for judges and reviewers
- **LootReveal Flow** After every win, a Chainlink VRF-powered loot chest opens with rarity-glow animation. Full end-to-end: match victory, stats screen, chest reveal, item drop
- **Match History + Leaderboard** Track every match result, damage dealt, coins spent, and loot earned. Ranked leaderboard across all players

---

## The Problem

Game developers want blockchain features real economies, verifiable randomness, AI NPCs with wallets but integration costs 6-12 months of blockchain engineering. Most studios give up or ship half-baked integrations. 90%+ of "blockchain games" are just games with a token stapled on.

## The Solution

Avalon is middleware. **Stripe for on-chain games.** Drop in the SDK and get:

- **Own Avalanche L1** Your game runs on its own sovereign chain, not shared with thousands of others
- **ERC-8004 AI NPCs** NPCs with on-chain wallets, personality, and autonomous economic behavior
- **Chainlink VRF v2.5** Provably fair loot drops players can verify on-chain
- **Tether WDK Economy** Real USDT entry fees, prize pools, and in-game purchases
- **30-Second Onboarding** Social login, embedded wallets, gas abstraction. No MetaMask.

```typescript
import { Avalon } from '@avalon/sdk';

const avalon = new Avalon({ network: 'fuji' });
const chain = await avalon.l1.deploy({ name: 'My Game', blockTime: 1 });
const npc = await avalon.agents.create({ name: 'Iron Merchant', archetype: 'merchant' });
const loot = await avalon.vrf.roll({ player: '0x...', table: 'epic-chest' });
```

## Chronos Battle Demo Game

**Chronos Battle** is our showcase game where blockchain latency IS the core mechanic:

- Cheap moves are slow (opponent sees them coming)
- Expensive moves are instant (surprise attacks)
- AI opponents have unique personalities powered by ERC-8004 identity
- Entry fees and prizes in USDT via Tether WDK
- Loot chest rewards via Chainlink VRF after every win

**Play it in 30 seconds** at `/play/chronos`.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, TypeScript, Tailwind CSS 4, Framer Motion |
| State | Zustand stores (game, user, chronos) |
| Web3 | wagmi v2, viem, RainbowKit |
| Contracts | Solidity 0.8.24, Hardhat, OpenZeppelin, Chainlink |
| AI | Behavior trees, personality system, ERC-8004 identity |
| Network | Avalanche Fuji Testnet (Chain ID: 43113) |

## Project Structure

```
avaforge/
├── contracts/              # Solidity smart contracts (6 contracts, 1,111 LOC)
│   ├── GameFactory.sol     # Deploy new game instances
│   ├── AgentRegistry.sol   # ERC-8004 NPC identity registry
│   ├── LootVRF.sol         # Chainlink VRF v2.5 loot system
│   ├── StablecoinEconomy.sol # USDT economy (Tether WDK)
│   ├── ChronosBattle.sol   # Chronos Battle on-chain logic
│   └── AvalonGame.sol      # Base game contract
├── src/
│   ├── ai/                 # AI NPC system (12 files)
│   │   ├── BehaviorTree.ts       # Decision tree framework
│   │   ├── PersonalitySystem.ts  # 5 archetypes, 8 traits, mood system
│   │   ├── ChronosBridge.ts      # AI → game move translator
│   │   ├── npcs/chronos-npcs.ts  # 5 named opponents
│   │   └── ...
│   ├── engine/             # Game engine + SDK (14 files)
│   │   ├── sdk/AvalonSDK.ts      # The SDK class developers import
│   │   ├── chronos/              # Chronos Battle engine
│   │   ├── GameEngine.ts         # Engine entry point
│   │   ├── EconomySystem.ts      # USDT economy logic
│   │   └── ...
│   ├── app/                # Next.js pages (8 routes)
│   │   ├── page.tsx              # Landing page
│   │   ├── sdk/page.tsx          # SDK documentation
│   │   ├── dashboard/page.tsx    # Developer dashboard
│   │   ├── play/chronos/         # Chronos Battle game
│   │   └── games/                # Game browser
│   ├── components/         # React components (35+ files)
│   │   ├── game/chronos/         # Battle arena, moves, health, particles
│   │   ├── game/                 # NPCCard, LootReveal
│   │   └── ui/                   # Design system components
│   ├── hooks/              # React hooks (4 files)
│   │   ├── useAvalon.ts          # Master SDK hook
│   │   ├── useContracts.ts       # Contract interactions
│   │   └── useWallet.ts          # Wallet state
│   ├── lib/                # Utilities + contract ABIs
│   │   └── contracts/            # ABIs + addresses
│   ├── stores/             # Zustand state (3 stores)
│   ├── providers/          # Web3 + Avalon providers
│   └── types/              # TypeScript types (560+ lines)
└── package.json
```

**Total: ~20,900 lines of code** (97 TypeScript/TSX files + 6 Solidity contracts)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Install & Run

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/avalon.git
cd avalon/avaforge

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the landing page.

### Compile Smart Contracts

```bash
npx hardhat compile
```

### Deploy to Fuji Testnet

```bash
npx hardhat run contracts/scripts/deploy.ts --network fuji
```

## Integration Partners

| Partner | Integration | What It Does |
|---------|------------|--------------|
| **Chainlink** | VRF v2.5 | Provably fair loot drops and randomness |
| **Tether** | WDK | Stablecoin economies, USDT payments, self-custodial wallets |
| **Avalanche** | L1 Subnets | Per-game sovereign chains |

## AI NPC Characters

Chronos Battle features 5 AI opponents, each with unique ERC-8004 identity and personality:

| NPC | Archetype | Personality | Play Style |
|-----|-----------|-------------|------------|
| **Aria** | Merchant | Greedy, cautious | Economic plays, cost-efficient moves |
| **Kael** | Warrior | Aggressive, brave | High-cost devastating attacks |
| **Nova** | Trickster | Cunning, impatient | Counter-heavy, unpredictable |
| **Sage** | Scholar | Curious, patient | Adaptive, pattern-learning |
| **Iron Guardian** | Guardian | Loyal, brave | Shield-focused, defensive walls |

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed technical architecture.

## Team

- **Kamal Nayan Singh** Builder

## License

MIT
