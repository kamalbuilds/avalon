# Chainlink VRF v2.5 — Fuji Status

## Current State
- **VRF Subscription**: ACTIVE on Fuji (v2.5)
- **Subscription ID**: PENDING — user screenshot shows truncated ID `242024...3666`, need full value
- **LootVRF Contract**: `0xc39d9Ec925d3AA6E67FE760630406696408724f8` (redeployed with `setSubscriptionId` + `onlyOwner`)
- **VRF Coordinator**: `0x2eD832bA664535E5AB023B4EaDAb0E4F6F4A8B16`
- **Key Hash**: `0x354d2f95da55398f44b7cff77da56283d9c6c829a4bdf1bbcaf2ad6a4d081f61` (200 gwei)
- **LINK Balance**: ~2 LINK remaining (low — needs top-up for production use)
- **Deployer/Owner**: `0x83F9d93ddfbaB266bf7c69110dC2F15e8fF3Ad4a`

## What's Needed

1. **Full VRF Subscription ID** — The truncated ID from the screenshot (`242024...3666`) needs to be provided in full
2. **Add LootVRF as consumer** — Add `0xc39d9Ec925d3AA6E67FE760630406696408724f8` as a consumer on the VRF subscription at https://vrf.chain.link
3. **Top up LINK** — Subscription shows "pending transactions due to low balance". Fund with more LINK tokens.

## Once Full Subscription ID is Available

1. Set `VRF_SUBSCRIPTION_ID=<full-id>` in `.env.local`
2. Run: `TS_NODE_PROJECT=tsconfig.hardhat.json npx hardhat run contracts/scripts/set-vrf-subscription.ts --network fuji`
3. Update `VRF_SUBSCRIPTION_ID` in `src/lib/constants.ts`

## Contract Changes (v2)
- Added `setSubscriptionId(uint256)` — owner-only function to update subscription ID post-deploy
- Added `onlyOwner` modifier to all admin functions (setLootTable, authorizeGame, revokeGame, setCallbackGasLimit, setRequestConfirmations)
- Owner is the deployer (`0x83F9d93ddfbaB266bf7c69110dC2F15e8fF3Ad4a`) via ConfirmedOwner inherited from VRFConsumerBaseV2Plus
