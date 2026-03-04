import { CHAIN_IDS, RPC_URLS } from './constants';
import type { ChainConfig } from '@/types';

// ---------------------------------------------------------------------------
// Environment Configuration
// ---------------------------------------------------------------------------

export const env = {
  // App
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',

  // Chain
  NETWORK: (process.env.NEXT_PUBLIC_NETWORK ?? 'fuji') as 'mainnet' | 'fuji',

  // Wallet Connect
  WALLET_CONNECT_PROJECT_ID: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID ?? '',

  // API Keys (server-side only)
  CHAINLINK_VRF_SUBSCRIPTION_ID: process.env.CHAINLINK_VRF_SUBSCRIPTION_ID ?? '',
  TETHER_WDK_API_KEY: process.env.TETHER_WDK_API_KEY ?? '',

  // AI NPC
  AI_MODEL_ENDPOINT: process.env.AI_MODEL_ENDPOINT ?? '',
  AI_MODEL_API_KEY: process.env.AI_MODEL_API_KEY ?? '',

  // Storage
  IPFS_GATEWAY: process.env.NEXT_PUBLIC_IPFS_GATEWAY ?? 'https://ipfs.io/ipfs/',
  IPFS_API_URL: process.env.IPFS_API_URL ?? '',
  IPFS_API_KEY: process.env.IPFS_API_KEY ?? '',
} as const;

// ---------------------------------------------------------------------------
// Chain Configuration
// ---------------------------------------------------------------------------

export const chainConfig: ChainConfig = {
  avalancheMainnet: {
    rpcUrl: RPC_URLS.AVALANCHE_MAINNET,
    chainId: CHAIN_IDS.AVALANCHE_MAINNET,
  },
  avalancheFuji: {
    rpcUrl: RPC_URLS.AVALANCHE_FUJI,
    chainId: CHAIN_IDS.AVALANCHE_FUJI,
  },
};

export function getActiveChain() {
  return env.NETWORK === 'mainnet'
    ? chainConfig.avalancheMainnet
    : chainConfig.avalancheFuji;
}

export function isProduction() {
  return env.NODE_ENV === 'production';
}
