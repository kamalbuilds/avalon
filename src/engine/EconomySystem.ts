// ============================================================
// Avalon SDK Economy System
// Stablecoin economy: deposits, withdrawals, balances,
// prize pools, platform fees, loot drops.
// Wired to StablecoinEconomy contract types.
// ============================================================

import { EventEmitter } from './EventEmitter';
import type {
  PlayerId, EnginePlayerState, EngineEconomyState,
  EngineLootDrop, PlayerBalance,
} from './types';
import {
  MOVE_COSTS, DEFAULT_PLATFORM_FEE, DEFAULT_CREATOR_FEE,
} from './types';
import type { MoveSpeed, StablecoinType, Address } from '@/types';

let nextLootId = 0;

export class EconomySystem {
  private economy: EngineEconomyState;
  private events: EventEmitter;

  constructor(events: EventEmitter, config?: {
    initialPrizePool?: number;
    currency?: StablecoinType;
    platformFee?: number;
    creatorFee?: number;
  }) {
    this.events = events;
    this.economy = {
      prizePool: config?.initialPrizePool ?? 0,
      totalWagered: 0,
      platformFee: config?.platformFee ?? DEFAULT_PLATFORM_FEE,
      creatorFee: config?.creatorFee ?? DEFAULT_CREATOR_FEE,
      currency: config?.currency ?? 'USDT',
      lootDrops: [],
      playerBalances: new Map(),
    };
  }

  getEconomy(): EngineEconomyState {
    return {
      ...this.economy,
      playerBalances: new Map(this.economy.playerBalances),
      lootDrops: [...this.economy.lootDrops],
    };
  }

  // --- SDK API (matches docs: avalon.economy.*) ---

  /** avalon.economy.deposit(playerId, amount) Add funds for a player */
  deposit(playerId: PlayerId, amount: number, address?: Address): PlayerBalance {
    const existing = this.economy.playerBalances.get(playerId) ?? {
      playerId, address, deposited: 0, withdrawn: 0, inGame: 0, available: 0,
    };

    const updated: PlayerBalance = {
      ...existing,
      address: address ?? existing.address,
      deposited: existing.deposited + amount,
      available: existing.available + amount,
    };

    this.economy = {
      ...this.economy,
      playerBalances: new Map(this.economy.playerBalances).set(playerId, updated),
    };

    this.events.emit('economy:deposit', { playerId, amount, currency: this.economy.currency, balance: updated });
    return updated;
  }

  /** avalon.economy.withdraw(playerId, amount) Withdraw available funds */
  withdraw(playerId: PlayerId, amount: number): PlayerBalance | null {
    const balance = this.economy.playerBalances.get(playerId);
    if (!balance || balance.available < amount) return null;

    const updated: PlayerBalance = {
      ...balance,
      withdrawn: balance.withdrawn + amount,
      available: balance.available - amount,
    };

    this.economy = {
      ...this.economy,
      playerBalances: new Map(this.economy.playerBalances).set(playerId, updated),
    };

    this.events.emit('economy:withdraw', { playerId, amount, currency: this.economy.currency, balance: updated });
    return updated;
  }

  /** avalon.economy.getBalance(playerId) Get player balance */
  getBalance(playerId: PlayerId): PlayerBalance | undefined {
    return this.economy.playerBalances.get(playerId);
  }

  /** avalon.economy.transfer(from, to, amount) Transfer between players */
  transfer(fromId: PlayerId, toId: PlayerId, amount: number): boolean {
    const from = this.economy.playerBalances.get(fromId);
    if (!from || from.available < amount) return false;

    const to = this.economy.playerBalances.get(toId) ?? {
      playerId: toId, deposited: 0, withdrawn: 0, inGame: 0, available: 0,
    };

    const updatedFrom: PlayerBalance = { ...from, available: from.available - amount };
    const updatedTo: PlayerBalance = { ...to, available: to.available + amount };

    const balances = new Map(this.economy.playerBalances);
    balances.set(fromId, updatedFrom);
    balances.set(toId, updatedTo);
    this.economy = { ...this.economy, playerBalances: balances };

    this.events.emit('economy:transfer', { from: fromId, to: toId, amount, currency: this.economy.currency });
    return true;
  }

  /** avalon.economy.distributePrize(matchId) Distribute prize pool with fee splits */
  distributePrize(
    matchId: string,
    winnerId: PlayerId,
    player: EnginePlayerState,
  ): { player: EnginePlayerState; platformCut: number; creatorCut: number; winnerPrize: number } {
    const pool = this.economy.prizePool;

    // Revenue split (basis points / 10000)
    const platformCut = Math.floor(pool * this.economy.platformFee / 10000);
    const creatorCut = Math.floor(pool * this.economy.creatorFee / 10000);
    const winnerPrize = pool - platformCut - creatorCut;

    // Credit winner
    const balance = this.economy.playerBalances.get(winnerId);
    if (balance) {
      const updated: PlayerBalance = { ...balance, available: balance.available + winnerPrize, inGame: Math.max(0, balance.inGame - winnerPrize) };
      this.economy = {
        ...this.economy,
        prizePool: 0,
        playerBalances: new Map(this.economy.playerBalances).set(winnerId, updated),
      };
    } else {
      this.economy = { ...this.economy, prizePool: 0 };
    }

    const updatedPlayer = { ...player, currency: player.currency + winnerPrize };

    this.events.emit('economy:prizeDistributed', {
      matchId, winnerId, winnerPrize, platformCut, creatorCut, currency: this.economy.currency,
    });

    return { player: updatedPlayer, platformCut, creatorCut, winnerPrize };
  }

