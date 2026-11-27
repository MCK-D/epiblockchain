import { useBalance, useConnection, useReadContract } from "wagmi";
import { simulateContract, writeContract } from "wagmi/actions";
import { baseSepolia } from "wagmi/chains";
import { rentalDepositAddress } from "../../config/contract";
import { rentalDepositAbi } from "../../contracts/rentalDepositAbi";
import { useContractAction } from "../../hooks/useContractAction";
import { useLeases } from "../../hooks/useLeases";
import { formatEth } from "../../utils/format";
import { ACTIVE, CLAIMED, DISPUTED } from "../../utils/leaseDeadlines";
import { TransactionStatus } from "../leases/TransactionStatus";

// Vue d'ensemble lue sur la chaîne. Une lecture qui échoue affiche « — » avec
// sa raison, jamais un zéro.
export function DashboardSummary() {
  const contract = rentalDepositAddress;
  const { address: account, chainId } = useConnection();
  const action = useContractAction();

  const held = useBalance({
    address: contract,
    chainId: baseSepolia.id,
    query: { enabled: contract !== undefined },
  });
  const owed = useReadContract({
    address: contract,
    abi: rentalDepositAbi,
    functionName: "balances",
    args: account ? [account] : undefined,
    chainId: baseSepolia.id,
    query: { enabled: contract !== undefined && account !== undefined },
  });
  const leases = useLeases();

  const openLeases =
    leases.status === "success"
      ? leases.leases.filter(
          (read) =>
            read.status === "success" &&
            [ACTIVE, CLAIMED, DISPUTED].includes(read.lease.status),
        ).length
      : undefined;

  // Retire en une fois tout ce qui est dû à l'adresse, sur tous ses baux.
  const withdraw = () =>
    action.run(async (config) => {
      const { request } = await simulateContract(config, {
        address: contract!,
        abi: rentalDepositAbi,
        functionName: "withdraw",
        account,
        chainId: baseSepolia.id,
      });
      return writeContract(config, request);
    });

  const canWithdraw =
    owed.data !== undefined &&
    owed.data > 0n &&
    chainId === baseSepolia.id &&
    !action.busy;

  return (
    <section className="ledger" aria-label="Fonds détenus par le contrat">
      <div className="ledger-main">
        <p className="ledger-label">Détenu par le contrat</p>
        <strong className="ledger-total">
          {held.data ? formatEth(held.data.value) : "—"}
        </strong>
        <p className="ledger-sub">
          {!contract
            ? "Le contrat n’est pas encore déployé."
            : held.isError
              ? "Lecture impossible. Rechargez la page."
              : "Cautions bloquées et sommes créditées pas encore retirées. Personne ne peut les déplacer en dehors des règles du contrat."}
        </p>
      </div>
      <div className="ledger-side">
        <div>
          <p>Solde à retirer</p>
          <strong>
            {owed.data !== undefined ? formatEth(owed.data) : "—"}
          </strong>
          <small>
            {!account
              ? "Connectez votre portefeuille pour voir votre solde."
              : owed.isError
                ? "Lecture impossible. Rechargez la page."
                : "Sommes qui vous sont dues sur tous vos baux."}
          </small>
          {account && owed.data !== undefined && owed.data > 0n && (
            <button
              className="primary"
              disabled={!canWithdraw}
              onClick={withdraw}
            >
              Retirer {formatEth(owed.data)}
            </button>
          )}
          <TransactionStatus state={action.state} success="Retrait effectué." />
        </div>
        <div>
          <p>Baux en cours</p>
          <strong>{openLeases ?? "—"}</strong>
          <small>
            {leases.status === "error"
              ? "Lecture impossible. Rechargez la page."
              : "Baux actifs, en réclamation ou en litige."}
          </small>
        </div>
      </div>
    </section>
  );
}
