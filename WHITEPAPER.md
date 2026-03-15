# Avalon Protocol Whitepaper

**Blockchain Gaming Middleware for Avalanche**
**Version 1.0 | March 2026**

---

## Abstract

Avalon is a middleware protocol that gives game developers a unified TypeScript SDK for deploying on-chain game economies on Avalanche. The protocol provides four primitives: (1) per-game smart contract deployment via EIP-1167 minimal proxies, (2) autonomous NPC identity via an ERC-8004-compatible AgentRegistry, (3) provably fair loot distribution via Chainlink VRF v2.5, and (4) stablecoin economy management with configurable revenue splits. This paper specifies the protocol's economic model, formalizes the ERC-8004 agent identity system as implemented, and presents a threat model covering all six deployed contracts.

---

## 1. Problem Statement

Game developers who want blockchain features (real economies, verifiable randomness, autonomous NPCs with wallets) face a 6-12 month integration cost that most studios cannot absorb. The result is a fragmented landscape:

- **DIY integration** requires hiring Solidity engineers, deploying contracts, managing validators, and handling wallet UX. Feasible for studios with $10M+ budgets (e.g., Nexon with MapleStory Universe), but impractical for indie teams of 2-15 developers.
- **Gaming-specific chains** (ImmutableX, Ronin) provide infrastructure but no game-specific primitives. A studio using ImmutableX still needs to build its own loot system, economy contracts, and NPC logic from scratch.
- **No-code platforms** (Thirdweb, Sequence) handle wallet connection but charge monthly SaaS fees ($50-500/month) and don't provide game-specific modules like VRF loot tables or autonomous agent registries.

None of these solutions let a developer say: "Give my game its own contract suite with AI characters and a stablecoin economy" in a single SDK import.

### Market Context

The blockchain gaming sector processed $698M in on-chain gaming volume in Q4 2025 (DappRadar). Avalanche's gaming ecosystem grew 340% in 2025 with the launch of L1 subnets optimized for gaming workloads. However, the developer tools gap remains: most studios still deploy generic ERC-721/ERC-20 contracts without game-specific logic.

Avalon targets the underserved middle: studios too small for DIY blockchain engineering, too sophisticated for no-code builders, and needing game-specific primitives that general-purpose chains don't provide.

---

## 2. Protocol Architecture

Avalon follows a layered architecture: SDK API -> Smart Contract Layer -> Avalanche Network.

```
  Game Engine (Unity / Unreal / React)
              |
  +-----------v-----------+
  |       AVALON SDK       |
  | L1 | Agents | VRF | $ |
  +-----------+-----------+
              |
  +-----------v-----------+
  |   SMART CONTRACT LAYER |
  | GameFactory            |
  | AgentRegistry (8004)   |
  | LootVRF (VRF v2.5)    |
  | StablecoinEconomy      |
  | ChronosBattle          |
  | AvalonGame (base)      |
  +-----------+-----------+
              |
  +-----------v-----------+
  |  AVALANCHE FUJI / L1   |
  +------------------------+
```

### 2.1 Contract Deployment Model

GameFactory deploys game instances as EIP-1167 minimal proxies of the AvalonGame implementation contract. This reduces deployment gas from ~1.5M to ~200K per game instance while maintaining full contract functionality through delegatecall.

Each game clone is initialized with:
- `maxPlayers`: Player capacity
- `entryFee`: Native token entry cost (wei)
- `roundDuration`: Time-based round length (seconds)
- `vrfEnabled`: Whether loot drops use Chainlink VRF
- `stablecoinEnabled`: Whether the economy uses ERC-20 stablecoins

### 2.2 Contract Addresses (Avalanche Fuji Testnet)

