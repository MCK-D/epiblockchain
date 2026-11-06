import { useConnection, useReadContract } from "wagmi";
import { simulateContract, writeContract } from "wagmi/actions";
import { baseSepolia } from "wagmi/chains";
import { getAddress, zeroHash, type Address } from "viem";
import { rentalDepositAddress } from "../../config/contract";
import { rentalDepositAbi } from "../../contracts/rentalDepositAbi";
import { useContractAction } from "../../hooks/useContractAction";
import { contractErrorMessage } from "../../utils/contractErrors";
import { formatDate, formatEth, statusLabel } from "../../utils/format";
import { rolesOf } from "../../utils/leaseRoles";
import type { Lease } from "../../types/lease";
import { TransactionStatus } from "./TransactionStatus";

const PROPOSED = 0;

function Party({
  label,
  address,
  you,
}: {
  label: string;
  address: Address;
  you: boolean;
}) {
  return (
    <>
      <dt>{label}</dt>
      <dd>
        {getAddress(address)}
        {you && <span className="you"> (vous)</span>}
      </dd>
    </>
  );
}

export function LeaseDetails({ id }: { id: bigint }) {
  const contract = rentalDepositAddress;
  const { address: account, chainId } = useConnection();
  const read = useReadContract({
    address: contract,
    abi: rentalDepositAbi,
    functionName: "getLease",
    args: [id],
    chainId: baseSepolia.id,
    query: { enabled: contract !== undefined },
  });
  const action = useContractAction();

  if (!contract) return <p>Le contrat n’est pas encore déployé.</p>;
  if (read.isError)
    return (
      <>
        <h2>Bail n°{id.toString()}</h2>
        <p className="wallet-error" role="alert">
          Lecture impossible : {contractErrorMessage(read.error)}
        </p>
        <button className="secondary" onClick={() => read.refetch()}>
          Réessayer
        </button>
      </>
    );
  if (!read.data) return <p role="status">Lecture du bail…</p>;

  const lease: Lease = { id, ...read.data };
  const roles = rolesOf(lease, account);
  const isLandlord = roles.includes("Propriétaire");
  const isTenant = roles.includes("Locataire");
  const onBaseSepolia = chainId === baseSepolia.id;
  const proposed = lease.status === PROPOSED;

  const cancel = () =>
    action.run(async (config) => {
      const { request } = await simulateContract(config, {
        address: contract,
        abi: rentalDepositAbi,
        functionName: "cancel",
        args: [id],
        account,
        chainId: baseSepolia.id,
      });
      return writeContract(config, request);
    });

  // msg.value doit être exactement lease.deposit, sinon WrongDepositAmount.
  const fund = () =>
    action.run(async (config) => {
      const { request } = await simulateContract(config, {
        address: contract,
        abi: rentalDepositAbi,
        functionName: "fund",
        args: [id],
        value: lease.deposit,
        account,
        chainId: baseSepolia.id,
      });
      return writeContract(config, request);
    });

  return (
    <>
      <h2>Bail n°{id.toString()}</h2>
      <p>
        <span className={`badge status-${lease.status}`}>
          {statusLabel(lease.status)}
        </span>
        {roles.length > 0 && (
          <span className="roles">
            {" "}
            · Vous êtes {roles.join(", ").toLowerCase()}
          </span>
        )}
      </p>
      <dl className="lease-details">
        <dt>Caution</dt>
        <dd>{formatEth(lease.deposit)}</dd>
        <dt>Fin du bail</dt>
        <dd>{formatDate(lease.endDate)}</dd>
        <Party label="Propriétaire" address={lease.landlord} you={isLandlord} />
        <Party label="Locataire" address={lease.tenant} you={isTenant} />
        <Party
          label="Arbitre"
          address={lease.arbiter}
          you={roles.includes("Arbitre")}
        />
        <dt>Empreinte du bail</dt>
        <dd className="hash">
          {lease.leaseHash === zeroHash ? "Aucune" : lease.leaseHash}
        </dd>
      </dl>

      {proposed && (isLandlord || isTenant) && !onBaseSepolia && (
        <p className="notice">Passez sur Base Sepolia pour agir sur ce bail.</p>
      )}

      {proposed && isTenant && (
        <>
          <p className="notice">
            En versant {formatEth(lease.deposit)}, vous acceptez l’arbitre
            ci-dessus et la date de fin du {formatDate(lease.endDate)}. La
            caution restera bloquée dans le contrat : personne ne pourra la
            déplacer en dehors de ses règles.
          </p>
          <button
            className="primary"
            disabled={action.busy || !onBaseSepolia}
            onClick={fund}
          >
            Verser {formatEth(lease.deposit)}
          </button>
        </>
      )}

      {proposed && isLandlord && (
        <button
          className="secondary"
          disabled={action.busy || !onBaseSepolia}
          onClick={cancel}
        >
          Annuler le bail
        </button>
      )}

      {!proposed && (
        <p className="notice">
          Les réclamations et litiges seront disponibles avec les prochaines
          parties du contrat.
        </p>
      )}

      <TransactionStatus
        state={action.state}
        success="Transaction confirmée."
      />
    </>
  );
}
