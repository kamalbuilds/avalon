"use client";

import { useState, useCallback, useRef } from "react";
import { type Address } from "viem";
import { usePublicClient } from "wagmi";
import { useLootVRF } from "./useContracts";
import { useWallet } from "./useWallet";
import { LootVRFABI } from "@/lib/contracts/abis/LootVRF";
import { CONTRACT_ADDRESSES } from "@/lib/contracts/addresses";
import { rollLootFromVRF, rollLoot, type LootItem } from "@/engine/chronos/opponents";

export type VRFLootStatus =
  | "idle"
  | "requesting" // sending tx to requestRandomLoot
  | "pending_vrf" // waiting for Chainlink VRF callback
  | "fulfilled" // VRF fulfilled, loot resolved
  | "error"
  | "demo"; // fallback demo mode

export interface VRFLootResult {
  item: LootItem;
  vrfRequestId: string | null; // hex string of the on-chain requestId
  vrfProofHash: string | null; // the randomWord as hex (the VRF proof)
  vrfTxHash: string | null; // the transaction hash
  isDemoMode: boolean;
}

const CHRONOS_GAME_ID = BigInt(1); // Game ID for Chronos Battle in the LootVRF contract
const VRF_POLL_INTERVAL = 3000; // poll every 3s for fulfillment
const VRF_MAX_POLLS = 40; // max ~2 minutes of polling

/**
 * Hook that orchestrates requesting loot from the on-chain LootVRF contract,
 * polling for Chainlink VRF fulfillment, and resolving to a LootItem.
 *
 * Falls back to Math.random() demo mode when:
 * - wallet is not connected
 * - ?demo=true URL param is active
 * - the VRF request fails
 */
export function useVRFLoot() {
  const { address, isConnected } = useWallet();
  const { requestRandomLoot, isRequestPending } = useLootVRF();
  const publicClient = usePublicClient();

  const [status, setStatus] = useState<VRFLootStatus>("idle");
  const [result, setResult] = useState<VRFLootResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cleanup = useCallback(() => {
    if (pollRef.current) {
      clearTimeout(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  /**
   * Request loot. If isDemo or no wallet, uses Math.random() fallback.
   * Otherwise calls the LootVRF contract and polls for fulfillment.
   */
  const requestLoot = useCallback(
    async (isDemoMode: boolean) => {
      cleanup();
      setError(null);

      // Demo fallback
      if (isDemoMode || !isConnected || !address) {
        const item = rollLoot();
        const fakeVrfId = `0x${Array.from({ length: 64 }, () =>
          Math.floor(Math.random() * 16).toString(16)
        ).join("")}`;
        setResult({
          item,
          vrfRequestId: fakeVrfId,
          vrfProofHash: null,
          vrfTxHash: null,
          isDemoMode: true,
        });
        setStatus("demo");
        return;
      }

      // Real VRF request
      try {
        setStatus("requesting");

        const txHash = await requestRandomLoot(
          CHRONOS_GAME_ID,
          address as Address
        );

        if (!txHash || !publicClient) {
          throw new Error("Transaction failed or no public client");
        }

        // Wait for transaction receipt to get the LootRequested event
        const receipt = await publicClient.waitForTransactionReceipt({
          hash: txHash,
        });

        // Parse LootRequested event to get requestId
        let requestId: bigint | null = null;
        for (const log of receipt.logs) {
          try {
            // LootRequested event topic
            // event LootRequested(uint256 indexed requestId, uint256 indexed gameId, address indexed player)
            if (log.address.toLowerCase() === CONTRACT_ADDRESSES.lootVRF.toLowerCase() && log.topics.length >= 2) {
              // requestId is the first indexed param (topics[1])
              requestId = BigInt(log.topics[1] as string);
              break;
            }
          } catch {
            // skip unparseable logs
          }
        }

        if (requestId === null) {
          throw new Error("Could not parse LootRequested event from receipt");
        }

        const requestIdHex = `0x${requestId.toString(16).padStart(64, "0")}`;
        setStatus("pending_vrf");

        // Poll for VRF fulfillment
        let polls = 0;
        const poll = async () => {
          polls++;
          try {
            const dropData = await publicClient.readContract({
              address: CONTRACT_ADDRESSES.lootVRF,
              abi: LootVRFABI,
              functionName: "getLootDrop",
              args: [requestId!],
            });

            // dropData is a tuple: [gameId, player, rarity, lootId, fulfilled, randomWord]
            const drop = dropData as unknown as readonly [bigint, string, number, bigint, boolean, bigint];
            const fulfilled = drop[4];

            if (fulfilled) {
              const rarity = drop[2]; // enum Rarity index
              const randomWord = drop[5];
              const item = rollLootFromVRF(randomWord, rarity);
              const proofHash = `0x${randomWord.toString(16).padStart(64, "0")}`;

              setResult({
                item,
                vrfRequestId: requestIdHex,
                vrfProofHash: proofHash,
                vrfTxHash: txHash,
                isDemoMode: false,
              });
              setStatus("fulfilled");
              return;
            }

            if (polls >= VRF_MAX_POLLS) {
              // VRF taking too long, fall back to demo
              console.warn("VRF fulfillment timed out, falling back to demo mode");
              const item = rollLoot();
              setResult({
                item,
                vrfRequestId: requestIdHex,
                vrfProofHash: null,
                vrfTxHash: txHash,
                isDemoMode: true,
              });
              setStatus("demo");
              return;
            }

            // Not fulfilled yet, poll again
            pollRef.current = setTimeout(poll, VRF_POLL_INTERVAL);
          } catch (pollError) {
            console.error("VRF poll error:", pollError);
            // Fall back to demo on poll error
            const item = rollLoot();
            setResult({
              item,
              vrfRequestId: requestIdHex,
              vrfProofHash: null,
              vrfTxHash: txHash,
              isDemoMode: true,
            });
            setStatus("demo");
          }
        };

        pollRef.current = setTimeout(poll, VRF_POLL_INTERVAL);
      } catch (err) {
        console.error("VRF loot request failed:", err);
        setError(err instanceof Error ? err.message : "VRF request failed");
        // Fall back to demo mode on any error
        const item = rollLoot();
        setResult({
          item,
          vrfRequestId: null,
          vrfProofHash: null,
          vrfTxHash: null,
          isDemoMode: true,
        });
        setStatus("demo");
      }
    },
    [isConnected, address, requestRandomLoot, publicClient, cleanup]
  );

  const reset = useCallback(() => {
    cleanup();
    setStatus("idle");
    setResult(null);
    setError(null);
  }, [cleanup]);

  return {
    status,
    result,
    error,
    isLoading: status === "requesting" || status === "pending_vrf",
    isRequestPending,
    requestLoot,
    reset,
  };
}