| Contract | Address |
|----------|---------|
| GameFactory | `0x3f7FC08150709C22F1741A230351B59c36bCCc8a` |
| ChronosBattle | `0x5BFb2b211d20FC6F811f869184546910FB45985e` |
| AgentRegistry | `0x2636Ed9F3Aa33589810BE07B48ad9Be79de3Fd7F` |
| StablecoinEconomy | `0x95B4b7d7a23d954BF92FeDF2e00A374E22208D69` |
| LootVRF | `0x00aabA40e80d9C64d650C0f99063754944C1F05E` |

All contracts verified on Snowtrace.

---

## 3. ERC-8004 Agent Identity Specification

### 3.1 Overview

ERC-8004 defines a standard for autonomous AI agents with on-chain identity, reputation, and validation. Avalon's AgentRegistry implements this standard as an extension of ERC-721, where each token represents a unique AI agent with associated metadata and behavioral properties.

### 3.2 Interface

The AgentRegistry exposes three registries:

**Identity Registry** (Agent lifecycle)

```solidity
function registerAgent(string name, string agentURI) -> uint256 tokenId
function transferAgent(address to, uint256 tokenId)
function getAgent(uint256 tokenId) -> AgentInfo
```

Each agent is minted as an ERC-721 token. The `agentURI` points to off-chain metadata describing the agent's capabilities, personality traits, and behavior parameters. Agents are transferable, enabling marketplace trading of trained NPCs.

**Reputation Registry** (Trust scoring)

```solidity
function updateReputation(uint256 tokenId, uint256 newScore)  // onlyOwner
function getReputation(uint256 tokenId) -> uint256
```

Reputation is stored as a basis-point score (0-10000, where 10000 = 100%). New agents start at 5000 (50%). Reputation is updated by the contract owner based on game outcomes:
- Win: +100-500 reputation (depending on opponent strength)
- Loss: -50-200 reputation
- Validated behavior: +1000 (one-time bonus)

The MIN_REPUTATION_FOR_VALIDATION threshold (5000) prevents low-quality agents from being endorsed by validators.

**Validation Registry** (Trust endorsement)

```solidity
function authorizeValidator(address validator)    // onlyOwner
function revokeValidator(address validator)        // onlyOwner
function validateAgent(uint256 tokenId)            // onlyValidator
function invalidateAgent(uint256 tokenId)          // onlyValidator
```

Validators are trusted addresses (game servers, DAO multisigs, or automated monitoring contracts) that can endorse agents as behaving correctly. Validation is a binary flag. An agent must have reputation >= 5000 to be validated.

### 3.3 Agent Data Model

```solidity
struct AgentInfo {
    string name;              // Human-readable name ("Iron Guardian")
    string agentURI;          // IPFS/HTTP URI for personality metadata
    uint256 reputationScore;  // 0-10000 basis points
    bool validated;           // Endorsed by a validator
    address validator;        // Who validated this agent
    uint256 registeredAt;     // Registration timestamp
    uint256 lastActive;       // Last reputation update timestamp
}
```

### 3.4 Composition with ERC-721

AgentRegistry extends ERC721Enumerable, inheriting:
- Token ownership and transfer semantics
- `tokenOfOwnerByIndex` for enumerating a studio's NPCs
- `tokenURI` overridden to return `agentURI`
- Standard approval and operator mechanics

This means agents can be:
- Listed on NFT marketplaces (OpenSea, etc.)
- Managed by smart contract operators (game factories)
- Enumerated by game clients to discover available NPCs

### 3.5 Agent Personality System (Off-Chain)

The `agentURI` metadata encodes 8 personality traits that drive NPC behavior:

| Trait | Range | Effect on Behavior |
|-------|-------|--------------------|
| Aggression | 0.0-1.0 | Preference for high-damage moves over defensive play |
| Patience | 0.0-1.0 | Willingness to wait for optimal move timing |
| Courage | 0.0-1.0 | Tendency to engage at low HP vs. retreat/shield |
| Cunning | 0.0-1.0 | Ability to read opponent patterns and counter |
| Greed | 0.0-1.0 | Preference for coin-efficient moves |
| Sociability | 0.0-1.0 | Frequency and tone of dialogue |
| Curiosity | 0.0-1.0 | Willingness to try varied strategies |
| Loyalty | 0.0-1.0 | Consistency of strategy vs. adaptability |

