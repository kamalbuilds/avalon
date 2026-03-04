"use client";

import { use } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { MOCK_GAMES } from "@/lib/mockData";
import { Gamepad2, ArrowRight, Sparkles } from "lucide-react";
import { GlowButton } from "@/components/ui/GlowButton";
import { GlowCard } from "@/components/ui/GlowCard";

export default function PlayPage({
  params,
}: {
  params: Promise<{ gameId: string }>;
}) {
  const { gameId } = use(params);

  // Chronos Battle is the playable demo — redirect there
  if (gameId === "chronos-battle" || gameId === "chronos") {
    redirect("/play/chronos");
  }

  const game = MOCK_GAMES.find((g) => g.id === gameId);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg w-full text-center"
      >
        <GlowCard glowColor="cyan" className="p-8">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-2xl bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center">
              <Gamepad2 className="w-10 h-10 text-neon-cyan" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-text-primary mb-2">
            {game?.name ?? "Game Not Found"}
          </h1>

          <p className="text-sm text-text-secondary mb-2">
            {game
              ? "This game is built on the Avalon SDK with its own Avalanche L1 chain."
              : "The requested game does not exist."}
          </p>

          {game && (
            <div className="flex items-center justify-center gap-4 text-xs font-mono text-text-muted mb-6">
              <span>{game.players} players</span>
              <span className="text-border-bright">|</span>
              <span>{game.status === "active" ? "Live" : game.status}</span>
            </div>
          )}

          <div className="p-4 rounded-xl bg-surface-2 border border-border mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-neon-yellow" />
              <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
                Play the Demo
              </span>
            </div>
            <p className="text-xs text-text-secondary">
              Chronos Battle is Avalon&apos;s showcase game — a real-time strategy game
              where blockchain latency IS the mechanic. Fight AI opponents with ERC-8004
              identities, earn USDT prizes, and get VRF loot drops.
            </p>
          </div>

          <Link href="/play/chronos">
            <GlowButton variant="avalanche" size="lg" className="w-full">
              <Gamepad2 className="w-5 h-5" />
              Play Chronos Battle
              <ArrowRight className="w-4 h-4" />
            </GlowButton>
          </Link>

          <Link
            href="/games"
            className="block mt-4 text-xs text-text-muted hover:text-text-secondary transition-colors"
          >
            &larr; Back to Games
          </Link>
        </GlowCard>
      </motion.div>
    </div>
  );
}
