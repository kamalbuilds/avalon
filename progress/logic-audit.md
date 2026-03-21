# Logic Correctness Audit: AvaForge

**Auditor:** logic-auditor-avaforge
**Date:** 2026-03-13
**Scope:** All critical game logic files

---

## CRITICAL: Dead Logic & Unreachable Branches

### 1. `isPaused` is checked but can NEVER be `true`

**File:** `src/stores/chronosStore.ts:104, 218, 358`
**DOES:** The store declares `isPaused: boolean` (line 104), initializes it to `false` (line 156), resets it to `false` in `startMatch()` (line 206), and checks it in the block ticker (line 218) and AI move scheduler (line 358).
**SHOULD:** There should be a `togglePause` or `setPaused` action that sets `isPaused = true`. Without one, the `isPaused` guard on lines 218 and 358 is dead code. The game can never be paused.
**Impact:** HIGH. Players cannot pause mid-match. The pause check exists (suggesting the feature was planned) but was never wired up. The branch `if (s.isPaused)` at line 358 can never trigger.

---

### 2. Three personality traits are IGNORED in battle decisions

**File:** `src/ai/ChronosBridge.ts` (entire file)
**DOES:** The bridge scores moves based on 5 traits: `aggression`, `courage`, `greed`, `cunning`, `patience`. The `PersonalityTraits` interface defines 8 traits.
**SHOULD:** The traits `sociability`, `curiosity`, and `loyalty` are defined on every NPC (e.g., Kael has loyalty=70, curiosity=15) but have ZERO effect on any battle decision. These traits exist in the data but never influence gameplay.
**Impact:** MEDIUM. NPCs with high loyalty or curiosity behave identically to those with low values. The personality system promises 8 dimensions of behavior but only delivers 5. Players reading NPC profiles see traits that are cosmetic-only.

---

### 3. `opponentToPersonality()` collapses 5 archetypes into 3 behaviors (fallback path)

**File:** `src/engine/chronos/opponents.ts:259-268`
**DOES:** Maps merchant/guardian to `'defensive'`, warrior to `'aggressive'`, trickster/scholar to `'balanced'`. This is the fallback when no NPC profile exists.
**SHOULD:** The mapping loses critical distinction. A trickster (cunning=95) and a scholar (curiosity=95) both become `'balanced'`, playing identically. A merchant (greed=85) and a guardian (patience=95) both become `'defensive'`, also identical.
**Impact:** LOW (bridge is used when npcProfile exists, which is always for the 5 named opponents). But if any opponent is added without a corresponding NPC profile, the fallback produces indistinguishable behavior for 2 out of 3 personality buckets.

---

### 4. `getChronosNPCByName()` and `getChronosNPCsByDifficulty()` are never called

**File:** `src/ai/npcs/chronos-npcs.ts:199-205`
**DOES:** Two helper functions are exported and re-exported via `src/ai/index.ts`.
**SHOULD:** No file in the codebase imports or calls these functions. `getChronosNPCByName` and `getChronosNPCsByDifficulty` are dead code.
**Impact:** LOW. Unused exports, no runtime effect. But they inflate the public API surface and suggest missing features (e.g., filtering opponents by difficulty in the lobby).

---

### 5. Difficulty `'legendary'` exists on opponents but NOT on NPC profiles

**File:** `src/engine/chronos/opponents.ts:18` vs `src/ai/npcs/chronos-npcs.ts:24`
**DOES:** `ChronosOpponent.difficulty` allows `'easy' | 'medium' | 'hard' | 'expert' | 'legendary'`. Iron Guardian opponent has `difficulty: 'legendary'` (line 170). But `ChronosNPCProfile.difficulty` only allows `'easy' | 'medium' | 'hard' | 'expert'`. Iron Guardian's NPC profile has `difficulty: 'hard'` (line 176).
**SHOULD:** The difficulty types should be consistent. Iron Guardian is marketed as `'legendary'` in the opponent card but plays as `'hard'` in the NPC system. The `'legendary'` difficulty value is a dead enum member in `ChronosNPCProfile` type it literally cannot be assigned.
**Impact:** MEDIUM. Misleads players about difficulty. The hardest boss appears as "hard" internally while the UI may show "legendary" from the opponent object.

