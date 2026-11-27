/// <reference types="vite/client" />
import { defineChain } from "viem";
import { baseSepolia } from "wagmi/chains";

export { baseSepolia };

// Plan de secours de la soutenance : si Base Sepolia est indisponible,
// `VITE_CHAIN=local npm run dev` vise un nœud Hardhat local sur lequel le même
// module Ignition a été déployé (voir DEMO.md). Par défaut : Base Sepolia.
export const isLocal = import.meta.env.VITE_CHAIN === "local";

export const hardhatLocal = defineChain({
  id: 31337,
  name: "Nœud local Hardhat",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["http://127.0.0.1:8545"] } },
});

export const appChain = isLocal ? hardhatLocal : baseSepolia;
