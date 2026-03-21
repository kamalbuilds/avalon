# Code Quality Audit: AvaForge

**Auditor:** code-critic-avaforge
**Date:** 2026-03-13
**Scope:** README claims vs code, config contradictions, scoring bugs, contract address mismatches, type mismatches, dead code

---

## CRITICAL Findings

### 1. LootVRF Contract Address Mismatch (submission.md vs codebase)

**submission.md** lists LootVRF at `0xc39d9Ec925d3AA6E67FE760630406696408724f8`

All three code sources use a DIFFERENT address:
- `contracts/deployed-addresses.json`: `0x00aabA40e80d9C64d650C0f99063754944C1F05E`
- `src/lib/constants.ts:32`: `0x00aabA40e80d9C64d650C0f99063754944C1F05E`
- `src/lib/contracts/addresses.ts:10`: `0x00aabA40e80d9C64d650C0f99063754944C1F05E`

**Impact:** If a judge clicks the Snowtrace link in submission.md, they'll see a different contract than what the app actually uses. The `0xc39d9...` address appears to be an older deployment.

---

### 2. ChronosBattle.sol vs Frontend Engine: Completely Different Games

The on-chain contract (`contracts/ChronosBattle.sol`) and the frontend engine (`src/engine/chronos/moves.ts` + `ChronosEngine.ts`) implement **fundamentally different game mechanics**:

| Mechanic | ChronosBattle.sol | Frontend Engine |
|----------|-------------------|-----------------|
| Move types | 3 (FAST, MEDIUM, SLOW) | 5 (quick_strike, power_blow, devastating_attack, shield, counter) |
| Resource | "energy" (starts at 100) | "coins" (starts at 10) |
| Resource regen | 2 energy/block | 1 coin/block |
| FAST/quick cost | 30 energy | 1 coin |
| FAST/quick delay | 1 block | 0 blocks (instant) |
| FAST/quick damage | 15 | 10 |
| SLOW/devastating damage | 40 | 50 |
| Shield | Not in contract | 2-block delay, blocks next hit |
| Counter | Not in contract | Instant, doubles incoming damage |
| Payment | Native AVAX (msg.value) | Claims USDT |

**Impact:** The contract and the actual playable game are different products. A judge comparing on-chain code to the demo will notice the discrepancy. The contract has no shield or counter mechanic. The damage values, costs, and delay timings don't match.

---

### 3. Platform Fee Contradiction

- `src/lib/constants.ts:100` `ECONOMY.PLATFORM_FEE_BPS = 250` (2.5%)
- `contracts/ChronosBattle.sol:64` `platformFeeBps = 500` (5%)
- `contracts/StablecoinEconomy.sol:59` `defaultSplit.platformFeeBps = 500` (5%)

The TypeScript config says 2.5% fee but both deployed contracts use 5%.

---

## HIGH Findings

### 4. Rarity Weight Contradictions (3 different systems disagree)

| Source | Common | Uncommon | Rare | Epic | Legendary |
|--------|--------|----------|------|------|-----------|
| `constants.ts:120` RARITY_WEIGHTS | 50 | 30 | 15 | **4** | **1** |
| `opponents.ts:201` LOOT_TABLE | 50 | 25 | 15 | **7.5** | **2.5** |
| `LootVRF.sol:65` defaultLootTable (bps) | 5000 | 2500 | 1500 | **750** | **250** |

The Solidity contract and the LOOT_TABLE agree (7.5% epic, 2.5% legendary). But `constants.ts` RARITY_WEIGHTS says 4% epic and 1% legendary. Also, uncommon differs: constants says 30%, contract says 25%.

The `rollLoot()` function in `opponents.ts:245` uses the LOOT_TABLE weights (correct relative to contract). But any code using `RARITY_WEIGHTS` from constants.ts would get different probabilities.

---

### 5. NPC Difficulty Levels Contradict Between Parallel Definitions

Two files define the same 5 NPCs with conflicting difficulty:

| NPC | `opponents.ts` | `chronos-npcs.ts` |
|-----|---------------|-------------------|
| Aria | easy | medium |
| Kael | medium | hard |
| Nova | hard | expert |
| Sage | expert | expert |
| Iron Guardian | **legendary** | **hard** |

