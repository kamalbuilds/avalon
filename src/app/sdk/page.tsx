"use client";

import { motion } from "framer-motion";
import { GlowCard } from "@/components/ui/GlowCard";
import { GlowButton } from "@/components/ui/GlowButton";
import { GradientText } from "@/components/ui/GradientText";
import { Badge } from "@/components/ui/Badge";
import {
  Code2,
  Terminal,
  Bot,
  Shield,
  Coins,
  Layers,
  Plug,
  Copy,
  Check,
  ArrowRight,
  Gamepad2,
  Cpu,
  Database,
  Zap,
  BookOpen,
} from "lucide-react";
import { useState } from "react";
import Link from "next/link";

function CodeBlock({ title, code, language = "typescript" }: { title: string; code: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-border bg-[#0d0d14] overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-danger/60" />
          <div className="h-3 w-3 rounded-full bg-warning/60" />
          <div className="h-3 w-3 rounded-full bg-neon-green/60" />
          <span className="ml-2 text-xs text-muted font-mono">{title}</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted hover:text-foreground transition-colors"
        >
          {copied ? <Check className="h-3 w-3 text-neon-green" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-sm font-mono leading-relaxed">
        <code className="text-muted/90">{code}</code>
      </pre>
    </div>
  );
}

const modules = [
  {
    icon: Layers,
    title: "L1 Deployment",
    description: "Deploy your game on its own Avalanche L1 with custom parameters block time, gas token, validator set.",
    color: "text-avalanche",
    bgColor: "bg-avalanche/10",
    methods: ["avalon.l1.deploy()", "avalon.l1.status()"],
  },
  {
    icon: Bot,
    title: "AI Agents (ERC-8004)",
    description: "Create autonomous NPCs with on-chain identity, wallets, and behavior trees. They perceive, think, and act.",
    color: "text-neon-cyan",
    bgColor: "bg-neon-cyan/10",
    methods: ["avalon.agents.create()", "avalon.agents.get()", "avalon.agents.totalAgents()", "avalon.agents.updateReputation()"],
  },
  {
    icon: Shield,
    title: "VRF Loot System",
    description: "Provably fair loot drops, random encounters, and reward distribution powered by Chainlink VRF v2.5.",
    color: "text-neon-purple",
    bgColor: "bg-neon-purple/10",
    methods: ["avalon.vrf.roll()", "avalon.vrf.configureLootTable()", "avalon.vrf.getLastDrop()"],
  },
  {
    icon: Coins,
    title: "Stablecoin Economy",
    description: "Built-in USDT economies via Tether WDK. Entry fees, prizes, in-game purchases, player earnings.",
    color: "text-gold",
    bgColor: "bg-gold/10",
    methods: ["avalon.economy.stats()", "avalon.economy.deposit()", "avalon.economy.isTokenAccepted()"],
  },
  {
    icon: Cpu,
    title: "Game State",
    description: "On-chain game state management with state diffing, history, and cross-chain synchronization.",
    color: "text-neon-green",
    bgColor: "bg-neon-green/10",
    methods: ["avalon.state.get()", "avalon.state.update()", "avalon.state.history()"],
  },
  {
    icon: Database,
    title: "Player Onboarding",
    description: "30-second onboarding for non-crypto players. Embedded wallets, social login, gas abstraction.",
    color: "text-info",
    bgColor: "bg-info/10",
    methods: ["avalon.onboard.create()", "avalon.onboard.socialLogin()", "avalon.onboard.abstractGas()"],
  },
];

const installCode = `# Install the Avalon SDK
npm install @avalon/sdk

# Or with yarn
yarn add @avalon/sdk`;

const quickStartCode = `import { Avalon } from '@avalon/sdk';

// 1. Initialize Avalon (connects to Fuji testnet)
const avalon = new Avalon({ network: 'fuji' });

// 2. Deploy your game on its own Avalanche L1
const chain = await avalon.l1.deploy({
  name: 'My Epic Game',
  blockTime: 2,
});
console.log(\`Chain live: \${chain.rpcUrl}\`);

// 3. Create an AI NPC with ERC-8004 identity
const npc = await avalon.agents.create({
  name: 'Iron Merchant',
  archetype: 'merchant',
});
console.log(\`NPC registered: token #\${npc.tokenId}\`);

// 4. Roll for loot (Chainlink VRF v2.5)
const loot = await avalon.vrf.roll(playerAddress);
console.log(\`Dropped: \${loot.item.name} (\${loot.rarity})\`);

// 5. Check economy stats
const stats = await avalon.economy.stats();
console.log(\`Total deposits: \${stats.totalDeposits}\`);

// That's it! Your game now has:
// - Its own Avalanche L1 chain
// - AI NPCs with on-chain wallets
// - Provably fair loot via Chainlink VRF
// - Stablecoin economies via Tether WDK`;

const unityCode = `// Unity C# Avalon Plugin
using Avalon.SDK;

public class GameManager : MonoBehaviour
{
    private AvalonClient avalon;

    async void Start()
    {
        // Connect to your Avalon-powered game L1
        avalon = new AvalonClient("your-game-id");
        await avalon.Connect();

        // Get NPC merchant and interact
        var merchant = await avalon.Agents.Get("aria-merchant");
        var offer = await merchant.NegotiateTrade(
            playerInventory, "Frost Blade"
        );

        // Roll for loot with VRF
        var loot = await avalon.VRF.Roll("legendary-weapons");
        Debug.Log($"You found: {loot.ItemName} ({loot.Rarity})!");
    }
}`;

const pythonCode = `# Python Avalon SDK
from avalon_sdk import Avalon

# 1. Initialize
avalon = Avalon(
    api_key="your-api-key",
    network="fuji"
)

# 2. Deploy a game L1
chain = avalon.l1.deploy(
    name="My Python Game",
    block_time=2,
    gas_token="GAME"
)

# 3. Create an AI NPC
npc = avalon.agents.create(
    name="Merchant Zara",
    archetype="merchant",
    personality={"greed": 0.6, "loyalty": 0.8}
)

# 4. Roll for loot
loot = avalon.vrf.roll("legendary-weapons")
print(f"Dropped: {loot.item_name} ({loot.rarity})")`;

const sdkTabs = [
  { id: "typescript", label: "TypeScript", file: "quickstart.ts" },
  { id: "unity", label: "Unity C#", file: "GameManager.cs" },
  { id: "python", label: "Python", file: "quickstart.py" },
] as const;

const l1DeployCode = `import { Avalon } from '@avalon/sdk';

const avalon = new Avalon({
  apiKey: process.env.AVALON_API_KEY!,
  network: 'fuji', // or 'mainnet'
});

// Deploy your game on its own Avalanche L1
const chain = await avalon.l1.deploy({
  name: 'Dragon Quest Online',
  blockTime: 2,           // 2-second block time
  gasToken: 'DQO',        // your game's native token
  validators: {
    minStake: '2000',     // minimum stake in AVAX
    maxValidators: 5,
  },
  nativeTokenSupply: '1_000_000',
});

console.log('Chain ID:', chain.chainId);    // e.g. 99999
console.log('RPC URL:', chain.rpcUrl);      // https://rpc.dragon-quest.avax.gg
console.log('Explorer:', chain.explorerUrl);

// Fine-tune EVM settings for your players
await avalon.l1.configure(chain.chainId, {
  maxGasLimit: 8_000_000,
  baseFeeEnabled: false,   // gasless for players
  precompiles: ['warp', 'nativeMinter'],
});

console.log('L1 ready for players!');`;

const agentCreateCode = `import { Avalon } from '@avalon/sdk';

const avalon = new Avalon({
  apiKey: process.env.AVALON_API_KEY!,
  network: 'fuji',
});

// Create an autonomous AI NPC with ERC-8004 on-chain identity
const guardian = await avalon.agents.create({
  name: 'Iron Guardian',
  archetype: 'warrior',
  personality: {
    aggression:   0.85,  // 0 = passive,     1 = relentless
    caution:      0.40,  // 0 = reckless,    1 = defensive
    adaptability: 0.70,  // 0 = predictable, 1 = unpredictable
    loyalty:      0.60,  // 0 = selfish,     1 = team-focused
  },
  wallet: {
    initialBalance: '10.00',  // USDT starting treasury
    autoEarn: true,           // earns from wins and loot sales
  },
  behaviors: ['attack', 'defend', 'flee', 'taunt'],
  model: 'chronos-v1',        // AI model powering decisions
});

console.log('Agent ID:',  guardian.agentId);
// --> "0x2636...Fd7F:42"
console.log('Wallet:',    guardian.walletAddress);
// --> "0xAbCd...1234"

// Agents have real on-chain wallets — they buy gear, pay entry fees, earn prizes
const balance = await avalon.agents.getWallet(guardian.agentId);
console.log('Treasury:', balance.usdt, 'USDT');`;

const vrfLootCode = `import { Avalon } from '@avalon/sdk';

const avalon = new Avalon({
  apiKey: process.env.AVALON_API_KEY!,
  network: 'fuji',
});

// Configure a loot table once during game setup
await avalon.vrf.configureTable('post-battle-drops', {
  drops: [
    { item: 'Void Crystal',  rarity: 'legendary', weight: 1  },
    { item: 'Frost Blade',   rarity: 'epic',       weight: 5  },
    { item: 'Shadow Dagger', rarity: 'rare',       weight: 15 },
    { item: 'Iron Sword',    rarity: 'common',     weight: 79 },
  ],
});

// After a battle ends, roll for loot using Chainlink VRF v2.5
const result = await avalon.vrf.rollLoot({
  table:   'post-battle-drops',
  player:  '0xPlayerAddress',
  matchId: 'match-0042',   // for on-chain audit trail
  count:   1,              // number of items to drop
});

// Every drop is provably fair — verifiable on-chain via Snowtrace
console.log('Dropped:', result.drops[0].item);    // "Shadow Dagger"
console.log('Rarity:',  result.drops[0].rarity);  // "rare"
console.log('VRF ID:',  result.vrfRequestId);     // on-chain request hash

// Verify any historical drop — players can audit their own luck
const proof = await avalon.vrf.verify(result.vrfRequestId);
console.log('Tamper-proof:', proof.isValid);       // true`;

const exampleTabs = [
  { id: "l1-deploy",  label: "L1 Deploy",  file: "l1-deploy.ts",  icon: "Layers",  code: l1DeployCode },
  { id: "ai-agents",  label: "AI Agents",  file: "ai-agents.ts",  icon: "Bot",     code: agentCreateCode },
  { id: "vrf-loot",   label: "VRF Loot",   file: "vrf-loot.ts",   icon: "Shield",  code: vrfLootCode },
] as const;

export default function SDKPage() {
  const [activeSDKTab, setActiveSDKTab] = useState<string>("typescript");
  const [activeExampleTab, setActiveExampleTab] = useState<string>("l1-deploy");
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      {/* Header */}
      <motion.div
        className="text-center mb-16"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Badge variant="accent" className="mb-4">
          <Code2 className="h-3 w-3" />
          Developer SDK
        </Badge>
        <h1 className="text-4xl font-bold sm:text-5xl">
          Build On-Chain Games{" "}
          <GradientText gradient="cyan-purple">Your Way</GradientText>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted">
          Keep building in Unity, Unreal, or React. Avalon gives your game its own
          Avalanche L1 with AI agents, fair loot, and real economies through a simple SDK.
        </p>
      </motion.div>

      {/* Install */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="mb-16"
      >
        <CodeBlock title="terminal" code={installCode} language="bash" />
      </motion.div>

      {/* SDK Modules */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="mb-16"
      >
        <h2 className="text-2xl font-bold mb-8">
          <BookOpen className="inline h-6 w-6 mr-2 text-neon-cyan" />
          SDK Modules
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((mod, i) => {
            const Icon = mod.icon;
            return (
              <motion.div
                key={mod.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.05, duration: 0.4 }}
              >
                <GlowCard className="h-full">
                  <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${mod.bgColor}`}>
                    <Icon className={`h-5 w-5 ${mod.color}`} />
                  </div>
                  <h3 className="font-semibold">{mod.title}</h3>
                  <p className="mt-1.5 text-sm text-muted">{mod.description}</p>
                  <div className="mt-3 space-y-1">
                    {mod.methods.map((method) => (
                      <code key={method} className="block text-xs font-mono text-neon-cyan/70">
                        {method}
                      </code>
                    ))}
                  </div>
                </GlowCard>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Code Examples */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="mb-16"
      >
        <h2 className="text-2xl font-bold mb-2">
          <Terminal className="inline h-6 w-6 mr-2 text-neon-green" />
          Code Examples
        </h2>
        <p className="text-muted mb-6">
          Three focused recipes you can copy-paste into your game today.
        </p>

        {/* Example tabs */}
        <div className="flex flex-wrap items-center gap-1 mb-4 p-1 rounded-lg bg-surface border border-border w-fit">
          {exampleTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveExampleTab(tab.id)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all cursor-pointer ${
                activeExampleTab === tab.id
                  ? "bg-accent/15 text-accent border border-accent/30"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {exampleTabs.map((tab) =>
          activeExampleTab === tab.id ? (
            <CodeBlock key={tab.id} title={tab.file} code={tab.code} />
          ) : null
        )}
      </motion.div>

      {/* Quick Start Tab Switcher */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="mb-16"
      >
        <h2 className="text-2xl font-bold mb-2">
          <Zap className="inline h-6 w-6 mr-2 text-neon-purple" />
          Quick Start
        </h2>
        <p className="text-muted mb-4">Deploy a full on-chain game in your language of choice.</p>

        {/* Language tabs */}
        <div className="flex items-center gap-1 mb-4 p-1 rounded-lg bg-surface border border-border w-fit">
          {sdkTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSDKTab(tab.id)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all cursor-pointer ${activeSDKTab === tab.id
                  ? "bg-accent/15 text-accent border border-accent/30"
                  : "text-muted hover:text-foreground"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeSDKTab === "typescript" && (
          <CodeBlock title="quickstart.ts" code={quickStartCode} />
        )}
        {activeSDKTab === "unity" && (
          <CodeBlock title="GameManager.cs" code={unityCode} language="csharp" />
        )}
        {activeSDKTab === "python" && (
          <CodeBlock title="quickstart.py" code={pythonCode} language="python" />
        )}
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="text-center py-16"
      >
        <h2 className="text-3xl font-bold">
          Ready to Ship?
        </h2>
        <p className="mt-4 text-muted">
          See Avalon in action play Chronos Battle, built entirely on the SDK.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link href="/play/chronos">
            <GlowButton variant="avalanche" size="lg">
              <Gamepad2 className="h-5 w-5" />
              Play Chronos Battle
              <ArrowRight className="h-4 w-4" />
            </GlowButton>
          </Link>
          <Link href="/dashboard">
            <GlowButton variant="ghost" size="lg">
              Open Dashboard
            </GlowButton>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
