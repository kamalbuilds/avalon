// ============================================================
// @avalon/sdk Economy Module
// Stablecoin economies powered by Tether WDK
// Entry fees, prize pools, platform revenue splits
// ============================================================

import type { PublicClient, WalletClient } from 'viem';
import type { Address, EconomyConfig, EconomyStats, EconomyModule } from '../types';

const STABLECOIN_ECONOMY_ABI = [
  {
    inputs: [{ name: 'token', type: 'address' }],
    name: 'isAcceptedToken',
    outputs: [{ type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalDeposits',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalPrizesDistributed',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'platformFeeBps',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'deposit',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

export function createEconomyModule(
  publicClient: PublicClient,
  walletClient: WalletClient | null,
  economyAddress: Address
): EconomyModule {
  return {
    async configure(_config: EconomyConfig): Promise<void> {
      // Would call setConfig on the contract
      // Requires owner access
    },

    async stats(): Promise<EconomyStats> {
      const [totalDeposits, totalPrizes, feeBps] = await Promise.all([
        publicClient.readContract({
          address: economyAddress,
          abi: STABLECOIN_ECONOMY_ABI,
          functionName: 'totalDeposits',
        }),
        publicClient.readContract({
          address: economyAddress,
          abi: STABLECOIN_ECONOMY_ABI,
          functionName: 'totalPrizesDistributed',
        }),
        publicClient.readContract({
          address: economyAddress,
          abi: STABLECOIN_ECONOMY_ABI,
          functionName: 'platformFeeBps',
        }),
      ]);

      return {
        totalDeposits: totalDeposits as bigint,
        totalPrizes: totalPrizes as bigint,
        totalFees: ((totalDeposits as bigint) * (feeBps as bigint)) / 10000n,
        acceptedTokens: [],
      };
    },

    async deposit(player: Address, amount: bigint): Promise<string> {
      if (!walletClient) throw new Error('Wallet client required');
      // Would need token approval first, then deposit
      throw new Error('Use approve() on the token contract first, then call deposit');
    },

    async isTokenAccepted(token: Address): Promise<boolean> {
      const accepted = await publicClient.readContract({
        address: economyAddress,
        abi: STABLECOIN_ECONOMY_ABI,
        functionName: 'isAcceptedToken',
        args: [token],
      });
      return accepted as boolean;
    },
  };
}
