import { formatEther, type Address } from "viem";
import { leaseStatuses, type Status } from "../types/lease";

export function formatEth(wei: bigint): string {
  return `${formatEther(wei).replace(".", ",")} ETH`;
}

export function formatDate(seconds: bigint): string {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(Number(seconds) * 1000));
}

export function shortAddress(address: Address): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function statusLabel(status: number): Status | "Inconnu" {
  return leaseStatuses[status] ?? "Inconnu";
}
