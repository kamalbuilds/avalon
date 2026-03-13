# Avalon Demo Script (5 minutes)

> **Audience:** Hackathon judges, Avalanche ecosystem
> **Goal:** Show Avalon is a working blockchain gaming SDK with a playable demo
> **Setup:** Browser at localhost:3000 or deployed URL. No wallet needed (demo mode).
> **Format:** [ACTION] = what to do on screen, [SAY] = voiceover narration

---

## 1. Hook + Landing Page (0:00 - 0:30)

[ACTION] Open landing page. Hero section visible.

[SAY] "Imagine you're a game dev. You've got a great game. You want on-chain economies, fair loot drops, NPCs with real wallets. But wiring up smart contracts takes months. That's the problem we solve."

[SAY] "Avalon is the blockchain backend for game developers. You build your game however you want. We give it autonomous NPCs with on-chain identity, provably fair loot via Chainlink VRF, and a stablecoin economy. All through one TypeScript SDK."

[ACTION] Scroll through the 4 feature cards. Pause on the code example showing `Avalon.init()`.

[SAY] "A few lines of code. That's the developer experience. Let me show you what this looks like as a player."

[ACTION] Click **"Play Now"** on the Chronos Battle card. Navigate to `/play/chronos?demo=true`.

---

## 2. Chronos Battle Lobby (0:30 - 1:15)

[ACTION] Lobby loads with 5 NPC opponent cards.

[SAY] "Chronos Battle is our showcase game. The core innovation: blockchain latency IS the gameplay. Cheap moves land instantly but do low damage. Expensive moves hit hard but take blocks to arrive, giving your opponent time to react. Time is money, literally."

[ACTION] Hover over each NPC card briefly, showing radar charts:

[SAY] "Five opponents, each with a unique personality. These aren't scripted bots. Each NPC is an ERC-8004 autonomous agent with an on-chain identity, reputation score, and 8 personality traits that drive every combat decision. Aria hoards coins. Kael goes all-in on devastating attacks. Iron Guardian walls up with shields."

[ACTION] **Select Iron Guardian.** Right panel shows agent ID, contract address, stats.

[SAY] "Iron Guardian. 98 defense, 15 aggression. Watch how that shapes what it does in combat. That contract address is the real AgentRegistry on Fuji."

[ACTION] Click **START MATCH**.

---

## 3. Battle Gameplay (1:15 - 3:00)

[ACTION] Battle arena loads. Player HP/coins on left, AI HP/coins on right.

### Move 1: Quick Strike
[ACTION] Press **1** or click Quick Strike.

[SAY] "Quick Strike. One coin, lands instantly, 10 damage. Watch the hit sound and floating damage number."

> *SFX plays, damage popup appears*

### Move 2: Power Blow
[ACTION] Press **2** or click Power Blow.

[SAY] "Power Blow. 2 coins, takes 3 blocks to land. See it in the moves-in-flight panel? Iron Guardian can see it coming. This is the core tension."

[ACTION] Point to moves-in-flight countdown.

> *NPC dialogue appears*

[SAY] "That dialogue is personality-driven. Iron Guardian's high patience means calm, measured responses. Kael would be trash-talking right now. The mood system shifts behavior too. Get Iron Guardian's HP low and it switches to afraid mode, using more shields."

### Move 3: Shield + Counter
[ACTION] When Iron Guardian has a move incoming, use Shield (press **4**). Then Counter (press **5**) on the next attack.

[SAY] "Shield blocks the next hit completely. Counter is instant and reflects double damage on any move in flight. That's the game theory: do you commit 3 coins to a devastating attack, knowing your opponent might counter for 100 damage?"

### Move 4: Devastating Attack
[ACTION] Press **3** for Devastating Attack.

[SAY] "The big one. 3 coins, 6 blocks to land, 50 damage. High risk, high reward. All of this is mirrored on-chain. The ChronosBattle contract has the exact same 5 moves, same costs, same delays. Verified on Snowtrace."

[ACTION] Continue playing. Point out:
- NPC dialogue changing with game state
- Coin economy (earn 1/block, spend on moves)
- Moves-in-flight panel

### Game Over + Loot (30s)
[ACTION] Match ends. Victory effects play. Stats screen shows.

[SAY] "Full match stats: damage dealt, coins spent, blocks played. And now the loot drop."

[ACTION] Loot reveal animation plays.

[SAY] "This loot drop comes from our Chainlink VRF v2.5 contract on Fuji. When your wallet is connected, it calls the on-chain VRF consumer for a verifiable random number. In demo mode, you see a client-side fallback. But the contract is live and verified."

