import { baseSepolia } from "wagmi/chains";
import type { ActionState } from "../../hooks/useContractAction";

function explorerLink(hash: string) {
  return `${baseSepolia.blockExplorers.default.url}/tx/${hash}`;
}

// Affiche l'étape en cours d'une transaction, ou sa raison d'échec.
export function TransactionStatus({
  state,
  success,
}: {
  state: ActionState;
  success: string;
}) {
  if (state.status === "idle") return null;
  if (state.status === "error")
    return (
      <p className="wallet-error" role="alert">
        {state.message}
      </p>
    );
  return (
    <p className="notice" role="status">
      {state.status === "wallet" &&
        "Confirmez la transaction dans votre portefeuille…"}
      {state.status === "pending" &&
        "Transaction envoyée, en attente d’un bloc… "}
      {state.status === "success" && `${success} `}
      {state.status !== "wallet" && (
        <a href={explorerLink(state.hash)} target="_blank" rel="noreferrer">
          Voir sur Basescan
        </a>
      )}
    </p>
  );
}
