// ============================================================
// Avalon SDK — Event Emitter
// Typed event system for UI subscribers + on-chain logging.
// Every game action flows through here.
// ============================================================

import type {
  AvalonEventType, AvalonEvent, AvalonEventHandler, MatchId,
} from './types';

export type OnChainLogger = (event: AvalonEvent) => void | Promise<void>;

export class EventEmitter {
  private listeners = new Map<AvalonEventType, Set<AvalonEventHandler>>();
  private wildcardListeners = new Set<AvalonEventHandler>();
  private onChainLogger: OnChainLogger | null = null;
  private onChainEvents = new Set<AvalonEventType>();
  private eventLog: AvalonEvent[] = [];
  private maxLogSize = 1000;
  private currentMatchId: MatchId | undefined;
  private currentBlock: number = 0;

  // --- Configuration ---

  setOnChainLogger(logger: OnChainLogger): void {
    this.onChainLogger = logger;
  }

  setOnChainEvents(events: AvalonEventType[]): void {
    this.onChainEvents = new Set(events);
  }

  setMatchContext(matchId: MatchId, blockNumber: number): void {
    this.currentMatchId = matchId;
    this.currentBlock = blockNumber;
  }

  // --- Subscriptions ---

  on<T = unknown>(event: AvalonEventType, handler: AvalonEventHandler<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler as AvalonEventHandler);
    return () => this.off(event, handler);
  }

  off<T = unknown>(event: AvalonEventType, handler: AvalonEventHandler<T>): void {
    this.listeners.get(event)?.delete(handler as AvalonEventHandler);
  }

  once<T = unknown>(event: AvalonEventType, handler: AvalonEventHandler<T>): () => void {
    const wrapper: AvalonEventHandler<T> = (e) => {
      this.off(event, wrapper);
      handler(e);
    };
    return this.on(event, wrapper);
  }

  /** Subscribe to ALL events — useful for logging, analytics, replays */
  onAny(handler: AvalonEventHandler): () => void {
    this.wildcardListeners.add(handler);
    return () => this.wildcardListeners.delete(handler);
  }

  // --- Emission ---

  emit<T = unknown>(event: AvalonEventType, data: T): void {
    const shouldLogOnChain = this.onChainEvents.has(event);

    const avalonEvent: AvalonEvent<T> = {
      type: event,
      timestamp: Date.now(),
      blockNumber: this.currentBlock,
      matchId: this.currentMatchId,
      data,
      onChain: shouldLogOnChain,
    };

    // Log to history
    this.eventLog.push(avalonEvent as AvalonEvent);
    if (this.eventLog.length > this.maxLogSize) {
      this.eventLog.shift();
    }

    // Notify typed listeners
    this.listeners.get(event)?.forEach(handler => {
      try {
        handler(avalonEvent as AvalonEvent);
      } catch (err) {
        console.error(`[Avalon EventEmitter] Error in handler for "${event}":`, err);
      }
    });

    // Notify wildcard listeners
    this.wildcardListeners.forEach(handler => {
      try {
        handler(avalonEvent as AvalonEvent);
      } catch (err) {
        console.error(`[Avalon EventEmitter] Error in wildcard handler:`, err);
      }
    });

    // On-chain logging (async, fire-and-forget)
    if (shouldLogOnChain && this.onChainLogger) {
      try {
        this.onChainLogger(avalonEvent as AvalonEvent);
      } catch (err) {
        console.error(`[Avalon EventEmitter] On-chain log failed for "${event}":`, err);
      }
    }
  }

  /** Emit multiple events atomically (all or none for listeners) */
  emitBatch(events: { type: AvalonEventType; data: unknown }[]): void {
    for (const { type, data } of events) {
      this.emit(type, data);
    }
  }

  // --- Queries ---

  getEventLog(filter?: AvalonEventType): AvalonEvent[] {
    if (filter) {
      return this.eventLog.filter(e => e.type === filter);
    }
    return [...this.eventLog];
  }

  getOnChainEvents(): AvalonEvent[] {
    return this.eventLog.filter(e => e.onChain);
  }

  clearLog(): void {
    this.eventLog = [];
  }

  // --- Lifecycle ---

  removeAllListeners(event?: AvalonEventType): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
      this.wildcardListeners.clear();
    }
  }

  listenerCount(event: AvalonEventType): number {
    return this.listeners.get(event)?.size ?? 0;
  }
}