Traits are combined via a weighted scoring function in the ChronosBridge module. For each available move, the bridge computes:

```
score(move) = w_agg * aggression_score(move)
            + w_pat * patience_score(move)
            + w_cou * courage_score(move)
            + w_cun * cunning_score(move)
            + w_gre * greed_score(move)
```

Where `aggression_score(Devastating Attack)` is high and `aggression_score(Shield)` is low. The weights are the NPC's trait values themselves. The move with the highest composite score is selected, with a noise factor proportional to `(1 - loyalty)` to prevent perfect predictability.

### 3.6 Mood Engine

Agents have a dynamic mood state that modifies trait weights during combat:

| Mood | Trigger | Trait Modification |
|------|---------|-------------------|
| Calm | Default state | No modification |
| Angry | Took large damage | Aggression +30%, Patience -40% |
| Afraid | HP below 25% | Courage -50%, Patience +30% |
| Excited | Landed critical hit | Aggression +20%, Cunning +20% |
| Bored | 5+ turns without action | Curiosity +40%, varied play |
| Suspicious | Opponent repeated move | Cunning +50%, Counter preference |

Mood transitions create emergent behavior patterns. A Guardian NPC that starts calm and defensive may shift to afraid mode at low HP, temporarily abandoning shields for desperate attacks, then shift back to defensive if healed.

---

## 4. Economic Model

### 4.1 Platform Revenue

Avalon follows a transaction-fee model analogous to Stripe: zero upfront cost, percentage of economic throughput.

**Primary revenue: 5% platform fee on match prize pools.**

The fee is implemented as `platformFeeBps = 500` in both ChronosBattle.sol and StablecoinEconomy.sol. On match completion, the prize pool is split:

```
platformFee = prizePool * 500 / 10000  // 5%
winnerPrize = prizePool - platformFee
```

**Why 5%?**

| Benchmark | Take Rate | Model |
|-----------|-----------|-------|
| Stripe | 2.9% + $0.30/txn | Per-transaction |
| Unity Asset Store | 30% | Marketplace |
| Steam | 30% | Distribution |
| ImmutableX | 2% | NFT trades |
| Avalon | 5% | Prize pool percentage |

For a 2-player $10 match ($20 pool):
- Stripe equivalent: $0.59/player x 2 = $1.18
- Avalon: $1.00

Avalon is cheaper than Stripe at low entry fees and comparable at $20+ pools. The 5% rate is designed for adoption-phase pricing. The `setPlatformFeeBps` function allows adjustment up to a hard cap of 2000 bps (20%), enforced on-chain.

**Revenue sensitivity:**

| Monthly Matches | Avg Pool | Monthly Revenue | Annual Revenue |
|----------------|----------|-----------------|----------------|
| 1,000 | $20 | $1,000 | $12,000 |
| 10,000 | $20 | $10,000 | $120,000 |
| 100,000 | $50 | $250,000 | $3,000,000 |

**Break-even point:** ~300 matches/month at $20 average pool = $6,000/month volume, generating $300 in fees. Estimated monthly infrastructure cost is ~$300 (RPC endpoints, hosting, VRF subscriptions).

### 4.2 Revenue Split Architecture

StablecoinEconomy.sol implements a three-way configurable revenue split for ERC-20 payments:

```solidity
struct RevenueSplit {
    uint16 platformFeeBps;   // Default: 500 (5%)
    uint16 creatorFeeBps;    // Default: 1000 (10%)
    uint16 prizePoolBps;     // Default: 8500 (85%)
}
```

Game creators can customize their split (subject to the constraint that all three sum to 10000 bps). This enables different business models:
- **Free-to-play with ads**: platformFeeBps=500, creatorFeeBps=9500, prizePoolBps=0
- **Esports tournament**: platformFeeBps=500, creatorFeeBps=500, prizePoolBps=9000
- **Default (Chronos Battle)**: 5% platform, 10% creator, 85% prize pool

