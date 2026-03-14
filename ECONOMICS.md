# Avalon Economic Model

**Avalon** is a blockchain gaming SDK. Its economic model follows a platform fee structure — analogous to Stripe charging a percentage of transaction volume rather than a monthly SaaS fee. Game studios pay nothing upfront; Avalon earns when the game earns.

---

## Revenue Streams

### 1. Platform Fee on Prize Pools (Primary)

ChronosBattle and every game deployed via `GameFactory` routes through `StablecoinEconomy.sol`:

```
PLATFORM_FEE = 500 basis points = 5%
```

On a $10 entry match with 2 players:
- Prize pool: $20
- Platform cut: $1.00 (5%)
- Winner payout: $19.00 (95%)

**Why 5%?** Comparable to Stripe (2.9% + $0.30/txn) on an absolute-dollar basis, but applied to pooled value rather than individual transactions. For a 2-player $10 game, Stripe would charge ~$0.59 per player entry (2.9% + $0.30 each) = $1.18 total, vs Avalon's $1.00. We are slightly cheaper than Stripe at low entry fees, comparable at $20+ pools. Unity's Asset Store takes 30%; traditional console storefronts take 30%. 5% is aggressive pricing designed for adoption, with room to increase to 7-8% at scale.

**Sensitivity analysis:**

| Monthly Match Volume | Avg Pool Size | Monthly Revenue (5%) |
|---------------------|--------------|---------------------|
| 1,000 matches | $20 | $1,000 |
| 10,000 matches | $20 | $10,000 |
| 100,000 matches | $50 | $250,000 |
| 1M matches | $50 | $2,500,000 |

For reference: Axie Infinity at peak processed ~$60M/month in marketplace volume. At Avalon's 5% fee, that would be $3M/month. We don't need Axie scale to be revenue-positive — 10K monthly matches at $20 average covers infrastructure costs.

### 2. L1 Deployment Fee (Secondary, Future)

Each game deploys on its own Avalanche L1. Avalanche's native L1 creation requires:
- Validator stakes (minimum $2,000 AVAX equivalent at time of writing for a 5-validator set)
- One-time chain registration fee

In the Avalon model, the platform subsidizes L1 creation during the hackathon period. Post-hackathon, studios would pay a deployment fee covering Avalon's stake delegation cost + 20% margin. Estimated: $500-2,000 USD per L1 deployment depending on validator requirements.

**Revenue at scale:**
- 100 studios deploy in Year 1: $50K-200K one-time
- Annual validator management fee: $200-500/year per studio

### 3. VRF Request Fees (Infrastructure Pass-through)

Chainlink VRF v2.5 charges per randomness request in LINK. On Fuji at current prices: ~$0.002 per request. Avalon passes this through at cost + 10% (charged to game treasury, not players).

At 100 loot drops per match, 10K matches/month: 1M VRF requests × $0.002 × 1.1 = $2,200/month infrastructure revenue.

---

## Coin Economy (In-Game)

Chronos Battle uses a **coin economy** — not a token. Coins are ephemeral per-match state, not tradeable assets. This is a deliberate design choice.

**Why not a token?**
- Eliminates regulatory complexity (coins are game state, not securities)
- Prevents secondary market speculation from distorting game balance
- Allows clean in-game economy without on-chain overhead per move

**Coin parameters:**

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| Starting coins | 10 | Enough for 3-5 opening moves; creates immediate strategic tension |
| Max coins | 20 | Prevents snowball accumulation; forces spending |
| Regen rate | 1/block | Fuji block time ~2s = 0.5 coins/sec; matches game pacing |
| Quick Strike | 1 coin, 10 dmg | Always affordable; keeps game moving |
| Power Blow | 2 coins, 25 dmg | 2.5x dmg efficiency vs Quick Strike; core mid-game move |
| Devastating Attack | 3 coins, 50 dmg | 5x dmg efficiency; high-commitment, 6-block delay = counter risk |
| Shield | 1 coin, blocks 1 attack | Cheap defense; pairs with Counter economy |
| Counter | 2 coins, 2× in-flight dmg | Situational; best when opponent commits large attack |

**Balance simulation (1v1 to knockout):**

A naive greedy agent (only Power Blows) drains coins in 5 moves (10 coins ÷ 2 per blow). Against full HP (100), 5 Power Blows deal 125 damage — enough to win in one burst. But a Counter during this sequence doubles one blow's damage back onto the greedy agent. This creates a Rock-Paper-Scissors meta:
- Greedy Power Blow spam → loses to Counter
- Counter-fishing → loses to Quick Strike spam (too fast to counter)
- Quick Strike spam → loses to Shield + Power Blow (cheap to block, efficient to punish)

