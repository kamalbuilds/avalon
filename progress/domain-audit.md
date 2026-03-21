# Domain Expert Audit: AvaForge (Avalon)

**Auditor**: domain-expert-avaforge
**Date**: 2026-03-13 (updated 2026-03-15 after contract fixes)
**Scope**: Avalanche L1 claims, Chainlink VRF v2.5, ERC-8004, stablecoin economy, SDK accuracy

---

## Overall Verdict: STRONG MVP WITH HONEST FRAMING

The project has been significantly improved since the initial audit. GameFactory now deploys real EIP-1167 clones, ChronosBattle matches the frontend's 5-move system, security vulnerabilities have been fixed, and claims in README/submission have been toned down to match reality. Below is the updated claim-by-claim assessment.

---

## 1. Avalanche L1 / Game Deployment

**Claim (updated)**: "Dedicated on-chain backend with architecture designed for per-game L1 deployment"
**Severity**: LOW (downgraded from HIGH) - Claims now match reality

### What changed:
- **GameFactory.sol** now uses OpenZeppelin `Clones.clone()` (EIP-1167 minimal proxies) to deploy real AvalonGame instances. Each `createGame()` call deploys a cheap proxy (~200k gas vs ~1.5M for full deploy) and calls `initialize()`.
- `gameAddress` is no longer `address(0)` - it's a real deployed contract address.
- **README.md** now says "architecture designed for per-game L1 deployment" instead of claiming L1s are live. This is honest and accurate.

### What still applies:
- The SDK's `L1Module` still simulates L1 deployment with random chain IDs. This is fine for a hackathon demo as long as it's not presented as live.
- No P-Chain transactions or actual subnet deployment exists. But the README no longer claims this.

### Assessment:
The EIP-1167 proxy pattern is the correct approach for a game factory. Each game gets its own sovereign contract with unique address. The framing is now honest. **This finding is resolved.**

---

## 2. ERC-8004 AI Agent Standard

**Claim**: "ERC-8004 Agent Identity"
**Severity**: MEDIUM (unchanged) - Standard reference still needs verification

### What exists:
- **AgentRegistry.sol** is ERC-721 + custom metadata (name, agentURI, reputationScore, validated status, validator).
- Three registries: Identity (mint/transfer), Reputation (0-10000 bps), Validation (authorized validators).
- The TypeScript `AgentRegistry.ts` mirrors this as an in-memory registry.

### ERC-8004 assessment:
- The standard's existence as a finalized EIP is unverified. No `IERC8004` interface is imported.
- The implementation itself is solid ERC-721 + agent metadata, which is the right pattern regardless of the standard number.
- README now frames this as "ERC-8004 Agent Identity" which is less aggressive than "ERC-8004 compatible."

### Recommendation:
Verify ERC-8004 exists as a draft/final EIP. If yes, import the interface. If not, consider describing as "Agent Identity Standard (ERC-721-based)" to avoid questions about a potentially non-existent standard.

---

## 3. Chainlink VRF v2.5 Integration

**Claim**: "Chainlink VRF v2.5 with on-chain proof verification"
**Severity**: LOW (unchanged) - Contract is production-quality

### What exists:
- **LootVRF.sol** correctly extends `VRFConsumerBaseV2Plus` with proper v2.5 API usage
- VRF subscription is ACTIVE on Fuji with 0.3 AVAX
- **Address mismatch FIXED**: submission.md now shows `0x00aabA40e80d9C64d650C0f99063754944C1F05E` matching VRF-STATUS.md
- README now mentions "Demo mode uses client-side fallback for instant gameplay; wallet-connected mode calls the deployed LootVRF contract" - this is honest framing

### Remaining issues:
- The SDK `VRFModule` still uses `Math.random()` for demo mode. This is acceptable if clearly labeled (and it now is).
- The `onlyAuthorizedGame` modifier still allows `s_vrfCoordinator` to call `requestRandomLoot`, which is a minor logical error (coordinator only calls `fulfillRandomWords`).

### Assessment:
VRF is the project's strongest blockchain integration. The contract is correct, deployed, funded, and the claims are now honest about demo vs live mode. **Largely resolved.**

---

## 4. Stablecoin Economy

**Claim (updated)**: "ERC-20 payment infrastructure with entry fees, prize pools, and platform revenue splits"
**Severity**: LOW (downgraded from MEDIUM) - Claims now match reality

### What changed:
- README no longer claims "Tether WDK." It says "Stablecoin Economy" and "ERC-20 payment infrastructure."
- submission.md says "Tether WDK stablecoin economy scaffolded in StablecoinEconomy.sol" which is honest framing with "scaffolded."

### What exists:
- **StablecoinEconomy.sol** is a well-structured ERC-20 payment splitter with SafeERC20, revenue splits, prize pools.
- No WDK integration, no USDT configured, no embedded wallets. But the contract is ready to accept any ERC-20.

