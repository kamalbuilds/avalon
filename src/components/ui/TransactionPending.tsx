"use client";

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ExternalLink, CheckCircle, XCircle, Loader2 } from "lucide-react";

type TxStatus = "pending" | "confirming" | "success" | "failed";

interface TransactionPendingProps {
  isOpen: boolean;
  status: TxStatus;
  txHash?: string;
  message?: string;
  onClose?: () => void;
  explorerBaseUrl?: string;
}

const statusConfig: Record<TxStatus, { icon: typeof Loader2; color: string; label: string; glow: string }> = {
  pending: {
    icon: Loader2,
    color: "text-neon-cyan",
    label: "Submitting Transaction...",
    glow: "shadow-[0_0_30px_rgba(0,240,255,0.2)]",
  },
  confirming: {
    icon: Loader2,
    color: "text-neon-purple",
    label: "Waiting for Confirmation...",
    glow: "shadow-[0_0_30px_rgba(176,38,255,0.2)]",
  },
  success: {
    icon: CheckCircle,
    color: "text-neon-green",
    label: "Transaction Confirmed!",
    glow: "shadow-[0_0_30px_rgba(57,255,20,0.2)]",
  },
  failed: {
    icon: XCircle,
    color: "text-neon-red",
    label: "Transaction Failed",
    glow: "shadow-[0_0_30px_rgba(255,23,68,0.2)]",
  },
};

export function TransactionPending({
  isOpen,
  status,
  txHash,
  message,
  onClose,
  explorerBaseUrl = "https://testnet.snowtrace.io/tx",
}: TransactionPendingProps) {
  const config = statusConfig[status];
  const Icon = config.icon;
  const isSpinning = status === "pending" || status === "confirming";
  const isDismissible = status === "success" || status === "failed";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={isDismissible ? onClose : undefined}
          />

          {/* Card */}
          <motion.div
            className={cn(
              "relative w-full max-w-sm rounded-2xl border border-border bg-card p-8",
              config.glow
            )}
            style={{ background: "linear-gradient(135deg, #0f0f18 0%, #151520 100%)" }}
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <div className="flex flex-col items-center text-center">
              {/* Icon with glow ring */}
              <div className="relative">
                <motion.div
                  className={cn("h-16 w-16 flex items-center justify-center rounded-full", config.color)}
                  style={{
                    background: `radial-gradient(circle, ${
                      status === "pending" ? "rgba(0,240,255,0.1)" :
                      status === "confirming" ? "rgba(176,38,255,0.1)" :
                      status === "success" ? "rgba(57,255,20,0.1)" :
                      "rgba(255,23,68,0.1)"
                    } 0%, transparent 70%)`,
                  }}
                >
                  <Icon className={cn("h-8 w-8", isSpinning && "animate-spin")} />
                </motion.div>

                {/* Pulse ring for pending states */}
                {isSpinning && (
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-current opacity-20"
                    style={{ borderColor: status === "pending" ? "#00F0FF" : "#B026FF" }}
                    animate={{ scale: [1, 1.8], opacity: [0.3, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}
              </div>

              {/* Status label */}
              <h3 className={cn("mt-5 text-lg font-bold", config.color)}>
                {config.label}
              </h3>

              {/* Custom message */}
              {message && (
                <p className="mt-2 text-sm text-muted">{message}</p>
              )}

              {/* Tx hash */}
              {txHash && (
                <a
                  href={`${explorerBaseUrl}/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-surface px-3 py-2 text-xs font-mono text-muted transition-colors hover:text-neon-cyan"
                >
                  {txHash.slice(0, 10)}...{txHash.slice(-8)}
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}

              {/* Block confirmations animation */}
              {status === "confirming" && (
                <div className="mt-4 flex items-center gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="h-2 w-2 rounded-full bg-neon-purple"
                      animate={{ opacity: [0.2, 1, 0.2] }}
                      transition={{
                        duration: 1.2,
                        repeat: Infinity,
                        delay: i * 0.3,
                      }}
                    />
                  ))}
                  <span className="ml-1 text-[10px] text-muted font-mono">3 confirmations</span>
                </div>
              )}

              {/* Dismiss button */}
              {isDismissible && (
                <motion.button
                  onClick={onClose}
                  className="mt-6 rounded-lg border border-border px-6 py-2 text-sm font-medium text-muted transition-colors hover:text-foreground hover:border-accent/30 cursor-pointer"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  {status === "success" ? "Continue" : "Try Again"}
                </motion.button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
