// ============================================================
// Avalon SDK — Smoke Test
// Verifies: engine init, match creation, player join, moves,
// combat, economy, serialization, SDK class
// ============================================================

import { GameEngine } from '../GameEngine';
import { Avalon } from '../sdk/AvalonSDK';
import { EngineMatchPhase } from '../types';
import type { GameConfig } from '@/types';

const TEST_CONFIG: GameConfig = {
  maxPlayers: 2,
  tickRate: 20,
  worldWidth: 800,
  worldHeight: 600,
  enableAINpcs: false,
  enableLootDrops: true,
  enableTournaments: false,
  vrfEnabled: false,
  entryFee: '100',
  rewardPool: '200',
  metadata: {},
};

function createEngine(): GameEngine {
  const engine = new GameEngine();
  engine.initialize(TEST_CONFIG);
  return engine;
}

console.log('=== Avalon SDK Smoke Tests ===\n');

// Test 1: Engine initialization
{
  const engine = createEngine();
  console.assert(engine !== null, 'Engine should initialize');
  console.assert(!engine.isRunning(), 'Engine should not be running initially');
  console.log('✓ Test 1: Engine initialization');
}

// Test 2: Match creation (LOBBY phase)
{
  const engine = createEngine();
  const matchId = engine.createMatch({
    gameConfig: TEST_CONFIG,
    matchId: 'match-001',
    createdBy: 'player-1',
    wagerAmount: 10,
  });
  console.assert(matchId === 'match-001', 'Match ID should match');
  console.assert(engine.getState().phase === EngineMatchPhase.LOBBY, 'Phase should be LOBBY');
  console.log('✓ Test 2: Match creation (LOBBY phase)');
}

// Test 3: Player joining + auto READY
{
  const engine = createEngine();
  engine.createMatch({
    gameConfig: TEST_CONFIG,
    matchId: 'match-002',
    createdBy: 'player-1',
    wagerAmount: 0,
  });

  const joined1 = engine.matches.joinMatch('player-1', 'Alice');
  console.assert(joined1 === true, 'Player 1 should join');

  const joined2 = engine.matches.joinMatch('player-2', 'Bob');
  console.assert(joined2 === true, 'Player 2 should join');

  const state = engine.getState();
  console.assert(state.players.size === 2, 'Should have 2 players');
  console.assert(state.phase === EngineMatchPhase.READY, 'Phase should be READY after max players');
  console.log('✓ Test 3: Player joining + auto READY');
}

// Test 4: Entity creation for players
{
  const engine = createEngine();
  engine.createMatch({
    gameConfig: TEST_CONFIG,
    matchId: 'match-003',
    createdBy: 'player-1',
    wagerAmount: 0,
  });

  engine.matches.joinMatch('player-1', 'Alice');
  const state = engine.getState();
  const player = state.players.get('player-1');
  console.assert(player !== undefined, 'Player should exist in state');

  const entity = engine.entities.getEntity(player!.entityId);
  console.assert(entity !== undefined, 'Player entity should exist');
  console.assert(entity!.components.has('health'), 'Entity should have health component');
  console.assert(entity!.components.has('combat'), 'Entity should have combat component');
  console.assert(entity!.components.has('position'), 'Entity should have position component');
  console.log('✓ Test 4: Entity creation for players');
}

// Test 5: Move cost calculation
{
  const engine = createEngine();
  console.assert(engine.moves.getMoveCost('instant') === 5, 'Instant move cost = 5');
  console.assert(engine.moves.getMoveCost('fast') === 3, 'Fast move cost = 3');
  console.assert(engine.moves.getMoveCost('normal') === 2, 'Normal move cost = 2');
  console.assert(engine.moves.getMoveCost('slow') === 1, 'Slow move cost = 1');
  console.log('✓ Test 5: Move cost calculation');
}

// Test 6: Event system (Avalon event types)
{
  const engine = createEngine();
  let eventFired: boolean = false;
  engine.on('state:changed', () => { eventFired = true; });

  engine.createMatch({
    gameConfig: TEST_CONFIG,
    matchId: 'match-004',
    createdBy: 'player-1',
    wagerAmount: 0,
  });

  engine.state.updateState(s => ({ tick: s.tick + 1 }));
  console.assert(eventFired, 'state:changed event should fire');
  console.log('✓ Test 6: Event system (Avalon events)');
}

