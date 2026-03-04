"use client";

import { motion } from "framer-motion";
import { HeroSection } from "@/components/HeroSection";
import { FeatureCard } from "@/components/ui/FeatureCard";
import { GlowCard } from "@/components/ui/GlowCard";
import { GlowButton } from "@/components/ui/GlowButton";
import { GradientText } from "@/components/ui/GradientText";
import { Footer } from "@/components/Footer";
import {
  Layers,
  Bot,
  Coins,
  Gamepad2,
  ArrowRight,
  Zap,
  Play,
  Users,
  Shield,
  Code2,
  Terminal,
  Plug,
  Cpu,
} from "lucide-react";
import Link from "next/link";

const features = [
  {
    icon: Layers,
    title: "Own Avalanche L1",
    description:
      "Every game deploys on its own dedicated L1 chain. Custom gas tokens, tunable block times, sovereign validator sets. Your game, your chain.",
    color: "red" as const,
  },
  {
    icon: Bot,
    title: "ERC-8004 AI Agents",
    description:
      "Autonomous NPCs with on-chain identity, wallets, and reputation. They trade, negotiate, and make economic decisions without human intervention.",
    color: "cyan" as const,
  },
  {
    icon: Shield,
    title: "Chainlink VRF Loot",
    description:
      "Every loot drop, random encounter, and reward is provably fair. Players can verify on-chain that the game never cheats.",
    color: "purple" as const,
  },
  {
    icon: Coins,
    title: "Stablecoin Economy",
    description:
      "Real USDT economies via Tether WDK. Players earn, spend, and trade with real value. Self-custodial wallets out of the box.",
    color: "gold" as const,
  },
];

const integrations = [
  {
    step: "01",
    icon: Plug,
    title: "Connect",
    description: "Add the Avalon SDK to your Unity, Unreal, or React project. One import, one config file.",
    color: "cyan" as const,
  },
  {
    step: "02",
    icon: Cpu,
    title: "Configure",
    description: "Define your AI NPCs, loot tables, and economy through the Avalon dashboard or config API.",
    color: "purple" as const,
  },
  {
    step: "03",
    icon: Play,
    title: "Deploy",
    description: "One click deploys your game on its own Avalanche L1 with all contracts, agents, and economy live.",
    color: "green" as const,
  },
];

const codeExample = `import { Avalon } from '@avalon/sdk';

// Initialize Avalon for your game
const avalon = new Avalon({
  gameId: 'chronos-battle',
  chain: 'avalanche-l1',
  vrfEnabled: true,
  stablecoin: 'USDT',
});

// Register an AI NPC with ERC-8004 identity
const merchant = await avalon.agents.create({
  name: 'Iron Merchant',
  archetype: 'merchant',
  personality: { greed: 0.7, loyalty: 0.4 },
  wallet: { initialBalance: '100 USDT' },
});

// Generate provably fair loot
const loot = await avalon.vrf.rollLoot({
  player: playerAddress,
  table: 'legendary-weapons',
  rarity: 'epic',
});`;

