// ============================================================
// @avalon/sdk Quickstart Example
// 20 lines to integrate blockchain into your game
// ============================================================

import { Avalon } from '../packages/sdk/src';

async function main() {
  // 1. Initialize the SDK (connects to Avalanche Fuji testnet)
  const avalon = new Avalon({ network: 'fuji' });

  // 2. Check current block (proves connection works)
  const block = await avalon.getBlockNumber();
  console.log(`Connected to Avalanche Fuji at block ${block}`);

  // 3. Check how many AI agents are registered
  const agentCount = await avalon.agents.totalAgents();
  console.log(`${agentCount} AI agents registered on-chain`);

  // 4. Query the stablecoin economy
  const stats = await avalon.economy.stats();
  console.log(`Economy: ${stats.totalDeposits} total deposits, ${stats.totalPrizes} prizes paid`);

  // 5. Check L1 chain status
  const l1 = await avalon.l1.status();
  console.log(`L1: ${l1.name} (chain ${l1.chainId}) at block ${l1.blockHeight}`);

  console.log('\nAvalon SDK initialized. Ready to build your game.');
}

main().catch(console.error);
