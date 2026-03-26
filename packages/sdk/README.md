# @avalon/sdk

Blockchain Gaming SDK for Avalanche. Give your game its own L1 chain, AI NPCs, provably fair loot, and stablecoin economies.

## Quickstart

```typescript
import { Avalon } from '@avalon/sdk';

const avalon = new Avalon({ network: 'fuji' });

// 1. Deploy a per-game L1 chain
const chain = await avalon.l1.deploy({ name: 'My RPG', blockTime: 2 });
console.log(`Chain live at ${chain.rpcUrl}`);

// 2. Create an AI NPC (ERC-8004 identity)
const npc = await avalon.agents.create({
  name: 'Iron Merchant',
  archetype: 'merchant',
});
console.log(`NPC registered: token #${npc.tokenId}`);

// 3. Roll for loot (Chainlink VRF v2.5)
const loot = await avalon.vrf.roll(playerAddress);
console.log(`Dropped: ${loot.item.name} (${loot.rarity})`);

// 4. Check economy stats
const stats = await avalon.economy.stats();
console.log(`Total deposits: ${stats.totalDeposits}`);
```

## Modules

### `avalon.l1` - Per-Game L1 Chains
Deploy dedicated Avalanche L1 chains for your game with custom block time, gas tokens, and validator sets.

### `avalon.agents` - ERC-8004 AI NPCs
Create autonomous NPCs with on-chain identity, wallets, reputation scores, and personality-driven behavior.

### `avalon.vrf` - Chainlink VRF Loot
Provably fair loot drops using Chainlink VRF v2.5. Players can verify every drop on-chain.

### `avalon.economy` - Stablecoin Economy
USDT entry fees, prize pools, and platform revenue splits via the Tether WDK integration.

## Deployed Contracts (Fuji)

| Contract | Address |
|----------|---------|
| GameFactory | `0x3f7FC08150709C22F1741A230351B59c36bCCc8a` |
| AgentRegistry | `0x2636Ed9F3Aa33589810BE07B48ad9Be79de3Fd7F` |
| LootVRF | `0x00aabA40e80d9C64d650C0f99063754944C1F05E` |
| StablecoinEconomy | `0x95B4b7d7a23d954BF92FeDF2e00A374E22208D69` |

## Requirements

- `viem` >= 2.0.0

## License

MIT
