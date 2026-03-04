"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { GlowButton } from "@/components/ui/GlowButton";
import {
  Trophy,
  Skull,
  Swords,
  Shield,
  Timer,
  Coins,
  Zap,
  Target,
  TrendingUp,
  Gift,
  ExternalLink,
} from "lucide-react";

interface MatchStats {
  result: "victory" | "defeat";
  playerHP: number;
  opponentHP: number;
  maxHP: number;
  damageDealt: number;
  damageReceived: number;
  movesUsed: number;
  blocksPlayed: number;
  coinsSpent: number;
  coinsEarned: number;
  timeElapsed: string;
  shieldsUsed: number;
  countersLanded: number;
  lootReward?: { name: string; rarity: string; icon: string };
  vrfProofUrl?: string;
  txHash?: string;
}

interface MatchResultProps {
  stats: MatchStats;
  onPlayAgain: () => void;
  onMenu: () => void;
  onViewLoot?: () => void;
}

function StatRow({ icon: Icon, label, value, color }: {
  icon: typeof Swords;
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2.5">
        <Icon className={cn("h-4 w-4", color || "text-muted")} />
        <span className="text-sm text-muted">{label}</span>
      </div>
      <span className="text-sm font-mono font-bold">{value}</span>
    </div>
  );
}

export function MatchResult({ stats, onPlayAgain, onMenu, onViewLoot }: MatchResultProps) {
  const isVictory = stats.result === "victory";

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto py-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />

      <motion.div
        className="relative w-full max-w-lg mx-4"
        initial={{ scale: 0.9, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.1 }}
      >
        {/* Result header */}
        <motion.div
          className={cn(
            "relative overflow-hidden rounded-t-2xl border border-b-0 p-8 text-center",
            isVictory
              ? "border-neon-green/20 bg-gradient-to-b from-neon-green/10 to-card"
              : "border-neon-red/20 bg-gradient-to-b from-neon-red/10 to-card"
          )}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <motion.div
            className={cn(
              "mx-auto flex h-20 w-20 items-center justify-center rounded-full",
              isVictory ? "bg-neon-green/10" : "bg-neon-red/10"
            )}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.4 }}
          >
            {isVictory ? (
              <Trophy className="h-10 w-10 text-neon-green" />
            ) : (
              <Skull className="h-10 w-10 text-neon-red" />
            )}
          </motion.div>

          <motion.h2
            className={cn(
              "mt-4 text-3xl font-black uppercase tracking-wider",
              isVictory ? "text-neon-green" : "text-neon-red"
            )}
            style={{
              textShadow: isVictory
                ? "0 0 20px rgba(57,255,20,0.5)"
                : "0 0 20px rgba(255,23,68,0.5)",
            }}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {isVictory ? "VICTORY" : "DEFEAT"}
          </motion.h2>

          {/* HP comparison */}
          <motion.div
            className="mt-4 flex items-center justify-center gap-4 text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <span className="text-neon-cyan font-mono">You: {stats.playerHP}/{stats.maxHP} HP</span>
            <span className="text-muted">vs</span>
            <span className="text-neon-magenta font-mono">AI: {stats.opponentHP}/{stats.maxHP} HP</span>
          </motion.div>
        </motion.div>

        {/* Stats body */}
        <motion.div
          className="rounded-b-2xl border border-t-0 border-border bg-card p-6"
          style={{ background: "linear-gradient(180deg, #111118 0%, #0f0f18 100%)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="divide-y divide-border">
            <StatRow icon={Swords} label="Damage Dealt" value={stats.damageDealt} color="text-neon-red" />
            <StatRow icon={Shield} label="Damage Blocked" value={stats.damageReceived} color="text-accent" />
            <StatRow icon={Target} label="Moves Used" value={stats.movesUsed} color="text-neon-cyan" />
            <StatRow icon={TrendingUp} label="Counters Landed" value={stats.countersLanded} color="text-neon-purple" />
            <StatRow icon={Shield} label="Shields Used" value={stats.shieldsUsed} color="text-neon-green" />
            <StatRow icon={Coins} label="Coins Spent" value={`${stats.coinsSpent} AVAX`} color="text-gold" />
            <StatRow icon={Zap} label="Coins Earned" value={`+${stats.coinsEarned} USDT`} color="text-gold" />
            <StatRow icon={Timer} label="Time Elapsed" value={stats.timeElapsed} />
          </div>

          {/* Loot reward */}
          {stats.lootReward && (
            <motion.div
              className="mt-4 rounded-lg border border-neon-purple/20 bg-neon-purple/5 p-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{stats.lootReward.icon}</span>
                  <div>
                    <p className="text-sm font-bold">{stats.lootReward.name}</p>
                    <p className="text-xs text-neon-purple capitalize">{stats.lootReward.rarity}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {onViewLoot && (
                    <button
                      onClick={onViewLoot}
                      className="rounded-md px-3 py-1.5 text-xs font-medium text-neon-purple border border-neon-purple/20 hover:bg-neon-purple/10 transition-colors cursor-pointer"
                    >
                      <Gift className="inline h-3 w-3 mr-1" />
                      View
                    </button>
                  )}
                  {stats.vrfProofUrl && (
                    <a
                      href={stats.vrfProofUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-muted hover:text-neon-cyan transition-colors"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Tx hash */}
          {stats.txHash && (
            <a
              href={`https://testnet.snowtrace.io/tx/${stats.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex items-center justify-center gap-2 text-xs font-mono text-muted hover:text-neon-cyan transition-colors"
            >
              Tx: {stats.txHash.slice(0, 10)}...{stats.txHash.slice(-6)}
              <ExternalLink className="h-3 w-3" />
            </a>
          )}

          {/* Actions */}
          <div className="mt-6 flex gap-3">
            <GlowButton variant="avalanche" size="lg" className="flex-1" onClick={onPlayAgain}>
              Play Again
            </GlowButton>
            <GlowButton variant="ghost" size="lg" className="flex-1" onClick={onMenu}>
              Menu
            </GlowButton>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
