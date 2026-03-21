# AvaForge Architecture Audit

**Auditor:** arch-auditor-avaforge
**Date:** 2026-03-15 (rev 2 - updated after GameFactory + AvalonGame fixes)
**Contracts:** GameFactory.sol, AgentRegistry.sol, LootVRF.sol, ChronosBattle.sol, StablecoinEconomy.sol, AvalonGame.sol

---

## Overall Grade: C-

**Verdict: Improved from D+ after GameFactory and AvalonGame fixes.** GameFactory now deploys real EIP-1167 clones. AvalonGame has a proper `initialize()` and pull-over-push refunds. Still missing circuit breakers, time-locks, custom errors, and emergency exits on most contracts.

---

## Per-Contract Analysis

### 1. GameFactory.sol (improved)

| Category | Finding |
|----------|---------|
| **ERCs/EIPs** | **EIP-1167 minimal proxies** via OZ `Clones.clone()`. Immutable `gameImplementation` address. |
| **Safety patterns** | ReentrancyGuard (on createGame), Ownable, zero-address check on implementation |
| **Missing** | Pausable, circuit breaker, time-lock, custom errors, CREATE2 deterministic deployment |

**What improved:**
- Factory now deploys real AvalonGame clones via `Clones.clone()` (EIP-1167). Gas cost ~200k vs ~1.5M.
- `gameImplementation` is `immutable`, preventing post-deployment replacement (eliminates the `setGameAddress` rug vector from v1).
- `initialize()` called immediately after cloning with proper ownership transfer.

**Remaining issues:**
- `getActiveGames()` still has an unbounded double-loop over all games. DoS vector at scale.
- `updateGame()` updates metadata but NOT the deployed clone's config. Metadata and on-chain state can diverge silently.
- No Pausable: cannot freeze game creation during an exploit.
- No CREATE2: game addresses are not deterministic/predictable before deployment.

### 2. AgentRegistry.sol (unchanged)

| Category | Finding |
|----------|---------|
| **ERCs/EIPs** | ERC-721 (via ERC721Enumerable). Claims ERC-8004 compatibility in NatSpec |
| **Safety patterns** | Ownable only |
| **Missing** | ReentrancyGuard, Pausable, circuit breaker, time-lock, custom errors |

**Critical issues (same as v1):**
- ERC-8004 claim is aspirational, not implemented. No on-chain agent capability schema, no standardized discovery interface.
- Reputation is fully centralized: `updateReputation()` is `onlyOwner`. No oracle, no decay, no multi-sig.
- No Pausable: cannot freeze minting if an exploit is found.
- No transfer restrictions: validated agents can be sold, reputation transferred to buyer. No soul-bound option.
- `getAgentsByOwner()` has unbounded loop.

### 3. LootVRF.sol (unchanged)

| Category | Finding |
|----------|---------|
| **ERCs/EIPs** | Chainlink VRF v2.5 (VRFConsumerBaseV2Plus) |
| **Safety patterns** | onlyAuthorizedGame modifier, onlyOwner for admin |
| **Missing** | Pausable, ReentrancyGuard, circuit breaker, time-lock, emergency withdrawal, custom errors |

**Critical issues (same as v1):**
- `onlyAuthorizedGame` modifier incorrectly allows `s_vrfCoordinator` to call `requestRandomLoot()`. The coordinator only calls `fulfillRandomWords()`, so this check is dead code that widens the attack surface.
- No emergency pause. If VRF oracle goes down, no fallback or timeout mechanism.
- No withdrawal function for stuck LINK or native tokens.
- Admin can change `subscriptionId`, `keyHash`, `callbackGasLimit`, `requestConfirmations` with zero delay. Instant rug vector.
- `playerDrops` array grows unbounded.

### 4. ChronosBattle.sol (unchanged)

| Category | Finding |
|----------|---------|
| **ERCs/EIPs** | None |
| **Safety patterns** | Ownable, ReentrancyGuard (on _endMatch) |
| **Missing** | Pausable, circuit breaker, time-lock, custom errors, match timeout |