  // --- Move Costs ---

  deductMoveCost(player: EnginePlayerState, speed: MoveSpeed): EnginePlayerState | null {
    const cost = MOVE_COSTS[speed];
    if (player.currency < cost) return null;

    const updated = { ...player, currency: player.currency - cost };
    this.economy = { ...this.economy, totalWagered: this.economy.totalWagered + cost };
    this.events.emit('economy:transfer', {
      type: 'move_cost', playerId: player.id, amount: -cost, currency: this.economy.currency,
    });
    return updated;
  }

  addCurrency(player: EnginePlayerState, amount: number, reason: string): EnginePlayerState {
    const updated = { ...player, currency: player.currency + amount };
    this.events.emit('economy:transfer', {
      type: reason, playerId: player.id, amount, currency: this.economy.currency,
    });
    return updated;
  }

  // --- Prize Pool ---

  addToPrizePool(amount: number): void {
    this.economy = { ...this.economy, prizePool: this.economy.prizePool + amount };
  }

  // --- Wager ---

  recordWager(player: EnginePlayerState, amount: number): EnginePlayerState | null {
    if (player.currency < amount) return null;

    const updated = { ...player, currency: player.currency - amount };

    // Lock funds in player balance
    const balance = this.economy.playerBalances.get(player.id);
    if (balance) {
      const updatedBalance: PlayerBalance = {
        ...balance,
        available: balance.available - amount,
        inGame: balance.inGame + amount,
      };
      this.economy = {
        ...this.economy,
        prizePool: this.economy.prizePool + amount,
        totalWagered: this.economy.totalWagered + amount,
        playerBalances: new Map(this.economy.playerBalances).set(player.id, updatedBalance),
      };
    } else {
      this.economy = {
        ...this.economy,
        prizePool: this.economy.prizePool + amount,
        totalWagered: this.economy.totalWagered + amount,
      };
    }

    this.events.emit('economy:transfer', {
      type: 'wager', playerId: player.id, amount: -amount, currency: this.economy.currency,
    });
    return updated;
  }

  // --- Loot Drops ---

  tryLootDrop(blockNumber: number, dropChance: number, minAmount: number = 1, maxAmount: number = 10): EngineLootDrop | null {
    if (Math.random() > dropChance) return null;

    const amount = minAmount + Math.floor(Math.random() * (maxAmount - minAmount + 1));
    const drop: EngineLootDrop = {
      id: `loot_${++nextLootId}`,
      amount,
      claimedBy: null,
      blockNumber,
    };

    this.economy = {
      ...this.economy,
      lootDrops: [...this.economy.lootDrops, drop],
    };
    this.events.emit('loot:dropped', drop);
    return drop;
  }

  claimLoot(lootId: string, playerId: PlayerId, player: EnginePlayerState): { player: EnginePlayerState; drop: EngineLootDrop } | null {
    const dropIndex = this.economy.lootDrops.findIndex(d => d.id === lootId && d.claimedBy === null);
    if (dropIndex === -1) return null;

    const drop = { ...this.economy.lootDrops[dropIndex], claimedBy: playerId };
    const newDrops = [...this.economy.lootDrops];
    newDrops[dropIndex] = drop;

    this.economy = { ...this.economy, lootDrops: newDrops };
    const updatedPlayer = this.addCurrency(player, drop.amount, 'loot_claim');

    this.events.emit('loot:claimed', { lootId, playerId, amount: drop.amount });
    return { player: updatedPlayer, drop };
  }

  getUnclaimedLoot(): EngineLootDrop[] {
    return this.economy.lootDrops.filter(d => d.claimedBy === null);
  }

  // --- Configuration ---

  configure(opts: { currency?: StablecoinType; platformFee?: number; creatorFee?: number }): void {
    this.economy = {
      ...this.economy,
      currency: opts.currency ?? this.economy.currency,
      platformFee: opts.platformFee ?? this.economy.platformFee,
      creatorFee: opts.creatorFee ?? this.economy.creatorFee,
    };
  }

  // --- Reset ---

  reset(initialPrizePool: number = 0): void {
    this.economy = {
      ...this.economy,
      prizePool: initialPrizePool,
      totalWagered: 0,
      lootDrops: [],
      playerBalances: new Map(),
    };
    nextLootId = 0;
  }
}
