// ============================================================
// @avalon/sdk Agents Module
// ERC-8004 Agent Registry: create, query, and manage AI NPCs
// Each agent gets an on-chain identity, wallet, and reputation
// ============================================================

import { type PublicClient, type WalletClient, getContract } from 'viem';
import type { Address, AgentConfig, AgentIdentity, AgentsModule } from '../types';

// Minimal ABI for AgentRegistry read operations
const AGENT_REGISTRY_ABI = [
  {
    inputs: [],
    name: 'totalAgents',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'getAgent',
    outputs: [
      { name: 'name', type: 'string' },
      { name: 'walletAddress', type: 'address' },
      { name: 'reputation', type: 'uint256' },
      { name: 'behaviorHash', type: 'bytes32' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'ownerOf',
    outputs: [{ type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'name', type: 'string' },
      { name: 'walletAddr', type: 'address' },
      { name: 'behaviorHash', type: 'bytes32' },
    ],
    name: 'registerAgent',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'tokenId', type: 'uint256' },
      { name: 'delta', type: 'int256' },
    ],
    name: 'updateReputation',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

export function createAgentsModule(
  publicClient: PublicClient,
  walletClient: WalletClient | null,
  registryAddress: Address
): AgentsModule {
  return {
    async create(config: AgentConfig): Promise<AgentIdentity> {
      if (!walletClient) throw new Error('Wallet client required to create agents');

      const behaviorHash = `0x${'0'.repeat(64)}` as `0x${string}`;

      const hash = await walletClient.writeContract({
        address: registryAddress,
        abi: AGENT_REGISTRY_ABI,
        functionName: 'registerAgent',
        args: [
          config.name,
          config.walletAddress || walletClient.account!.address,
          behaviorHash,
        ],
      });

      // Wait for confirmation
      await publicClient.waitForTransactionReceipt({ hash });

      const total = await publicClient.readContract({
        address: registryAddress,
        abi: AGENT_REGISTRY_ABI,
        functionName: 'totalAgents',
      });

      return {
        tokenId: total as bigint,
        name: config.name,
        archetype: config.archetype,
        walletAddress: config.walletAddress || walletClient.account!.address,
        reputation: 5000,
        behaviorHash: behaviorHash,
        owner: walletClient.account!.address,
      };
    },

    async get(tokenId: bigint): Promise<AgentIdentity | null> {
      try {
        const [name, walletAddress, reputation, behaviorHash] = await publicClient.readContract({
          address: registryAddress,
          abi: AGENT_REGISTRY_ABI,
          functionName: 'getAgent',
          args: [tokenId],
        }) as [string, Address, bigint, string];

        const owner = await publicClient.readContract({
          address: registryAddress,
          abi: AGENT_REGISTRY_ABI,
          functionName: 'ownerOf',
          args: [tokenId],
        }) as Address;

        return {
          tokenId,
          name,
          archetype: 'warrior', // Default, would be stored in metadata
          walletAddress,
          reputation: Number(reputation),
          behaviorHash,
          owner,
        };
      } catch {
        return null;
      }
    },

    async totalAgents(): Promise<number> {
      const total = await publicClient.readContract({
        address: registryAddress,
        abi: AGENT_REGISTRY_ABI,
        functionName: 'totalAgents',
      }) as bigint;
      return Number(total);
    },

    async updateReputation(tokenId: bigint, delta: number): Promise<void> {
      if (!walletClient) throw new Error('Wallet client required');
      const hash = await walletClient.writeContract({
        address: registryAddress,
        abi: AGENT_REGISTRY_ABI,
        functionName: 'updateReputation',
        args: [tokenId, BigInt(delta)],
      });
      await publicClient.waitForTransactionReceipt({ hash });
    },
  };
}