**Critical issues (same as v1):**
- **No match expiry.** If player2 joins and neither player acts, funds are locked forever. No timeout, no emergency withdrawal.
- `executeMove()` is callable by anyone, not just players. Any address can execute a pending move.
- Owner can change `entryFee`, `platformFeeBps`, and `treasury` instantly with no time-lock. Fee can be set up to 20% with no delay.
- `receive()` accepts arbitrary ETH with no accounting, inflating prize pools silently.
- No Pausable: cannot halt matches during an exploit.

### 5. StablecoinEconomy.sol (unchanged)

| Category | Finding |
|----------|---------|
| **ERCs/EIPs** | Uses SafeERC20 (good for non-standard USDT) |
| **Safety patterns** | Ownable, ReentrancyGuard, SafeERC20 |
| **Missing** | Pausable, circuit breaker, time-lock, custom errors, rate limiting |

**Critical issues (same as v1):**
- `removeToken()` sets `acceptedTokens[token] = false` but never removes from `tokenList` array. `getAcceptedTokens()` returns stale data.
- `distributePrize()` is `onlyOwner`. Single admin key controls all prize distribution. No multi-sig, no time-lock.
- No per-game spending caps or daily limits.
- `setRevenueSplit()` allows game creator to set split with no time-lock. Creator can front-run by changing split right before large entry fee.
- Revenue split check only validates sum = 10000, not minimum prize pool percentage. Creator could set 99% creator fee.

### 6. AvalonGame.sol (improved)

| Category | Finding |
|----------|---------|
| **ERCs/EIPs** | **EIP-1167 compatible** (initializable clone pattern) |
| **Safety patterns** | Ownable, Pausable, ReentrancyGuard, **pull-over-push refunds**, initialization guard |
| **Missing** | Circuit breaker, time-lock, custom errors, game timeout |

**What improved:**
- `initialize()` function with `_initialized` guard replaces constructor for EIP-1167 compatibility.
- **Pull-over-push refunds:** `cancelGame()` now credits `pendingRefunds` mapping instead of pushing ETH in a loop. Players call `claimRefund()` to withdraw. Eliminates the DoS vector from v1.
- Proper `_transferOwnership(_owner)` in initialize.
- New events: `RefundAvailable`, `RefundClaimed`.

**Remaining issues:**
- `completeGame()` still sends `address(this).balance` (entire contract balance), not tracked deposits. If extra ETH arrives via `receive()`, winner gets unearned bonus.
- `executeMove()` is `onlyOwner` with arbitrary `scoreChange`. Owner fully controls game outcome.
- No game timeout. If owner never calls `completeGame()`, funds are locked forever (players can only get refunds if owner calls `cancelGame()`).
- `_initialized` is `bool private` but not in a gap-safe position for future upgrades.
- `cancelGame()` still loops through `playerList` to credit refunds. The loop is bounded by `maxPlayers` but the push itself can't revert (just writes to storage), so this is acceptable.

---

## Benchmark Comparison

### vs. Tilt (Grade: A)

| Pattern | Tilt | AvaForge |
|---------|------|----------|
| ERC-4626 Vault Standard | Yes | No vault pattern at all |
| BeaconProxy (upgradeable) | Yes | **EIP-1167 clones** (not upgradeable, but real deploys) |
| Dead shares (inflation prevention) | Yes | N/A (no vault) |
| Circuit breakers | Yes, per-pool and global | None on any contract |
| Time-locked admin changes | Yes, 48h delay | Zero delay on all admin functions |
| Custom errors | Yes (gas efficient) | All require strings (wasteful) |
| Storage gaps | Yes (__gap) | None |
| Pull-over-push | Yes | **Yes** (AvalonGame.claimRefund) |

### vs. EqualFi (Grade: A-)

| Pattern | EqualFi | AvaForge |
|---------|---------|----------|
| EIP-2535 Diamond Proxy | Yes (modular facets) | EIP-1167 clones (simpler, non-upgradeable) |
| Library depth | 52 libraries | 0 custom libraries |
| Encumbrance system | Yes (sophisticated access) | Basic Ownable only |
| Multi-sig governance | Yes | Single owner key |
| Emergency shutdown | Yes | None |

