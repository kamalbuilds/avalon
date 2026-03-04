"use client";

import Link from "next/link";
import { Sparkles, Github, Twitter } from "lucide-react";

const footerLinks = {
  product: [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Games", href: "/games" },
    { label: "SDK Docs", href: "/sdk" },
    { label: "Play Chronos", href: "/play/chronos" },
  ],
  ecosystem: [
    { label: "Avalanche", href: "https://avax.network" },
    { label: "Chainlink VRF", href: "https://chain.link" },
    { label: "Tether WDK", href: "https://tether.io" },
    { label: "ERC-8004", href: "#" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/15 border border-accent/30">
                <Sparkles className="h-5 w-5 text-accent" />
              </div>
              <span className="text-lg font-bold tracking-tight">
                Ava<span className="text-accent">lon</span>
              </span>
            </Link>
            <p className="mt-4 max-w-sm text-sm text-muted">
              The blockchain gaming SDK for Avalanche. Deploy your game on its own L1
              with AI NPCs, provably fair loot, and stablecoin economies.
              Build in Unity, Unreal, or React — we handle the chain.
            </p>
            <div className="mt-4 flex gap-3">
              <a href="#" className="rounded-lg border border-border p-2 text-muted transition-colors hover:border-accent/30 hover:text-accent">
                <Github className="h-4 w-4" />
              </a>
              <a href="#" className="rounded-lg border border-border p-2 text-muted transition-colors hover:border-accent/30 hover:text-accent">
                <Twitter className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-sm font-semibold text-foreground">Product</h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-muted transition-colors hover:text-foreground">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground">Ecosystem</h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.ecosystem.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted">
            Built for the Avalanche Build Games 2026
          </p>
          <p className="text-xs text-muted">
            Powered by Avalanche L1 &bull; Chainlink VRF &bull; Tether WDK &bull; ERC-8004
          </p>
        </div>
      </div>
    </footer>
  );
}
