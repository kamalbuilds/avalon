# Chainlink VRF v2.5 Fuji Status

## Current State: LIVE
- **VRF Subscription**: ACTIVE on Fuji (v2.5)
- **Subscription ID**: `22817384940057307931907999457681689586478313577258851994725009272597594708292`
- **LootVRF Contract**: `0x00aabA40e80d9C64d650C0f99063754944C1F05E` (consumer added)
- **VRF Coordinator**: `0x5C210eF41CD1a72de73bF76eC39637bB0d3d7BEE`
- **Key Hash**: `0xc799bd1e3bd4d1a41cd4968997a4e03dfd2a3c7c04b695881138580163f42887`
- **Native Balance**: 0.3 AVAX (native payment)
- **Deployer/Owner**: `0x83F9d93ddfbaB266bf7c69110dC2F15e8fF3Ad4a`
- **Setup Date**: 2026-03-13

## Setup Complete
All steps automated:
1. Created VRF v2.5 subscription
2. Funded with 0.3 AVAX (native payment)
3. Redeployed LootVRF with correct coordinator (`0x5C210eF...`)
4. Added LootVRF as consumer
5. Set subscription ID on LootVRF contract
6. Updated .env.local, constants.ts, addresses.ts, deployed-addresses.json

## Previous Issue (Fixed)
Old coordinator address `0x2eD832bA664535E5AB023B4EaDAb0E4F6F4A8B16` had no code on Fuji.
This was the VRF v2 address, not v2.5. Fixed by finding the correct v2.5 coordinator.

## Transaction Hashes
- Create Subscription: `0xd9afb1026ccd7688fe1abb76a4e7e78e979cadfdcba7a19ed7d82100eabb1781`
- Fund Subscription: `0x2c41c768301379ecee6febfd863555010ac76d000c63489af112c64aa3a06d27`
- Redeploy LootVRF: see deployed-addresses.json timestamp
- Add Consumer: `0x51f0453a391013670055b414498ed7a093085d1ff4d43b71015d58c3cb1d79a0`
- Set Subscription ID: `0x14f0d3699769c60ea3a15d4f89b670aa207ef88acd3b501e2095e75d19107eeb`