---

## Architecture Assessment: "Every Game Gets Its Own L1"

**Does the architecture support per-game L1 deployment?** Partially.

- **GameFactory now deploys real EIP-1167 clones.** Each game gets its own contract address with isolated state. This is the foundation for per-game sovereignty.
- However, clones are on the same chain. No cross-chain messaging, no bridge contracts, no relayer infrastructure.
- No L2/appchain deployment scripts or configuration.
- No deterministic addressing (CREATE2) for cross-chain address prediction.

The architecture has moved from "stub" to "single-chain factory." Per-game L1s would still require: bridge contracts, cross-chain state sync, and chain-specific deployment tooling. But the clone-per-game pattern is the right starting point.

---

## What's Missing for Production (Summary)

### Tier 1: Security-Critical
- [x] ~~Actual factory deployment (EIP-1167)~~ **DONE**
- [x] ~~Pull-over-push for refunds~~ **DONE** (AvalonGame)
- [ ] **Circuit breakers** (global pause + per-game pause with automatic triggers)
- [ ] **Time-locks** on all admin functions (48h minimum)
- [ ] **Multi-sig governance** (Gnosis Safe or similar)
- [ ] **Emergency withdrawal** function on every contract holding funds
- [ ] **Match/game expiry** with automatic refund after timeout
- [ ] **Custom errors** replacing all require strings (gas savings + ABI encoding)
- [ ] **Rate limiting** on entry fees and prize distribution

### Tier 2: Robustness
- [ ] **Bounded loops** or pagination (getActiveGames, getAgentsByOwner)
- [ ] **Storage gaps** (`__gap`) for upgrade safety
- [ ] **Access control roles** (AccessControl instead of single Ownable)
- [ ] **Oracle health checks** (VRF timeout fallback)
- [ ] **LootVRF modifier fix** (remove coordinator from onlyAuthorizedGame)
- [ ] **StablecoinEconomy tokenList cleanup** on removeToken

### Tier 3: Architecture
- [ ] **Proxy/upgrade pattern** (BeaconProxy or UUPS) for upgradeable clones
- [ ] **CREATE2 deterministic deployment** for predictable addresses
- [ ] **ERC-8004 proper implementation** (not just a NatSpec claim)
- [ ] **ERC-4626** if any vault/staking pattern is needed
- [ ] **Cross-chain infrastructure** if per-game chains are the vision

---

## Grade Rationale

| Criteria | Score | Change | Notes |
|----------|-------|--------|-------|
| ERC/EIP adoption | D+ | +1 | ERC-721 real. EIP-1167 now real. ERC-8004 still a label. |
| Proxy/upgrade | D | +2 | EIP-1167 clones deployed, but not upgradeable. |
| Circuit breakers | F | -- | None on any contract. |
| Time-locks | F | -- | All admin changes are instant. |
| Emergency exits | F | -- | No emergency withdrawal on any contract. Funds can be permanently locked. |
| Dead shares | N/A | -- | No vault pattern to evaluate. |
| Custom errors | F | -- | 100% require strings. |
| Defense-in-depth | D+ | +0.5 | AvalonGame now has ReentrancyGuard + Pausable + pull-over-push. Still no layered safety elsewhere. |
| Reentrancy guards | C+ | -- | Present on GameFactory, ChronosBattle, StablecoinEconomy, AvalonGame. Missing on AgentRegistry and LootVRF. |
| Access control | D | -- | All use single-key Ownable. No roles, no multi-sig. |

**Overall: C-** (up from D+)

The GameFactory + AvalonGame fixes address the two most embarrassing gaps (stub factory, DoS refund loop). The clone pattern is the correct architectural foundation. But 4 of 6 contracts are unchanged, and the system-wide gaps (no circuit breakers, no time-locks, no emergency exits, no custom errors) remain. The gap to Tilt/EqualFi is still substantial but the trajectory is positive.
