import { useState, type FormEvent } from "react";
import { keccak256, zeroHash, type Address, type Hex } from "viem";
import { simulateContract, writeContract } from "wagmi/actions";
import { baseSepolia } from "wagmi/chains";
import { rentalDepositAbi } from "../../contracts/rentalDepositAbi";
import { useContractAction } from "../../hooks/useContractAction";
import { useNow, useWindows } from "../../hooks/useLeaseTiming";
import type { Lease, Role } from "../../types/lease";
import {
  validateClaimForm,
  validateSplit,
  type ClaimFormField,
  type ClaimFormValues,
} from "../../utils/claimForm";
import { formatDate, formatEth } from "../../utils/format";
import {
  ACTIVE,
  availableActions,
  CLAIMED,
  CLOSED,
  deadlinesOf,
  DISPUTED,
  formatRemaining,
  type EndOfLeaseAction,
} from "../../utils/leaseDeadlines";
import { TransactionStatus } from "./TransactionStatus";

// Transitions qui ne prennent que l'identifiant du bail.
type LeaseIdFunction = Exclude<EndOfLeaseAction, "claim" | "resolve">;

const emptyClaim: ClaimFormValues = { amount: "", claimHash: undefined };

// Fin du bail (parties 2 et 3) : restitution, réclamation, acceptation,
// contestation, arbitrage et délais expirés. Les fonds ne sont jamais envoyés
// ici : chaque issue crédite un solde, que le bénéficiaire retire depuis la
// vue d'ensemble.
export function EndOfLeaseActions({
  contract,
  lease,
  roles,
  account,
  onBaseSepolia,
}: {
  contract: Address;
  lease: Lease;
  roles: Role[];
  account: Address | undefined;
  onBaseSepolia: boolean;
}) {
  const windows = useWindows();
  const now = useNow();
  const action = useContractAction();
  const [claim, setClaim] = useState(emptyClaim);
  const [claimErrors, setClaimErrors] = useState<
    Partial<Record<ClaimFormField, string>>
  >({});
  const [fileName, setFileName] = useState("");
  const [split, setSplit] = useState("");
  const [splitError, setSplitError] = useState<string | undefined>();

  if (!windows) return <p role="status">Lecture des délais du contrat…</p>;

  const { claimDeadline, responseDeadline, arbitrationDeadline } = deadlinesOf(
    lease,
    windows,
  );
  const actions = availableActions(lease, roles, windows, now);
  const can = (name: EndOfLeaseAction) => actions.includes(name);
  const disabled = action.busy || !onBaseSepolia || !account;

  // L'arbitre ne répartit que le montant contesté (InvalidSplit au-delà).
  async function submitSplit(event: FormEvent) {
    event.preventDefault();
    const result = validateSplit(split, lease.claimAmount);
    if (result.error !== undefined) {
      setSplitError(result.error);
      return;
    }
    const receipt = await action.run(async (config) => {
      const { request } = await simulateContract(config, {
        address: contract,
        abi: rentalDepositAbi,
        functionName: "resolve",
        args: [lease.id, result.toLandlord],
        account,
        chainId: baseSepolia.id,
      });
      return writeContract(config, request);
    });
    if (receipt) setSplit("");
  }

  // simulateContract rejoue l'appel avant la signature : un revert (délai pas
  // encore expiré, mauvais état…) est décodé sans payer de frais.
  const send = (functionName: LeaseIdFunction) =>
    action.run(async (config) => {
      const { request } = await simulateContract(config, {
        address: contract,
        abi: rentalDepositAbi,
        functionName,
        args: [lease.id],
        account,
        chainId: baseSepolia.id,
      });
      return writeContract(config, request);
    });

  // Le justificatif ne quitte pas le navigateur : seule son empreinte
  // keccak256 est enregistrée dans le contrat (claimHash).
  async function hashFile(file: File | undefined) {
    setFileName(file?.name ?? "");
    const claimHash: Hex | undefined = file
      ? keccak256(new Uint8Array(await file.arrayBuffer()))
      : undefined;
    setClaim((current) => ({ ...current, claimHash }));
    setClaimErrors((current) => ({ ...current, claimHash: undefined }));
  }

  async function submitClaim(event: FormEvent) {
    event.preventDefault();
    const result = validateClaimForm(claim, lease.deposit);
    if (result.errors) {
      setClaimErrors(result.errors);
      return;
    }
    const [amount, claimHash] = result.args;
    const receipt = await action.run(async (config) => {
      const { request } = await simulateContract(config, {
        address: contract,
        abi: rentalDepositAbi,
        functionName: "claim",
        args: [lease.id, amount, claimHash],
        account,
        chainId: baseSepolia.id,
      });
      return writeContract(config, request);
    });
    if (receipt) setClaim(emptyClaim);
  }

  return (
    <section className="end-of-lease" aria-label="Fin du bail">
      <h3>Fin du bail</h3>

      {lease.status === ACTIVE && (
        <dl className="lease-details">
          <dt>Réclamation</dt>
          <dd>
            {now < lease.endDate
              ? `possible à partir du ${formatDate(lease.endDate)} (${formatRemaining(lease.endDate, now)})`
              : now <= claimDeadline
                ? `possible jusqu’au ${formatDate(claimDeadline)} (${formatRemaining(claimDeadline, now)})`
                : `délai expiré ${formatRemaining(claimDeadline, now)} : la caution revient au locataire`}
          </dd>
        </dl>
      )}

      {(lease.status === CLAIMED || lease.status === DISPUTED) && (
        <dl className="lease-details">
          <dt>Montant réclamé</dt>
          <dd>{formatEth(lease.claimAmount)}</dd>
          <dt>Déjà rendu au locataire</dt>
          <dd>{formatEth(lease.deposit - lease.claimAmount)}</dd>
          <dt>Justificatifs</dt>
          <dd className="hash">
            {lease.claimHash === zeroHash ? "Aucun" : lease.claimHash}
          </dd>
          {lease.status === CLAIMED && (
            <>
              <dt>Réponse du locataire</dt>
              <dd>
                {now <= responseDeadline
                  ? `jusqu’au ${formatDate(responseDeadline)} (${formatRemaining(responseDeadline, now)})`
                  : `délai expiré ${formatRemaining(responseDeadline, now)} : la réclamation est acquise au propriétaire`}
              </dd>
            </>
          )}
          {lease.status === DISPUTED && (
            <>
              <dt>Décision de l’arbitre</dt>
              <dd>
                {now <= arbitrationDeadline
                  ? `jusqu’au ${formatDate(arbitrationDeadline)} (${formatRemaining(arbitrationDeadline, now)})`
                  : `délai expiré ${formatRemaining(arbitrationDeadline, now)} : le montant contesté revient au locataire`}
              </dd>
            </>
          )}
        </dl>
      )}

      {lease.status === CLOSED && (
        <p className="notice">
          Bail clôturé. Les fonds ont été crédités aux bénéficiaires, qui les
          retirent depuis la vue d’ensemble.
        </p>
      )}

      {actions.length > 0 && !onBaseSepolia && (
        <p className="notice">Passez sur Base Sepolia pour agir sur ce bail.</p>
      )}

      {can("claim") && (
        <form onSubmit={submitClaim} noValidate>
          <p>
            Indiquez le montant retenu et ajoutez vos justificatifs. Le reste de
            la caution est rendu au locataire dès la confirmation.
          </p>
          <label>
            Montant réclamé (ETH, au plus {formatEth(lease.deposit)})
            <input
              value={claim.amount}
              onChange={(e) => {
                setClaim((current) => ({ ...current, amount: e.target.value }));
                setClaimErrors((current) => ({
                  ...current,
                  amount: undefined,
                }));
              }}
              placeholder="0,00005"
              inputMode="decimal"
              aria-invalid={claimErrors.amount ? true : undefined}
              aria-describedby={claimErrors.amount ? "amount-error" : undefined}
            />
            {claimErrors.amount && (
              <span className="field-error" id="amount-error">
                {claimErrors.amount}
              </span>
            )}
          </label>
          <label>
            État des lieux de sortie et devis
            <input
              type="file"
              onChange={(e) => hashFile(e.target.files?.[0])}
              aria-invalid={claimErrors.claimHash ? true : undefined}
              aria-describedby={
                claimErrors.claimHash ? "claimHash-error" : undefined
              }
            />
            <small className="field-hint">
              {claim.claimHash
                ? `${fileName} · empreinte ${claim.claimHash.slice(0, 10)}…`
                : "Le fichier reste sur votre appareil : seule son empreinte est enregistrée."}
            </small>
            {claimErrors.claimHash && (
              <span className="field-error" id="claimHash-error">
                {claimErrors.claimHash}
              </span>
            )}
          </label>
          <button className="primary" type="submit" disabled={disabled}>
            Réclamer
          </button>
        </form>
      )}

      {can("releaseAll") && (
        <button
          className="secondary"
          disabled={disabled}
          onClick={() => send("releaseAll")}
        >
          Rendre toute la caution ({formatEth(lease.deposit)})
        </button>
      )}

      {can("acceptClaim") && (
        <button
          className="primary"
          disabled={disabled}
          onClick={() => send("acceptClaim")}
        >
          Accepter la réclamation ({formatEth(lease.claimAmount)} au
          propriétaire)
        </button>
      )}

      {can("dispute") && (
        <>
          <p className="notice">
            Vous contestez ? L’arbitre désigné dans le bail répartira les{" "}
            {formatEth(lease.claimAmount)} contestés, et rien d’autre : la part
            déjà rendue reste à vous. S’il ne tranche pas à temps, le montant
            contesté vous revient.
          </p>
          <button
            className="secondary"
            disabled={disabled}
            onClick={() => send("dispute")}
          >
            Contester devant l’arbitre
          </button>
        </>
      )}

      {can("resolve") && (
        <form onSubmit={submitSplit} noValidate>
          <p>
            Vous êtes l’arbitre de ce litige. Indiquez la part des{" "}
            {formatEth(lease.claimAmount)} contestés qui revient au propriétaire
            ; le reste ira au locataire.
          </p>
          <label>
            Part du propriétaire (ETH, entre 0 et {formatEth(lease.claimAmount)}
            )
            <input
              value={split}
              onChange={(e) => {
                setSplit(e.target.value);
                setSplitError(undefined);
              }}
              placeholder="0"
              inputMode="decimal"
              aria-invalid={splitError ? true : undefined}
              aria-describedby={splitError ? "split-error" : undefined}
            />
            {splitError && (
              <span className="field-error" id="split-error">
                {splitError}
              </span>
            )}
          </label>
          <button className="primary" type="submit" disabled={disabled}>
            Trancher le litige
          </button>
        </form>
      )}

      {lease.status === DISPUTED &&
        !can("resolve") &&
        !can("resolveAfterTimeout") && (
          <p className="notice">
            Litige en cours : seul l’arbitre peut répartir le montant contesté,
            jusqu’au {formatDate(arbitrationDeadline)}.
          </p>
        )}

      {can("refundAfterTimeout") && (
        <button
          className="primary"
          disabled={disabled}
          onClick={() => send("refundAfterTimeout")}
        >
          Délai expiré : rendre la caution au locataire
        </button>
      )}

      {can("acceptAfterTimeout") && (
        <button
          className="primary"
          disabled={disabled}
          onClick={() => send("acceptAfterTimeout")}
        >
          Délai expiré : attribuer la réclamation au propriétaire
        </button>
      )}

      {can("resolveAfterTimeout") && (
        <button
          className="primary"
          disabled={disabled}
          onClick={() => send("resolveAfterTimeout")}
        >
          Délai expiré : rendre le montant contesté au locataire
        </button>
      )}

      {(can("refundAfterTimeout") ||
        can("acceptAfterTimeout") ||
        can("resolveAfterTimeout")) && (
        <p className="field-hint">
          N’importe quelle adresse peut déclencher un délai expiré : le résultat
          est le même quel que soit l’appelant.
        </p>
      )}

      <TransactionStatus
        state={action.state}
        success="Transaction confirmée."
      />
    </section>
  );
}
