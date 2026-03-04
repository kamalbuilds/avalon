"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { GlowButton } from "./GlowButton";
import {
  Swords,
  Bot,
  Wallet,
  Gamepad2,
  type LucideIcon,
} from "lucide-react";

type EmptyPreset = "no-matches" | "no-agents" | "connect-wallet" | "no-games";

interface EmptyStateProps {
  preset?: EmptyPreset;
  icon?: LucideIcon;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
  className?: string;
}

const presetConfig: Record<EmptyPreset, { icon: LucideIcon; title: string; description: string; actionLabel: string }> = {
  "no-matches": {
    icon: Swords,
    title: "No Matches Yet",
    description: "You haven't played any matches. Jump into Chronos Battle and test your strategy against AI opponents.",
    actionLabel: "Start a Match",
  },
  "no-agents": {
    icon: Bot,
    title: "No Agents Deployed",
    description: "You don't have any ERC-8004 AI agents yet. Create autonomous NPCs with on-chain identity and wallets.",
    actionLabel: "Deploy an Agent",
  },
  "connect-wallet": {
    icon: Wallet,
    title: "Connect Your Wallet",
    description: "Connect your wallet to see your games, matches, agents, and earnings. We support MetaMask, WalletConnect, and more.",
    actionLabel: "Connect Wallet",
  },
  "no-games": {
    icon: Gamepad2,
    title: "No Games Found",
    description: "There are no games here yet. Be the first to create one — every game gets its own Avalanche L1 blockchain.",
    actionLabel: "Create a Game",
  },
};

export function EmptyState({
  preset,
  icon: CustomIcon,
  title: customTitle,
  description: customDesc,
  actionLabel: customAction,
  onAction,
  actionHref,
  className,
}: EmptyStateProps) {
  const config = preset ? presetConfig[preset] : null;
  const Icon = CustomIcon || config?.icon || Gamepad2;
  const title = customTitle || config?.title || "Nothing Here";
  const description = customDesc || config?.description || "No items to display.";
  const actionLabel = customAction || config?.actionLabel;

  return (
    <motion.div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface/50 px-8 py-16 text-center",
        className
      )}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/5 border border-accent/10">
        <Icon className="h-8 w-8 text-muted" />
      </div>

      <h3 className="mt-5 text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-muted">{description}</p>

      {actionLabel && (onAction || actionHref) && (
        <div className="mt-6">
          {actionHref ? (
            <a href={actionHref}>
              <GlowButton variant="primary" size="md">{actionLabel}</GlowButton>
            </a>
          ) : (
            <GlowButton variant="primary" size="md" onClick={onAction}>{actionLabel}</GlowButton>
          )}
        </div>
      )}
    </motion.div>
  );
}