Additionally, `chronos-npcs.ts:24` defines difficulty as `'easy' | 'medium' | 'hard' | 'expert'` (no `legendary`), while `opponents.ts:18` includes `'legendary'` as a valid value. These are incompatible type definitions.

---

### 6. Iron Guardian Title Mismatch

- `opponents.ts:164`: title = `"The Immovable"`
- `chronos-npcs.ts:159`: title = `"The Protector"`

---

### 7. README Radar Chart Traits Don't Match Code

**README (line 18)** claims radar charts show: `aggression, patience, adaptability, courage, cunning`

**Actual `radarStats` in `opponents.ts:36-41`**: `aggression, defense, economy, speed, cunning`

3 of 5 trait names are wrong in the README.

---

### 8. README Move Name Wrong

**README (line 17)**: "Devastating Strike"
**Code (`moves.ts:53`)**: `name: 'Devastating Attack'`

The move is called "Devastating Attack" everywhere in the codebase. The README uses the wrong name.

---

## MEDIUM Findings

### 9. submission.md Lists 5 Contracts, README Lists 6

submission.md contract table omits `AvalonGame.sol`, which exists at `contracts/AvalonGame.sol` and is listed in the README project structure. The README also claims "6 contracts" in the structure comment.

---

### 10. NPC Wallet Addresses: Hardcoded Fakes

All 5 NPCs in `opponents.ts` share the same `contractAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18'` (Bitfinex hot wallet address). In `chronos-npcs.ts`, wallet addresses are sequential fakes (`0x1111...`, `0x2222...`, etc.). Neither points to the actual deployed AgentRegistry contract (`0x2636Ed9F3Aa33589810BE07B48ad9Be79de3Fd7F`).

---

### 11. ChronosBattle.sol Uses Native AVAX, Not USDT

The README, submission.md, and UI all claim entry fees are in "USDT via Tether WDK". But `ChronosBattle.sol` uses `msg.value` (native AVAX) for entry fees and `.call{value: ...}` for prize payouts. The `StablecoinEconomy.sol` contract does use ERC20 tokens, but it's a separate contract not connected to ChronosBattle.

---

### 12. VRF Loot is Simulated, Not On-Chain

`chronosStore.ts:440` `revealLoot()` calls `rollLoot()` which uses `Math.random()` (line 247 of opponents.ts), not Chainlink VRF. The `vrfRequestId` is faked with random hex:
```typescript
const vrfId = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
```

The LootVRF contract exists on-chain but the frontend never calls it. All loot drops are client-side random.

---

### 13. Duplicate Game-Over Logic (3x copy-paste)

`chronosStore.ts` contains the game-over block (match recording, balance update, history push) duplicated 3 times:
- `playerMove()` at lines 253-286
- `tick()` at lines 311-342
- `scheduleAIMove()` at lines 387-422

Same 30+ lines of code repeated verbatim. A single `handleGameOver()` function would eliminate this maintenance risk.

---

## LOW Findings

### 14. MOCK_LEADERBOARD Hardcoded

`chronosStore.ts:84-93` has a hardcoded fake leaderboard with made-up players. This is presented as real on-chain data in the UI but is entirely static.

---

### 15. Opponent NPC Trait Values Differ Between Files

Aria's trait overrides in `opponents.ts:59`: `aggression: 20, patience: 90, greed: 85, cunning: 70`
Aria's full traits in `chronos-npcs.ts:41-49`: `aggression: 20, patience: 80, greed: 80, cunning: 75`

The patience (90 vs 80), greed (85 vs 80), and cunning (70 vs 75) values differ.

---

### 16. README Claims "Next.js 16" - Accurate

`package.json` confirms `"next": "16.1.6"`. This claim is correct.

---

## Summary

| Severity | Count |
|----------|-------|
| CRITICAL | 3 |
| HIGH | 5 |
| MEDIUM | 5 |
| LOW | 3 |
| **Total** | **16** |

The most judge-visible issues are:
1. **submission.md LootVRF address is wrong** (judge clicks Snowtrace, sees wrong contract)
2. **On-chain contract is a completely different game** than what's playable (3 moves vs 5, different resource system)
3. **README radar chart trait names are wrong** (judge sees different traits in UI vs docs)
4. **VRF loot is Math.random(), not Chainlink VRF** (the integration is deployed but unused)
