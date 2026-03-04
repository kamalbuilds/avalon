"use client";

import { useAccount, useBalance, useChainId, useSwitchChain } from "wagmi";
import { avalancheFuji } from "wagmi/chains";
import { FUJI_CHAIN_ID } from "@/lib/contracts/addresses";

export function useWallet() {
  const { address, isConnected, isConnecting } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { data: balance } = useBalance({ address });

  const isCorrectNetwork = chainId === FUJI_CHAIN_ID;

  const switchToFuji = () => {
    switchChain({ chainId: avalancheFuji.id });
  };

  return {
    address,
    isConnected,
    isConnecting,
    chainId,
    isCorrectNetwork,
    balance: balance ? (Number(balance.value) / 10 ** balance.decimals).toFixed(4) : "0",
    balanceSymbol: balance?.symbol ?? "AVAX",
    switchToFuji,
  };
}
