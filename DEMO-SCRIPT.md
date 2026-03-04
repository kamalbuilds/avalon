# Avalon Demo Script (5 minutes)

> **Audience:** Blockchain VCs, Avalanche core team
> **Goal:** Show Avalon is a complete, working platform for on-chain gaming
> **Setup:** Browser at http://localhost:3000. No wallet needed (demo mode).
> **Format:** [ACTION] = what to do on screen, [SAY] = voiceover narration

---

## 1. Hook + Landing Page (0:00 - 0:30)

[ACTION] Open http://localhost:3000. Hero section is visible.

[SAY] "Unity builds the graphics. Avalon powers the economy. We're the blockchain backend for game developers. You build your game however you want. We give it its own Avalanche L1, autonomous AI agents with real wallets, provably fair loot, and a stablecoin economy."

[ACTION] Scroll slowly through the 4 feature cards:
- **Own Avalanche L1** - every game gets a dedicated chain
- **ERC-8004 AI Agents** - NPCs with on-chain identity and wallets
- **Chainlink VRF Loot** - provably fair, verifiable on-chain
- **Stablecoin Economy** - real USDT via Tether WDK

[ACTION] Pause on the code example showing `Avalon.init()` and the 3-step flow: Connect, Configure, Deploy.

[SAY] "Three lines of code. That's it. Let me show you what this looks like in production."

[ACTION] Click **"Play Now"** on the Chronos Battle showcase card. Navigates to `/play/chronos?demo=true`.

---

## 2. Chronos Battle Lobby (0:30 - 1:15)

[ACTION] Lobby loads with 5 NPC opponent cards displayed as radar-chart NPCCards.

[SAY] "Chronos Battle is our showcase game. The core mechanic: blockchain latency IS the gameplay. Cheap moves land instantly but do low damage. Expensive moves hit hard but take blocks to arrive, so your opponent sees them coming and can react."

[ACTION] Hover over each NPC card briefly:
- **Aria the Merchant** (medium) - cautious, hoards coins
- **Kael the Warrior** (easy) - pure aggression
- **Nova the Trickster** (hard) - counter specialist
- **Sage the Scholar** (expert) - adapts mid-fight
- **Iron Guardian** (hard) - defensive wall

[SAY] "Each opponent is an ERC-8004 AI agent. That's our proposed standard for autonomous NPCs. They have their own on-chain wallet, reputation score, and personality traits that drive their combat decisions. Not scripted. Not random. Personality-driven."

[ACTION] **Select Iron Guardian.** Right panel shows:
- ERC-8004 agent ID and contract address (real Fuji: `0x2636...d7F`)
- Win/loss record and reputation score
- Entry fee + prize pool in USDT
- Catchphrase and playstyle description

[SAY] "Iron Guardian is a defensive specialist. 90 patience, 85 courage. Watch how that shapes its decisions in combat."

[ACTION] Click **START MATCH**.

---

## 3. Battle Gameplay (1:15 - 3:00)

[ACTION] Battle arena loads. Player HP/coins on left, AI HP/coins on right, move selector at bottom.

### Move 1: Quick Strike
[ACTION] Press **1** or click Quick Strike (1 coin, instant, 10 dmg).

[SAY] "Quick Strike. One coin, lands instantly. Watch the damage popup and the hit sound."

> *SFX plays, floating damage number appears*

### Move 2: Power Blow
[ACTION] Press **2** or click Power Blow (2 coins, 3 blocks delay, 25 dmg).

[SAY] "Power Blow costs 2 coins but takes 3 blocks to land. See it in the moves-in-flight panel on the right. Iron Guardian can see it coming and might throw up a shield."

[ACTION] Point to the moves-in-flight panel showing the countdown timer.

> *NPC dialogue appears: Iron Guardian comments calmly*

[SAY] "That dialogue is personality-driven. Iron Guardian's high patience means calm, measured responses. Kael the Warrior would be trash-talking right now."

### Move 3: Shield + Counter
[ACTION] Use Shield (press **4**) when Iron Guardian has a move incoming. Then Counter (press **5**) on the next attack.

[SAY] "Shield blocks the next hit. Counter reflects damage at 2x. The AI reads my patterns and adjusts. Watch the confidence percentage in the dialogue bar - that's the AI's internal certainty about its chosen move."

### Move 4: Devastating Strike
[ACTION] Press **3** for Devastating Strike (3 coins, 6 blocks, 50 dmg).

[SAY] "The big one. 3 coins, 6 blocks to land, 50 damage. High risk, high reward. If Iron Guardian shields, I wasted 3 coins. That economic tension is the whole game."

[ACTION] Continue until match ends. Point out throughout:
- NPC dialogue changing with game state (low HP, dominating, etc.)
- Coin economy (earn 1/block, spend on moves)
- HP bars with damage flash effects and floating numbers
- AI confidence display

### Game Over + Loot (30s)
[ACTION] Match ends. Victory confetti rain (if win) or defeat glow (if loss). Stats screen shows.

[SAY] "Full match stats. Damage dealt, moves used, blocks played, coins spent. And now the loot drop."

