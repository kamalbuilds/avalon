# Hackathon Judge Simulation: AvaForge (Avalon)

**Hackathon:** Avalanche Build Games 2026 ($1M prize pool)
**Judge:** Simulated (50th project reviewed today, 3-minute window)
**Date:** 2026-03-13

---

## Scoring

### 1. Smart Contract Quality: 7/10

What I see in 3 minutes: 6 contracts on Fuji, all verified on Snowtrace. OpenZeppelin imports, ReentrancyGuard, SafeERC20. That's competent. The ERC-8004 AgentRegistry is a nice touch with reputation scoring in basis points.

What keeps this from an 8: **Zero tests.** I see an empty `test/` directory. You deployed 6 contracts handling real money flows (entry fees, prize pools, platform cuts) and you have no test suite. The StablecoinEconomy contract splits revenue three ways with basis point math on 6-decimal USDT, and you're telling me you verified this by... deploying it? At the 50th project today, I've seen teams with 2 contracts and 40 tests. You have 6 contracts and 0 tests.

The contracts themselves are clean. No TODOs, proper access control, sane state machines in ChronosBattle. The LootVRF rarity table math checks out (50/25/15/7.5/2.5 = 100). But contract quality without test coverage is like a bridge without load testing. It might hold, but I wouldn't drive on it.

Also: ChronosBattle uses native AVAX for entry fees while StablecoinEconomy uses ERC20. That's two different payment rails in one game. Intentional architectural choice or scope creep?

### 2. Product-Market Fit: 6/10

The pitch: "Unity builds the graphics. Avalon powers the economy." SDK for game devs to bolt blockchain economies onto their games. Per-game Avalanche L1, AI NPCs with on-chain identity, VRF loot, stablecoin economies.

The problem is real. Game studios don't want to become blockchain engineers. But here's my issue: **your demo game IS the product, and your SDK is the pitch.** I can play Chronos Battle. I cannot use the Avalon SDK. The SDK page shows 3 code examples but there's no npm package, no installable library, no integration guide for Unity or Unreal. The submission.md claims a Unity plugin exists somewhere, but I don't see it in the repo.

So who's the customer? If it's gamers, Chronos Battle is a fun proof of concept but not a game anyone would play for more than 10 minutes. If it's game studios, where's the developer experience? Where's the SDK I can `npm install`?

I've seen this pattern 30 times today: team builds a demo app, calls it a "platform," and hopes judges don't notice the platform doesn't exist yet. You're more honest about it than most (the MoSCoW framework in submission.md is transparent), but PMF requires a product that fits a market, and right now I see a demo game, not a developer tool.

The stablecoin economy angle with Tether WDK is smart positioning. Real revenue model (5% platform fee). But it's all theoretical until a second game uses the SDK.

### 3. Innovation and Creativity: 8/10

This is where you shine. Three genuinely clever ideas:

**Latency as game mechanic.** Every blockchain game I've judged today tries to hide latency. You made it the core gameplay loop. "Moves in Flight" with block countdown timers is brilliant. Quick Strike (0 blocks, 10 damage) vs Devastating Strike (6 blocks, 50 damage) creates real strategic tension. Do I commit to the big hit and risk a Counter? That's actual game design, not just "we put an NFT in a game."

**ERC-8004 for NPC identity.** On-chain autonomous agents with reputation that persists across games. Each NPC has a wallet, a win/loss record, personality traits encoded in metadata. When Kael the Warrior beats you, his reputation goes up on-chain. That's a novel use of token standards for game characters.

**Personality-driven AI with real depth.** 8 traits, 5 archetypes, mood system, behavior trees. The PersonalitySystem.ts is 339 lines of well-structured trait/mood/decision logic. This isn't "random NPC does random thing." Iron Guardian plays defensive because his loyalty and courage traits are 90+. Nova the Trickster favors Counter because her cunning is 95. That's more sophisticated than most indie game AI I've seen.

What holds this back from a 9: the innovation is in the design, not fully in the execution. The dialogue system generates 60+ lines per NPC but isn't wired into the battle UI (console only). The EconomicAgent for NPC merchants is scaffolded but not live. The L1-per-game vision is architecture, not implementation. Smart ideas, partially delivered.

### 4. Real Problem Solving: 6/10

The identified problem: "Game studios struggle to integrate blockchain economies. Current options require deep crypto expertise."

This is a real problem. ImmutableX, Ronin, and Polygon gaming all exist because game devs need blockchain middleware. But the question for a hackathon judge is: **does THIS project solve it better than what already exists?**

ImmutableX has a working SDK, documentation, and games shipping on it. Ronin has Axie Infinity. What does Avalon have? A battle demo and a vision. The per-game L1 thesis is interesting but unproven. The ERC-8004 NPC angle is novel but theoretical until a real game studio says "I need this."

The problem Avalon ACTUALLY solves in its current state: "How do we make a fun blockchain game demo for a hackathon?" And it solves that problem very well. The demo mode, the game loop, the polish. But that's not the problem stated in the submission.

