"use client";

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { X, Wallet, Copy, ExternalLink, CheckCircle, CircleDot } from "lucide-react";
import { useState } from "react";

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  address?: string;
  balance?: string;
  chainName?: string;
  chainId?: number;
  isConnected?: boolean;
  onDisconnect?: () => void;
}

export function WalletModal({
  isOpen,
  onClose,
  address = "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD38",
  balance = "1,247.50 USDT",
  chainName = "Avalanche Fuji",
  chainId = 43113,
  isConnected = true,
  onDisconnect,
}: WalletModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center sm:items-start sm:justify-end sm:p-4 sm:pt-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

          <motion.div
            className="relative w-full max-w-sm rounded-2xl border border-border bg-card overflow-hidden"
            style={{ background: "linear-gradient(135deg, #0f0f18 0%, #151520 100%)" }}
            initial={{ scale: 0.95, y: -10, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: -10, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-accent" />
                <span className="text-sm font-semibold">Wallet</span>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-muted transition-colors hover:bg-surface hover:text-foreground cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Network status */}
              <div className="flex items-center justify-between rounded-lg bg-surface p-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-avalanche/10">
                    <CircleDot className="h-4 w-4 text-avalanche" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{chainName}</p>
                    <p className="text-xs text-muted font-mono">Chain {chainId}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className={cn(
                    "h-2 w-2 rounded-full",
                    isConnected ? "bg-neon-green animate-pulse" : "bg-danger"
                  )} />
                  <span className="text-xs text-muted">
                    {isConnected ? "Connected" : "Disconnected"}
                  </span>
                </div>
              </div>

              {/* Address */}
              <div className="rounded-lg bg-surface p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted mb-1.5">Address</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-sm font-mono text-foreground">{shortAddress}</code>
                  <button
                    onClick={handleCopy}
                    className="rounded-md p-1.5 text-muted transition-colors hover:bg-border hover:text-foreground cursor-pointer"
                  >
                    {copied ? (
                      <CheckCircle className="h-3.5 w-3.5 text-neon-green" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                  <a
                    href={`https://testnet.snowtrace.io/address/${address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-md p-1.5 text-muted transition-colors hover:bg-border hover:text-neon-cyan cursor-pointer"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>

              {/* Balance */}
              <div className="rounded-lg bg-surface p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted mb-1.5">Balance</p>
                <p className="text-2xl font-bold text-gold">{balance}</p>
              </div>

              {/* Quick actions */}
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={`https://testnet.snowtrace.io/address/${address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-border py-2.5 text-xs font-medium text-muted transition-colors hover:border-accent/30 hover:text-foreground"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Explorer
                </a>
                {onDisconnect && (
                  <button
                    onClick={onDisconnect}
                    className="flex items-center justify-center gap-1.5 rounded-lg border border-danger/20 py-2.5 text-xs font-medium text-danger transition-colors hover:bg-danger/10 cursor-pointer"
                  >
                    Disconnect
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