### 4.3 In-Match Coin Economy

Chronos Battle uses an ephemeral coin economy that resets each match. Coins are game state, not tokens. This is a deliberate regulatory design choice.

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| Starting coins | 10 | Enough for 3-5 opening moves; immediate strategic tension |
| Max coins | 20 | Prevents snowball accumulation; forces spending |
| Regen rate | 1 coin/block | At Fuji ~2s/block = 0.5 coins/sec; matches game pacing |
| Quick Strike | 1 coin, 0 delay, 10 dmg | Always affordable; keeps game moving |
| Power Blow | 2 coins, 3 blocks, 25 dmg | 2.5x damage/coin vs Quick Strike |
| Devastating Attack | 3 coins, 6 blocks, 50 dmg | 5x damage/coin; high risk (counter window) |
| Shield | 1 coin, 2 blocks, blocks 1 hit | Cheap defense; pairs with Counter |
| Counter | 2 coins, 0 delay, 2x reflected | Situational; punishes committed attacks |

**Damage efficiency analysis:**

| Move | Coins | Damage | Dmg/Coin | Delay (blocks) | Risk |
|------|-------|--------|----------|----------------|------|
| Quick Strike | 1 | 10 | 10.0 | 0 | None (instant) |
| Power Blow | 2 | 25 | 12.5 | 3 | Shield/Counter window |
| Devastating Attack | 3 | 50 | 16.7 | 6 | Large Shield/Counter window |
| Counter | 2 | 2x target | Variable | 0 | Whiffs if no in-flight moves |

The damage-per-coin ratio increases with delay, creating the core risk/reward tradeoff. A player who always uses Devastating Attack gets the best damage efficiency but gives the opponent a 6-block window to Shield or Counter for 100 reflected damage.

**Metagame equilibrium:**

The coin economy creates a Rock-Paper-Scissors dynamic:
1. **Greedy Power Blow spam** (high damage/coin) loses to Counter (reflected damage exceeds invested coins)
2. **Counter-fishing** (waiting for opponent to commit) loses to Quick Strike spam (instant, no counter window)
3. **Quick Strike spam** (safe, instant) loses to Shield + Power Blow (cheap block + efficient punish)

Each NPC archetype maps to one strategy vertex, making opponent selection strategic:
- Kael (Warrior): vertex 1 (greedy aggression)
- Nova (Trickster): vertex 2 (counter specialist)
- Aria (Merchant): vertex 3 (efficient chip damage)
- Sage (Scholar): adaptive (reads opponent strategy, shifts vertex)
- Iron Guardian: mixed defense (Shield-heavy, waits for openings)

**No inflation risk:** Coins are created at match start (10 per player + 1/block regen capped at 20) and destroyed at match end. There is no persistent coin supply across matches.

### 4.4 Loot Rarity Distribution

Post-match loot is distributed via Chainlink VRF v2.5. The `_determineRarity` function maps a random number modulo 10000 to rarity tiers:

| Tier | Probability | Cumulative | Gameplay Effect |
|------|------------|------------|-----------------|
| Common | 50.0% | 100.0% | Speed Rune: -1 block delay on moves |
| Uncommon | 25.0% | 50.0% | Power Crystal: +5 damage on next attack |
| Rare | 15.0% | 25.0% | Shield Fragment: 50% damage reduction once |
| Epic | 7.5% | 10.0% | Chronos Crown: +2 starting coins |
| Legendary | 2.5% | 2.5% | Temporal Rift: opponent loses 5 coins |

The 50/25/15/7.5/2.5 distribution follows the Pareto-based gacha curve validated in live-service games (Hearthstone, Genshin Impact). The contract enforces that all rates sum to exactly 10000 bps via a require statement in `setLootTable`.

