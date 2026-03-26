// ============================================================
// @avalon/sdk L1 Module
// Deploy and manage per-game Avalanche L1 chains
// Each game gets its own chain with custom parameters
// ============================================================

import type { PublicClient } from 'viem';
import type { L1Config, L1Status, L1Module } from '../types';

/**
 * L1 Module: Deploy per-game Avalanche L1 subnets
 *
 * In production, this calls the Avalanche Platform Chain (P-Chain) APIs
 * to create a new subnet and blockchain. For the hackathon MVP, this
 * returns a simulated status while the real L1 is the Fuji C-Chain
 * where our contracts are deployed.
 *
 * Architecture: Each game gets its own L1 for isolated block space,
 * custom gas tokens, and independent validator sets.
 */
export function createL1Module(publicClient: PublicClient): L1Module {
  let currentL1: L1Status | null = null;

  return {
    async deploy(config: L1Config): Promise<L1Status> {
      // In production: P-Chain createSubnet + createBlockchain API calls
      // For Fuji testnet: simulate L1 status with real chain data
      const block = await publicClient.getBlockNumber();

      currentL1 = {
        chainId: 43113 + Math.floor(Math.random() * 10000),
        name: config.name,
        blockHeight: Number(block),
        isHealthy: true,
        rpcUrl: `https://${config.name.toLowerCase().replace(/\s+/g, '-')}.avax.network/rpc`,
        explorerUrl: `https://explorer.avax.network/subnet/${config.name.toLowerCase().replace(/\s+/g, '-')}`,
      };

      return currentL1;
    },

    async status(): Promise<L1Status> {
      if (!currentL1) {
        const block = await publicClient.getBlockNumber();
        return {
          chainId: 43113,
          name: 'Avalanche Fuji',
          blockHeight: Number(block),
          isHealthy: true,
          rpcUrl: 'https://api.avax-test.network/ext/bc/C/rpc',
          explorerUrl: 'https://testnet.snowtrace.io',
        };
      }
      // Update block height
      const block = await publicClient.getBlockNumber();
      currentL1.blockHeight = Number(block);
      return currentL1;
    },
  };
}
