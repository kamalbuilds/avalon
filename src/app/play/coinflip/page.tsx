'use client';

import { Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCoinflipStore } from '@/stores/coinflipStore';
import { getStreakMultiplier, calculatePayout } from '@/engine/coinflip/CoinflipEngine';
import { GlowButton } from '@/components/ui/GlowButton';
import { GlowCard } from '@/components/ui/GlowCard';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  ArrowUp,
  ArrowDown,
  Flame,
  Coins,
  History,
  RotateCcw,
  Trophy,
  TrendingUp,
  Zap,
} from 'lucide-react';
import Link from 'next/link';

function CoinflipGame() {
  const phase = useCoinflipStore(s => s.phase);
  const balance = useCoinflipStore(s => s.balance);
  const currentBet = useCoinflipStore(s => s.currentBet);
  const prediction = useCoinflipStore(s => s.prediction);
  const lastResult = useCoinflipStore(s => s.lastResult);
  const streak = useCoinflipStore(s => s.streak);
  const maxStreak = useCoinflipStore(s => s.maxStreak);
  const totalWins = useCoinflipStore(s => s.totalWins);
  const totalLosses = useCoinflipStore(s => s.totalLosses);
  const totalWon = useCoinflipStore(s => s.totalWon);
  const history = useCoinflipStore(s => s.history);
  const flipNumber = useCoinflipStore(s => s.flipNumber);
  const flipProgress = useCoinflipStore(s => s.flipProgress);
  const setBet = useCoinflipStore(s => s.setBet);
  const flip = useCoinflipStore(s => s.flip);
  const reset = useCoinflipStore(s => s.reset);
  const continuePlay = useCoinflipStore(s => s.continuePlay);

  const isFlipping = phase === 'flipping';
  const isResult = phase === 'result';
  const canBet = (phase === 'idle' || phase === 'result') && balance > 0;
  const nextMultiplier = getStreakMultiplier(streak);
  const potentialPayout = calculatePayout(currentBet, streak);

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Zap className="h-6 w-6 text-gold" />
            Avalanche Coinflip
          </h1>
          <p className="text-sm text-muted mt-0.5">
            Predict HIGH or LOW. Streaks multiply winnings. VRF-ready randomness.
          </p>
        </div>
        <Link href="/games">
          <Badge variant="default" className="cursor-pointer hover:bg-surface-2 transition-colors">
            Back to Games
          </Badge>
        </Link>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <Card className="p-3 text-center">
          <div className="text-[10px] uppercase tracking-wider text-muted">Balance</div>
          <div className="text-xl font-bold text-gold flex items-center justify-center gap-1">
            <Coins className="h-4 w-4" />
            {balance}
          </div>
        </Card>
        <Card className="p-3 text-center">
          <div className="text-[10px] uppercase tracking-wider text-muted">Streak</div>
          <div className="text-xl font-bold text-neon-cyan flex items-center justify-center gap-1">
            <Flame className="h-4 w-4" />
            {streak}
          </div>
        </Card>
        <Card className="p-3 text-center">
          <div className="text-[10px] uppercase tracking-wider text-muted">Win Rate</div>
          <div className="text-xl font-bold">
            {totalWins + totalLosses > 0
              ? `${Math.round((totalWins / (totalWins + totalLosses)) * 100)}%`
              : '--'}
          </div>
        </Card>
        <Card className="p-3 text-center">
          <div className="text-[10px] uppercase tracking-wider text-muted">Total Won</div>
          <div className="text-xl font-bold text-green-400 flex items-center justify-center gap-1">
            <TrendingUp className="h-4 w-4" />
            {totalWon}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Game Area */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Flip Display */}
          <GlowCard
            glowColor={lastResult?.won ? 'cyan' : isResult ? 'red' : 'purple'}
            className="relative overflow-hidden"
          >
            <div className="flex flex-col items-center py-8">
              {/* Number Display */}
              <motion.div
                className="relative w-32 h-32 rounded-full flex items-center justify-center border-4"
                style={{
                  borderColor: isFlipping
                    ? '#A855F7'
                    : lastResult?.won
                      ? '#06B6D4'
                      : isResult
                        ? '#EF4444'
                        : '#3F3F46',
                  background: isFlipping
                    ? 'radial-gradient(circle, rgba(168,85,247,0.15), transparent)'
                    : lastResult?.won && isResult
                      ? 'radial-gradient(circle, rgba(6,182,212,0.15), transparent)'
                      : isResult
                        ? 'radial-gradient(circle, rgba(239,68,68,0.1), transparent)'
                        : 'transparent',
                }}
                animate={isFlipping ? { rotate: [0, 360], scale: [1, 1.1, 1] } : {}}
                transition={isFlipping ? { duration: 0.5, repeat: Infinity } : {}}
              >
                <span className="text-4xl font-mono font-bold">
                  {isFlipping && flipNumber ? flipNumber : lastResult ? lastResult.number : '?'}
                </span>
              </motion.div>

              {/* Result Text */}
              <AnimatePresence mode="wait">
                {isResult && lastResult && (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-4 text-center"
                  >
                    <div className={`text-2xl font-bold ${lastResult.won ? 'text-neon-cyan' : 'text-red-400'}`}>
                      {lastResult.won ? 'YOU WIN!' : 'BUST!'}
                    </div>
                    <div className="text-sm text-muted mt-1">
                      Number: {lastResult.number} ({lastResult.number > 50 ? 'HIGH' : 'LOW'})
                      {' '} You picked: {lastResult.prediction.toUpperCase()}
                    </div>
                    {lastResult.won && lastResult.multiplier > 1 && (
                      <Badge variant="accent" className="mt-2">
                        <Flame className="h-3 w-3 mr-1" />
                        {lastResult.multiplier}x STREAK BONUS!
                      </Badge>
                    )}
                    {lastResult.won && (
                      <div className="text-lg font-bold text-green-400 mt-2">
                        +{lastResult.payout} coins
                      </div>
                    )}
                  </motion.div>
                )}
                {isFlipping && (
                  <motion.div
                    key="flipping"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="mt-4 text-center"
                  >
                    <div className="text-lg font-bold text-purple-400 animate-pulse">
                      Flipping coin...
                    </div>
                    <div className="text-xs text-muted mt-1">
                      Outcome recorded on Avalanche Fuji
                    </div>
                  </motion.div>
                )}
                {phase === 'idle' && !lastResult && (
                  <motion.div
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-4 text-center text-muted"
                  >
                    Place your bet and pick HIGH or LOW
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </GlowCard>

          {/* Bet Controls */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold">Bet Amount</span>
              <div className="flex items-center gap-2">
                {streak > 0 && (
                  <Badge variant="accent" className="text-[10px]">
                    <Flame className="h-3 w-3 mr-0.5" />
                    {nextMultiplier}x multiplier active
                  </Badge>
                )}
                <span className="text-xs text-muted">
                  Potential payout: <span className="text-green-400 font-bold">{potentialPayout}</span>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-4">
              {[1, 5, 10, 25].map(amount => (
                <button
                  key={amount}
                  onClick={() => setBet(amount)}
                  disabled={!canBet || amount > balance}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer
                    ${currentBet === amount
                      ? 'bg-neon-purple/20 border-2 border-neon-purple text-neon-purple'
                      : 'bg-surface-2 border-2 border-transparent text-text-secondary hover:border-border-bright'
                    }
                    disabled:opacity-30 disabled:cursor-not-allowed`}
                >
                  {amount}
                </button>
              ))}
              <button
                onClick={() => setBet(balance)}
                disabled={!canBet}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer
                  ${currentBet === balance
                    ? 'bg-gold/20 border-2 border-gold text-gold'
                    : 'bg-surface-2 border-2 border-transparent text-gold/70 hover:border-gold/30'
                  }
                  disabled:opacity-30 disabled:cursor-not-allowed`}
              >
                ALL IN
              </button>
            </div>

            {/* HIGH / LOW Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <GlowButton
                variant="cyan"
                size="lg"
                onClick={() => flip('high')}
                disabled={!canBet || isFlipping}
                className="w-full"
              >
                <ArrowUp className="h-5 w-5" />
                HIGH (51-100)
              </GlowButton>
              <GlowButton
                variant="purple"
                size="lg"
                onClick={() => flip('low')}
                disabled={!canBet || isFlipping}
                className="w-full"
              >
                <ArrowDown className="h-5 w-5" />
                LOW (1-50)
              </GlowButton>
            </div>

            {isResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 flex gap-2"
              >
                <GlowButton
                  variant="cyan"
                  size="sm"
                  onClick={continuePlay}
                  className="flex-1"
                >
                  {balance > 0 ? 'Play Again' : 'New Game'}
                </GlowButton>
              </motion.div>
            )}

            {balance <= 0 && phase === 'result' && (
              <div className="mt-3 text-center">
                <p className="text-sm text-red-400 mb-2">Out of coins!</p>
                <button
                  onClick={reset}
                  className="text-xs text-muted hover:text-text-primary underline cursor-pointer"
                >
                  <RotateCcw className="inline h-3 w-3 mr-1" />
                  Start fresh with 100 coins
                </button>
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar: History + Info */}
        <div className="flex flex-col gap-4">
          {/* NPC Dealer */}
          <Card className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold/30 to-neon-purple/30 flex items-center justify-center text-xl border border-gold/30">
                🎲
              </div>
              <div>
                <div className="text-sm font-bold text-gold">Lucky the Dealer</div>
                <div className="text-[10px] text-muted">ERC-8004 Agent #006</div>
              </div>
            </div>
            <p className="text-xs text-text-secondary italic">
              {!lastResult && `"Step right up! The odds are 50/50, but streaks pay BIG."`}
              {lastResult?.won && streak >= 3 && `"${streak} in a row?! You're on FIRE! The house is sweating."`}
              {lastResult?.won && streak < 3 && `"Nice call! Keep it going for streak bonuses."`}
              {lastResult && !lastResult.won && streak === 0 && `"Tough break! The chain doesn't lie. Try again?"`}
            </p>
          </Card>

          {/* Stats */}
          <Card className="p-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted mb-3 flex items-center gap-1">
              <Trophy className="h-3 w-3" /> Session Stats
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Wins</span>
                <span className="font-mono text-green-400">{totalWins}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Losses</span>
                <span className="font-mono text-red-400">{totalLosses}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Best Streak</span>
                <span className="font-mono text-gold">{maxStreak}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Total Won</span>
                <span className="font-mono text-green-400">{totalWon}</span>
              </div>
            </div>
          </Card>

          {/* History */}
          <Card className="p-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted mb-3 flex items-center gap-1">
              <History className="h-3 w-3" /> Recent Flips
            </div>
            {history.length === 0 ? (
              <p className="text-xs text-muted text-center py-4">No flips yet. Make your first prediction!</p>
            ) : (
              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {[...history].reverse().map((result, i) => (
                  <div
                    key={i}
                    className={`flex items-center justify-between px-2 py-1.5 rounded text-xs
                      ${result.won ? 'bg-green-500/5 border border-green-500/20' : 'bg-red-500/5 border border-red-500/20'}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold w-8">{result.number}</span>
                      <span className="text-muted">{result.prediction.toUpperCase()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {result.won ? (
                        <span className="text-green-400 font-bold">+{result.payout}</span>
                      ) : (
                        <span className="text-red-400">-{result.betAmount}</span>
                      )}
                      {result.multiplier > 1 && (
                        <Badge variant="accent" className="text-[8px] py-0 px-1">
                          {result.multiplier}x
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* VRF Info */}
          <Card className="p-3 border-neon-cyan/20">
            <div className="text-[10px] text-neon-cyan/60 uppercase tracking-wider mb-1">VRF-Ready</div>
            <p className="text-[11px] text-muted">
              Designed to use Chainlink VRF v2.5 for verifiable randomness.
              Results are recorded on Avalanche Fuji testnet.
              Full VRF integration available once subscription is configured.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function CoinflipPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-text-muted">Loading...</div>}>
      <CoinflipGame />
    </Suspense>
  );
}
