// ============================================================
// Avalon AI — Economic Agent
// Autonomous buy/sell/trade decisions for NPC wallets
// Each NPC owns a wallet and makes economic choices
// ============================================================

import type { Address, Timestamp } from '@/types';
import type { PersonalitySystem, EconomicBias } from './PersonalitySystem';

// --- Economic Types ---

export interface NpcWallet {
  address: Address;
  balance: number;         // stablecoin balance (USDT units)
  lockedBalance: number;   // funds locked in pending trades
  totalEarned: number;
  totalSpent: number;
  lastTransaction: Timestamp;
}

export interface TradeItem {
  id: string;
  name: string;
  baseValue: number;       // stablecoin value
  rarity: string;
  quantity: number;
}

export interface TradeOffer {
  id: string;
  sellerId: string;
  buyerId: string | null;
  item: TradeItem;
  askPrice: number;
  bidPrice?: number;
  status: TradeStatus;
  createdAt: Timestamp;
  expiresAt: Timestamp;
}

export type TradeStatus = 'open' | 'negotiating' | 'accepted' | 'rejected' | 'expired' | 'completed';

export interface TradeDecision {
  action: 'buy' | 'sell' | 'hold' | 'negotiate';
  item?: TradeItem;
  price?: number;
  confidence: number;
  reasoning: string;
}

export interface PriceMemory {
  itemId: string;
  prices: { price: number; timestamp: Timestamp }[];
  averagePrice: number;
  lastSeen: Timestamp;
}

// --- Economic Agent ---

export class EconomicAgent {
  private wallet: NpcWallet;
  private inventory: TradeItem[] = [];
  private priceHistory: Map<string, PriceMemory> = new Map();
  private activeOffers: TradeOffer[] = [];
  private personality: PersonalitySystem;
  private maxInventorySlots = 20;

  constructor(walletAddress: Address, personality: PersonalitySystem, initialBalance = 100) {
    this.personality = personality;
    this.wallet = {
      address: walletAddress,
      balance: initialBalance,
      lockedBalance: 0,
      totalEarned: 0,
      totalSpent: 0,
      lastTransaction: Date.now(),
    };
  }

  // --- Wallet ---

  getWallet(): Readonly<NpcWallet> {
    return this.wallet;
  }

  getAvailableBalance(): number {
    return this.wallet.balance - this.wallet.lockedBalance;
  }

  deposit(amount: number): void {
    this.wallet.balance += amount;
    this.wallet.totalEarned += amount;
    this.wallet.lastTransaction = Date.now();
  }

  withdraw(amount: number): boolean {
    if (amount > this.getAvailableBalance()) return false;
    this.wallet.balance -= amount;
    this.wallet.totalSpent += amount;
    this.wallet.lastTransaction = Date.now();
    return true;
  }

  // --- Inventory ---

  getInventory(): ReadonlyArray<TradeItem> {
    return this.inventory;
  }

