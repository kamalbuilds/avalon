"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Users, Activity, Layers } from "lucide-react";
import type { Game, GameStatus } from "@/types";

const statusVariant: Record<GameStatus, "success" | "warning" | "danger" | "default" | "accent"> = {
  draft: "default",
  deploying: "warning",
  live: "success",
  paused: "danger",
  archived: "default",
};

interface GameCardProps {
  game: Game;
}

export function GameCard({ game }: GameCardProps) {
  return (
    <Link href={`/games/${game.id}`}>
      <Card
        glow
        className="group cursor-pointer overflow-hidden p-0"
        whileHover={{ y: -4 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        {/* Thumbnail */}
        <div className="relative h-40 bg-gradient-to-br from-accent/20 via-card to-card overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(99,102,241,0.15),transparent_70%)]" />
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
            <Badge variant={statusVariant[game.state.status]}>
              {game.state.status}
            </Badge>
            {game.chainConfig.chainId > 0 && (
              <Badge variant="accent">
                <Layers className="mr-1 h-3 w-3" />
                L1
              </Badge>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="p-4">
          <h3 className="font-semibold truncate group-hover:text-accent transition-colors">
            {game.name}
          </h3>
          <p className="mt-1 text-xs text-muted line-clamp-2">
            {game.description}
          </p>

          <div className="mt-3 flex items-center gap-4 text-xs text-muted">
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {game.state.playerCount}
            </span>
            <span className="flex items-center gap-1">
              <Activity className="h-3.5 w-3.5" />
              {game.state.activeMatches} matches
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
