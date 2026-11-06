import { isAddressEqual, type Address } from "viem";
import type { Lease, Role } from "../types/lease";

// Rôles de l'adresse connectée sur ce bail, déduits des adresses enregistrées
// dans le contrat (jamais choisis dans l'interface).
export function rolesOf(lease: Lease, account: Address | undefined): Role[] {
  if (!account) return [];
  const roles: Role[] = [];
  if (isAddressEqual(lease.landlord, account)) roles.push("Propriétaire");
  if (isAddressEqual(lease.tenant, account)) roles.push("Locataire");
  if (isAddressEqual(lease.arbiter, account)) roles.push("Arbitre");
  return roles;
}