---

### 6. Loot item effects are described but NEVER implemented

**File:** `src/engine/chronos/opponents.ts:201-242`
**DOES:** Loot items have detailed gameplay effect descriptions:
- Speed Rune: "Reduces move delay by 1 block"
- Shield of Ages: "absorbs 2 hits"
- Chronos Crown: "Grants +2 starting coins"
- Void Cloak: "Makes your next slow move invisible"
- Infinity Gauntlet: "One free instant Devastating Attack per match"
- Time Lord's Ring: "See opponent moves 1 block earlier"

**SHOULD:** None of these effects are implemented anywhere in the game engine. `rollLoot()` returns a `LootItem` with a description string, but the game engine (`ChronosEngine.ts`) never checks for equipped items, applies stat modifiers, or alters move behavior based on loot. The items are purely cosmetic drop notifications.
**Impact:** HIGH. Players receive loot with specific promised gameplay effects that do nothing. The VRF system is used to determine rarity, but the items themselves are inert.

---

### 7. `PersonalitySystem.modifyDecision()` and mood system are unused in battles

**File:** `src/ai/PersonalitySystem.ts:152-338`
**DOES:** The `PersonalitySystem` class has a full mood system (`setMood`, `tickMood`, `reactToEvent`), decision modifier (`modifyDecision`), and economic bias system.
**SHOULD:** The Chronos battle system bypasses this entirely. The `ChronosBridge.ts` directly reads `npc.traits` without instantiating a `PersonalitySystem`. No battle code calls `reactToEvent()`, `tickMood()`, or `modifyDecision()`. The entire `PersonalitySystem` class, `Mood` type (8 moods: calm/alert/angry/afraid/happy/suspicious/excited/bored), and `DialogueStyle`/`EconomicBias` interfaces are dead code in the battle context.
**Impact:** MEDIUM. A full NPC behavior system exists but is never used. The bridge reimplements a simpler version of personality-driven decisions, duplicating logic. The mood system (which would make NPCs react differently when hurt, winning, etc.) is completely bypassed.

---

### 8. `NPCFactory`, `DialogueSystem`, `EconomicAgent` are internal-only (no external consumers)

**File:** `src/ai/NPCFactory.ts`, `src/ai/DialogueSystem.ts`, `src/ai/EconomicAgent.ts`
**DOES:** These modules exist in the AI system and are imported within `src/ai/` internally.
**SHOULD:** No file outside of `src/ai/` imports these modules. They form a self-contained subsystem that the game never uses. The battle system (`ChronosEngine`, `chronosStore`, `ChronosBridge`) imports directly from `npcs/chronos-npcs.ts` and `PersonalitySystem.ts` for types only.
**Impact:** LOW-MEDIUM. An entire NPC factory pipeline exists but is dead code from the game's perspective. Suggests a planned-but-unfinished integration.

---

### 9. `MatchState` type uses `MatchStatus` with values never set in code

**File:** `src/types/index.ts:439`
**DOES:** `MatchStatus = 'waiting' | 'starting' | 'in_progress' | 'completed' | 'cancelled'`
**SHOULD:** The Chronos engine uses its own `GamePhase = 'waiting' | 'playing' | 'game_over'`. The `MatchStatus` type (with `'starting'`, `'in_progress'`, `'cancelled'`) is defined but never assigned anywhere in the codebase. No code ever creates a `MatchState` object with these statuses.
**Impact:** LOW. Dead type definition. Two parallel state machines exist for match lifecycle and never converge.

---

### 10. ChronosBattle.sol: No timeout/forfeit mechanism for `WAITING` matches

