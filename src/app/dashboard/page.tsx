"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { GameCard } from "@/components/dashboard/GameCard";
import { StatCard } from "@/components/ui/StatCard";
import { GlowButton } from "@/components/ui/GlowButton";
import { GlowCard } from "@/components/ui/GlowCard";
import { Badge } from "@/components/ui/Badge";
import { SkeletonStatCard, SkeletonCard } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { WalletModal } from "@/components/ui/WalletModal";
import { MOCK_GAMES, MOCK_ACTIVITIES } from "@/lib/mockData";
import { useChronosBattle, useAgentRegistry, useStablecoinEconomy } from "@/hooks/useContracts";
import { useWallet } from "@/hooks/useWallet";
import {
  Gamepad2,
  DollarSign,
  Layers,
  Activity,
  Rocket,
  UserPlus,
  Coins,
  FileText,
  Bot,
  Globe,
  ArrowRight,
  Code2,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ConnectButton } from "@rainbow-me/rainbowkit";

const activityIcons: Record<string, typeof Activity> = {
  game_created: FileText,
  game_published: Rocket,
  player_joined: UserPlus,
  l1_deployed: Layers,
  revenue_earned: Coins,
};

const l1Chains = [
  { name: "Chronos Battle L1", chainId: 100001, status: "active", blockTime: "2s", validators: 4, txCount: "12.4K" },
  { name: "AI Arena L1", chainId: 100002, status: "active", blockTime: "1s", validators: 3, txCount: "8.7K" },
  { name: "Loot Realm L1", chainId: 100003, status: "deploying", blockTime: "3s", validators: 0, txCount: "0" },
];

