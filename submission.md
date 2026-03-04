Submit Your Work
Functional prototype, GitHub repository with code, technical implementation details, and product walkthrough video (max 5 minutes) demonstrating key features.


1
Stage 1  Idea
update if needed
Project Overview

**Your project name:**
Avalon

**Summarize your project in one sentence (max 280 characters):**
Avalon is a blockchain gaming SDK that gives any game its own Avalanche L1 with AI NPCs (ERC-8004), provably fair loot (Chainlink VRF), and stablecoin economies (Tether WDK) so game devs keep building in Unity while Avalon powers the on-chain economy.

**Select the category that best describes your project:**
Gaming

**Did you start working on this idea before Build Games?**
No new idea

---

**Problem Identification**

**Describe the pain point or need your project aims to solve:**
Game developers want to add blockchain features  real economies, verifiable randomness, AI NPCs with wallets but the integration cost is brutal. Today, a Unity dev who wants on-chain assets has to learn Solidity, deploy contracts, run validators, handle wallet UX, integrate oracles, and manage chain infrastructure. That's 6-12 months of blockchain engineering on top of the game itself. Most studios give up or ship half-baked integrations that frustrate players with gas fees, slow transactions, and confusing wallet flows. The result: 90%+ of "blockchain games" are just games with a token stapled on  not truly on-chain experiences.

**Describe your primary user persona:**
Our primary user is an indie-to-mid game studio (B2B)  a team of 2-15 developers building in Unity or Unreal who have a working game prototype and want to add blockchain features without hiring a smart contract team. They understand their game deeply but don't know Solidity, don't want to manage validators, and need their players to onboard in under 30 seconds without MetaMask. Secondary users are the players themselves (B2B2C)  gamers who interact with the on-chain economy transparently, earning real USDT, trading with AI merchants, and receiving provably fair loot drops  all without knowing they're on a blockchain.

**Describe existing workarounds or solutions before your project:**
Current alternatives fall into three buckets: (1) DIY blockchain integration  studios hire Solidity devs, deploy their own contracts, and manage infrastructure. Works for MapleStory (Nexon, massive budget) but fails for indie teams. (2) Gaming-specific chains like ImmutableX or Ronin  these give you a chain but no AI agents, no VRF loot, no stablecoin economies, and no per-game L1 isolation. Your game shares a chain with thousands of others. (3) No-code game builders like Thirdweb or Sequence  these handle wallet connection but don't give you a dedicated L1, don't integrate AI NPCs, and don't provide game-specific features like loot tables or economy balancing. None of these solutions let a game dev say "give my game its own blockchain with AI characters and real economies" in 20 lines of code.

**Explain how your project solves the problem better than current solutions:**
Avalon is middleware  "Stripe for on-chain games." Game devs keep building in Unity, Unreal, or React. They drop in the Avalon SDK (npm install @avalon/sdk or Unity plugin) and get: (1) Their own Avalanche L1 blockchain with custom block time, gas token, and validator set  not shared with anyone else. (2) ERC-8004 AI NPCs with on-chain identity, wallets, personality, and autonomous behavior  merchants that negotiate prices, guards that remember grudges, oracles that provide lore. (3) Chainlink VRF v2.5 for provably fair loot drops  players can verify every drop on-chain. (4) Tether WDK stablecoin economies  real USDT entry fees, prize pools, and in-game purchases with self-custodial wallets. (5) 30-second player onboarding with social login, embedded wallets, and gas abstraction  no MetaMask, no seed phrases. The pitch: "Unity builds the graphics. Avalon powers the economy."

**Describe the key blockchain interactions in your solution:**
When a developer deploys a game through Avalon, a new Avalanche L1 subnet is created with custom parameters (block time, gas token, validators). AI NPCs are registered as ERC-8004 Trustless Agents on this L1  each NPC gets an on-chain wallet, identity token, and behavior contract that governs their economic decisions. When a player opens a loot chest, the game calls Chainlink VRF v2.5 through Avalon's SDK  a verifiable random number is generated on-chain, the loot table resolves against it, and the resulting item is minted as an on-chain asset the player truly owns. When players enter a match, their USDT entry fee flows through a Tether WDK-powered smart contract into a prize pool  the winner's payout is automatic, trustless, and instant. AI merchants track their own profit/loss on-chain, adjust prices based on supply/demand, and build reputation scores that persist across game sessions.

---

Video & Partnerships

**Link to video:**
(Recording in progress — 5-minute walkthrough: landing page → SDK docs → Chronos Battle demo with Iron Guardian → LootReveal → developer dashboard with live Fuji contract data)

