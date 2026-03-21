# PMF Audit: AvaForge (Avalon SDK)

**Auditor:** pmf-auditor-avaforge
**Date:** 2026-03-13
**Project:** Avalon - "Blockchain Gaming SDK for Avalanche"
**Pitch:** "Every game gets its own blockchain" / "Stripe for on-chain games"

---

## Overall Grade: C+

**Verdict:** Strong technical execution in a real market, but the core value proposition has a positioning problem. The "own blockchain per game" pitch solves a problem most game devs don't know they have, while the features they actually want (wallet onboarding, VRF loot, stablecoin economies) are commoditizing fast. This is a good hackathon project with real contracts and a playable demo, but as a product it's a solution partially looking for a problem.

---

## (1) Target User - Grade: B-

**Claimed persona:** Indie-to-mid game studio (2-15 devs) building in Unity/Unreal who want blockchain features without hiring a smart contract team.

**Assessment:**

This persona is real but poorly segmented. There are actually three distinct buyer types here with very different needs:

| Persona | Pain Level | Willingness to Pay | Avalon Fit |
|---------|-----------|-------------------|------------|
| **Web3-native indie dev** (already building on-chain) | Medium - they know Solidity but want faster iteration | Medium | Weak - they want control, not abstraction |
| **Web2 game studio exploring blockchain** (Unity/Unreal team, no Solidity expertise) | High - integration costs 6-12 months | High | Strong - this is the bullseye |
| **Crypto project building a game** (token-first, game second) | Low - they have blockchain expertise | Low | Weak - they don't need an SDK |

The submission correctly identifies the Web2 studio persona but doesn't acknowledge that this persona is extremely skeptical of blockchain gaming after the 2022-2023 crash. The "indie dev who wants blockchain" market has shrunk significantly. Most indie devs building games in 2026 are not thinking about blockchains at all.

**Key concern:** The SDK targets Next.js/React developers (based on actual implementation), but the pitch claims Unity/Unreal support. There is no Unity plugin in the repo. The persona mismatch between "Unity devs" in the pitch and "React devs" in the code is a red flag.

---

## (2) Current Solution & Why Inadequate - Grade: B

**Competitors mapped:**

| Competitor | Funding | Traction | Differentiation from Avalon |
|-----------|---------|----------|---------------------------|
| **Immutable** | $300M+ raised | 460+ games, 5.8M Passport sign-ups, Unity Verified Solution | Full ecosystem, production-ready, massive moat |
| **Sequence (Horizon)** | $40M Series A (Ubisoft, Take-Two investors) | Growing dev platform | Wallet + marketplace + SDK |
| **Thirdweb** | $24M+ raised | Tens of thousands of devs | Plug-and-play Unity/web, broad chain support |
| **Ronin (Sky Mavis)** | Well-funded | Axie ecosystem | Proven at scale with real users |
| **ChainSafe** | Growing | Unity SDK with continuous updates | Established, multi-chain |
| **Moralis** | $40M+ raised | Large dev community | Backend abstraction, multi-chain |

**What Avalon claims as differentiation:**
1. Per-game L1 blockchain (own Avalanche subnet)
2. ERC-8004 AI NPCs with on-chain identity
3. Chainlink VRF loot system
4. Tether WDK stablecoin economy
5. 30-second onboarding

**Reality check:**
- Items 3-5 are table stakes. Every competitor offers randomness, payment rails, and easy onboarding.
- Item 1 (per-game L1) is genuinely unique but also genuinely questionable. Most games don't need their own blockchain. The operational overhead of running a validator set per game is enormous. Immutable, Ronin, and others proved you can serve millions of gamers on shared infrastructure.
- Item 2 (ERC-8004 AI NPCs) is the most interesting differentiator. ERC-8004 is a real, emerging standard (launched on Ethereum mainnet, 10k+ agents registered on testnet). The combination of AI agents with gaming is genuinely novel. But the implementation in Avalon is a behavior tree system - not LLM-powered agents that ERC-8004 was designed for.

