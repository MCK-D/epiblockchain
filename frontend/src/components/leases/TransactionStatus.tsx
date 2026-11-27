import { appChain } from "../../config/chain";
import type { ActionState } from "../../hooks/useContractAction";

// Le nœud local de secours n'a pas d'explorateur : pas de lien dans ce cas.
const explorer = appChain.blockExplorers?.default;

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
      {state.status !== "wallet" && explorer && (
        <a
          href={`${explorer.url}/tx/${state.hash}`}
          target="_blank"
          rel="noreferrer"
        >
          Voir sur {explorer.name}
        </a>
      )}
    </p>
  );
}
