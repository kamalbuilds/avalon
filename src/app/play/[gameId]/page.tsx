"use client";

import { use, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { MOCK_GAMES } from "@/lib/mockData";
import { cn } from "@/lib/utils";
import {
  Heart,
  Coins,
  Clock,
  Zap,
  Gauge,
  Turtle,
  User,
  Swords,
  Trophy,
} from "lucide-react";

interface MoveButton {
  type: "fast" | "medium" | "slow";
  label: string;
  cost: number;
  icon: typeof Zap;
  color: string;
}

const moveButtons: MoveButton[] = [
  { type: "fast", label: "FAST", cost: 3, icon: Zap, color: "text-danger" },
  { type: "medium", label: "MEDIUM", cost: 2, icon: Gauge, color: "text-warning" },
  { type: "slow", label: "SLOW", cost: 1, icon: Turtle, color: "text-success" },
];

export default function PlayPage({
  params,
}: {
  params: Promise<{ gameId: string }>;
}) {
  const { gameId } = use(params);
  const game = MOCK_GAMES.find((g) => g.id === gameId) ?? MOCK_GAMES[0];

  const [playerHealth, setPlayerHealth] = useState(85);
  const [opponentHealth, setOpponentHealth] = useState(72);
  const [currency, setCurrency] = useState(25);
  const [timeRemaining, setTimeRemaining] = useState(180);
  const [movesInFlight, setMovesInFlight] = useState<
    { id: number; type: string; progress: number }[]
  >([]);
  const [matchStatus, setMatchStatus] = useState<"active" | "waiting">("active");

  // Timer countdown
  useEffect(() => {
    if (matchStatus !== "active") return;
    const timer = setInterval(() => {
      setTimeRemaining((t) => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [matchStatus]);

  // Animate moves in flight
  useEffect(() => {
    const interval = setInterval(() => {
      setMovesInFlight((prev) =>
        prev
          .map((m) => ({ ...m, progress: m.progress + 5 }))
          .filter((m) => m.progress <= 100)
      );
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const handleMove = (move: MoveButton) => {
    if (currency < move.cost) return;
    setCurrency((c) => c - move.cost);
    setMovesInFlight((prev) => [
      ...prev,
      { id: Date.now(), type: move.type, progress: 0 },
    ]);
    // Simulate opponent taking damage
    setTimeout(() => {
      const damage = move.type === "fast" ? 15 : move.type === "medium" ? 10 : 5;
      setOpponentHealth((h) => Math.max(0, h - damage));
    }, move.type === "fast" ? 500 : move.type === "medium" ? 1000 : 2000);
  };

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <div className="relative flex h-[calc(100vh-4rem)] flex-col bg-background">
      {/* HUD Top Bar */}
      <div className="flex items-center justify-between border-b border-border bg-surface/80 px-6 py-3 backdrop-blur-sm">
        <div className="flex items-center gap-6">
          {/* Player Health */}
          <div className="flex items-center gap-2">
            <Heart className="h-4 w-4 text-danger" />
            <div className="h-3 w-32 overflow-hidden rounded-full bg-border">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-danger to-danger/70"
                animate={{ width: `${playerHealth}%` }}
                transition={{ type: "spring", stiffness: 200 }}
              />
            </div>
            <span className="text-xs font-mono text-foreground">
              {playerHealth}/100
            </span>
          </div>

          {/* Currency */}
          <div className="flex items-center gap-1.5">
            <Coins className="h-4 w-4 text-warning" />
            <span className="text-sm font-bold text-warning">{currency}</span>
          </div>
        </div>

        {/* Match Timer */}
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted" />
          <span
            className={cn(
              "font-mono text-lg font-bold",
              timeRemaining < 30 ? "text-danger" : "text-foreground"
            )}
          >
            {formatTime(timeRemaining)}
          </span>
        </div>

        {/* Match Status */}
        <Badge variant={matchStatus === "active" ? "success" : "warning"}>
          {matchStatus === "active" ? "LIVE" : "WAITING"}
        </Badge>
      </div>

      {/* Main Game Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Game Canvas */}
        <div className="relative flex-1 bg-background">
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Background grid */}
            <div
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage:
                  "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
                backgroundSize: "48px 48px",
              }}
            />

            {/* Moves in flight visualization */}
            <AnimatePresence>
              {movesInFlight.map((move) => (
                <motion.div
                  key={move.id}
                  initial={{ x: -100, opacity: 0, scale: 0.5 }}
                  animate={{
                    x: (move.progress / 100) * 300 - 100,
                    opacity: move.progress < 80 ? 1 : 0,
                    scale: 1,
                  }}
                  exit={{ opacity: 0, scale: 0 }}
                  className={cn(
                    "absolute h-4 w-4 rounded-full",
                    move.type === "fast"
                      ? "bg-danger shadow-[0_0_15px_rgba(255,23,68,0.5)]"
                      : move.type === "medium"
                      ? "bg-warning shadow-[0_0_15px_rgba(255,230,0,0.5)]"
                      : "bg-success shadow-[0_0_15px_rgba(57,255,20,0.5)]"
                  )}
                />
              ))}
            </AnimatePresence>

            <div className="text-center">
              <Swords className="mx-auto h-16 w-16 text-muted/20 mb-4" />
              <p className="text-muted/60 text-sm">Game Arena — {game.name}</p>
            </div>
          </div>
        </div>

        {/* Right Panel — Opponent */}
        <div className="flex w-64 flex-col border-l border-border bg-surface">
          <div className="border-b border-border p-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <User className="h-4 w-4 text-muted" />
              Opponent
            </h3>
          </div>
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-danger/10 border border-danger/20">
                <User className="h-5 w-5 text-danger" />
              </div>
              <div>
                <p className="text-sm font-medium">AvalancheHero</p>
                <p className="text-xs text-muted">0xbbbb...2222</p>
              </div>
            </div>

            {/* Opponent Health */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted">Health</span>
                <span className="font-mono">{opponentHealth}/100</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-border">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-neon-cyan to-neon-cyan/60"
                  animate={{ width: `${opponentHealth}%` }}
                  transition={{ type: "spring", stiffness: 200 }}
                />
              </div>
            </div>

            <div className="mt-6 rounded-lg border border-border bg-card p-3">
              <h4 className="text-xs font-medium text-muted mb-2">Stats</h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted">Wins</span>
                  <span className="text-success font-mono">79</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Losses</span>
                  <span className="text-danger font-mono">18</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Ranking</span>
                  <span className="text-warning font-mono">#2</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom — Move Controls */}
      <div className="border-t border-border bg-surface px-6 py-4">
        <div className="mx-auto flex max-w-lg items-center justify-center gap-4">
          {moveButtons.map((move) => {
            const Icon = move.icon;
            const canAfford = currency >= move.cost;
            return (
              <motion.button
                key={move.type}
                whileHover={canAfford ? { scale: 1.05 } : {}}
                whileTap={canAfford ? { scale: 0.95 } : {}}
                onClick={() => handleMove(move)}
                disabled={!canAfford}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-xl border px-6 py-3 transition-all",
                  canAfford
                    ? "border-border bg-card hover:border-accent/30 cursor-pointer"
                    : "border-border/50 bg-card/50 opacity-40 cursor-not-allowed"
                )}
              >
                <Icon className={cn("h-6 w-6", move.color)} />
                <span className="text-sm font-bold">{move.label}</span>
                <span className="flex items-center gap-1 text-xs text-warning">
                  <Coins className="h-3 w-3" />
                  {move.cost}
                </span>
              </motion.button>
            );
          })}
        </div>

        {/* Moves in flight indicator */}
        {movesInFlight.length > 0 && (
          <div className="mt-3 text-center">
            <span className="text-xs text-muted">
              {movesInFlight.length} move{movesInFlight.length > 1 ? "s" : ""} in flight
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