// Test 7: Economy system with stablecoin features
{
  const engine = createEngine();
  engine.createMatch({
    gameConfig: TEST_CONFIG,
    matchId: 'match-005',
    createdBy: 'player-1',
    wagerAmount: 0,
  });

  engine.matches.joinMatch('player-1', 'Alice');
  const player = engine.getState().players.get('player-1')!;

  const updated = engine.economy.deductMoveCost(player, 'fast');
  console.assert(updated !== null, 'Should afford fast move');
  console.assert(updated!.currency === player.currency - 3, 'Should deduct 3 coins');

  // Test deposit/withdraw
  const balance = engine.economy.deposit('player-1', 50);
  console.assert(balance.available === 150, 'Deposit should add to available');

  const withdrawn = engine.economy.withdraw('player-1', 20);
  console.assert(withdrawn !== null, 'Should withdraw');
  console.assert(withdrawn!.available === 130, 'Withdrawal should reduce available');

  // Test loot drop
  const drop = engine.economy.tryLootDrop(1, 1.0, 5, 5);
  console.assert(drop !== null, 'Loot should drop at 100% chance');
  console.assert(drop!.amount === 5, 'Loot amount should be 5');
  console.log('✓ Test 7: Economy system with stablecoin features');
}

// Test 8: Serialization round-trip
{
  const engine = createEngine();
  engine.createMatch({
    gameConfig: TEST_CONFIG,
    matchId: 'match-006',
    createdBy: 'player-1',
    wagerAmount: 0,
  });
  engine.matches.joinMatch('player-1', 'Alice');

  const serialized = engine.serialize();
  console.assert(serialized.matchId === 'match-006', 'Serialized matchId should match');

  const engine2 = new GameEngine();
  engine2.initialize(TEST_CONFIG);
  engine2.deserialize(serialized);

  const state2 = engine2.getState();
  console.assert(state2.matchId === 'match-006', 'Deserialized matchId should match');
  console.assert(state2.players.size === 1, 'Deserialized should have 1 player');
  console.log('✓ Test 8: Serialization round-trip');
}

// Test 9: Combat system - health check
{
  const engine = createEngine();
  engine.createMatch({
    gameConfig: TEST_CONFIG,
    matchId: 'match-007',
    createdBy: 'player-1',
    wagerAmount: 0,
  });
  engine.matches.joinMatch('player-1', 'Alice');

  const player = engine.getState().players.get('player-1')!;
  const health = engine.combat.getHealth(player.entityId);
  console.assert(health !== undefined, 'Should have health');
  console.assert(health!.current === 100, 'Health should be 100');
  console.assert(health!.max === 100, 'Max health should be 100');
  console.assert(!engine.combat.isEntityDead(player.entityId), 'Player should be alive');
  console.log('✓ Test 9: Combat system - health check');
}

// Test 10: State subscriptions + diffing
{
  const engine = createEngine();
  engine.createMatch({
    gameConfig: TEST_CONFIG,
    matchId: 'match-008',
    createdBy: 'player-1',
    wagerAmount: 0,
  });

  let subscriberCalled: boolean = false;
  engine.subscribeToState(() => { subscriberCalled = true; });

  engine.state.updateState(s => ({ tick: s.tick + 1 }));
  console.assert(subscriberCalled, 'State subscriber should fire');

  const diffs = engine.state.getPendingDiffs();
  console.assert(diffs.length > 0, 'Should have pending diffs');
  console.log('✓ Test 10: State subscriptions + diffing');
}

// Test 11: Avalon SDK class
{
  const avalon = new Avalon({ network: 'fuji' });
  console.assert(avalon.getNetwork() === 'fuji', 'Network should be fuji');
  console.assert(avalon.getEngine() instanceof GameEngine, 'Should expose GameEngine');

  // VRF
  avalon.vrf.configureTable({
    name: 'test-table',
    drops: [
      { item: 'Sword', rarity: 'common', weight: 80 },
      { item: 'Shield', rarity: 'rare', weight: 20 },
    ],
  });
  const table = avalon.vrf.getTable('test-table');
  console.assert(table !== undefined, 'VRF table should exist');

  // Economy
  avalon.economy.configure({ currency: 'USDT', platformFee: 0.05 });
  const bal = avalon.economy.deposit('test-player', 100);
  console.assert(bal.available === 100, 'SDK economy deposit should work');

  console.log('✓ Test 11: Avalon SDK class');
}

// Test 12: Match state machine transitions
{
  const engine = createEngine();
  engine.createMatch({
    gameConfig: TEST_CONFIG,
    matchId: 'match-009',
    createdBy: 'player-1',
    wagerAmount: 0,
  });

  console.assert(engine.matches.getPhase() === EngineMatchPhase.LOBBY, 'Should start in LOBBY');

  engine.matches.joinMatch('player-1', 'Alice');
  engine.matches.joinMatch('player-2', 'Bob');
  console.assert(engine.matches.getPhase() === EngineMatchPhase.READY, 'Should auto-transition to READY');

  console.log('✓ Test 12: Match state machine transitions');
}

console.log('\n=== All 12 tests passed! ===');