Each NPC archetype maps to one of these strategies, making opponent selection meaningful.

**No inflation risk:** Coins are created when a match starts (10 per player) and destroyed when the match ends. There is no persistent coin supply. The economy resets each match.

---

## Loot Rarity Distribution

Loot is awarded post-match via Chainlink VRF. Rarity table:

| Tier | Probability | Type |
|------|------------|------|
| Common | 50% | Speed Rune (+1 coin regen rate, 3 blocks) |
| Uncommon | 25% | Power Crystal (+5 damage on next attack) |
| Rare | 15% | Shield Fragment (free shield, no coin cost) |
| Epic | 7.5% | Chronos Crown (reduce all move delays by 2 blocks) |
| Legendary | 2.5% | Temporal Rift (opponent loses 5 coins) |

**Why these probabilities?** The 50/25/15/7.5/2.5 distribution is the Pareto-based standard gacha curve used in Hearthstone (Common/Rare/Epic/Legendary), Genshin Impact (3/4/5-star), and most live service games. It has been validated by player experience research showing this distribution maximizes "exciting but fair" sentiment. The math:

- Expected value of loot per match: 0.5×1 + 0.25×2 + 0.15×3 + 0.075×4 + 0.025×5 = 0.5 + 0.5 + 0.45 + 0.3 + 0.125 = 1.875 (utility units)
- A player winning 10 matches can expect: ~1 Rare, ~2-3 Uncommon, ~5 Common items
- Legendary expectation: 1 per 40 matches (keep-playing incentive)

Loot items affect only in-match mechanics (not persisted between matches in this version), preventing pay-to-win accumulation.

---

## Unit Economics at Sustainability

Break-even analysis for Avalon as a bootstrapped product:

**Monthly infrastructure costs (estimated):**
- Fuji/Mainnet RPC endpoint (Alchemy/Infura): $50-200
- Vercel hosting: $20
- Chainlink VRF subscriptions: $50 (for demo volume)
- **Total: ~$300/month**

**Break-even at 5% fee:**
- Need $6,000/month in prize pool volume
- = 300 matches/month at $20 average pool
- = 10 matches/day
- Well within reach for a game with 50 active players

**Series A-equivalent scale (as reference point):**
- 1M matches/year × $20 average = $20M pool volume
- $1M ARR at 5% fee
- 5 studios deployed = $25K-100K in L1 fees
- **Total: ~$1.1M ARR**

---

## Comparison to Existing Solutions

| Platform | Revenue Model | Take Rate | Studio Effort |
|----------|--------------|-----------|--------------|
| ImmutableX | Transaction fee on NFT trades | 2% | Weeks of integration |
| Ronin | Gas fees + Axie ecosystem lock-in | Variable | Ronin-specific SDK only |
| Thirdweb | SaaS tier ($50-500/month) + gas sponsorship | Fixed + gas | General purpose, not game-specific |
| Polygon Gaming | Gas fees (variable) | Variable | Deploy on Polygon, standard EVM |
| **Avalon** | **5% of match prize pools** | **5%** | **One SDK, one import** |

Avalon's advantage: zero upfront cost (Thirdweb charges monthly), per-game L1 (own gas token, own block time), and game-specific primitives (VRF loot, ERC-8004 NPCs, stablecoin economy) that require custom engineering on every other platform.

---

## Risk Factors

1. **Regulatory risk on USDT economies**: Tether WDK integration for real USDT flows in games could face gaming regulation (especially in EU/Asia). Mitigation: in-game coins are not USDT; USDT only flows at entry/exit (analogous to a poker buy-in, not in-game currency).

2. **Avalanche L1 infrastructure dependency**: Per-game L1 requires Avalanche validator availability and stake. If AVAX price rises sharply, L1 deployment costs rise. Mitigation: Avalon's fee scales with USDT match volume (not AVAX price), providing a hedge.

3. **VRF oracle dependency**: Chainlink VRF downtime = no loot distribution. Mitigation: client-side fallback (ChaCha20 PRNG in demo mode) maintains gameplay; on-chain loot is queued and fulfilled when VRF recovers.

4. **Cold-start problem**: No games = no match volume = no revenue. Chronos Battle is the seed game that demonstrates the loop. Target: 3 studios in first 6 months via direct outreach to Avalanche ecosystem game teams.
