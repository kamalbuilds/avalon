"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useWallet } from "@/hooks/useWallet";
import { GlowButton } from "@/components/ui/GlowButton";
import { AlertTriangle, Wallet, Gamepad2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import type { ReactNode } from "react";

interface WalletGateProps {
  children: ReactNode;
  requireNetwork?: boolean;
}

export function WalletGate({ children, requireNetwork = true }: WalletGateProps) {
  const { isConnected, isCorrectNetwork, switchToFuji } = useWallet();
  const searchParams = useSearchParams();
  const isDemo = searchParams.get("demo") === "true";

  if (isDemo) {
    return <>{children}</>;
  }

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-border bg-card mb-6">
          <Wallet className="h-10 w-10 text-accent" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
        <p className="text-muted text-center max-w-md mb-8">
          Connect your wallet to access the Avalon dashboard, deploy games, and play on-chain.
        </p>
        <div className="flex flex-col items-center gap-3">
          <ConnectButton />
          <a
            href="?demo=true"
            className="inline-flex items-center gap-2 text-sm text-muted hover:text-accent transition-colors"
          >
            <Gamepad2 className="h-4 w-4" />
            Try Demo
          </a>
        </div>
      </div>
    );
  }

  if (requireNetwork && !isCorrectNetwork) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-warning/30 bg-warning/10 mb-6">
          <AlertTriangle className="h-10 w-10 text-warning" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Wrong Network</h2>
        <p className="text-muted text-center max-w-md mb-8">
          Please switch to Avalanche Fuji testnet to use Avalon.
        </p>
        <GlowButton variant="avalanche" onClick={switchToFuji}>
          Switch to Fuji
        </GlowButton>
      </div>
    );
  }

  return <>{children}</>;
}