**Select integration partners:**
- Chainlink (VRF v2.5 for provably fair loot and randomness)
- Tether WDK (stablecoin economies, self-custodial wallets, USDT payments)
- Avalanche (L1 subnet deployment, core infrastructure)

---

Team & Collaboration
Name: Kamal Nayan Singh | Email: geniusamansingh@gmail.com | Role: Member | Status: Confirmed


2
Stage 2  MVP
current stage

**GitHub repository:**
https://github.com/kamalbuilds/avaforge (31+ commits, actively developed)

**Live Demo (no wallet required):**
Play Chronos Battle instantly at `/play/chronos?demo=true` — the `?demo=true` parameter bypasses wallet connection using a pre-configured demo wallet. Judges can experience the full game loop (battle, loot reveal, match history) without installing MetaMask or holding any tokens.

**Deployed & Verified Contracts on Avalanche Fuji Testnet:**

| Contract | Address | Verify |
|----------|---------|--------|
| GameFactory | `0x3f7FC08150709C22F1741A230351B59c36bCCc8a` | [Snowtrace](https://testnet.snowtrace.io/address/0x3f7FC08150709C22F1741A230351B59c36bCCc8a) |
| ChronosBattle | `0xafA4230B7154d95F1c8Bc13AD443b2e50bde7C57` | [Snowtrace](https://testnet.snowtrace.io/address/0xafA4230B7154d95F1c8Bc13AD443b2e50bde7C57) |
| AgentRegistry (ERC-8004) | `0x2636Ed9F3Aa33589810BE07B48ad9Be79de3Fd7F` | [Snowtrace](https://testnet.snowtrace.io/address/0x2636Ed9F3Aa33589810BE07B48ad9Be79de3Fd7F) |
| StablecoinEconomy | `0x95B4b7d7a23d954BF92FeDF2e00A374E22208D69` | [Snowtrace](https://testnet.snowtrace.io/address/0x95B4b7d7a23d954BF92FeDF2e00A374E22208D69) |
| LootVRF (Chainlink VRF v2.5) | `0xc39d9Ec925d3AA6E67FE760630406696408724f8` | [Snowtrace](https://testnet.snowtrace.io/address/0xc39d9Ec925d3AA6E67FE760630406696408724f8) |

**Describe your tech stack, architecture decisions, and implementation approach:**
Frontend: Next.js 16 (App Router) with TypeScript, Tailwind CSS 4, Zustand state management, and Framer Motion animations. Mobile-responsive battle layout. Web3: wagmi v2 + viem for blockchain interactions, RainbowKit for wallet connection, plus a ?demo=true bypass mode that uses a pre-configured demo wallet so judges and players can try the full game without a wallet. Smart Contracts: Solidity 0.8.24 on Hardhat with OpenZeppelin and Chainlink contract libraries — 6 contracts (~1,111 LOC), all deployed and verified on Avalanche Fuji. Game Engine: Custom TypeScript engine with ECS-inspired architecture (EntitySystem, MoveSystem, CombatSystem, EconomySystem, StateManager). AI System: Behavior tree architecture with personality-driven agents, dialogue system, economic decision-making, and ERC-8004 identity integration. Audio: Web Audio API synthesized sound effects (no .mp3 files) — hit sounds, power-up tones, victory jingle.

Codebase: ~20,900 lines of code across 97 TypeScript/TSX files + 6 Solidity contracts. 31+ commits. Build is GREEN (npx next build passes, 0 errors, 9 routes).

Architecture decision: We chose to be an SDK (not a game engine) because game devs already love Unity/Unreal and won't switch. Avalon is the blockchain backend layer — we handle chain deployment, smart contracts, AI agents, randomness, and economies. The game dev handles graphics and gameplay. This is "Stripe for on-chain games" — not "Unity competitor."

**Outline the main components, workflows, and technical structure:**
System Architecture:

1. Avalon SDK (npm package / Unity plugin)  Developer-facing API layer
   - L1 Module: Deploy and manage Avalanche L1 subnets
   - Agent Module: Create/manage ERC-8004 AI NPCs
   - VRF Module: Chainlink VRF v2.5 loot system
   - Economy Module: Tether WDK stablecoin flows
   - State Module: On-chain game state management
   - Onboard Module: Player wallet creation and gas abstraction

2. Smart Contract Layer (on-chain, per-game L1)
   - GameFactory.sol: Deploys new game instances
   - AgentRegistry.sol: ERC-8004 NPC registry with wallets
   - LootVRF.sol: Chainlink VRF consumer for loot drops
   - StablecoinEconomy.sol: USDT prize pools, fees, transfers
   - ChronosBattle.sol: Showcase game contract

3. AI Engine (off-chain, server-side)
   - BehaviorTree: Decision-making framework for NPCs
   - PersonalitySystem: Trait-driven behavior (greed, loyalty, curiosity)
   - EconomicAgent: Market-making, price negotiation, trade execution
   - DialogueSystem: Context-aware NPC conversations

4. Frontend Dashboard
   - Developer dashboard: L1 chains, AI agents, economies overview
   - SDK documentation: Interactive code examples
   - Chronos Battle: Playable showcase game

Data flow: Game dev calls SDK → SDK translates to smart contract calls → Contracts execute on game's L1 → Events emitted back to SDK → Game engine processes state changes → UI updates.

**Walk us through the full user journey step by step:**
Step 1: Developer lands on avalon.gg, sees "Unity builds the graphics. Avalon powers the economy." and clicks "View SDK Docs."
Step 2: Developer runs `npm install @avalon/sdk` and initializes Avalon with their API key and network (Fuji testnet).
Step 3: Developer calls `avalon.l1.deploy()` to create their game's own Avalanche L1 with custom block time and gas token  takes 60 seconds.
Step 4: Developer creates AI NPCs using `avalon.agents.create()`  each NPC gets an ERC-8004 identity, wallet, personality traits, and behavior set.
Step 5: Developer configures loot tables using `avalon.vrf.configureTable()` with item names, rarities, and drop weights  powered by Chainlink VRF.
Step 6: Developer enables USDT economy using `avalon.economy.configure()`  entry fees, prize pools, and in-game purchases via Tether WDK.
Step 7: Developer integrates the SDK into their Unity/React game  20 lines of code to connect all blockchain features.
Step 8: Player opens the game, signs in with Google/Discord (no MetaMask), gets an embedded wallet with gas abstraction  onboarded in 30 seconds.
Step 9: Player enters a match, pays $1 USDT entry fee → plays the game → wins/loses → prize distributed automatically on-chain.
Step 10: Player opens a loot chest → Chainlink VRF generates verifiable random number → item minted → player can verify fairness on-chain.
Step 11: Player trades with an AI merchant NPC (ERC-8004) who has its own wallet, negotiates prices based on personality, and builds reputation over time.

**MoSCoW Framework — Delivery Status:**

Must Have (all shipped):
- [x] Working Avalon SDK with L1 deployment, AI agents, VRF loot, and stablecoin economy modules
- [x] Chronos Battle fully playable — 5 move types, hit sounds, floating damage popups, HP flash effects, victory confetti, defeat glow animation
- [x] 5 smart contracts deployed and verified on Avalanche Fuji testnet (GameFactory, AgentRegistry, LootVRF, StablecoinEconomy, ChronosBattle)
- [x] Developer dashboard showing live L1 chains, AI agents, and economy metrics (reads from Fuji contracts)
- [x] SDK documentation page with interactive code examples
- [x] Landing page with clear SDK positioning and "Play Chronos Battle" CTA
- [x] ERC-8004 AI NPCs — 5 named opponents with on-chain identity, radar charts showing 5 personality traits, and contextual mid-battle dialogue
- [x] Judge demo mode: `/play/chronos?demo=true` bypasses wallet entirely — full game loop accessible in one click
- [x] LootReveal end-to-end: match victory → stats screen → Chainlink VRF-powered chest opening with rarity-glow animation → item drop
- [x] Match History tab tracking every result, damage dealt, coins spent, and loot earned
- [x] Leaderboard ranked across all players
- [x] Mobile-responsive battle layout

Should Have (shipped):
- [x] Chainlink VRF v2.5 integration with verifiable loot drops (contract: `0xc39d9...724f8`)
- [x] AI NPC personality system — 5 archetypes, 8 traits, mood system affecting combat decisions and dialogue tone
- [x] AI NPC dialogue system — contextual responses triggered by game events (low HP, dominating, opponent move incoming)
- [x] Real-time coin economy (earn 1 coin/block, spend on moves with delay/damage tradeoffs)
- [x] Tether WDK stablecoin economy scaffolded in StablecoinEconomy.sol

Could Have (partial):
- [ ] Cross-chain messaging (Chainlink CCIP) — architecture designed, not implemented in MVP
- [ ] Marketplace for NPC-crafted items — future phase
- [ ] Multi-validator production L1 — single validator on Fuji for hackathon

Won't Have:
- Visual game editor (we're an SDK — developers use Unity/Unreal)
- Mobile native apps (web-first for hackathon)
- Mainnet deployment (Fuji testnet only for MVP)
- Token launch or tokenomics

---

**Video:**
(Recording in progress — 5-minute product walkthrough. See DEMO-SCRIPT.md in repo for full script.)
