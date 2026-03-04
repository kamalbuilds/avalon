// ============================================================================
// Avalon — Integration Check
// Validates that the application is properly wired to on-chain contracts.
// Run via: import { runIntegrationCheck } from '@/lib/integration-check'
// ============================================================================

import { CONTRACT_ADDRESSES, FUJI_CHAIN_ID } from '@/lib/contracts/addresses';

interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
}

export async function runIntegrationCheck(): Promise<CheckResult[]> {
  const results: CheckResult[] = [];
  const ZERO = '0x0000000000000000000000000000000000000000';

  // 1. Correct chain
  results.push({
    name: 'Target chain is Fuji (43113)',
    passed: FUJI_CHAIN_ID === 43113,
    detail: `FUJI_CHAIN_ID = ${FUJI_CHAIN_ID}`,
  });

  // 2. Contract addresses are non-zero
  const addressChecks: [string, string][] = [
    ['gameFactory', CONTRACT_ADDRESSES.gameFactory],
    ['chronosBattle', CONTRACT_ADDRESSES.chronosBattle],
    ['agentRegistry', CONTRACT_ADDRESSES.agentRegistry],
    ['stablecoinEconomy', CONTRACT_ADDRESSES.stablecoinEconomy],
    ['lootVRF', CONTRACT_ADDRESSES.lootVRF],
  ];

  for (const [name, addr] of addressChecks) {
    const isZero = addr === ZERO;
    results.push({
      name: `Contract ${name} has non-zero address`,
      passed: !isZero,
      detail: isZero ? `${name} is zero address — not deployed` : `${name} = ${addr}`,
    });
  }

  // 3. USDT address
  const usdtZero = CONTRACT_ADDRESSES.usdt === ZERO;
  results.push({
    name: 'USDT address configured',
    passed: !usdtZero,
    detail: usdtZero
      ? 'USDT is zero — set NEXT_PUBLIC_USDT_ADDRESS env var'
      : `usdt = ${CONTRACT_ADDRESSES.usdt}`,
  });

  // 4. Log results
  console.log('\n========== AVALON INTEGRATION CHECK ==========');
  for (const r of results) {
    const icon = r.passed ? '\u2705' : '\u274C';
    console.log(`${icon} ${r.name}: ${r.detail}`);
  }
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  console.log(`\nResult: ${passed}/${total} checks passed`);
  console.log('================================================\n');

  return results;
}