  addItem(item: TradeItem): boolean {
    if (this.inventory.length >= this.maxInventorySlots) return false;
    const existing = this.inventory.find(i => i.id === item.id);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      this.inventory.push({ ...item });
    }
    return true;
  }

  removeItem(itemId: string, quantity = 1): boolean {
    const idx = this.inventory.findIndex(i => i.id === itemId);
    if (idx === -1) return false;
    const item = this.inventory[idx];
    if (item.quantity < quantity) return false;
    item.quantity -= quantity;
    if (item.quantity <= 0) {
      this.inventory.splice(idx, 1);
    }
    return true;
  }

  // --- Price Analysis ---

  recordPrice(itemId: string, price: number): void {
    const existing = this.priceHistory.get(itemId);
    if (existing) {
      existing.prices.push({ price, timestamp: Date.now() });
      // Keep last 20 price points
      if (existing.prices.length > 20) existing.prices.shift();
      existing.averagePrice = existing.prices.reduce((s, p) => s + p.price, 0) / existing.prices.length;
      existing.lastSeen = Date.now();
    } else {
      this.priceHistory.set(itemId, {
        itemId,
        prices: [{ price, timestamp: Date.now() }],
        averagePrice: price,
        lastSeen: Date.now(),
      });
    }
  }

  getPerceivedValue(item: TradeItem): number {
    const history = this.priceHistory.get(item.id);
    if (history) {
      return history.averagePrice;
    }
    return item.baseValue;
  }

  // --- Trade Decisions ---

  evaluateBuy(item: TradeItem, askPrice: number): TradeDecision {
    const bias = this.personality.getEconomicBias();
    const mood = this.personality.getMood();
    const perceived = this.getPerceivedValue(item);
    const available = this.getAvailableBalance();

    // Can't afford
    if (askPrice > available) {
      return { action: 'hold', confidence: 1, reasoning: 'Cannot afford this item' };
    }

    // Value ratio — how good is the deal?
    const valueRatio = perceived / askPrice;
    let confidence = 0;

    // Good deal (item worth more than asking price)
    if (valueRatio >= 1.3) {
      confidence = 0.9;
    } else if (valueRatio >= 1.0) {
      confidence = 0.6;
    } else if (valueRatio >= 0.7) {
      confidence = 0.3;
    } else {
      confidence = 0.1;
    }

    // Personality modifiers
    confidence *= (bias.buyWillingness / 100);

    // Mood modifiers
    if (mood.current === 'happy') confidence *= 1.2;
    if (mood.current === 'suspicious') confidence *= 0.6;
    if (mood.current === 'angry') confidence *= 0.4;

    // Greedy NPCs are pickier about prices
    if (this.personality.getTraits().greed > 70 && valueRatio < 1.2) {
      confidence *= 0.5;
    }

    // Hoarding check — already have too many items?
    const inventoryFullness = this.inventory.length / this.maxInventorySlots;
    if (inventoryFullness > 0.8 && bias.hoarding < 50) {
      confidence *= 0.5;
    }

    // Decision threshold
    if (confidence > 0.6) {
      return { action: 'buy', item, price: askPrice, confidence, reasoning: `Good deal: value ratio ${valueRatio.toFixed(2)}` };
    }

    // Try to negotiate
    if (confidence > 0.3 && bias.priceFlexibility > 40) {
      const counterOffer = askPrice * (0.6 + (bias.priceFlexibility / 100) * 0.3);
      return { action: 'negotiate', item, price: Math.floor(counterOffer), confidence: confidence * 0.8, reasoning: `Counter-offering at ${counterOffer.toFixed(0)}` };
    }

    return { action: 'hold', confidence: 1 - confidence, reasoning: `Price too high: value ratio ${valueRatio.toFixed(2)}` };
  }

  evaluateSell(item: TradeItem, bidPrice?: number): TradeDecision {
    const bias = this.personality.getEconomicBias();
    const perceived = this.getPerceivedValue(item);

    // No bid — create listing
    if (bidPrice === undefined) {
      // Markup based on greed
      const markup = 1 + (this.personality.getTraits().greed / 200); // 1.0 to 1.5
      const askPrice = Math.ceil(perceived * markup);

      if (bias.sellWillingness < 30) {
        return { action: 'hold', confidence: 0.8, reasoning: 'Not interested in selling' };
      }

      return { action: 'sell', item, price: askPrice, confidence: bias.sellWillingness / 100, reasoning: `Listing at ${askPrice} (markup: ${((markup - 1) * 100).toFixed(0)}%)` };
    }

    // Evaluate incoming bid
    const valueRatio = bidPrice / perceived;

    if (valueRatio >= 1.2) {
      return { action: 'sell', item, price: bidPrice, confidence: 0.95, reasoning: 'Great price, selling immediately' };
    }
    if (valueRatio >= 0.9) {
      return { action: 'sell', item, price: bidPrice, confidence: 0.6 * (bias.sellWillingness / 100), reasoning: 'Fair price' };
    }

    // Too low — negotiate
    if (bias.priceFlexibility > 50) {
      const counter = Math.ceil(perceived * 1.1);
      return { action: 'negotiate', item, price: counter, confidence: 0.5, reasoning: `Bid too low, counter at ${counter}` };
    }

    return { action: 'hold', confidence: 0.8, reasoning: 'Bid too low' };
  }

  // --- Trade Execution ---

  executeTrade(offer: TradeOffer): boolean {
    if (offer.status !== 'accepted') return false;

    // Buying
    if (offer.buyerId && offer.bidPrice !== undefined) {
      if (!this.withdraw(offer.bidPrice)) return false;
      this.addItem(offer.item);
      this.recordPrice(offer.item.id, offer.bidPrice);
      offer.status = 'completed';
      return true;
    }

    // Selling
    if (offer.sellerId) {
      if (!this.removeItem(offer.item.id, offer.item.quantity)) return false;
      this.deposit(offer.askPrice);
      this.recordPrice(offer.item.id, offer.askPrice);
      offer.status = 'completed';
      return true;
    }

    return false;
  }

  // --- Active Offers ---

  createOffer(item: TradeItem, askPrice: number): TradeOffer {
    const offer: TradeOffer = {
      id: `offer_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      sellerId: this.wallet.address,
      buyerId: null,
      item,
      askPrice,
      status: 'open',
      createdAt: Date.now(),
      expiresAt: Date.now() + 300_000, // 5 min expiry
    };
    this.activeOffers.push(offer);
    return offer;
  }

  getActiveOffers(): ReadonlyArray<TradeOffer> {
    return this.activeOffers.filter(o => o.status === 'open' || o.status === 'negotiating');
  }

  cleanExpiredOffers(): void {
    const now = Date.now();
    this.activeOffers = this.activeOffers.filter(o => {
      if (o.expiresAt < now && (o.status === 'open' || o.status === 'negotiating')) {
        o.status = 'expired';
        return false;
      }
      return o.status !== 'completed' && o.status !== 'rejected' && o.status !== 'expired';
    });
  }

  // --- Autonomous Economic Tick ---

  economicTick(): TradeDecision[] {
    const decisions: TradeDecision[] = [];
    this.cleanExpiredOffers();

    // Evaluate selling excess items
    const bias = this.personality.getEconomicBias();
    for (const item of this.inventory) {
      if (item.quantity > 1 && bias.hoarding < 60) {
        const sellDecision = this.evaluateSell(item);
        if (sellDecision.action === 'sell' && sellDecision.price) {
          decisions.push(sellDecision);
        }
      }
    }

    return decisions;
  }
}
