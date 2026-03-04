'use client';

import { Suspense, useEffect, useCallback, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChronosStore, getNPCForOpponent } from '@/stores/chronosStore';
import { BattleArena } from '@/components/game/chronos/BattleArena';
import { MoveSelector } from '@/components/game/chronos/MoveSelector';
import { HealthBar } from '@/components/game/chronos/HealthBar';
import { CurrencyDisplay } from '@/components/game/chronos/CurrencyDisplay';
import { MatchTimer } from '@/components/game/chronos/MatchTimer';
import { MoveHistory } from '@/components/game/chronos/MoveHistory';
import { GameOverScreen } from '@/components/game/chronos/GameOverScreen';
import { LootReveal } from '@/components/game/chronos/LootReveal';
import { Leaderboard } from '@/components/game/chronos/Leaderboard';
import { MatchHistoryList } from '@/components/game/chronos/MatchHistoryList';
import { MatchResult } from '@/components/game/chronos/MatchResult';
import { NPCCard } from '@/components/game/NPCCard';
import { WalletGate } from '@/components/WalletGate';
import { TransactionPending } from '@/components/ui/TransactionPending';
import { useChronosBattle } from '@/hooks/useContracts';
import { useWallet } from '@/hooks/useWallet';
import { useSearchParams } from 'next/navigation';
import { CHRONOS_NPCS, type ChronosNPCProfile } from '@/ai/npcs/chronos-npcs';
import { useNPCDialogue, type DialogueMoment } from '@/ai/useNPCDialogue';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { MOVE_LIST, MAX_COINS } from '@/engine/chronos/moves';

// Map ChronosNPCProfile archetype for NPCCard personality prop
function npcToCardPersonality(npc: ChronosNPCProfile) {
  return {
    aggression: npc.traits.aggression / 100,
    loyalty: npc.traits.loyalty / 100,
    greed: npc.traits.greed / 100,
    curiosity: npc.traits.curiosity / 100,
    defensiveness: npc.traits.patience / 100, // map patience → defensiveness
  };
}

// Map archetype to NPCCard archetype prop
function mapArchetype(arch: string): 'merchant' | 'warrior' | 'guardian' | 'trickster' | 'sage' {
  const map: Record<string, 'merchant' | 'warrior' | 'guardian' | 'trickster' | 'sage'> = {
    merchant: 'merchant', warrior: 'warrior', guardian: 'guardian',
    trickster: 'trickster', scholar: 'sage',
  };
  return map[arch] ?? 'warrior';
}

export default function ChronosBattlePageWrapper() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-text-muted">Loading...</div>}>
      <ChronosBattlePage />
    </Suspense>
  );
}