**Is the current solution inadequate?** Partially. The blockchain gaming SDK space is crowded but not commoditized. There's room for Avalanche-specific tooling. But Avalon is competing with companies that have 100x more funding and production traction.

---

## (3) TAM/SAM/SOM - Grade: C+

**TAM (Total Addressable Market):**
- Blockchain gaming market: ~$17-24B in 2025, projected to reach $100B+ by 2030 (multiple analyst reports)
- This includes all blockchain gaming revenue, not just SDK/infrastructure

**SAM (Serviceable Addressable Market):**
- Blockchain gaming infrastructure/SDK layer: estimated at 5-10% of TAM = $1-2.4B
- Avalanche-specific portion: Avalanche is ~3-5% of blockchain gaming activity = $30-120M

**SOM (Serviceable Obtainable Market):**
- Indie-to-mid studios on Avalanche wanting an SDK: realistically $1-5M in the first 2 years
- This assumes capturing 20-50 paying game studios at $2K-10K/month

**Assessment:** The TAM is real and growing. The SAM narrows sharply when you limit to Avalanche. The SOM is speculative because there's no evidence of paying customers or even a pricing model. The "per-game L1" value prop further narrows the market to games that actually need chain isolation, which is a small subset.

---

## (4) Evidence of Demand - Grade: D+

**What I found:**
- The blockchain gaming SDK category has clear demand: Immutable's 460 games, Sequence's $40M raise with AAA gaming investors (Ubisoft, Take-Two), Thirdweb's dev community all prove the market exists
- ERC-8004 has genuine momentum: real EIP, Ethereum Foundation backing, 10K+ agents on testnet
- "Appchains for gaming" is a discussed concept in the Avalanche ecosystem (Avalanche subnets were built for this use case)

**What I did NOT find:**
- No evidence of external demand specifically for Avalon/AvaForge
- No tweets, forum posts, or community discussion about this project
- No beta users, no waitlist numbers, no LOIs
- No developer testimonials or case studies
- The GitHub repo appears to be a solo developer project with no external contributors
- No indication that any game studio has evaluated or expressed interest in this SDK

**Critical gap:** The project has zero demand signals beyond the hackathon submission. This is the biggest PMF risk. A great SDK that nobody asked for is still a failing product.

---

## (5) 30-Second Judge Test - Grade: B+

**Can a non-technical judge understand WHY this matters in 30 seconds?**

The pitch "Unity builds the graphics. Avalon powers the economy" is excellent. It immediately communicates:
- Who it's for (game developers)
- What it replaces (building blockchain infrastructure yourself)
- The analogy (Stripe for games)

The "Stripe for on-chain games" positioning is strong and well-understood. A judge would get it.

**However:**
- "Every game gets its own blockchain" sounds impressive but a judge might ask "why does a game need its own blockchain?" and the answer isn't obvious
- The Chronos Battle demo is a smart move for showing rather than telling
- The demo mode (`?demo=true`) for judges is thoughtful product thinking
- The 5 AI NPC opponents with personality traits are visually compelling

**Weak point:** The landing page leads with the SDK (developer-focused) but the demo is a consumer game. A judge might be confused about who the customer is.

---

## (6) Does "Own Blockchain" Solve a Real Problem? - Grade: C-

**The core question: Is per-game L1 a feature or a gimmick?**

**Arguments FOR:**
- Game-specific chain = no gas competition with DeFi/NFT activity
- Custom block times optimized for game speed
- Sovereignty over validator set and chain parameters
- Marketing appeal ("your game has its own blockchain")

**Arguments AGAINST:**
- Running a blockchain is operationally expensive; who pays for validators?
- Most games need <100 TPS; shared L2s handle this easily
- ImmutableX serves 460+ games on shared infrastructure without performance complaints
- Cross-game interoperability (a key blockchain gaming promise) is HARDER with per-game chains
- The SDK's L1 deployment is currently simulated (returns mock data with zero addresses) - this core feature doesn't actually work yet