**Expected loot per 10 matches:** ~5 Common, ~2-3 Uncommon, ~1-2 Rare, ~0-1 Epic, ~0 Legendary.
**Legendary expectation:** 1 per 40 matches (retention incentive).

Loot items currently affect only the current match session, preventing pay-to-win accumulation across matches.

### 4.5 Comparison to Existing Solutions

| Platform | Revenue Model | Take Rate | Game Primitives |
|----------|--------------|-----------|-----------------|
| ImmutableX | NFT trade fee | 2% | NFT minting only |
| Ronin | Gas + ecosystem lock-in | Variable | Ronin-specific, no VRF |
| Thirdweb | SaaS ($50-500/mo) + gas | Fixed + gas | Wallet, no game logic |
| Polygon Gaming | Gas fees | Variable | Standard EVM, no SDK |
| **Avalon** | **5% prize pool** | **5%** | **VRF loot, agents, economy, factory** |

---

## 5. Threat Model

### 5.1 Scope

This threat model covers all six deployed contracts. For each contract, we identify attack vectors, implemented mitigations, residual risks, and trust assumptions.

### 5.2 ChronosBattle.sol

**Attack Vector 1: Reentrancy on prize distribution**
- Risk: `_endMatch` sends ETH to winner and treasury. A malicious contract could re-enter.
- Mitigation: `_endMatch` is protected by OpenZeppelin's `ReentrancyGuard` (inherited, `nonReentrant` modifier). State is updated (match state set to COMPLETED) before external calls.
- Residual risk: None for reentrancy. The checks-effects-interactions pattern is followed.

**Attack Vector 2: Front-running move submissions**
- Risk: On a public mempool, an opponent could see a submitted move transaction and submit a Counter before it lands.
- Mitigation: On Avalanche C-Chain, block time is ~2 seconds with sub-second finality. The practical front-running window is narrow. The `moveData` parameter (bytes32) is available for commit-reveal schemes in future versions. Currently, moves are submitted in plaintext.
- Residual risk: **Medium.** On C-Chain, validators see pending transactions. A sophisticated opponent could monitor the mempool and counter. On a dedicated L1 with a trusted validator set, this risk is eliminated because the game operator controls transaction ordering.
- Future mitigation: Implement commit-reveal pattern using `moveData` field (commit hash in block N, reveal in block N+1).

**Attack Vector 3: Coin calculation manipulation**
- Risk: `_getCurrentCoins` calculates coins based on `block.number - startBlock`. A player could wait many blocks to accumulate coins before acting.
- Mitigation: `MAX_COINS = 20` caps accumulation. At 1 coin/block and a 20-coin cap, a player reaches maximum after 10 blocks (~20 seconds). Beyond that, waiting provides no advantage.
- Residual risk: None. The cap is enforced on-chain.

**Attack Vector 4: Griefing via match abandonment**
- Risk: Player 1 creates a match, player 2 joins, then player 1 stops submitting moves. The match stays ACTIVE indefinitely, locking player 2's entry fee.
- Mitigation: `cancelMatch` allows player 1 to cancel a WAITING match after `CANCEL_TIMEOUT_BLOCKS = 100` blocks (~200 seconds). However, there is currently no timeout mechanism for ACTIVE matches.
- Residual risk: **Medium.** An ACTIVE match with an unresponsive player has no on-chain resolution. The frontend handles this with a timeout, but on-chain the funds remain locked until an owner-level intervention.
- Recommended mitigation: Add an `abandonMatch` function that allows either player to end an ACTIVE match after N blocks of inactivity (no moves submitted).

**Attack Vector 5: Platform fee manipulation**
- Risk: Owner could set `platformFeeBps` up to 2000 (20%), extracting excessive fees.
- Mitigation: Hard cap of 2000 bps enforced by `require(_feeBps <= 2000)`. This limits maximum extraction to 20%.
- Residual risk: Low. The cap is reasonable for a gaming platform. In production, this should be governed by a multisig or timelock.

### 5.3 AgentRegistry.sol