### Assessment:
The contract is sound and the claims are now honest. **This finding is largely resolved.**

---

## 5. SDK Code Examples

**Claim**: SDK documentation with code examples
**Severity**: LOW (unchanged)

### Assessment:
- TypeScript SDK class exists and is well-designed
- Unity/Python are code examples only (acceptable for hackathon)
- `@avalon/sdk` not on npm (acceptable for hackathon)
- The SDK page demonstrates the intended developer experience clearly

**This was always a minor finding for a hackathon context.**

---

## 6. Contract Improvements Since Initial Audit

### GameFactory.sol - SIGNIFICANTLY IMPROVED
- Now uses `Clones.clone()` (EIP-1167) to deploy real AvalonGame proxies
- `gameImplementation` is immutable - good pattern
- Returns both `gameId` and `gameAddress` from `createGame()`
- Proper `_toAvalonConfig()` conversion helper

### AvalonGame.sol - SECURITY FIX APPLIED
- Added `initialize()` function for proxy pattern (replaces constructor)
- `_initialized` guard prevents re-initialization attacks
- **Pull-based refunds** via `pendingRefunds` mapping and `claimRefund()` - this fixes the DoS vulnerability I flagged where a reverting contract could block all refunds
- Proper `RefundAvailable` and `RefundClaimed` events

### ChronosBattle.sol - MAJOR UPGRADE
- Expanded from 3 generic moves to 5 specific moves matching the frontend:
  - Quick Strike (instant, 1 coin, 10 dmg)
  - Power Blow (3-block delay, 2 coins, 25 dmg)
  - Devastating Attack (6-block delay, 3 coins, 50 dmg)
  - Shield (2-block activation, 1 coin, blocks next attack)
  - Counter (instant, 2 coins, doubles opponent's in-flight damage)
- Coins economy (earn per block, cap at 20) instead of generic energy
- Shield mechanics with `ShieldActivated`/`ShieldBroken` events
- Counter mechanics that scan opponent's `movesInFlight` array
- `cancelMatch()` with timeout protection (`CANCEL_TIMEOUT_BLOCKS = 100`)
- `createdBlock` tracking for cancel timeout
- CANCELLED state added to MatchState enum
- **Contract now matches frontend 1:1** - this is critical for judge credibility
- 39 tests covering all move types (mentioned in README)

### Security Status:
- AvalonGame.sol DoS vulnerability: **FIXED** (pull-over-push refunds)
- ChronosBattle.sol cancel griefing: **MITIGATED** (100-block timeout)
- Low-level `.call{value}` still used but acceptable for this context

---

## 7. README/Submission Accuracy

### What improved:
- L1 claims toned down to "architecture designed for per-game L1 deployment"
- "Tether WDK" usage is now "scaffolded" language
- VRF description is honest about demo vs wallet-connected modes
- Address mismatch fixed
- Test count included (39 tests)
- Loot effects described (Speed Rune, Power Crystal, Shield Fragment, Chronos Crown)

### What judges might still question:
- ERC-8004 reference if the standard doesn't exist as a finalized EIP
- The gap between "SDK" branding and the actual single-game demo
- Unity/Python SDK availability

---

## Updated Summary Table

| Claim | Status | Severity | Change |
|-------|--------|----------|--------|
| Game deployment | EIP-1167 clones, real contracts | LOW | Fixed (was HIGH) |
| ERC-8004 AI Agents | ERC-721 + custom metadata | MEDIUM | Unchanged |
| Chainlink VRF v2.5 | Contract solid, honest demo/live framing | LOW | Improved |
| Stablecoin Economy | ERC-20 splitter, honest "scaffolded" framing | LOW | Fixed (was MEDIUM) |
| SDK Examples | TS exists, others aspirational | LOW | Unchanged |
| ChronosBattle | 5 moves, shield/counter, 39 tests, matches frontend | NONE | Significantly improved |
| Contract Security | Pull refunds, cancel timeout, re-init guard | NONE | Multiple fixes applied |

---

## Bottom Line

The project has materially improved since the initial audit. The three biggest issues (GameFactory not deploying contracts, ChronosBattle not matching frontend, AvalonGame DoS vulnerability) are all fixed. Claims have been toned down to match reality.

**Remaining risk**: ERC-8004 standard verification. Everything else is now honestly framed.

**Judge readiness**: HIGH. The contracts are solid, the game is playable, the claims are honest, and the test suite (39 tests) demonstrates engineering rigor. The "blockchain latency as game mechanic" concept with 5 distinct moves is genuinely innovative and well-implemented both on-chain and in the frontend.

**Recommended strategy**: Lead with ChronosBattle's innovative time-based combat, the EIP-1167 factory pattern, and the VRF loot system. These are real, deployed, and differentiated. The SDK framing works for positioning but shouldn't be the lead in a technical demo.
