import { parseEther, type Hex } from "viem";

export type ClaimFormValues = {
  amount: string;
  claimHash: Hex | undefined;
};

export type ClaimFormField = keyof ClaimFormValues;

// Reprend les règles de claim (InvalidClaimAmount) pour expliquer l'erreur
// avant toute transaction. Le contrat revérifie tout.
export function validateClaimForm(
  values: ClaimFormValues,
  deposit: bigint,
):
  | { args: readonly [bigint, Hex]; errors?: undefined }
  | { args?: undefined; errors: Partial<Record<ClaimFormField, string>> } {
  const errors: Partial<Record<ClaimFormField, string>> = {};

  let amount = 0n;
  try {
    amount = parseEther(values.amount.trim().replace(",", "."));
  } catch {
    errors.amount = "Montant invalide.";
  }
  if (!errors.amount && amount <= 0n)
    errors.amount = "Le montant réclamé doit être supérieur à zéro.";
  else if (!errors.amount && amount > deposit)
    errors.amount = "Le montant réclamé ne peut pas dépasser la caution.";

  if (!values.claimHash)
    errors.claimHash =
      "Ajoutez les justificatifs (état des lieux de sortie, devis).";

  if (Object.keys(errors).length > 0 || !values.claimHash) return { errors };
  return { args: [amount, values.claimHash] };
}
