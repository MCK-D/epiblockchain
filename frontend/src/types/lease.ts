import type { Address, Hex } from "viem";

// Même ordre que l'enum Status du contrat : l'index lu sur la chaîne donne le libellé.
export const leaseStatuses = [
  "Proposé",
  "Actif",
  "Réclamation",
  "Litige",
  "Clôturé",
  "Annulé",
] as const;

export type Status = (typeof leaseStatuses)[number];

// Bail tel que renvoyé par getLease, avec son identifiant.
export type Lease = {
  id: bigint;
  landlord: Address;
  tenant: Address;
  arbiter: Address;
  status: number;
  endDate: bigint;
  claimedAt: bigint;
  disputedAt: bigint;
  deposit: bigint;
  claimAmount: bigint;
  leaseHash: Hex;
  claimHash: Hex;
};

export type Role = "Propriétaire" | "Locataire" | "Arbitre";
