# Avalon Demo Script (5 minutes)

> **Audience:** Blockchain VCs, Avalanche core team
> **Goal:** Show that Avalon is a complete, working platform for on-chain gaming
> **Setup:** Browser open to localhost:3000. Wallet connected to Fuji testnet.

---

## 1. Landing Page Pitch (0:00 - 0:30)

**Open localhost:3000**

> "Avalon is the blockchain backend for game developers. You build your game in Unity, Unreal, or React. We give it its own Avalanche L1, autonomous AI agents with real wallets, provably fair loot, and a stablecoin economy."

Scroll down slowly through the four feature cards:
- **Own Avalanche L1** - every game gets a dedicated chain
- **ERC-8004 AI Agents** - NPCs with on-chain identity and wallets
- **Chainlink VRF Loot** - provably fair, verifiable on-chain
- **Stablecoin Economy** - real USDT via Tether WDK

Pause on the code example. Point out the 3-step integration: Connect, Configure, Deploy.

> "Three lines of code. That's it. Let me show you what this looks like in production."

Click **"Play Now"** on the Chronos Battle showcase card.

---

## 2. Chronos Battle Demo (0:30 - 2:30)

### The Lobby (30s)

> "Chronos Battle is our showcase game. The core mechanic: blockchain latency IS the gameplay. Cheap moves are instant but weak. Expensive moves hit hard but take blocks to land, so your opponent sees them coming."

Point out the NPC opponent cards in the grid:
- **Aria the Merchant** (medium) - cautious, economical fighter
- **Kael the Warrior** (easy) - pure aggression, low cunning
- **Nova the Trickster** (hard) - counter specialist, unpredictable
- **Sage the Scholar** (expert) - adapts mid-fight
- **Iron Guardian** (hard) - defensive wall

> "Each of these is an ERC-8004 AI agent with its own on-chain wallet, reputation score, and personality traits that shape how it fights. Not scripted. Not random. Personality-driven."

**Select Kael the Warrior** (easiest, best for a quick demo win).

Point out the right panel:
- ERC-8004 agent ID
- Contract address (real Fuji address)
- Win/loss record and reputation
- Entry fee and prize pool in USDT

Click **START MATCH**.

### Playing (60s - play 2-3 rounds)

> "Watch the moves-in-flight panel on the right. When I throw a Power Blow, it costs 2 coins and takes 3 blocks to land. Kael can see it coming and try to shield or counter. That tension IS the game."

**Round 1:** Use Quick Strike (instant, 10 dmg) to show the fast path.
**Round 2:** Use Power Blow (3 blocks, 25 dmg) - point out the in-flight timer.
**Round 3:** Use Shield if Kael has a move incoming, then follow with Devastating Strike.

Point out as you play:
- NPC dialogue lines (personality-driven, not canned)
- AI thinking confidence percentage
- Coin economy (earn 1/block, spend on moves)
- Health bars and damage numbers

### Game Over + Loot (30s)

When the match ends:

> "Game over screen shows full stats. And now the loot drop - this is powered by Chainlink VRF. Every roll is verifiable on-chain. The player can check the VRF proof on Snowtrace and confirm the game never cheated."

Show the loot reveal animation. Point out the rarity (common/uncommon/rare/epic/legendary).

Click back to lobby.

---

## 3. Dashboard Tour (2:30 - 3:30)

**Navigate to /dashboard** (click Dashboard in nav).

> "This is the developer dashboard. Everything here is reading from live Fuji contracts."

Point out the stats row:
- **Active L1 Chains** - 2 active, 1 deploying
- **AI Agents (ERC-8004)** - count from AgentRegistry contract
- **On-Chain Matches** - count from ChronosBattle contract
- **Accepted Tokens** - from StablecoinEconomy contract

> "These aren't mocked. If the contracts are down or you're on the wrong network, you see skeleton loaders. Connect your wallet and it reads live state from Fuji."

Scroll to the L1 Chains section:
- Chronos Battle L1 (Chain ID 100001, 2s blocks, 4 validators)
- AI Arena L1 (Chain ID 100002, 1s blocks)
- Loot Realm L1 (deploying)

> "Every game gets its own L1. Custom block time, custom validators, custom gas token. Full sovereignty."

Point out Quick Actions at bottom right: SDK Docs, Play Chronos, Browse Games.

---

## 4. SDK Docs Pitch (3:30 - 4:00)

**Navigate to /sdk**.

> "For developers, everything is accessible through a TypeScript SDK."

Scroll through the code examples. Point out:
- `Avalon.init()` - one-line setup
- `avalon.agents.create()` - spawn an ERC-8004 NPC
- `avalon.vrf.rollLoot()` - provably fair loot
- `avalon.economy.payEntryFee()` - stablecoin payments

> "Supports TypeScript, Unity plugin, CLI tools. A game developer doesn't need to know Solidity. They configure their game, we handle the blockchain."

---

## 5. Closing (4:00 - 5:00)

> "Let me leave you with what's actually deployed today."

Pull up the contract addresses (or just recite them):

| Contract | Fuji Address |
|----------|-------------|
| GameFactory | `0x3f7F...Cc8a` |
| ChronosBattle | `0xafA4...7C57` |
| AgentRegistry (ERC-8004) | `0x2636...d7F` |
| StablecoinEconomy | `0x95B4...D69` |
| LootVRF (Chainlink) | `0xc39d...4f8` |

> "Five contracts live on Fuji. ERC-8004 is our proposed standard for autonomous AI agents with on-chain identity. Chainlink VRF handles all randomness. Tether WDK powers the economy. Every game deploys on its own Avalanche L1."

> "We're not pitching a whitepaper. This is working code. You just played it."

**End.**

---

## Backup Talking Points (if judges ask)

- **Why Avalanche L1?** Sub-second finality, custom gas, sovereign security. Game-specific chains mean no congestion from DeFi traffic.
- **Why ERC-8004?** Existing NFT standards don't cover autonomous agents. ERC-8004 gives NPCs wallets, reputation, and decision-making identity on-chain.
- **Why Chainlink VRF?** Players need to trust loot drops are fair. VRF proofs are verifiable on-chain. No server-side RNG.
- **Why Tether WDK?** Stablecoin economies mean players earn real value, not volatile tokens. USDT is universally understood.
- **Revenue model?** Platform fee on game L1 deployments + percentage of stablecoin transaction volume.
- **What's next?** Unity plugin (alpha), game creator dashboard with no-code NPC builder, mainnet deployment.
