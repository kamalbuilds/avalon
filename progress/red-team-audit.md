# Red Team Security Audit - AvaForge

**Auditor:** Red Team Agent (adversarial security)
**Date:** 2026-03-15
**Scope:** LootVRF.sol, ChronosBattle.sol, StablecoinEconomy.sol
**Overall Grade: C+** (one high-severity, one medium, one low-medium)

---

## Finding 1: LootVRF.sol - Modifier Privilege Escalation

**Severity: HIGH**
**File:** `contracts/LootVRF.sol:74-77`

```solidity
modifier onlyAuthorizedGame() {
    require(authorizedGames[msg.sender] || msg.sender == address(s_vrfCoordinator), "LootVRF: not authorized");
    _;
}
```

**Issue:** The `onlyAuthorizedGame` modifier grants the VRF Coordinator address permission to call `requestRandomLoot()`. This is incorrect. The VRF Coordinator only needs to call `rawFulfillRandomWords()` (handled internally by the `VRFConsumerBaseV2Plus` base class, which already validates `msg.sender == s_vrfCoordinator` in its own `rawFulfillRandomWords` function).

**Impact:** If the VRF Coordinator contract is compromised, upgraded, or has any unexpected call path, it can invoke `requestRandomLoot()` to generate arbitrary loot drops for any player/game. This bypasses the intended authorization model where only registered game contracts should trigger loot requests.

**Proof of concept:**
1. VRF Coordinator (or anyone who can make it delegate-call) calls `requestRandomLoot(gameId, attackerAddress)`
2. The modifier passes because `msg.sender == address(s_vrfCoordinator)`
3. A VRF request is created for the attacker with no game contract involvement
4. When fulfilled, the attacker receives free loot

**Fix:** Remove the coordinator check from the modifier. It serves no purpose here:
```solidity
modifier onlyAuthorizedGame() {
    require(authorizedGames[msg.sender], "LootVRF: not authorized");
    _;
}
```

**Risk assessment:** The practical exploitability depends on whether the VRF Coordinator has external call paths that could be abused. On Chainlink's production coordinators, this is unlikely but not impossible. The fix is trivial and should be applied regardless - defense in depth.

---

## Finding 2: ChronosBattle.sol - ACTIVE Match Fund Lock (No Timeout)

**Severity: HIGH**
**File:** `contracts/ChronosBattle.sol`

**Issue:** `cancelMatch()` (line 311) only handles `MatchState.WAITING`. Once a match transitions to `ACTIVE` (when player2 joins at line 135), there is **no timeout or forfeit mechanism**. If both players stop submitting moves, or if one player abandons mid-game, the match stays `ACTIVE` forever with both players' entry fees permanently locked in the contract.

**Scenarios where funds are locked:**
1. **Player abandonment:** Player2 joins, then both players walk away. Match is ACTIVE with `prizePool` locked permanently.
2. **Griefing:** Player2 joins and deliberately never submits moves. Player1 cannot force a resolution.
3. **Off-chain coordination failure:** Frontend goes down, players lose access. No on-chain recovery path.
4. **Stalemate:** Both players have health > 0 but no coins to submit moves and the block-based coin income isn't enough to afford any move (unlikely with current constants but possible with modified parameters).

**What exists:** `cancelMatch()` at line 311 handles WAITING matches after `CANCEL_TIMEOUT_BLOCKS=100`. This is good but insufficient.

**What's missing:** A `claimVictoryByTimeout()` or `forfeitActiveMatch()` function for ACTIVE matches. Suggested approach:
```solidity
uint256 public constant ACTIVE_TIMEOUT_BLOCKS = 1000; // ~30 min on Avalanche

function claimVictoryByTimeout(uint256 matchId) external nonReentrant {
    Match storage m = matches[matchId];
    require(m.state == MatchState.ACTIVE, "not active");
    require(msg.sender == m.player1 || msg.sender == m.player2, "not a player");

    // Require significant inactivity
    // Could track lastMoveBlock per player for precision
    require(block.number >= m.startBlock + ACTIVE_TIMEOUT_BLOCKS, "timeout not reached");

    // Award to the player who is claiming (they're still engaged)
    _endMatch(matchId, msg.sender);
}
```

**Note:** A more sophisticated version would track `lastMoveBlock` per player and award victory to the player who moved most recently.

---

## Finding 3: StablecoinEconomy.sol - tokenList Stale Data

**Severity: MEDIUM-LOW**
**File:** `contracts/StablecoinEconomy.sol:76-79`

```solidity
function removeToken(address token) external onlyOwner {
    require(acceptedTokens[token], "StablecoinEconomy: not accepted");
    acceptedTokens[token] = false;
    emit TokenRemoved(token);
}
```

**Issue:** `removeToken()` sets `acceptedTokens[token] = false` but **does not remove the token from the `tokenList` array** (line 31). The `getAcceptedTokens()` view function (line 210) returns the raw `tokenList`, which will include removed tokens.

**Impact:**
- **UI/Integration confusion:** Any frontend or integration calling `getAcceptedTokens()` will display removed tokens as accepted, leading users to attempt transactions that will revert.
- **No fund loss:** The `acceptedTokens` mapping is the actual gate for `payEntryFee()` and `purchase()`, so removed tokens correctly cannot be used. The issue is purely data staleness.
- **Gas waste:** Over time, `tokenList` grows monotonically. If tokens are added and removed repeatedly, the array bloats, increasing gas costs for `getAcceptedTokens()`.

**Fix options:**

Option A (simple - filter on read):
```solidity
function getAcceptedTokens() external view returns (address[] memory) {
    uint256 count = 0;
    for (uint256 i = 0; i < tokenList.length; i++) {
        if (acceptedTokens[tokenList[i]]) count++;
    }
    address[] memory result = new address[](count);
    uint256 j = 0;
    for (uint256 i = 0; i < tokenList.length; i++) {
        if (acceptedTokens[tokenList[i]]) result[j++] = tokenList[i];
    }
    return result;
}
```

Option B (swap-and-pop in removeToken):
```solidity
function removeToken(address token) external onlyOwner {
    require(acceptedTokens[token], "StablecoinEconomy: not accepted");
    acceptedTokens[token] = false;

    for (uint256 i = 0; i < tokenList.length; i++) {
        if (tokenList[i] == token) {
            tokenList[i] = tokenList[tokenList.length - 1];
            tokenList.pop();
            break;
        }
    }
    emit TokenRemoved(token);
}
```

---

## Summary

| # | Contract | Issue | Severity | Status |
|---|----------|-------|----------|--------|
| 1 | LootVRF.sol:74-77 | VRF Coordinator bypass in onlyAuthorizedGame modifier | HIGH | Needs fix |
| 2 | ChronosBattle.sol | No timeout/forfeit for ACTIVE matches, funds locked permanently | HIGH | Needs fix |
| 3 | StablecoinEconomy.sol:76-79 | tokenList not cleaned on removeToken(), stale data in getAcceptedTokens() | MEDIUM-LOW | Needs fix |

**Recommendation:** Fix #1 and #2 before any mainnet deployment. #1 is a one-line fix. #2 requires a new function but the pattern is straightforward. #3 is lower priority but should be cleaned up.
