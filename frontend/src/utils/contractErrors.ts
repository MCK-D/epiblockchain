import {
  BaseError,
  ContractFunctionRevertedError,
  InsufficientFundsError,
} from "viem";
import { walletErrorMessage } from "./walletErrors";

// Une phrase lisible pour chaque custom error de RentalDeposit.
const messages: Record<string, string> = {
  LeaseNotFound: "Ce bail n’existe pas.",
  WrongStatus: "Le bail n’est plus dans l’état attendu. Rechargez la page.",
  NotLandlord: "Seul le propriétaire du bail peut faire cette action.",
  NotTenant: "Seul le locataire du bail peut faire cette action.",
  NotArbiter: "Seul l’arbitre du bail peut faire cette action.",
  InvalidTenant:
    "Adresse du locataire invalide : elle doit être renseignée et différente de celle du propriétaire.",
  InvalidArbiter:
    "Adresse de l’arbitre invalide : elle doit être différente de celles du propriétaire et du locataire.",
  ZeroDeposit: "La caution doit être supérieure à zéro.",
  EndDateInPast: "La date de fin doit être dans le futur.",
  WrongDepositAmount:
    "Le montant versé doit être exactement celui de la caution.",
  LeaseNotEnded: "Le bail n’est pas encore terminé.",
  ClaimWindowExpired: "Le délai de réclamation est expiré.",
  ClaimWindowOpen: "Le délai de réclamation n’est pas encore expiré.",
  InvalidClaimAmount:
    "Le montant réclamé doit être compris entre 0 et la caution.",
  ResponseWindowExpired: "Le délai de réponse est expiré.",
  ResponseWindowOpen: "Le délai de réponse n’est pas encore expiré.",
  ArbitrationWindowExpired: "Le délai d’arbitrage est expiré.",
  ArbitrationWindowOpen: "Le délai d’arbitrage n’est pas encore expiré.",
  InvalidSplit:
    "La part du propriétaire ne peut pas dépasser le montant contesté.",
  NothingToWithdraw: "Aucun solde à retirer.",
  TransferFailed: "Le virement a échoué.",
  NotImplemented: "Cette action n’est pas encore implémentée dans le contrat.",
};

export function contractErrorMessage(error: unknown): string {
  if (error instanceof BaseError) {
    const reverted = error.walk(
      (cause) => cause instanceof ContractFunctionRevertedError,
    );
    if (reverted instanceof ContractFunctionRevertedError) {
      const name = reverted.data?.errorName;
      if (name && messages[name]) return messages[name];
      return "Le contrat a refusé l’opération.";
    }
    if (error.walk((cause) => cause instanceof InsufficientFundsError))
      return "Solde insuffisant pour payer le montant et les frais de réseau.";
  }
  return walletErrorMessage(error);
}