[ACTION] Loot reveal animation plays. Chest opens with rarity glow.

[SAY] "This loot drop is powered by Chainlink VRF v2.5. Every roll is verifiable on-chain. Players can check the VRF proof on Snowtrace. Provably fair by default."

---

## 4. History + Ranks (3:00 - 3:15)

[ACTION] Click **HISTORY** tab in the header.

[SAY] "Every match is tracked. Stats, opponent, result, loot earned."

[ACTION] Click **RANKS** tab.

[SAY] "Leaderboard ranks players by performance. In production, this reads directly from the ChronosBattle contract."

---

## 5. Dashboard (3:15 - 3:45)

[ACTION] Navigate to http://localhost:3000/dashboard.

[SAY] "Developer dashboard. Everything reads from live Fuji contracts."

[ACTION] Point out the 4 stat cards:
- **Active L1 Chains** - 2 active, 1 deploying
- **AI Agents (ERC-8004)** - live count from AgentRegistry
- **On-Chain Matches** - live count from ChronosBattle
- **Accepted Tokens** - from StablecoinEconomy

[SAY] "Not mocked. Wrong network? Skeleton loaders. The data comes from 5 smart contracts on Avalanche Fuji."

[ACTION] Scroll to L1 Chains section showing Chronos Battle L1 (Chain ID 100001, 2s blocks) and AI Arena L1.

[SAY] "Every game gets its own L1. Custom block time, custom gas token, sovereign security."

---

## 6. SDK Docs (3:45 - 4:15)

[ACTION] Navigate to http://localhost:3000/sdk.

[SAY] "For developers, everything is accessible through a TypeScript SDK."

[ACTION] Scroll through module cards and code examples:
- `Avalon.init()` - one-line setup
- `avalon.agents.create()` - spawn an ERC-8004 NPC
- `avalon.vrf.rollLoot()` - provably fair loot
- `avalon.economy.payEntryFee()` - stablecoin payments

[SAY] "TypeScript SDK, Unity plugin, CLI tools. A game developer doesn't need to know Solidity. They configure their game. We handle the blockchain. Any game can integrate this in one npm install."

---

## 7. Close (4:15 - 5:00)

[ACTION] Navigate back to http://localhost:3000 (landing page).

[SAY] "Here's what's deployed today."

| Contract | Fuji Address | Verify |
|----------|-------------|--------|
| GameFactory | `0x3f7FC08150709C22F1741A230351B59c36bCCc8a` | [Snowtrace](https://testnet.snowtrace.io/address/0x3f7FC08150709C22F1741A230351B59c36bCCc8a) |
| ChronosBattle | `0xafA4230B7154d95F1c8Bc13AD443b2e50bde7C57` | [Snowtrace](https://testnet.snowtrace.io/address/0xafA4230B7154d95F1c8Bc13AD443b2e50bde7C57) |
| AgentRegistry | `0x2636Ed9F3Aa33589810BE07B48ad9Be79de3Fd7F` | [Snowtrace](https://testnet.snowtrace.io/address/0x2636Ed9F3Aa33589810BE07B48ad9Be79de3Fd7F) |
| StablecoinEconomy | `0x95B4b7d7a23d954BF92FeDF2e00A374E22208D69` | [Snowtrace](https://testnet.snowtrace.io/address/0x95B4b7d7a23d954BF92FeDF2e00A374E22208D69) |
| LootVRF | `0xc39d9Ec925d3AA6E67FE760630406696408724f8` | [Snowtrace](https://testnet.snowtrace.io/address/0xc39d9Ec925d3AA6E67FE760630406696408724f8) |

[SAY] "Five contracts live on Fuji. ERC-8004 autonomous AI agents. Chainlink VRF provably fair loot. Tether WDK stablecoin economy. Every game deploys on its own Avalanche L1."

[SAY] "We're not pitching a whitepaper. This is working code. You just played it."

**END.**

---

## Backup Talking Points (if judges ask)

- **Why Avalanche L1?** Sub-second finality, custom gas, sovereign security. Game-specific chains mean no congestion from DeFi traffic.
- **Why ERC-8004?** Existing NFT standards don't cover autonomous agents. ERC-8004 gives NPCs wallets, reputation, and decision-making identity on-chain.
- **Why Chainlink VRF?** Players need to trust loot drops are fair. VRF proofs are verifiable on-chain. No server-side RNG.
- **Why Tether WDK?** Stablecoin economies mean players earn real value, not volatile tokens. USDT is universally understood.
- **Revenue model?** Platform fee on game L1 deployments + percentage of stablecoin transaction volume.
- **What's next?** Unity plugin (alpha), game creator dashboard with no-code NPC builder, mainnet deployment.

## Quick Reference URLs

| Page | URL |
|------|-----|
| Landing | http://localhost:3000 |
| Chronos Battle (demo) | http://localhost:3000/play/chronos?demo=true |
| Dashboard | http://localhost:3000/dashboard |
| SDK Docs | http://localhost:3000/sdk |
| Games | http://localhost:3000/games |
| Match History | http://localhost:3000/play/chronos/history |
