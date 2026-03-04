"use client";

import { motion } from "framer-motion";
import { GlowButton } from "@/components/ui/GlowButton";
import { GradientText } from "@/components/ui/GradientText";
import { Sparkles, ArrowRight, Zap, Code2, Gamepad2 } from "lucide-react";
import Link from "next/link";

export function HeroSection() {
  return (
    <section className="relative flex min-h-[90vh] flex-col items-center justify-center overflow-hidden px-4 text-center">
      {/* Animated background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-hero-gradient" />
        <div className="absolute inset-0 bg-grid-pattern opacity-40" />

        <motion.div
          className="absolute left-1/4 top-1/4 h-[500px] w-[500px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(176,38,255,0.08) 0%, transparent 70%)" }}
          animate={{ x: [0, 30, -20, 0], y: [0, -20, 30, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute right-1/4 top-1/3 h-[400px] w-[400px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(0,240,255,0.06) 0%, transparent 70%)" }}
          animate={{ x: [0, -25, 15, 0], y: [0, 20, -25, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute left-1/2 bottom-1/4 h-[300px] w-[300px] -translate-x-1/2 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(232,65,66,0.05) 0%, transparent 70%)" }}
          animate={{ x: [0, 20, -15, 0], y: [0, -15, 20, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neon-cyan/10 to-transparent" />
      </div>

      {/* Content */}
      <motion.div
        className="relative z-10 flex flex-col items-center"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mb-8 inline-flex items-center gap-2 rounded-full border border-neon-cyan/20 bg-neon-cyan/5 px-4 py-2 text-sm text-neon-cyan backdrop-blur-sm"
        >
          <Zap className="h-3.5 w-3.5" />
          <span>The Blockchain Layer for Any Game</span>
          <div className="h-1 w-1 rounded-full bg-neon-cyan animate-pulse-glow" />
        </motion.div>

        {/* Heading */}
        <motion.h1
          className="max-w-5xl text-5xl font-extrabold leading-[1.1] tracking-tight sm:text-6xl lg:text-7xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          Give Your Game Its Own{" "}
          <br className="hidden sm:block" />
          <GradientText gradient="cyan-purple" className="text-glow-cyan">
            Avalanche Blockchain
          </GradientText>
        </motion.h1>

        {/* Subheading */}
        <motion.p
          className="mx-auto mt-6 max-w-2xl text-lg text-muted sm:text-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.6 }}
        >
          Build in Unity, Unreal, or React. Avalon handles the chain — your own{" "}
          <span className="text-neon-cyan">Avalanche L1</span>,{" "}
          <span className="text-neon-purple">AI NPCs with wallets</span>,{" "}
          <span className="text-gold">stablecoin economies</span>, and{" "}
          <span className="text-neon-green">provably fair loot</span>.
        </motion.p>

        {/* CTAs */}
        <motion.div
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          <Link href="/play/chronos">
            <GlowButton variant="avalanche" size="lg" icon={<Gamepad2 className="h-5 w-5" />}>
              Play Chronos Battle
            </GlowButton>
          </Link>
          <Link href="/sdk">
            <GlowButton variant="ghost" size="lg">
              <Code2 className="h-4 w-4" />
              View SDK Docs
              <ArrowRight className="h-4 w-4" />
            </GlowButton>
          </Link>
        </motion.div>

        {/* Stats bar */}
        <motion.div
          className="mt-16 flex flex-wrap items-center justify-center gap-8 sm:gap-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          {[
            { value: "Own L1", label: "Per Game" },
            { value: "AI NPCs", label: "ERC-8004" },
            { value: "VRF", label: "Fair Loot" },
            { value: "USDT", label: "Economy" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-lg font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}
