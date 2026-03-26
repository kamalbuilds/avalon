// ============================================================
// @avalon/sdk Contract Addresses
// Deployed on Avalanche Fuji Testnet (Chain ID: 43113)
// ============================================================

import type { Address } from '../types';

export const FUJI_ADDRESSES = {
  gameFactory: '0x3f7FC08150709C22F1741A230351B59c36bCCc8a' as Address,
  chronosBattle: '0x5BFb2b211d20FC6F811f869184546910FB45985e' as Address,
  agentRegistry: '0x2636Ed9F3Aa33589810BE07B48ad9Be79de3Fd7F' as Address,
  stablecoinEconomy: '0x95B4b7d7a23d954BF92FeDF2e00A374E22208D69' as Address,
  lootVRF: '0x00aabA40e80d9C64d650C0f99063754944C1F05E' as Address,
} as const;

export const CHAIN_CONFIG = {
  fuji: {
    chainId: 43113,
    name: 'Avalanche Fuji',
    rpcUrl: 'https://api.avax-test.network/ext/bc/C/rpc',
    explorerUrl: 'https://testnet.snowtrace.io',
    addresses: FUJI_ADDRESSES,
  },
  mainnet: {
    chainId: 43114,
    name: 'Avalanche C-Chain',
    rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
    explorerUrl: 'https://snowtrace.io',
    addresses: FUJI_ADDRESSES, // placeholder
  },
} as const;