I'm giving a 6 because the problem identification is correct and the approach (SDK, not engine) shows good instinct. But the gap between "we identified a real problem" and "we built something that solves it" is still wide.

### 5. Pitch Quality: 8/10

Excellent pitch materials for a hackathon:

- **README**: Clean 30-second elevator pitch, clear problem/solution, tech stack table
- **DEMO-SCRIPT.md**: Timestamped 5-minute walkthrough with [ACTION]/[SAY] format. This tells me you've practiced your demo.
- **submission.md**: 14KB of structured submission with MoSCoW framework, user journey, deployed contracts
- **UX-REVIEW.md**: Self-audited with 5 known issues. Transparent about what's not perfect. Judges respect this.
- **Demo mode** (?demo=true): I can play without MetaMask. This alone puts you above 80% of Web3 hackathon projects.

The "Unity builds the graphics. Avalon powers the economy" tagline is memorable. The 5 NPC character bios add personality. Contract addresses with Snowtrace links show proof of work.

What keeps this from a 9: the pitch promises an SDK platform but delivers a game demo. There's a disconnect between the vision (developer tool for game studios) and the artifact (a single playable game). A judge who reads carefully will notice. Also, no video demo included, just a script. At project #50, I want to watch a 2-minute video, not read a 9KB markdown file.

---

## Composite Score

| Criterion | Weight | Score | Weighted |
|-----------|--------|-------|----------|
| Smart Contract Quality | 25% | 7 | 1.75 |
| Product-Market Fit | 20% | 6 | 1.20 |
| Innovation and Creativity | 20% | 8 | 1.60 |
| Real Problem Solving | 15% | 6 | 0.90 |
| Pitch Quality | 20% | 8 | 1.60 |
| **COMPOSITE** | **100%** | | **7.05** |

**Composite Score: 7.1/10**

---

## In the Judges' Room

"In the judges' room, I would say about this project:

This is a strong solo builder who made smart design choices. The latency-as-mechanic idea is genuinely clever, and the AI personality system has real depth. The demo is polished, the contracts are deployed, and the pitch materials are well-structured. This person knows how to ship.

But here's the thing: they pitched an SDK and built a game. The Avalon SDK doesn't exist as a usable developer tool. You can't npm install it. There's no Unity plugin in the repo despite the submission claiming one. The 'platform' is one demo game with 5 NPCs on a testnet.

If we're judging the GAME, it's an 8. Fun loop, real blockchain integration, smart use of VRF and stablecoins. If we're judging the PLATFORM, it's a 6. Vision without the developer experience to back it up.

Zero tests on 6 financial smart contracts is a concern. I know it's a hackathon, but the StablecoinEconomy contract handles real token flows with revenue splits. At least throw a few Hardhat tests at the happy path.

I'd put this in the top 20% of submissions. Strong execution, creative ideas, honest scope. But winners at the $1M level need to deliver on their core promise, and the core promise here is an SDK that game studios can use. That doesn't exist yet.

Would I fund this team? If they add a second builder and ship the actual SDK in 3 months, yes. Solo builders with this level of polish and design instinct are rare."

---

## The Project I'd Rank Above This

"The project I'd rank above this is one that:

1. **Actually ships the developer experience.** An SDK with `npm install @avalon/sdk`, a 5-line integration example that compiles, and documentation that a Unity dev can follow without reading Solidity. Even if the demo game is less polished, showing a second game built on the same SDK proves the platform thesis.

2. **Has test coverage on financial contracts.** Even 10 well-chosen tests on the StablecoinEconomy revenue split and VRF loot distribution would demonstrate production readiness. Tests are the difference between 'hackathon demo' and 'investable MVP.'

3. **Shows multi-game evidence.** Two simple games sharing the same agent registry, same economy contracts, same VRF loot system. Even if game #2 is just tic-tac-toe with NFT rewards, it proves the SDK works for more than one game.

4. **Has a live video demo.** 2 minutes. Screen recording. Narrated. At project #50, a video is worth 10,000 words of markdown.

5. **Demonstrates L1 deployment, not just architecture.** The per-game L1 thesis is the boldest claim in the pitch. Show me one L1 actually deployed, even with a single validator. Right now it's a diagram in ARCHITECTURE.md.

That project doesn't need to be more creative than AvaForge. It just needs to close the gap between pitch and proof. AvaForge has the best ideas in the room. The project that beats it has the best evidence."

---

## Quick Verdict

**Would this win a $1M hackathon?** Top 15-20%, strong contender for a category prize (Best Gaming, Best AI Integration), but unlikely to take the grand prize without closing the SDK gap.

**What would change my mind?** Show me one external game studio that integrated the SDK during the hackathon. Or show me the SDK working as a standalone package with docs. That turns a 7.1 into an 8.5 overnight.

**One-line summary for the scorecard:** "Clever game designer with real blockchain chops, but pitched a platform and delivered a demo."