function ChronosBattlePage() {
  const screen = useChronosStore(s => s.screen);
  const game = useChronosStore(s => s.game);
  const selectedOpponent = useChronosStore(s => s.selectedOpponent);
  const opponents = useChronosStore(s => s.opponents);
  const playerBalance = useChronosStore(s => s.playerBalance);
  const selectOpponent = useChronosStore(s => s.selectOpponent);
  const startMatch = useChronosStore(s => s.startMatch);
  const playerMove = useChronosStore(s => s.playerMove);
  const hitFlash = useChronosStore(s => s.hitFlash);
  const cleanup = useChronosStore(s => s.cleanup);
  const setScreen = useChronosStore(s => s.setScreen);
  const npcProfile = useChronosStore(s => s.npcProfile);
  const aiThinking = useChronosStore(s => s.aiThinking);
  const matchHistory = useChronosStore(s => s.matchHistory);
  const revealLoot = useChronosStore(s => s.revealLoot);
  const returnToLobby = useChronosStore(s => s.returnToLobby);
  const lootDrop = useChronosStore(s => s.lootDrop);

  // Demo mode + wallet + on-chain hooks
  const searchParams = useSearchParams();
  const isDemo = searchParams.get('demo') === 'true';
  const { isConnected } = useWallet();
  const { createMatch, entryFee: onChainEntryFee, isWritePending, txHash } = useChronosBattle();
  const [txStatus, setTxStatus] = useState<'pending' | 'confirming' | 'success' | 'failed' | null>(null);

  // NPC dialogue hook + SFX
  const dialogue = useNPCDialogue(npcProfile);
  const sfx = useSoundEffects();
  const [showMatchResult, setShowMatchResult] = useState(false);
  const prevEventsLen = useRef(0);
  const firedDialogues = useRef(new Set<string>());

  // Trigger dialogue + SFX on game events
  useEffect(() => {
    const lastEvt = game.events[game.events.length - 1];
    if (!lastEvt || game.events.length === prevEventsLen.current) return;
    prevEventsLen.current = game.events.length;

    // Sound effects for battle events
    if (screen === 'playing') {
      if (lastEvt.type === 'move_landed' || lastEvt.type === 'counter_success') {
        sfx.play('hit');
      } else if (lastEvt.type === 'move_blocked') {
        sfx.play('block');
      }
    }

    // NPC dialogue triggers
    if (!npcProfile || screen !== 'playing') return;

    const momentMap: Record<string, DialogueMoment> = {
      move_landed: lastEvt.target === 'player' ? 'dealt_damage' : 'took_damage',
      shield_block: 'shield_block',
      counter_success: lastEvt.owner === 'ai' ? 'counter_success' : 'counter_whiff',
    };
    const moment = momentMap[lastEvt.type];
    if (moment) dialogue.trigger(moment);

    // Low HP triggers
    if (game.ai.hp > 0 && game.ai.hp <= game.ai.maxHp * 0.25) {
      dialogue.trigger('low_hp');
    }
    if (game.player.hp > 0 && game.player.hp <= game.player.maxHp * 0.25) {
      dialogue.trigger('opponent_low_hp');
    }

    // Once-per-match dialogue triggers
    if (game.player.shieldActive && !firedDialogues.current.has('player_shielding')) {
      firedDialogues.current.add('player_shielding');
      dialogue.trigger('player_shielding');
    }
    if (game.ai.coins >= 15 && !firedDialogues.current.has('coin_rich')) {
      firedDialogues.current.add('coin_rich');
      dialogue.trigger('coin_rich');
    }
    if ((game.ai.hp - game.player.hp) >= 40 && !firedDialogues.current.has('dominating')) {
      firedDialogues.current.add('dominating');
      dialogue.trigger('dominating');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.events.length]);

  // Trigger match_start dialogue + reset fired set
  useEffect(() => {
    if (screen === 'playing' && game.currentBlock <= 1) {
      firedDialogues.current.clear();
      if (npcProfile) dialogue.trigger('match_start');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);

  // Trigger win/lose dialogue + victory/defeat SFX on game over
  useEffect(() => {
    if (screen === 'game_over') {
      const isWin = game.winner === 'player';
      sfx.play(isWin ? 'victory' : 'defeat');
      if (npcProfile) {
        dialogue.trigger(isWin ? 'lose' : 'win');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);

  // Keyboard shortcuts: 1-5 for moves
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (game.phase === 'playing') {
      const num = parseInt(e.key);
      if (num >= 1 && num <= 5) {
        const moveType = MOVE_LIST[num - 1];
        if (moveType) playerMove(moveType);
      }
    }
  }, [game.phase, playerMove]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  const canAffordEntry = selectedOpponent ? parseFloat(playerBalance) >= parseFloat(selectedOpponent.entryFee) : false;

  // Entry fee flow: attempt on-chain tx, then start local match
  const handleStartMatch = () => {
    if (!selectedOpponent || !canAffordEntry) return;

    // Attempt on-chain entry fee payment
    if (isConnected && onChainEntryFee) {
      setTxStatus('pending');
      try {
        createMatch(onChainEntryFee);
        setTxStatus('confirming');
        // Start local match after tx submission
        setTimeout(() => {
          setTxStatus('success');
          setTimeout(() => {
            setTxStatus(null);
            startMatch();
          }, 1500);
        }, 2000);
      } catch {
        setTxStatus('failed');
      }
    } else {
      // Fallback: start local match directly (no contracts deployed)
      startMatch();
    }
  };

  // Resolve NPC profile for selected opponent (for lobby display)
  const selectedNPC = selectedOpponent ? getNPCForOpponent(selectedOpponent) : null;

  // Build MatchResult stats from latest match record
  const latestMatch = matchHistory[0];
  const matchResultStats = latestMatch ? {
    result: latestMatch.result === 'win' ? 'victory' as const : 'defeat' as const,
    playerHP: latestMatch.playerHpRemaining,
    opponentHP: latestMatch.aiHpRemaining,
    maxHP: 100,
    damageDealt: latestMatch.playerStats.damageDealt,
    damageReceived: latestMatch.aiStats.damageDealt,
    movesUsed: latestMatch.playerStats.movesPlayed,
    blocksPlayed: latestMatch.totalBlocks,
    coinsSpent: latestMatch.playerStats.coinsSpent,
    coinsEarned: latestMatch.result === 'win' ? parseFloat(latestMatch.prizeWon) : 0,
    timeElapsed: `${Math.floor(latestMatch.totalBlocks * 2 / 60)}:${String((latestMatch.totalBlocks * 2) % 60).padStart(2, '0')}`,
    shieldsUsed: latestMatch.playerStats.shieldsUsed,
    countersLanded: latestMatch.playerStats.countersLanded,
    lootReward: latestMatch.lootDrop ? {
      name: latestMatch.lootDrop.name,
      rarity: latestMatch.lootDrop.rarity,
      icon: latestMatch.lootDrop.icon,
    } : undefined,
  } : null;

  return (
    <WalletGate>
      <div className="min-h-screen bg-background flex flex-col relative">
        {/* Transaction Pending Overlay */}
        <TransactionPending
          isOpen={txStatus !== null}
          status={txStatus ?? 'pending'}
          txHash={txHash}
          message={txStatus === 'pending' ? 'Approving USDT entry fee...' : txStatus === 'confirming' ? 'Creating match on-chain...' : undefined}
          onClose={() => setTxStatus(null)}
        />

        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <motion.h1
              className="text-xl font-bold tracking-tight"
              style={{
                background: 'linear-gradient(135deg, #00F0FF, #FF00E5)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              CHRONOS BATTLE
            </motion.h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-surface-2 border border-border text-text-muted">
              Avalon
            </span>
          </div>

          {screen === 'playing' && <MatchTimer />}

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-2 border border-border">
              <span className="text-[10px] font-mono text-text-muted">USDT</span>
              <span className="text-sm font-mono font-bold text-neon-yellow">${playerBalance}</span>
              {isDemo && (
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-warning/20 text-warning border border-warning/30">
                  DEMO
                </span>
              )}
            </div>

            {screen !== 'playing' && (
              <div className="flex gap-1">
                <TabButton active={screen === 'lobby'} onClick={() => setScreen('lobby')} label="FIGHT" />
                <TabButton active={screen === 'history'} onClick={() => setScreen('history')} label="HISTORY" />
                <TabButton active={screen === 'leaderboard'} onClick={() => setScreen('leaderboard')} label="RANKS" />
              </div>
            )}

            {screen === 'playing' && (
              <span className="text-[10px] font-mono px-2 py-1 rounded bg-neon-green/10 text-neon-green border border-neon-green/20">
                LIVE
              </span>
            )}
          </div>
        </header>

        {/* === LOBBY SCREEN === */}
        {screen === 'lobby' && (
          <div className="flex-1 flex flex-col md:flex-row gap-4 p-4 min-h-0 overflow-hidden">
            {/* Opponent selection grid NPCCard from designer agent */}
            <div className="flex-1 overflow-y-auto">
              <div className="mb-4">
                <h2 className="text-lg font-bold text-text-primary mb-1">Choose Your Opponent</h2>
                <p className="text-sm text-text-secondary">
                  Each AI has a unique ERC-8004 on-chain identity and fighting style. Higher difficulty = bigger stakes.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {opponents.map(opp => {
                  const npc = getNPCForOpponent(opp);
                  if (!npc) {
                    // Fallback to OpponentCard if no NPC profile
                    return (
                      <div
                        key={opp.id}
                        onClick={() => selectOpponent(opp)}
                        className={`cursor-pointer rounded-xl border-2 p-4 transition-all ${selectedOpponent?.id === opp.id
                            ? 'border-neon-cyan bg-neon-cyan/5'
                            : 'border-border bg-surface hover:border-border-bright'
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{opp.avatar}</span>
                          <div>
                            <h3 className="font-bold text-text-primary">{opp.name}</h3>
                            <p className="text-xs text-text-muted">{opp.title}</p>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div key={opp.id} onClick={() => selectOpponent(opp)} className="cursor-pointer">
                      <NPCCard
                        name={npc.name}
                        archetype={mapArchetype(npc.archetype)}
                        personality={npcToCardPersonality(npc)}
                        reputation={npc.reputation}
                        walletBalance={`$${opp.entryFee} USDT`}
                        level={npc.difficulty === 'easy' ? 1 : npc.difficulty === 'medium' ? 5 : npc.difficulty === 'hard' ? 10 : 15}
                        isActive={selectedOpponent?.id === opp.id}
                        className={selectedOpponent?.id === opp.id ? 'ring-2 ring-neon-cyan' : ''}
                      />
                    </div>
                  );
                })}
              </div>

              {/* How to play */}
              <div className="mt-6 p-4 rounded-xl bg-surface-2 border border-border">
                <h3 className="text-xs font-mono text-text-secondary uppercase tracking-wider mb-2">How To Play</h3>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 text-center">
                  <MoveHint icon={'\u26A1'} name="Quick Strike" cost="1" delay="instant" dmg="10" color="#00F0FF" />
                  <MoveHint icon={'\uD83D\uDCA5'} name="Power Blow" cost="2" delay="3 blocks" dmg="25" color="#FF6B00" />
                  <MoveHint icon={'\uD83D\uDD25'} name="Devastating" cost="3" delay="6 blocks" dmg="50" color="#FF1744" />
                  <MoveHint icon={'\uD83D\uDEE1\uFE0F'} name="Shield" cost="1" delay="2 blocks" dmg="Block" color="#39FF14" />
                  <MoveHint icon={'\uD83D\uDD04'} name="Counter" cost="2" delay="instant" dmg="2x" color="#B026FF" />
                </div>
              </div>
            </div>

            {/* Right panel: selected opponent details + start */}
            <div className="w-full md:w-72 shrink-0 flex flex-col gap-3">
              {selectedOpponent ? (
                <>
                  <div
                    className="p-4 rounded-xl border-2 bg-surface"
                    style={{
                      borderColor: selectedOpponent.color,
                      boxShadow: `0 0 30px ${selectedOpponent.glowColor}`,
                    }}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="w-14 h-14 rounded-full flex items-center justify-center border-2 text-2xl"
                        style={{ borderColor: selectedOpponent.color }}
                      >
                        {selectedOpponent.avatar}
                      </div>
                      <div>
                        <h3 className="font-bold text-text-primary">{selectedOpponent.name}</h3>
                        <p className="text-xs font-mono" style={{ color: selectedOpponent.color }}>
                          {selectedOpponent.title}
                        </p>
                        {selectedNPC && (
                          <p className="text-[9px] font-mono text-text-muted mt-0.5 italic">
                            &ldquo;{selectedNPC.catchphrase}&rdquo;
                          </p>
                        )}
                      </div>
                    </div>

                    {/* NPC description & playstyle */}
                    {selectedNPC && (
                      <div className="mb-3 space-y-1.5">
                        <p className="text-[10px] text-text-secondary leading-relaxed">{selectedNPC.description}</p>
                        <p className="text-[9px] font-mono text-text-muted">
                          <span className="text-neon-cyan">Playstyle:</span> {selectedNPC.playstyle}
                        </p>
                      </div>
                    )}

                    {/* ERC-8004 Identity block */}
                    <div className="p-2.5 rounded-lg bg-surface-2 border border-border mb-3 space-y-1">
                      <div className="flex justify-between text-[9px] font-mono">
                        <span className="text-text-muted">Agent ID</span>
                        <span className="text-neon-cyan">
                          {selectedNPC ? `ERC-8004 ${selectedNPC.agentId}` : `ERC-8004 #${selectedOpponent.identity.tokenId}`}
                        </span>
                      </div>
                      <div className="flex justify-between text-[9px] font-mono">
                        <span className="text-text-muted">Contract</span>
                        <span className="text-text-secondary">{selectedOpponent.identity.contractAddress.slice(0, 8)}...{selectedOpponent.identity.contractAddress.slice(-4)}</span>
                      </div>
                      <div className="flex justify-between text-[9px] font-mono">
                        <span className="text-text-muted">Reputation</span>
                        <span className="text-neon-green">{selectedNPC ? selectedNPC.reputation : selectedOpponent.identity.reputationScore}/100</span>
                      </div>
                      <div className="flex justify-between text-[9px] font-mono">
                        <span className="text-text-muted">Record</span>
                        <span>
                          <span className="text-neon-green">{selectedOpponent.identity.totalWins}W</span>
                          {' / '}
                          <span className="text-neon-red">{selectedOpponent.identity.totalLosses}L</span>
                        </span>
                      </div>
                      <div className="flex justify-between text-[9px] font-mono">
                        <span className="text-text-muted">Win Rate</span>
                        <span className="text-neon-yellow">
                          {selectedNPC ? `${Math.round(selectedNPC.winRate * 100)}%` : `${selectedOpponent.identity.walletBalance}`}
                        </span>
                      </div>
                      <div className="flex justify-between text-[9px] font-mono">
                        <span className="text-text-muted">Difficulty</span>
                        <span className={`font-bold ${selectedOpponent.difficulty === 'easy' ? 'text-neon-green' :
                            selectedOpponent.difficulty === 'medium' ? 'text-neon-yellow' :
                              selectedOpponent.difficulty === 'hard' ? 'text-neon-orange' :
                                selectedOpponent.difficulty === 'expert' ? 'text-neon-red' :
                                  'text-neon-magenta'
                          }`}>
                          {selectedOpponent.difficulty.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {/* Entry fee / Prize */}
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-2 border border-border mb-3">
                      <div className="text-center">
                        <p className="text-[9px] font-mono text-text-muted">ENTRY FEE</p>
                        <p className="text-sm font-mono font-bold text-neon-yellow">${selectedOpponent.entryFee}</p>
                      </div>
                      <span className="text-text-muted">{'\u2192'}</span>
                      <div className="text-center">
                        <p className="text-[9px] font-mono text-text-muted">PRIZE</p>
                        <p className="text-sm font-mono font-bold text-neon-green">${selectedOpponent.prizePool}</p>
                      </div>
                    </div>

                    <motion.button
                      whileHover={canAffordEntry ? { scale: 1.02 } : {}}
                      whileTap={canAffordEntry ? { scale: 0.98 } : {}}
                      onClick={handleStartMatch}
                      disabled={!canAffordEntry || isWritePending}
                      className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${canAffordEntry
                          ? 'bg-neon-cyan text-black shadow-[0_0_20px_rgba(0,240,255,0.3)] hover:shadow-[0_0_30px_rgba(0,240,255,0.5)]'
                          : 'bg-surface-3 text-text-muted cursor-not-allowed'
                        }`}
                    >
                      {canAffordEntry ? 'START MATCH' : 'INSUFFICIENT FUNDS'}
                    </motion.button>

                    {!canAffordEntry && (
                      <p className="text-[9px] text-neon-red font-mono text-center mt-1">
                        Need ${selectedOpponent.entryFee} USDT (Balance: ${playerBalance})
                      </p>
                    )}
                  </div>

                  {/* Leaderboard preview */}
                  <div className="bg-surface rounded-xl border border-border p-3 flex-1 overflow-y-auto">
                    <Leaderboard />
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <span className="text-4xl block mb-3">{'\u2694\uFE0F'}</span>
                    <p className="text-sm text-text-muted">Select an opponent to begin</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* === PLAYING SCREEN === */}
        {screen === 'playing' && (
          <div className="flex-1 flex flex-col md:flex-row gap-3 p-3 min-h-0 overflow-y-auto md:overflow-hidden">
            {/* Left column */}
            <div className="w-full md:w-64 flex flex-col gap-3 md:shrink-0">
              <div className="bg-surface rounded-xl border border-border p-3 space-y-3">
                <HealthBar
                  current={game.player.hp}
                  max={game.player.maxHp}
                  label="Your HP"
                  side="left"
                  isFlashing={hitFlash === 'player'}
                  shieldActive={game.player.shieldActive}
                />
                <CurrencyDisplay coins={game.player.coins} maxCoins={MAX_COINS} side="left" />
              </div>
              <div className="flex-1 bg-surface rounded-xl border border-border overflow-hidden min-h-0">
                <MoveHistory />
              </div>
            </div>

            {/* Center */}
            <div className="flex-1 flex flex-col gap-3 min-w-0">
              <div className="flex-1 min-h-0">
                <BattleArena />
              </div>

              {/* AI Thinking Caption TASK 4 */}
              <AnimatePresence>
                {dialogue.currentLine && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface border border-border"
                  >
                    <span className="text-lg">{selectedOpponent?.avatar || '\uD83E\uDD16'}</span>
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-mono font-bold" style={{ color: selectedOpponent?.color || '#FF00E5' }}>
                        {selectedOpponent?.name || 'AI'}
                      </span>
                      <p className="text-xs text-text-secondary italic truncate">
                        &ldquo;{dialogue.currentLine.text}&rdquo;
                      </p>
                    </div>
                    {aiThinking && (
                      <span className="text-[9px] font-mono text-text-muted shrink-0">
                        {Math.round(aiThinking.confidence * 100)}% confident
                      </span>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-surface rounded-xl border border-border p-3"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-mono text-text-muted uppercase tracking-wider">Select Move</span>
                  <span className="text-[9px] font-mono text-text-muted">(Keys 1-5)</span>
                  {selectedOpponent && (
                    <span className="text-[9px] font-mono ml-auto" style={{ color: selectedOpponent.color }}>
                      vs {selectedOpponent.name} {selectedOpponent.title}
                    </span>
                  )}
                </div>
                <MoveSelector />
              </motion.div>
            </div>

            {/* Right column */}
            <div className="w-full md:w-64 flex flex-col gap-3 md:shrink-0">
              <div className="bg-surface rounded-xl border border-border p-3 space-y-3">
                <HealthBar
                  current={game.ai.hp}
                  max={game.ai.maxHp}
                  label={selectedOpponent ? selectedOpponent.name : 'AI HP'}
                  side="right"
                  isFlashing={hitFlash === 'ai'}
                  shieldActive={game.ai.shieldActive}
                />
                <CurrencyDisplay coins={game.ai.coins} maxCoins={MAX_COINS} side="right" />
              </div>

              {/* Opponent ERC-8004 identity during battle TASK 3 */}
              {selectedOpponent && (
                <div className="bg-surface rounded-xl border border-border p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{selectedOpponent.avatar}</span>
                    <div>
                      <p className="text-xs font-bold text-text-primary">{selectedOpponent.name}</p>
                      <p className="text-[9px] font-mono" style={{ color: selectedOpponent.color }}>{selectedOpponent.title}</p>
                    </div>
                  </div>
                  <div className="space-y-0.5 text-[9px] font-mono">
                    <div className="flex justify-between">
                      <span className="text-text-muted">ERC-8004</span>
                      <span className="text-neon-cyan">{selectedNPC?.agentId || `#${selectedOpponent.identity.tokenId}`}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Rep</span>
                      <span className="text-neon-green">{selectedNPC?.reputation || selectedOpponent.identity.reputationScore}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Record</span>
                      <span><span className="text-neon-green">{selectedOpponent.identity.totalWins}W</span> / <span className="text-neon-red">{selectedOpponent.identity.totalLosses}L</span></span>
                    </div>
                  </div>
                </div>
              )}

              {/* Moves in flight */}
              <div className="bg-surface rounded-xl border border-border p-3 flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-neon-orange animate-pulse" />
                  <span className="text-xs font-mono text-text-secondary uppercase tracking-wider">
                    Moves In Flight
                  </span>
                </div>
                <AnimatePresence>
                  {game.movesInFlight.length === 0 ? (
                    <p className="text-xs text-text-muted font-mono text-center py-4">No moves in flight</p>
                  ) : (
                    <div className="space-y-2">
                      {game.movesInFlight.map(move => {
                        const isPlayer = move.owner === 'player';
                        return (
                          <motion.div
                            key={move.id}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            className="flex items-center gap-2 p-2 rounded-lg bg-surface-2 border border-border"
                          >
                            <span className={`text-[10px] font-mono font-bold ${isPlayer ? 'text-neon-cyan' : 'text-neon-magenta'}`}>
                              {isPlayer ? 'YOU' : 'AI'}
                            </span>
                            <span className="text-xs">{move.type.replace(/_/g, ' ')}</span>
                            <span className="text-[10px] font-mono text-neon-orange ml-auto">{move.blocksRemaining}b</span>
                            <div className="w-12 h-1.5 rounded-full bg-surface-3 overflow-hidden">
                              <motion.div
                                className="h-full bg-neon-orange rounded-full"
                                animate={{ width: `${((move.totalBlocks - move.blocksRemaining) / move.totalBlocks) * 100}%` }}
                              />
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        )}

        {/* === HISTORY SCREEN === */}
        {screen === 'history' && (
          <div className="flex-1 overflow-y-auto p-4 max-w-3xl mx-auto w-full">
            <h2 className="text-lg font-bold text-text-primary mb-4">{'\uD83D\uDCDC'} Match History</h2>
            <MatchHistoryList />
          </div>
        )}

        {/* === LEADERBOARD SCREEN === */}
        {screen === 'leaderboard' && (
          <div className="flex-1 overflow-y-auto p-4 max-w-2xl mx-auto w-full">
            <Leaderboard />
          </div>
        )}

        {/* === OVERLAYS === */}
        <GameOverScreen />
        <LootReveal />

        {/* MatchResult overlay shown after game_over when user clicks "View Stats" */}
        {showMatchResult && matchResultStats && (
          <MatchResult
            stats={matchResultStats}
            onPlayAgain={() => { setShowMatchResult(false); returnToLobby(); startMatch(); }}
            onMenu={() => { setShowMatchResult(false); returnToLobby(); }}
            onViewLoot={latestMatch?.result === 'win' ? () => { setShowMatchResult(false); revealLoot(); } : undefined}
          />
        )}
      </div>
    </WalletGate>
  );
}

// --- Helper components ---

function TabButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-lg text-[10px] font-mono font-bold transition-colors ${active
          ? 'bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20'
          : 'bg-surface-2 text-text-muted border border-border hover:text-text-secondary'
        }`}
    >
      {label}
    </button>
  );
}

function MoveHint({ icon, name, cost, delay, dmg, color }: {
  icon: string; name: string; cost: string; delay: string; dmg: string; color: string;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-lg">{icon}</span>
      <span className="text-[9px] font-bold text-text-primary">{name}</span>
      <span className="text-[8px] font-mono text-neon-yellow">{cost}{'\uD83E\uDE99'}</span>
      <span className="text-[8px] font-mono text-text-muted">{delay}</span>
      <span className="text-[8px] font-mono font-bold" style={{ color }}>{dmg} DMG</span>
    </div>
  );
}