**Attack Vector 1: Unauthorized reputation manipulation**
- Risk: `updateReputation` is `onlyOwner`. If the owner key is compromised, all agent reputations can be manipulated.
- Mitigation: Standard Ownable access control. Owner should be a multisig in production.
- Residual risk: **Low** (standard for admin-controlled contracts). Reputation is informational, not tied to fund flows.

**Attack Vector 2: Validator collusion**
- Risk: Validators can validate any agent with reputation >= 5000. A malicious validator could validate a low-quality agent.
- Mitigation: `authorizeValidator` and `revokeValidator` are `onlyOwner`. Validators are explicitly authorized. Invalid validations can be reversed via `invalidateAgent`.
- Residual risk: Low. The trust model requires the owner to vet validators. In a DAO model, validator authorization would go through governance.

**Attack Vector 3: Sybil attacks on agent registration**
- Risk: Anyone can call `registerAgent` and mint unlimited agent tokens.
- Mitigation: None at the contract level. Agents start at 5000 reputation and are unvalidated. Game clients should filter by reputation threshold and validation status.
- Residual risk: **Low.** Sybil agents have no advantage without reputation and validation. The off-chain game client controls which agents are presented to players.

### 5.4 LootVRF.sol

**Attack Vector 1: VRF callback manipulation**
- Risk: If the VRF coordinator is compromised, the callback could provide biased randomness.
- Mitigation: Chainlink VRF v2.5 provides cryptographic proof of randomness. The proof is verified on-chain by the VRF coordinator before calling `fulfillRandomWords`. Avalon does not control the randomness source.
- Residual risk: **None** (assuming Chainlink VRF infrastructure is secure, which is a reasonable trust assumption given Chainlink's $10B+ secured value).

**Attack Vector 2: Unauthorized loot requests**
- Risk: Anyone could call `requestRandomLoot` to drain the VRF subscription's LINK balance.
- Mitigation: `onlyAuthorizedGame` modifier restricts callers to addresses explicitly authorized by the owner via `authorizeGame`.
- Residual risk: None (given proper authorization management).

**Attack Vector 3: VRF subscription exhaustion**
- Risk: If the LINK balance in the VRF subscription runs out, no loot can be generated.
- Mitigation: The frontend implements a client-side fallback using ChaCha20 PRNG for demo mode. When VRF is unavailable, gameplay continues with client-side randomness (clearly marked as unverified).
- Residual risk: **Low.** This affects fairness guarantees but not gameplay availability. The subscription should be monitored and topped up. At ~$0.002/request, 10,000 requests cost ~$20 in LINK.

**Attack Vector 4: Rarity table manipulation**
- Risk: Owner could set a loot table with 100% Legendary drops.
- Mitigation: `setLootTable` requires all rates sum to exactly 10000 bps. The owner can set any valid distribution.
- Residual risk: Low. The constraint ensures a valid probability distribution. In production, table changes should go through a timelock so players can verify fairness.

### 5.5 StablecoinEconomy.sol

**Attack Vector 1: Reentrancy on ERC-20 transfers**
- Risk: Malicious ERC-20 token with callback hooks could re-enter during `safeTransferFrom`.
- Mitigation: `ReentrancyGuard` protects all external functions (`payEntryFee`, `purchase`, `distributePrize`, `withdrawRevenue`). OpenZeppelin's `SafeERC20` handles non-standard return values.
- Residual risk: None for reentrancy. SafeERC20 handles USDT's non-standard `transfer` (no return value).

**Attack Vector 2: Token approval front-running**
- Risk: Standard ERC-20 approval race condition. Player approves amount X, then tries to change to Y. An attacker front-runs the second approve to spend X + Y.
- Mitigation: `SafeERC20` with `safeTransferFrom` does not directly address approval race conditions, but the contract uses `transferFrom` (not `approve`), meaning the player sets their own approval. Players should use `increaseAllowance` patterns.
- Residual risk: **Low.** This is a standard ERC-20 issue, not specific to Avalon. Players control their own approvals.

**Attack Vector 3: Prize pool drainage**
- Risk: `distributePrize` is `onlyOwner`. If the owner key is compromised, all prize pools can be drained.
- Mitigation: Ownable access control. In production, should be a multisig with timelock.
- Residual risk: **Medium** in current single-owner deployment. Critical to upgrade to multisig before mainnet.

**Attack Vector 4: Malicious token acceptance**
- Risk: Owner could accept a malicious ERC-20 token that has hidden fee-on-transfer or rebasing mechanics.
- Mitigation: `acceptToken` is `onlyOwner`. The owner must vet tokens. The contract uses SafeERC20 which handles non-standard transfers.
- Residual risk: Low. Only accept well-known stablecoins (USDT, USDC). Fee-on-transfer tokens would cause accounting discrepancies.

### 5.6 GameFactory.sol

**Attack Vector 1: Proxy initialization front-running**
- Risk: After a clone is deployed, someone could front-run the `initialize` call to claim ownership.
- Mitigation: `createGame` deploys the clone and calls `initialize` in the same transaction. There is no window between deployment and initialization.
- Residual risk: **None.** The atomic deploy+initialize pattern prevents front-running.

**Attack Vector 2: Implementation contract manipulation**
- Risk: The `gameImplementation` address is set in the constructor and is immutable. If the implementation contract is self-destructed or upgraded, all clones break.
- Mitigation: `gameImplementation` is `immutable` (set once in constructor, stored in bytecode). The implementation contract itself has no `selfdestruct` call. Since Solidity 0.8.24+ on EVM, `selfdestruct` only sends ETH without destroying code (EIP-6780), so even if someone added it, existing clones would continue working.
- Residual risk: **None** on post-Cancun EVM (Avalanche supports EIP-6780).

### 5.7 AvalonGame.sol

**Attack Vector 1: Double initialization**
- Risk: Someone could call `initialize` a second time to change ownership.
- Mitigation: `require(!_initialized)` check with a boolean flag. Once initialized, the function reverts.
- Residual risk: None.

**Attack Vector 2: DoS on game cancellation refunds**
- Risk: `cancelGame` iterates over all players to credit refunds. A large player list could hit the block gas limit.
- Mitigation: The contract uses a **pull-based refund pattern**. `cancelGame` credits refunds to `pendingRefunds` mapping; players call `claimRefund` to withdraw. This prevents the DoS vector of sending ETH to many addresses in one transaction.
- Residual risk: **None.** The pull pattern is the recommended approach (ConsenSys best practices).

**Attack Vector 3: Prize theft via completeGame**
- Risk: `completeGame` sends the entire contract balance to the declared winner. A malicious owner could declare any address as winner.
- Mitigation: `onlyOwner`. The game creator controls match resolution. In production, match results should be determined by on-chain game logic (as in ChronosBattle) rather than owner declaration.
- Residual risk: **Medium.** AvalonGame is a base contract intended for customization. Games that use off-chain result submission trust the owner. The ChronosBattle contract has fully on-chain match resolution, demonstrating the target pattern.

### 5.8 Trust Assumptions Summary

| Trust Assumption | Scope | Mitigation Path |
|-----------------|-------|-----------------|
| Contract owner is honest | All contracts | Upgrade to multisig + timelock for mainnet |
| Chainlink VRF is secure | LootVRF | Standard assumption; $10B+ TVS backing |
| Avalanche validators order fairly | ChronosBattle | Per-game L1 with controlled validator set |
| Accepted tokens are non-malicious | StablecoinEconomy | Whitelist only USDT/USDC |
| Validators are vetted | AgentRegistry | Owner-controlled authorization |

### 5.9 Security Measures Implemented

| Measure | Contracts Using It |
|---------|-------------------|
| OpenZeppelin ReentrancyGuard | ChronosBattle, StablecoinEconomy, GameFactory, AvalonGame |
| OpenZeppelin Ownable | All 6 contracts |
| OpenZeppelin SafeERC20 | StablecoinEconomy |
| OpenZeppelin Pausable | AvalonGame |
| Pull-based refunds | AvalonGame (cancelGame/claimRefund) |
| EIP-1167 atomic init | GameFactory (clone + initialize in same tx) |
| Basis-point rate validation | LootVRF (rates must sum to 10000) |
| Fee hard cap | ChronosBattle (max 20% fee) |
| Initialization guard | AvalonGame (_initialized flag) |

---

## 6. Chronos Battle: Game Design as Protocol Proof

Chronos Battle is not a standalone game. It is a reference implementation proving that Avalon's four primitives (factory deployment, agent identity, VRF loot, stablecoin economy) compose into a complete game loop.

### 6.1 Core Innovation: Latency as Mechanic

Most blockchain games treat on-chain latency as a UX problem to be hidden. Chronos Battle makes it the core mechanic:

- **Cheap moves are instant** but weak (Quick Strike: 1 coin, 10 damage)
- **Expensive moves are delayed** but powerful (Devastating Attack: 3 coins, 6 blocks, 50 damage)
- **The delay window creates counterplay** (Shield blocks, Counter reflects 2x damage)

This transforms block confirmation time from a liability into the game's strategic depth.

### 6.2 Match Lifecycle

```
createMatch() -> WAITING
    |
joinMatch()   -> ACTIVE
    |
submitMove()  -> [instant resolution or moves-in-flight]
    |
executeMove() -> [delayed moves land when block.number >= executeBlock]
    |
health == 0   -> COMPLETED -> _endMatch(winner)
                    |
                    +-> platformFee to treasury (5%)
                    +-> prize to winner (95%)
```

### 6.3 Contract Test Coverage

The ChronosBattle contract is covered by 39 Hardhat tests validating:
- All 5 move types and their damage/cost/delay values
- Shield activation and breaking mechanics
- Counter success (reflecting in-flight damage) and miss (no in-flight moves)
- Prize distribution with platform fee calculation
- Match cancellation with timeout enforcement
- Admin access control (fee changes, treasury updates)

---

## 7. Future Work

### 7.1 Per-Game L1 Deployment
The architecture is designed for each game to deploy on its own Avalanche L1 subnet with custom block time, gas token, and validator set. The GameFactory contract would be deployed on each L1, with cross-chain communication via Avalanche Warp Messaging (AWM) for leaderboards and agent reputation.

### 7.2 Commit-Reveal Moves
Adding a commit-reveal scheme using the existing `moveData` field in ChronosBattle to eliminate front-running on shared chains. Players commit a hash of their move, then reveal after the opponent commits.

### 7.3 On-Chain Agent Behavior
Moving the personality-to-move scoring function on-chain, so NPC decisions are verifiable. This requires gas optimization of the behavior tree evaluation.

### 7.4 DAO Governance
Transitioning contract ownership from single EOA to a DAO multisig with timelock for fee changes, validator authorization, and loot table updates.

---

## 8. Conclusion

Avalon provides game developers with a composable set of on-chain primitives: factory-deployed game instances (EIP-1167), autonomous agent identity (ERC-8004 via AgentRegistry), provably fair randomness (Chainlink VRF v2.5), and stablecoin economy management with configurable revenue splits. The protocol earns revenue through a 5% platform fee on prize pool throughput, comparable to payment processor pricing. All six contracts are deployed and verified on Avalanche Fuji, and the Chronos Battle reference game demonstrates a complete loop from match creation through prize distribution and VRF-powered loot drops.

The protocol's threat model identifies front-running on shared mempools and single-owner centralization as the primary residual risks, with clear mitigation paths (per-game L1 for transaction ordering, multisig + timelock for governance). The ERC-8004 agent identity system provides a reusable standard for on-chain NPC identity with reputation-gated validation.

---

*Avalon Protocol | Built for Avalanche Build Games 2026*