[SAY] "And these loot items have real gameplay effects. Speed Rune reduces your move delay by 1 block. Power Crystal adds 5 damage to your next attack. They carry over into your next match."

---

## 4. History + Ranks (3:00 - 3:15)

[ACTION] Click **HISTORY** tab.

[SAY] "Every match is tracked. Stats, opponent, result, loot earned."

[ACTION] Click **RANKS** tab.

[SAY] "Leaderboard. In production, this reads directly from the ChronosBattle contract events."

---

## 5. Dashboard (3:15 - 3:45)

[ACTION] Navigate to `/dashboard`.

[SAY] "Developer dashboard. These stat cards read from the live Fuji contracts."

[ACTION] Point out stat cards: AI Agents from AgentRegistry, On-Chain Matches from ChronosBattle, Accepted Tokens from StablecoinEconomy.

[SAY] "5 smart contracts deployed and verified on Avalanche Fuji. The architecture is designed so each game can deploy its own contract suite, with a roadmap path to per-game L1 subnets."

---

## 6. SDK Docs (3:45 - 4:15)

[ACTION] Navigate to `/sdk`.

[SAY] "For developers, everything is accessible through one TypeScript SDK."

[ACTION] Click through the three code example tabs:
- L1 Deploy
- AI Agents
- VRF Loot

[SAY] "Configure your game. Register your NPCs as ERC-8004 agents. Set up VRF loot tables. Set up your stablecoin economy. The SDK wraps all 5 contracts into a clean API."

---

## 7. Close (4:15 - 5:00)

[ACTION] Navigate back to landing page.

[SAY] "Let me recap what's real and deployed today."

[SAY] "5 verified contracts on Avalanche Fuji. A fully playable game with 5 autonomous NPC opponents. Chainlink VRF integration for provably fair loot. ERC-8004 agent identity, which is a novel use of the standard for gaming NPCs. A stablecoin economy contract. And 39 passing smart contract tests."

[SAY] "The game you just saw isn't a mockup. The contracts are live. The NPCs have real on-chain identities. The VRF is real. We're not pitching a whitepaper. You just played it."

**END.**

---

## Deployed Contracts

| Contract | Address | Verify |
|----------|---------|--------|
| GameFactory | `0x3f7FC08150709C22F1741A230351B59c36bCCc8a` | [Snowtrace](https://testnet.snowtrace.io/address/0x3f7FC08150709C22F1741A230351B59c36bCCc8a) |
| ChronosBattle | `0x5BFb2b211d20FC6F811f869184546910FB45985e` | [Snowtrace](https://testnet.snowtrace.io/address/0x5BFb2b211d20FC6F811f869184546910FB45985e) |
| AgentRegistry | `0x2636Ed9F3Aa33589810BE07B48ad9Be79de3Fd7F` | [Snowtrace](https://testnet.snowtrace.io/address/0x2636Ed9F3Aa33589810BE07B48ad9Be79de3Fd7F) |
| StablecoinEconomy | `0x95B4b7d7a23d954BF92FeDF2e00A374E22208D69` | [Snowtrace](https://testnet.snowtrace.io/address/0x95B4b7d7a23d954BF92FeDF2e00A374E22208D69) |
| LootVRF | `0x00aabA40e80d9C64d650C0f99063754944C1F05E` | [Snowtrace](https://testnet.snowtrace.io/address/0x00aabA40e80d9C64d650C0f99063754944C1F05E) |

## Backup Talking Points (if judges ask)

- **Why Avalanche?** Sub-second finality, low gas, growing gaming ecosystem. Architecture ready for per-game L1 subnets.
- **Why ERC-8004?** Existing NFT standards don't cover autonomous agents. ERC-8004 gives NPCs wallets, reputation, and on-chain identity. Novel use case for gaming.
- **Why Chainlink VRF?** Players need to trust loot drops are fair. VRF proofs are verifiable on-chain. No server-side RNG.
- **Revenue model?** Platform fee (5%) on match prize pools + percentage of economy transaction volume.
- **What's next?** Per-game L1 deployment via Avalanche subnets, npm package publish, Unity plugin, no-code NPC builder.
- **How is the AI not just if/else?** 8 personality traits weighted into every decision, plus a mood engine that shifts behavior based on battle state. The traits create emergent behavior patterns, not scripted sequences.

## Quick Reference

| Page | URL |
|------|-----|
| Landing | http://localhost:3000 |
| Chronos Battle (demo) | http://localhost:3000/play/chronos?demo=true |
| Dashboard | http://localhost:3000/dashboard |
| SDK Docs | http://localhost:3000/sdk |
| Games | http://localhost:3000/games |
| Match History | http://localhost:3000/play/chronos/history |
