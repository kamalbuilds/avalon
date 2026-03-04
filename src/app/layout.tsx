import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Web3Provider } from "@/providers/Web3Provider";
import { AvalonProvider } from "@/providers/AvalonProvider";
import { Navbar } from "@/components/Navbar";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Avalon — Blockchain Gaming SDK for Avalanche",
  description:
    "The blockchain layer for any game. Deploy on your own Avalanche L1 with AI NPCs, Chainlink VRF, and stablecoin economies. Build in Unity, Unreal, or React — we handle the chain.",
  openGraph: {
    title: "Avalon — Blockchain Gaming SDK for Avalanche",
    description:
      "Unity builds the graphics. Avalon powers the economy. Deploy on your own Avalanche L1 with ERC-8004 AI agents, Chainlink VRF loot, and USDT economies.",
    siteName: "Avalon",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Avalon — Blockchain Gaming SDK",
    description:
      "The Stripe for on-chain games. Deploy on Avalanche L1 with AI agents, fair loot, and real economies.",
  },
  keywords: [
    "Avalon",
    "Avalanche",
    "blockchain gaming",
    "SDK",
    "L1",
    "ERC-8004",
    "AI NPC",
    "Chainlink VRF",
    "USDT",
    "game development",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        <Web3Provider>
          <AvalonProvider>
            <Navbar />
            <main className="min-h-[calc(100vh-4rem)]">{children}</main>
          </AvalonProvider>
        </Web3Provider>
      </body>
    </html>
  );
}
