import {
  isAddress,
  isAddressEqual,
  parseEther,
  type Address,
  type Hex,
} from "viem";

export type LeaseFormValues = {
  tenant: string;
  arbiter: string;
  deposit: string;
  endDate: string; // valeur d'un <input type="datetime-local">
  leaseHash: Hex | undefined;
};

export type LeaseFormField = keyof LeaseFormValues;

export type CreateLeaseArgs = readonly [Address, Address, bigint, bigint, Hex];

// Reprend les règles de createLease pour expliquer l'erreur avant toute
// transaction. Le contrat reste la seule autorité : il revérifie tout.
export function validateLeaseForm(
  values: LeaseFormValues,
  landlord: Address,
  nowSeconds: bigint,
):
  | { args: CreateLeaseArgs; errors?: undefined }
  | { args?: undefined; errors: Partial<Record<LeaseFormField, string>> } {
  const errors: Partial<Record<LeaseFormField, string>> = {};
  const tenant = values.tenant.trim();
  const arbiter = values.arbiter.trim();

  if (!isAddress(tenant)) errors.tenant = "Adresse Ethereum invalide.";
  else if (isAddressEqual(tenant, landlord))
    errors.tenant = "Le locataire doit être différent du propriétaire.";

  if (!isAddress(arbiter)) errors.arbiter = "Adresse Ethereum invalide.";
  else if (isAddressEqual(arbiter, landlord))
    errors.arbiter = "L’arbitre doit être différent du propriétaire.";
  else if (isAddress(tenant) && isAddressEqual(arbiter, tenant))
    errors.arbiter = "L’arbitre doit être différent du locataire.";

  let deposit = 0n;
  try {
    deposit = parseEther(values.deposit.trim().replace(",", "."));
  } catch {
    errors.deposit = "Montant invalide.";
  }
  if (!errors.deposit && deposit <= 0n)
    errors.deposit = "La caution doit être supérieure à zéro.";

  const time = new Date(values.endDate).getTime();
  const endDate = Number.isNaN(time) ? 0n : BigInt(Math.floor(time / 1000));
  if (endDate === 0n) errors.endDate = "Date de fin requise.";
  else if (endDate <= nowSeconds)
    errors.endDate = "La date de fin doit être dans le futur.";

  if (!values.leaseHash)
    errors.leaseHash = "Ajoutez le bail et l’état des lieux d’entrée.";

  if (Object.keys(errors).length > 0 || !values.leaseHash) return { errors };
  return {
    args: [
      tenant as Address,
      arbiter as Address,
      deposit,
      endDate,
      values.leaseHash,
    ],
  };
}