**Verdict:** Per-game L1 is a technically interesting concept that solves a real but niche problem (high-throughput games needing chain isolation). For 90%+ of games, a shared L2/subnet is sufficient. This is the "own blockchain" equivalent of giving every small business its own dedicated server in the cloud computing era - technically possible, but most are better served by shared infrastructure.

---

## Summary Scorecard

| Dimension | Grade | Notes |
|-----------|-------|-------|
| Target User | B- | Real persona, poorly segmented, Unity claim unsubstantiated |
| Current Solution Gap | B | Market gap exists but competitors are well-funded |
| TAM/SAM/SOM | C+ | TAM real, SAM narrow (Avalanche-only), SOM speculative |
| Evidence of Demand | D+ | Zero external demand signals; only hackathon submission |
| 30-Second Clarity | B+ | Great pitch line, good demo, minor confusion on customer |
| "Own Blockchain" Value | C- | Niche value, mostly unnecessary, core feature is simulated |

**Overall: C+**

---

## Recommendations

1. **Drop "own blockchain" as the lead pitch.** Lead with AI NPCs (ERC-8004) + VRF loot + stablecoin economies. The per-game L1 can be a premium feature, not the core value prop.

2. **Pick one persona and go deep.** The Web2 Unity studio is the right target. Build the actual Unity plugin. A React SDK for a target market of Unity devs is a non-starter.

3. **Find one paying customer before building more features.** Talk to 20 indie game studios. If 5+ would pay $500/month for this, you have something. If none would, pivot.

4. **The AI NPC angle is the most defensible moat.** ERC-8004 is early. Being the "AI NPC infrastructure for games" is more compelling than "per-game blockchain SDK." Consider repositioning around this.

5. **For the hackathon:** The demo is strong, the contracts are real, the pitch is clear. This will score well on technical execution. The PMF story is the weak link - a judge who asks "who would pay for this?" will find the answer unsatisfying.

---

---

## Addendum: Deep Research Findings

### Appchain Thesis is More Validated Than Expected
The "per-game blockchain" concept has real production precedent on Avalanche specifically:
- **MapleStory Universe (Nexon)**: Henesys chain as permissioned Avalanche L1 with gasless transactions
- **DeFi Kingdoms**: DFK Chain, 1.1M daily transactions
- **GUNZ/Off the Grid**: Own gaming subnet, 10M wallets in 30 days
- **Avalanche post-Etna**: ~1.3 AVAX/validator/month deployment cost

This upgrades the "own blockchain" value prop from C- to **C+** - the concept is validated at scale, but Avalon's implementation is still simulated.

### ERC-8004 Clarification
ERC-8004 is an **AI agent identity/reputation standard**, NOT a gaming-specific standard. It provides Identity Registry, Reputation Registry, and Validation Registry for autonomous agents. Gaming is one of many use cases. Avalon's application of it to game NPCs is creative but the framing as "ERC-8004 AI NPCs" is somewhat misleading - the standard wasn't designed for game characters.

### Code Reality Check (from SDK verification)
- **~80% of claims are backed by real code**
- Contracts: 100% real, deployed, verified on Fuji
- Game engine: 100% functional with real mechanics
- AI system: 90% real (12 files, ~12,000 lines of functional behavior trees, personality, dialogue)
- SDK class: 40% real - structure exists but L1/Agent/VRF modules are simulation wrappers using Math.random() instead of actual Chainlink VRF calls
- Demo mode: 100% playable with complete game simulation

### Market Sizing Correction
- Gaming SDK/middleware layer: ~$500M-$1.5B (back-of-envelope from 18% middleware share of tool spending)
- 1,697 active blockchain games as of Jan 2025
- 97% of gaming token launches underperformed in 2025
- Developer pricing sensitivity is high - Thirdweb, Alchemy, Moralis all use freemium/pay-as-you-scale

---

*Audit completed 2026-03-13 by pmf-auditor-avaforge*