export default function Home() {
  return (
    <div className="relative">
      {/* Hero Section */}
      <HeroSection />

      {/* Features Section */}
      <section className="relative py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <motion.div
            className="mb-16 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-sm font-semibold uppercase tracking-wider text-neon-cyan">
              Powered by Avalanche
            </p>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
              The Full Stack for{" "}
              <GradientText gradient="cyan-purple">On-Chain Gaming</GradientText>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted">
              Avalon is the blockchain backend for game developers. Build your game however
              you want we handle L1 deployment, AI agents, loot, and economies.
            </p>
          </motion.div>

          <div className="grid gap-6 sm:grid-cols-2">
            {features.map((feature, i) => (
              <FeatureCard key={feature.title} {...feature} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Code Example Section */}
      <section className="relative py-24 sm:py-32">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-mesh-gradient opacity-50" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <p className="text-sm font-semibold uppercase tracking-wider text-neon-purple">
                Developer Experience
              </p>
              <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
                Ship On-Chain Games in{" "}
                <GradientText gradient="cyan-purple">Minutes, Not Months</GradientText>
              </h2>
              <p className="mt-4 text-muted">
                A few lines of code gives your game its own Avalanche L1, autonomous AI NPCs with
                real wallets, provably fair loot drops, and a stablecoin economy.
                No blockchain expertise required.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm text-muted">
                  <Code2 className="h-4 w-4 text-neon-cyan" />
                  TypeScript SDK
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm text-muted">
                  <Terminal className="h-4 w-4 text-neon-purple" />
                  CLI Tools
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm text-muted">
                  <Plug className="h-4 w-4 text-neon-green" />
                  Unity Plugin
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.15 }}
            >
              <div className="rounded-xl border border-border bg-[#0d0d14] overflow-hidden">
                <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                  <div className="h-3 w-3 rounded-full bg-danger/60" />
                  <div className="h-3 w-3 rounded-full bg-warning/60" />
                  <div className="h-3 w-3 rounded-full bg-neon-green/60" />
                  <span className="ml-2 text-xs text-muted font-mono">game.ts</span>
                </div>
                <pre className="overflow-x-auto p-4 text-sm font-mono leading-relaxed text-muted/90">
                  {codeExample}
                </pre>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="relative py-24 sm:py-32">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-grid-pattern opacity-20" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <motion.div
            className="mb-16 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-sm font-semibold uppercase tracking-wider text-neon-purple">
              Simple Integration
            </p>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
              From Game to{" "}
              <GradientText gradient="rainbow">Live Blockchain</GradientText>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted">
              Keep building in your engine. Avalon plugs in as your blockchain backend.
            </p>
          </motion.div>

          <div className="grid gap-8 sm:grid-cols-3">
            {integrations.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15, duration: 0.5 }}
                  className="relative"
                >
                  <GlowCard glowColor={step.color} className="h-full text-center">
                    <div className="mb-4 text-5xl font-black text-border-bright/80">{step.step}</div>
                    <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${step.color === "cyan" ? "bg-neon-cyan/10 text-neon-cyan" :
                        step.color === "purple" ? "bg-neon-purple/10 text-neon-purple" :
                          "bg-neon-green/10 text-neon-green"
                      }`}>
                      <Icon className="h-7 w-7" />
                    </div>
                    <h3 className="text-xl font-bold">{step.title}</h3>
                    <p className="mt-2 text-sm text-muted">{step.description}</p>
                  </GlowCard>

                  {i < integrations.length - 1 && (
                    <div className="hidden sm:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10">
                      <ArrowRight className="h-5 w-5 text-border-bright" />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Game Showcase Section */}
      <section className="relative py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <motion.div
            className="mb-16 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-sm font-semibold uppercase tracking-wider text-avalanche">
              Built With Avalon
            </p>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
              See It In{" "}
              <GradientText gradient="avalanche">Action</GradientText>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted">
              Chronos Battle a game where blockchain latency IS the game mechanic.
              Built entirely on Avalon.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <GlowCard glowColor="red" className="overflow-hidden p-0">
              <div className="grid sm:grid-cols-2">
                <div className="relative h-64 sm:h-auto overflow-hidden">
                  <div
                    className="absolute inset-0"
                    style={{
                      background: "radial-gradient(ellipse at center, rgba(232,65,66,0.15) 0%, rgba(176,38,255,0.05) 50%, transparent 100%), linear-gradient(135deg, #0f0f18, #151520)",
                    }}
                  />
                  <div className="relative flex h-full flex-col items-center justify-center p-8">
                    <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-avalanche/10 border border-avalanche/20">
                      <Gamepad2 className="h-10 w-10 text-avalanche" />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-neon-green animate-pulse" />
                      <span className="text-xs text-neon-green font-mono">LIVE ON ITS OWN L1</span>
                    </div>
                  </div>
                </div>

                <div className="p-8 sm:p-10 flex flex-col justify-center">
                  <div className="mb-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-avalanche/10 px-3 py-1 text-xs font-medium text-avalanche">
                    <Zap className="h-3 w-3" />
                    Showcase Game
                  </div>

                  <h3 className="text-2xl font-bold">Chronos Battle</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted">
                    The first game where blockchain latency IS the mechanic. Cheap moves are slow —
                    opponents see them coming. Expensive moves are instant. Built on its own
                    Avalanche L1 with ERC-8004 AI opponents, VRF loot drops, and USDT prizes.
                  </p>

                  <div className="mt-6 flex items-center gap-6 text-sm text-muted">
                    <span className="flex items-center gap-1.5">
                      <Bot className="h-4 w-4 text-neon-cyan" />
                      AI Opponents
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Layers className="h-4 w-4 text-neon-purple" />
                      Own L1
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Coins className="h-4 w-4 text-gold" />
                      USDT Economy
                    </span>
                  </div>

                  <div className="mt-8">
                    <Link href="/play/chronos?demo=true">
                      <GlowButton variant="avalanche" size="md">
                        <Gamepad2 className="h-4 w-4" />
                        Play Now
                        <ArrowRight className="h-4 w-4" />
                      </GlowButton>
                    </Link>
                  </div>
                </div>
              </div>
            </GlowCard>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 sm:py-32">
        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute inset-0"
            style={{
              background: "radial-gradient(ellipse at bottom, rgba(0,240,255,0.05) 0%, transparent 60%)",
            }}
          />
        </div>

        <motion.div
          className="relative mx-auto max-w-3xl px-4 text-center sm:px-6"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl font-bold sm:text-5xl">
            <GradientText gradient="cyan-purple">Unity Builds the Graphics.</GradientText>
            <br />
            Avalon Powers the Economy.
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted">
            Give your game its own Avalanche blockchain, autonomous AI agents with
            real wallets, provably fair loot, and stablecoin economies in minutes.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link href="/sdk">
              <GlowButton variant="avalanche" size="xl" icon={<Code2 className="h-5 w-5" />}>
                Get the SDK
              </GlowButton>
            </Link>
            <Link href="/play/chronos?demo=true">
              <GlowButton variant="ghost" size="xl">
                <Gamepad2 className="h-5 w-5" />
                Try Chronos Battle
              </GlowButton>
            </Link>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-muted">
            <span className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-neon-green" />
              Provably Fair
            </span>
            <span className="flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-avalanche" />
              Own L1 Chain
            </span>
            <span className="flex items-center gap-1.5">
              <Bot className="h-3.5 w-3.5 text-neon-cyan" />
              Autonomous AI NPCs
            </span>
            <span className="flex items-center gap-1.5">
              <Coins className="h-3.5 w-3.5 text-gold" />
              Real Economies
            </span>
          </div>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
}