function timeAgo(timestamp: string) {
  const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default function DashboardPage() {
  const { isConnected, address, balance, balanceSymbol, chainId, isCorrectNetwork } = useWallet();
  const { matchCount } = useChronosBattle();
  const { totalAgents } = useAgentRegistry();
  const { acceptedTokens } = useStablecoinEconomy();
  const [walletModalOpen, setWalletModalOpen] = useState(false);

  // If wallet not connected, show connect prompt
  if (!isConnected) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <EmptyState
          preset="connect-wallet"
          onAction={() => { }}
          actionLabel="Connect Wallet"
        />
        <div className="flex justify-center mt-4">
          <ConnectButton />
        </div>
      </div>
    );
  }

  // Derive stats from on-chain data (with fallbacks)
  const matchCountNum = matchCount ? Number(matchCount) : undefined;
  const agentCountNum = totalAgents ? Number(totalAgents) : undefined;
  const tokenCount = acceptedTokens ? acceptedTokens.length : undefined;

  const stats = [
    {
      label: "Active L1 Chains",
      value: l1Chains.filter(c => c.status === "active").length,
      icon: <Layers className="h-5 w-5" />,
      trend: { value: 50, isPositive: true },
    },
    {
      label: "AI Agents (ERC-8004)",
      value: agentCountNum !== undefined ? agentCountNum : "—",
      icon: <Bot className="h-5 w-5" />,
      trend: agentCountNum !== undefined ? { value: 33, isPositive: true } : undefined,
    },
    {
      label: "On-Chain Matches",
      value: matchCountNum !== undefined ? matchCountNum : "—",
      icon: <Gamepad2 className="h-5 w-5" />,
      trend: matchCountNum !== undefined ? { value: 12, isPositive: true } : undefined,
    },
    {
      label: "Accepted Tokens",
      value: tokenCount !== undefined ? tokenCount : "—",
      icon: <DollarSign className="h-5 w-5" />,
      trend: tokenCount !== undefined ? { value: 0, isPositive: true } : undefined,
    },
  ];

  const isStatsLoading = matchCount === undefined && totalAgents === undefined;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Developer Dashboard</h1>
          <p className="mt-1 text-sm text-muted">Manage your L1 chains, AI agents, and game economies</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setWalletModalOpen(true)}
            className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm hover:border-accent/30 transition-colors cursor-pointer"
          >
            <Wallet className="h-4 w-4 text-accent" />
            <span className="font-mono text-xs">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
          </button>
          <Link href="/sdk">
            <GlowButton variant="avalanche" size="md">
              <Code2 className="h-4 w-4" />
              SDK Docs
            </GlowButton>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {isStatsLoading
          ? Array.from({ length: 4 }).map((_, i) => (
            <SkeletonStatCard key={i} />
          ))
          : stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <StatCard {...stat} />
            </motion.div>
          ))}
      </motion.div>

      <div className="mt-10 grid gap-8 lg:grid-cols-3">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-8">
          {/* L1 Chains */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Layers className="h-5 w-5 text-avalanche" />
                Your L1 Chains
              </h2>
              <Badge variant="accent">{l1Chains.length} chains</Badge>
            </div>
            <div className="space-y-3">
              {l1Chains.map((chain, i) => (
                <motion.div
                  key={chain.chainId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.05 }}
                >
                  <GlowCard className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-avalanche/10">
                        <Globe className="h-5 w-5 text-avalanche" />
                      </div>
                      <div>
                        <p className="font-medium">{chain.name}</p>
                        <p className="text-xs text-muted font-mono">Chain ID: {chain.chainId}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <p className="text-xs text-muted">Block Time</p>
                        <p className="font-mono font-medium">{chain.blockTime}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted">Validators</p>
                        <p className="font-mono font-medium">{chain.validators}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted">Tx Count</p>
                        <p className="font-mono font-medium">{chain.txCount}</p>
                      </div>
                      <div className={cn(
                        "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                        chain.status === "active" ? "bg-neon-green/10 text-neon-green" : "bg-warning/10 text-warning"
                      )}>
                        <div className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          chain.status === "active" ? "bg-neon-green animate-pulse" : "bg-warning animate-pulse"
                        )} />
                        {chain.status}
                      </div>
                    </div>
                  </GlowCard>
                </motion.div>
              ))}
            </div>
          </div>

          {/* AI Agents On-chain count */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Bot className="h-5 w-5 text-neon-cyan" />
                AI Agents (ERC-8004)
              </h2>
              <Badge variant="accent">
                {agentCountNum !== undefined ? `${agentCountNum} registered` : "Loading..."}
              </Badge>
            </div>
            {agentCountNum === undefined ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : agentCountNum === 0 ? (
              <EmptyState preset="no-agents" actionHref="/sdk" />
            ) : (
              <GlowCard glowColor="cyan">
                <div className="flex items-center gap-4 p-2">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-neon-cyan/10 border border-neon-cyan/20">
                    <Bot className="h-7 w-7 text-neon-cyan" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-neon-cyan">{agentCountNum}</p>
                    <p className="text-sm text-muted">ERC-8004 agents registered on-chain</p>
                  </div>
                </div>
              </GlowCard>
            )}
          </div>

          {/* Games */}
          <div>
            <h2 className="mb-4 text-lg font-semibold flex items-center gap-2">
              <Gamepad2 className="h-5 w-5 text-neon-purple" />
              Deployed Games
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {MOCK_GAMES.map((game, i) => (
                <motion.div
                  key={game.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.08 }}
                >
                  <GameCard game={game} />
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column Activity Feed */}
        <div>
          <h2 className="mb-4 text-lg font-semibold flex items-center gap-2">
            <Activity className="h-5 w-5 text-neon-green" />
            Recent Activity
          </h2>
          <div className="space-y-3">
            {MOCK_ACTIVITIES.map((activity, i) => {
              const Icon = activityIcons[activity.type] || Activity;
              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.08 }}
                  className="flex items-start gap-3 rounded-lg border border-border bg-card p-3"
                >
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent/10 text-accent">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">{activity.message}</p>
                    <p className="mt-0.5 text-xs text-muted">
                      {activity.gameName && (
                        <span className="text-accent">{activity.gameName}</span>
                      )}{" "}
                      {timeAgo(activity.timestamp)}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* On-chain Match Stats */}
          {matchCountNum !== undefined && (
            <div className="mt-6">
              <GlowCard glowColor="cyan" className="text-center">
                <Gamepad2 className="h-6 w-6 text-neon-cyan mx-auto mb-2" />
                <p className="text-2xl font-bold text-neon-cyan">{matchCountNum}</p>
                <p className="text-xs text-muted">Total on-chain matches (Chronos Battle)</p>
              </GlowCard>
            </div>
          )}

          {/* Quick Actions */}
          <div className="mt-8">
            <h3 className="text-sm font-semibold mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <Link href="/sdk" className="flex items-center gap-2 rounded-lg border border-border bg-card p-3 text-sm hover:border-accent/30 transition-colors">
                <Code2 className="h-4 w-4 text-neon-cyan" />
                View SDK Docs
                <ArrowRight className="h-3 w-3 ml-auto text-muted" />
              </Link>
              <Link href="/play/chronos" className="flex items-center gap-2 rounded-lg border border-border bg-card p-3 text-sm hover:border-accent/30 transition-colors">
                <Gamepad2 className="h-4 w-4 text-avalanche" />
                Play Chronos Battle
                <ArrowRight className="h-3 w-3 ml-auto text-muted" />
              </Link>
              <Link href="/games" className="flex items-center gap-2 rounded-lg border border-border bg-card p-3 text-sm hover:border-accent/30 transition-colors">
                <Globe className="h-4 w-4 text-neon-purple" />
                Browse All Games
                <ArrowRight className="h-3 w-3 ml-auto text-muted" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Wallet Modal */}
      <WalletModal
        isOpen={walletModalOpen}
        onClose={() => setWalletModalOpen(false)}
        address={address}
        balance={`${balance} ${balanceSymbol}`}
        chainName={isCorrectNetwork ? "Avalanche Fuji" : "Wrong Network"}
        chainId={chainId}
        isConnected={isConnected}
      />
    </div>
  );
}
