"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { GlowCard } from "@/components/ui/GlowCard";
import { GlowButton } from "@/components/ui/GlowButton";
import { Input } from "@/components/ui/Input";
import { useChronosBattle } from "@/hooks/useContracts";
import {
  Search,
  Users,
  Activity,
  Layers,
  ArrowUpDown,
  Gamepad2,
  Swords,
  ArrowRight,
  Clock,
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

export default function GamesPage() {
  const [search, setSearch] = useState("");
  const { matchCount } = useChronosBattle();
  const matchCountNum = matchCount ? Number(matchCount) : 0;

  // Chronos Battle is the real featured game
  const chronosGame = {
    id: "chronos",
    name: "Chronos Battle",
    description: "Turn-based strategic combat against ERC-8004 AI agents. Pick your moves wisely each has cost, delay, and damage. Win USDT prizes.",
    status: "live" as GameStatus,
    playerCount: matchCountNum > 0 ? matchCountNum * 2 : 142,
    activeMatches: matchCountNum > 0 ? matchCountNum : 8,
    entryFee: "1.00",
    chainId: 43113,
    chainName: "Avalanche Fuji",
    href: "/play/chronos",
  };

  // Avalanche Coinflip is the second live game
  const coinflipGame = {
    id: "coinflip",
    name: "Avalanche Coinflip",
    description: "Predict HIGH or LOW. Streaks multiply winnings. Powered by Chainlink VRF for provably fair results.",
    status: "live" as GameStatus,
    playerCount: 89,
    activeMatches: 12,
    entryFee: "0.50",
    chainId: 43113,
    chainName: "Avalanche Fuji",
    href: "/play/coinflip",
  };

  // Coming soon games
  const comingSoonGames = [
    {
      id: "avalanche-legends",
      name: "Avalanche Legends",
      icon: "\u26A1",
      description: "Last player standing wins the prize pool. Every NPC is an autonomous agent with a wallet.",
      status: "draft" as GameStatus,
      accentColor: "#e84142",
    },
    {
      id: "loot-realm",
      name: "Loot Realm",
      icon: "\uD83D\uDC8E",
      description: "Build a merchant empire. Trade with AI NPCs. Earn USDT from stablecoin economies.",
      status: "draft" as GameStatus,
      accentColor: "#FFE600",
    },
  ];

  const filteredComingSoon = comingSoonGames.filter(
    (game) => !search || game.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Browse Games</h1>
        <p className="mt-1 text-sm text-muted">
          Games built on the Avalon SDK with Avalanche L1 chains
        </p>
      </div>

      {/* Featured: Chronos Battle */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mt-8"
      >
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wider mb-3">Featured Game</h2>
        <Link href={chronosGame.href}>
          <GlowCard glowColor="cyan" className="group cursor-pointer">
            <div className="flex flex-col sm:flex-row sm:items-center gap-6">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 border border-neon-cyan/30">
                <Swords className="h-10 w-10 text-neon-cyan" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-2xl font-bold group-hover:text-neon-cyan transition-colors">
                    {chronosGame.name}
                  </h3>
                  <Badge variant="success">LIVE</Badge>
                  <Badge variant="accent">
                    <Layers className="mr-1 h-3 w-3" />
                    {chronosGame.chainName}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-muted max-w-2xl">{chronosGame.description}</p>
                <div className="mt-3 flex items-center gap-6 text-xs text-muted">
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {chronosGame.playerCount} players
                  </span>
                  <span className="flex items-center gap-1">
                    <Activity className="h-3.5 w-3.5" />
                    {chronosGame.activeMatches} matches
                  </span>
                  <span className="flex items-center gap-1 text-gold">
                    ${chronosGame.entryFee} USDT entry
                  </span>
                </div>
              </div>
              <div className="shrink-0">
                <GlowButton variant="cyan" size="lg">
                  <Gamepad2 className="h-5 w-5" />
                  Play Now
                  <ArrowRight className="h-4 w-4" />
                </GlowButton>
              </div>
            </div>
          </GlowCard>
        </Link>
      </motion.div>

      {/* Second Game: Avalanche Coinflip */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.5 }}
        className="mt-4"
      >
        <Link href={coinflipGame.href}>
          <GlowCard glowColor="purple" className="group cursor-pointer">
            <div className="flex flex-col sm:flex-row sm:items-center gap-6">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-gold/20 to-neon-purple/20 border border-gold/30">
                <ArrowUpDown className="h-10 w-10 text-gold" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-2xl font-bold group-hover:text-gold transition-colors">
                    {coinflipGame.name}
                  </h3>
                  <Badge variant="success">LIVE</Badge>
                  <Badge variant="accent">
                    <Layers className="mr-1 h-3 w-3" />
                    {coinflipGame.chainName}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-muted max-w-2xl">{coinflipGame.description}</p>
                <div className="mt-3 flex items-center gap-6 text-xs text-muted">
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {coinflipGame.playerCount} players
                  </span>
                  <span className="flex items-center gap-1">
                    <Activity className="h-3.5 w-3.5" />
                    {coinflipGame.activeMatches} active
                  </span>
                  <span className="flex items-center gap-1 text-gold">
                    ${coinflipGame.entryFee} USDT entry
                  </span>
                </div>
              </div>
              <div className="shrink-0">
                <GlowButton variant="purple" size="lg">
                  <Gamepad2 className="h-5 w-5" />
                  Play Now
                  <ArrowRight className="h-4 w-4" />
                </GlowButton>
              </div>
            </div>
          </GlowCard>
        </Link>
      </motion.div>

      {/* Search */}
      <div className="mt-10 mb-6">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wider mb-3">Coming Soon</h2>
        <Input
          icon={<Search className="h-4 w-4" />}
          placeholder="Search upcoming games..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Coming Soon Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredComingSoon.map((game, i) => (
          <motion.div
            key={game.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.08, duration: 0.4 }}
          >
            <Card className="group overflow-hidden p-0 hover:border-border-bright transition-colors duration-300">
              {/* Banner */}
              <div className="relative h-40 bg-gradient-to-br from-surface-2 via-card to-card overflow-hidden">
                <div
                  className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity duration-300"
                  style={{
                    background: `radial-gradient(circle at 50% 120%, ${game.accentColor}30, transparent 60%)`,
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-5xl opacity-60 group-hover:opacity-80 group-hover:scale-110 transition-all duration-300">
                    {game.icon}
                  </span>
                </div>
                <div className="absolute top-3 right-3">
                  <Badge variant="default">
                    <Clock className="mr-1 h-3 w-3" />
                    Coming Soon
                  </Badge>
                </div>
              </div>

              {/* Info */}
              <div className="p-5">
                <h3
                  className="text-lg font-semibold group-hover:transition-colors duration-200"
                  style={{ color: game.accentColor }}
                >
                  {game.name}
                </h3>
                <p className="mt-2 text-sm text-muted/70 line-clamp-2">
                  {game.description}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <Badge variant="default" className="text-xs">
                    In Development
                  </Badge>
                  <button
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-border-bright/50 text-text-secondary hover:text-text-primary hover:border-border-bright transition-colors duration-200 cursor-pointer"
                    onClick={(e) => e.preventDefault()}
                  >
                    Join Waitlist
                  </button>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {filteredComingSoon.length === 0 && search && (
        <div className="mt-16 text-center">
          <p className="text-muted">No games found matching your search.</p>
        </div>
      )}
    </div>
  );
}
