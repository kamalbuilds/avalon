"use client";

import { use, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Tabs } from "@/components/ui/Tabs";
import { MOCK_GAMES, MOCK_LEADERBOARD, MOCK_NPCS } from "@/lib/mockData";
import {
  Users,
  Activity,
  Layers,
  Play,
  Trophy,
  Bot,
  Coins,
  ArrowRight,
  Shield,
  Swords,
  ShoppingBag,
} from "lucide-react";
import Link from "next/link";
import type { GameStatus } from "@/types";

const statusVariant: Record<GameStatus, "success" | "warning" | "danger" | "default" | "accent"> = {
  draft: "default",
  deploying: "warning",
  live: "success",
  paused: "danger",
  archived: "default",
};

const npcBehaviorIcons: Record<string, typeof Shield> = {
  Guardian: Shield,
  Merchant: ShoppingBag,
  Shadow: Swords,
};

const gameTabs = [
  { id: "overview", label: "Overview" },
  { id: "leaderboard", label: "Leaderboard", count: MOCK_LEADERBOARD.length },
  { id: "npcs", label: "AI NPCs", count: MOCK_NPCS.length },
  { id: "economy", label: "Economy" },
];

export default function GameDetailPage({
  params,
}: {
  params: Promise<{ gameId: string }>;
}) {
  const { gameId } = use(params);
  const [activeTab, setActiveTab] = useState("overview");
  const game = MOCK_GAMES.find((g) => g.id === gameId) ?? MOCK_GAMES[0];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Hero Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-accent/10 via-card to-card"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(99,102,241,0.15),transparent_60%)]" />
        <div className="relative p-8 sm:p-12">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3">
                <Badge variant={statusVariant[game.state.status]} className="text-sm">
                  {game.state.status}
                </Badge>
                {game.chainConfig.chainId > 0 && (
                  <Badge variant="accent">
                    <Layers className="mr-1 h-3 w-3" />
                    Chain #{game.chainConfig.chainId}
                  </Badge>
                )}
              </div>
              <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
                {game.name}
              </h1>
              <p className="mt-3 text-muted">{game.description}</p>

              <div className="mt-6 flex items-center gap-6 text-sm text-muted">
                <span className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" /> {game.state.playerCount} players
                </span>
                <span className="flex items-center gap-1.5">
                  <Activity className="h-4 w-4" /> {game.state.activeMatches} live
                </span>
                <span className="flex items-center gap-1.5">
                  <Bot className="h-4 w-4" /> {game.state.npcCount} NPCs
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Link href={`/play/${game.id}`}>
                <Button size="lg" className="w-full sm:w-auto">
                  <Play className="h-5 w-5" />
                  Play Now
                </Button>
              </Link>
              {game.config.entryFee !== "0" && (
                <p className="text-center text-xs text-muted">
                  Entry fee: ${game.config.entryFee} USDT
                </p>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="mt-8">
        <Tabs tabs={gameTabs} onChange={setActiveTab} />
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === "overview" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            <Card className="p-5">
              <h3 className="text-sm font-medium text-muted">Max Players</h3>
              <p className="mt-1 text-2xl font-bold">{game.config.maxPlayers}</p>
            </Card>
            <Card className="p-5">
              <h3 className="text-sm font-medium text-muted">Tick Rate</h3>
              <p className="mt-1 text-2xl font-bold">{game.config.tickRate} TPS</p>
            </Card>
            <Card className="p-5">
              <h3 className="text-sm font-medium text-muted">World Size</h3>
              <p className="mt-1 text-2xl font-bold">
                {game.config.worldWidth} x {game.config.worldHeight}
              </p>
            </Card>
            <Card className="p-5">
              <h3 className="text-sm font-medium text-muted">VRF Loot</h3>
              <p className="mt-1 text-2xl font-bold">
                {game.config.vrfEnabled ? "Enabled" : "Disabled"}
              </p>
            </Card>
            <Card className="p-5">
              <h3 className="text-sm font-medium text-muted">Reward Pool</h3>
              <p className="mt-1 text-2xl font-bold">${game.config.rewardPool}</p>
            </Card>
            <Card className="p-5">
              <h3 className="text-sm font-medium text-muted">Tournaments</h3>
              <p className="mt-1 text-2xl font-bold">
                {game.config.enableTournaments ? "Active" : "Off"}
              </p>
            </Card>
          </motion.div>
        )}

        {activeTab === "leaderboard" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card className="overflow-hidden p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-card">
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted">Rank</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted">Player</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted">Score</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted">W/L</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_LEADERBOARD.map((entry) => (
                    <tr
                      key={entry.rank}
                      className="border-b border-border/50 hover:bg-card-hover transition-colors"
                    >
                      <td className="px-4 py-3">
                        <span
                          className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                            entry.rank === 1
                              ? "bg-warning/20 text-warning"
                              : entry.rank === 2
                              ? "bg-muted/20 text-muted"
                              : entry.rank === 3
                              ? "bg-neon-orange/20 text-neon-orange"
                              : "text-muted"
                          }`}
                        >
                          {entry.rank}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium">{entry.playerName}</p>
                          <p className="text-xs text-muted">{entry.playerAddress}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-accent">
                        {entry.score.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-success">{entry.wins}</span>
                        <span className="text-muted">/</span>
                        <span className="text-danger">{entry.losses}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </motion.div>
        )}

        {activeTab === "npcs" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {MOCK_NPCS.map((npc) => (
              <Card key={npc.id} glow className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                      <Bot className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{npc.identity?.name}</h3>
                      <p className="text-xs text-muted">
                        Token #{npc.identity?.tokenId}
                      </p>
                    </div>
                  </div>
                  <Badge variant={npc.isActive ? "success" : "default"}>
                    {npc.isActive ? "Active" : "Idle"}
                  </Badge>
                </div>
                <p className="mt-3 text-sm text-muted">
                  {npc.identity?.personality}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {npc.identity?.capabilities.map((cap) => (
                    <Badge key={cap} variant="accent" className="text-[10px]">
                      {cap}
                    </Badge>
                  ))}
                </div>
              </Card>
            ))}
          </motion.div>
        )}

        {activeTab === "economy" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            <Card className="p-5">
              <h3 className="text-sm font-medium text-muted">Total Deposited</h3>
              <p className="mt-1 text-2xl font-bold text-success">
                ${game.economy.totalDeposited}
              </p>
            </Card>
            <Card className="p-5">
              <h3 className="text-sm font-medium text-muted">Total Withdrawn</h3>
              <p className="mt-1 text-2xl font-bold text-danger">
                ${game.economy.totalWithdrawn}
              </p>
            </Card>
            <Card className="p-5">
              <h3 className="text-sm font-medium text-muted">Active Balance</h3>
              <p className="mt-1 text-2xl font-bold text-accent">
                ${game.economy.activeBalance}
              </p>
            </Card>
            <Card className="p-5">
              <h3 className="text-sm font-medium text-muted">Currency</h3>
              <p className="mt-1 text-2xl font-bold">{game.economy.currency}</p>
            </Card>
            <Card className="p-5">
              <h3 className="text-sm font-medium text-muted">Platform Fee</h3>
              <p className="mt-1 text-2xl font-bold">
                {(game.economy.feePercentage / 100).toFixed(1)}%
              </p>
            </Card>
            <Card className="p-5">
              <h3 className="text-sm font-medium text-muted">Treasury</h3>
              <p className="mt-1 truncate font-mono text-xs text-muted">
                {game.economy.treasuryAddress}
              </p>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
