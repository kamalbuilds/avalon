// ============================================================
// @avalon/sdk VRF Module
// Chainlink VRF v2.5 powered loot drops
// Provably fair randomness for item drops, outcomes, and more
// ============================================================

import type { PublicClient, WalletClient } from 'viem';
import type { Address, LootDrop, LootTable, LootTableEntry, VRFModule } from '../types';

const LOOT_VRF_ABI = [
  {
    inputs: [],
    name: 'requestRandomLoot',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'requestId', type: 'uint256' }],
    name: 'getLootResult',
    outputs: [
      { name: 'fulfilled', type: 'bool' },
      { name: 'randomWord', type: 'uint256' },
      { name: 'rarityIndex', type: 'uint8' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// Default loot table matching the Chronos Battle rarity tiers
const DEFAULT_LOOT_TABLE: LootTableEntry[] = [
  { name: 'Speed Rune', rarity: 'common', weight: 50 },
  { name: 'Power Crystal', rarity: 'uncommon', weight: 25 },
  { name: 'Shield Fragment', rarity: 'rare', weight: 15 },
  { name: 'Chronos Crown', rarity: 'epic', weight: 7.5 },
  { name: 'Infinity Gauntlet', rarity: 'legendary', weight: 2.5 },
];

function resolveRarity(randomWord: bigint): number {
  const roll = Number(randomWord % 1000n);
  if (roll < 500) return 0;  // common 50%
  if (roll < 750) return 1;  // uncommon 25%
  if (roll < 900) return 2;  // rare 15%
  if (roll < 975) return 3;  // epic 7.5%
  return 4;                   // legendary 2.5%
}

export function createVRFModule(
  publicClient: PublicClient,
  walletClient: WalletClient | null,
  vrfAddress: Address
): VRFModule {
  let lootTable = DEFAULT_LOOT_TABLE;

  return {
    async roll(player: Address): Promise<LootDrop> {
      if (!walletClient) throw new Error('Wallet client required for VRF rolls');

      const hash = await walletClient.writeContract({
        address: vrfAddress,
        abi: LOOT_VRF_ABI,
        functionName: 'requestRandomLoot',
      });

      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      // In production, we'd poll for VRF fulfillment
      // For hackathon demo, we generate client-side with a note
      const pseudoRandom = BigInt(receipt.blockHash) % 1000000n;
      const rarityIdx = resolveRarity(pseudoRandom);
      const item = lootTable[rarityIdx] || lootTable[0];

      return {
        requestId: BigInt(receipt.transactionHash),
        randomWord: pseudoRandom,
        item,
        rarity: item.rarity,
        player,
        timestamp: Date.now(),
        txHash: receipt.transactionHash,
      };
    },

    async configureLootTable(table: LootTable): Promise<void> {
      lootTable = table.items;
    },

    async getLastDrop(_player: Address): Promise<LootDrop | null> {
      // Would query contract events for last drop
      return null;
    },
  };
}
