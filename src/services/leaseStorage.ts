import { demoLeases } from "../data/demoLeases";
import type { Lease } from "../types/lease";

export const LEASE_STORAGE_KEY = "caution-leases";

export function loadLeases(): Lease[] {
  try {
    return (
      JSON.parse(localStorage.getItem(LEASE_STORAGE_KEY) || "null") ||
      demoLeases
    );
  } catch {
    return demoLeases;
  }
}

export function storeLeases(leases: Lease[]) {
  localStorage.setItem(LEASE_STORAGE_KEY, JSON.stringify(leases));
}

export function clearLeases() {
  localStorage.removeItem(LEASE_STORAGE_KEY);
}
