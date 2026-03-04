"use client";

import { cn } from "@/lib/utils";
import { motion, type HTMLMotionProps } from "framer-motion";
import { forwardRef, type ReactNode } from "react";

interface CardProps extends Omit<HTMLMotionProps<"div">, "ref" | "children"> {
  glow?: boolean;
  children?: ReactNode;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ glow = false, className, children, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={cn(
          "rounded-xl border border-border bg-card p-4 transition-all duration-300",
          glow && "glow-border",
          !glow && "hover:border-accent/30 hover:bg-card-hover",
          className
        )}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

Card.displayName = "Card";
