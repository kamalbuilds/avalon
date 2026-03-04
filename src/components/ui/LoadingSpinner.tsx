"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  label?: string;
}

const sizeMap = {
  sm: "h-6 w-6",
  md: "h-10 w-10",
  lg: "h-16 w-16",
};

export function LoadingSpinner({ size = "md", className, label }: LoadingSpinnerProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-4", className)}>
      <div className="relative">
        {/* Outer ring */}
        <motion.div
          className={cn(
            "rounded-full border-2 border-border",
            sizeMap[size]
          )}
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        />

        {/* Spinning arc */}
        <motion.div
          className={cn(
            "absolute inset-0 rounded-full border-2 border-transparent border-t-neon-cyan border-r-neon-purple",
            sizeMap[size]
          )}
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
          style={{
            filter: "drop-shadow(0 0 6px rgba(0, 240, 255, 0.4))",
          }}
        />

        {/* Inner glow dot */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <div
            className="h-1.5 w-1.5 rounded-full bg-neon-cyan"
            style={{ boxShadow: "0 0 8px #00F0FF, 0 0 16px #00F0FF60" }}
          />
        </motion.div>
      </div>

      {label && (
        <motion.p
          className="text-sm text-muted"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          {label}
        </motion.p>
      )}
    </div>
  );
}