**File:** `contracts/ChronosBattle.sol:79-101`
**DOES:** `createMatch()` sets `state: MatchState.WAITING` and locks the entry fee. The match stays in `WAITING` until someone calls `joinMatch()`.
**SHOULD:** If no opponent ever joins, player1's funds are permanently locked. There is no `cancelMatch()`, `withdrawFromWaiting()`, or timeout mechanism. The `WAITING` state is a one-way door with no escape for player1.
**Impact:** CRITICAL (on-chain). Real funds (ETH entry fees) can be permanently locked if no opponent joins. This is a funds-at-risk bug.

---

### 11. ChronosBattle.sol: `_getMoveCost`, `_getMoveDelay`, `_getMoveDamage` use implicit default for last enum value

**File:** `contracts/ChronosBattle.sol:214-230`
**DOES:** Each function checks `FAST` and `MEDIUM` explicitly, then falls through to return `SLOW_*` values as default. There's no explicit `SLOW` check and no revert for invalid values.
**SHOULD:** While Solidity enums prevent invalid values at the ABI level, the pattern is fragile. If a new `MoveType` (e.g., `COUNTER`) is added to the enum later, it would silently receive `SLOW` costs/delays/damage instead of reverting. This is a logic correctness concern.
**Impact:** LOW (currently safe since enum is exhaustive). Becomes HIGH if enum is extended without updating these functions.

---

### 12. `useNPCDialogue` trigger always falls back gracefully, but unused `DialogueMoment` values exist

**File:** `src/ai/useNPCDialogue.ts:13-28`
**DOES:** All 15 `DialogueMoment` values have corresponding entries in every NPC's `DialogueBank`. The trigger function uses `bank[moment]` which covers all cases.
**SHOULD:** This is actually correct all moments CAN fire. However, checking call sites in `src/app/play/chronos/page.tsx` reveals that only a subset of moments are actually triggered during gameplay. The following moments are defined in the bank but may never be triggered depending on game flow:
- `big_move_incoming` (requires detecting opponent's move launch)
- `player_shielding` (requires detecting player shield activation)
- `coin_rich` (requires coin threshold check)
- `dominating` (requires HP advantage threshold)

Without seeing the full page.tsx trigger logic, these dialogue lines may be unreachable in practice.
**Impact:** LOW. The dialogue banks are complete, but some dialogue lines may never appear to the player if the triggering conditions aren't wired up in the game UI.

---

## Summary Table

| # | File | Issue | Impact |
|---|------|-------|--------|
| 1 | chronosStore.ts | `isPaused` checked but never set to `true` | HIGH |
| 2 | ChronosBridge.ts | 3 of 8 personality traits ignored (sociability, curiosity, loyalty) | MEDIUM |
| 3 | opponents.ts | `opponentToPersonality()` collapses 5 archetypes to 3 | LOW |
| 4 | chronos-npcs.ts | `getChronosNPCByName()` and `getChronosNPCsByDifficulty()` never called | LOW |
| 5 | opponents.ts vs chronos-npcs.ts | `'legendary'` difficulty mismatch between opponent and NPC profile types | MEDIUM |
| 6 | opponents.ts | Loot items describe gameplay effects that are never implemented | HIGH |
| 7 | PersonalitySystem.ts | Mood system + `modifyDecision()` completely bypassed in battles | MEDIUM |
| 8 | NPCFactory/DialogueSystem/EconomicAgent | Entire AI subsystem never used by game | LOW-MEDIUM |
| 9 | types/index.ts | `MatchStatus` type defined but never instantiated | LOW |
| 10 | ChronosBattle.sol | No cancel/timeout for WAITING matches, funds locked forever | CRITICAL |
| 11 | ChronosBattle.sol | Move helper functions use implicit default instead of explicit enum match | LOW |
| 12 | useNPCDialogue.ts | Some DialogueMoment values may never trigger from game UI | LOW |
