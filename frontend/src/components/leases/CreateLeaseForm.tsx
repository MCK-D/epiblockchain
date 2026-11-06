import { useState, type FormEvent } from "react";
import { keccak256, parseEventLogs, type Hex } from "viem";
import { useConnection } from "wagmi";
import { simulateContract, writeContract } from "wagmi/actions";
import { baseSepolia } from "wagmi/chains";
import { rentalDepositAddress } from "../../config/contract";
import { rentalDepositAbi } from "../../contracts/rentalDepositAbi";
import useAppContext from "../../contexts/AppContext";
import { useContractAction } from "../../hooks/useContractAction";
import {
  validateLeaseForm,
  type LeaseFormField,
  type LeaseFormValues,
} from "../../utils/leaseForm";
import { TransactionStatus } from "./TransactionStatus";

const empty: LeaseFormValues = {
  tenant: "",
  arbiter: "",
  deposit: "",
  endDate: "",
  leaseHash: undefined,
};

export function CreateLeaseForm() {
  const { setCreate, setSelected } = useAppContext();
  const { address } = useConnection();
  const action = useContractAction();
  const [values, setValues] = useState(empty);
  const [errors, setErrors] = useState<Partial<Record<LeaseFormField, string>>>(
    {},
  );
  const [fileName, setFileName] = useState("");

  function update(field: LeaseFormField, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  // Le document ne quitte pas le navigateur : seule son empreinte keccak256
  // est enregistrée dans le contrat (leaseHash).
  async function hashFile(file: File | undefined) {
    setFileName(file?.name ?? "");
    const leaseHash: Hex | undefined = file
      ? keccak256(new Uint8Array(await file.arrayBuffer()))
      : undefined;
    setValues((current) => ({ ...current, leaseHash }));
    setErrors((current) => ({ ...current, leaseHash: undefined }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!address || !rentalDepositAddress) return;
    const contract = rentalDepositAddress;
    const now = BigInt(Math.floor(Date.now() / 1000));
    const result = validateLeaseForm(values, address, now);
    if (result.errors) {
      setErrors(result.errors);
      return;
    }
    // simulateContract rejoue l'appel avant la signature : un revert est
    // décodé (InvalidTenant, EndDateInPast…) sans payer de frais.
    const receipt = await action.run(async (config) => {
      const { request } = await simulateContract(config, {
        address: contract,
        abi: rentalDepositAbi,
        functionName: "createLease",
        args: result.args,
        account: address,
        chainId: baseSepolia.id,
      });
      return writeContract(config, request);
    });
    if (!receipt) return;
    // L'identifiant vient de l'événement LeaseCreated, jamais de leaseCount :
    // un autre bail a pu être créé entre-temps.
    const [created] = parseEventLogs({
      abi: rentalDepositAbi,
      eventName: "LeaseCreated",
      logs: receipt.logs,
    });
    if (created) {
      setCreate(false);
      setSelected(created.args.leaseId);
    }
  }

  const field = (name: LeaseFormField) => ({
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? `${name}-error` : undefined,
  });
  const error = (name: LeaseFormField) =>
    errors[name] && (
      <span className="field-error" id={`${name}-error`}>
        {errors[name]}
      </span>
    );

  return (
    <>
      <h2>Créer un bail</h2>
      <p>
        Vous serez le propriétaire de ce bail. Le locataire pourra ensuite
        verser la caution exacte, qui restera bloquée dans le contrat.
      </p>
      <form onSubmit={submit} noValidate>
        <label>
          Adresse du locataire
          <input
            value={values.tenant}
            onChange={(e) => update("tenant", e.target.value)}
            placeholder="0x…"
            autoComplete="off"
            spellCheck={false}
            {...field("tenant")}
          />
          {error("tenant")}
        </label>
        <label>
          Adresse de l’arbitre
          <input
            value={values.arbiter}
            onChange={(e) => update("arbiter", e.target.value)}
            placeholder="0x…"
            autoComplete="off"
            spellCheck={false}
            {...field("arbiter")}
          />
          {error("arbiter")}
        </label>
        <label>
          Caution (ETH)
          <input
            value={values.deposit}
            onChange={(e) => update("deposit", e.target.value)}
            placeholder="0,01"
            inputMode="decimal"
            {...field("deposit")}
          />
          {error("deposit")}
        </label>
        <label>
          Fin du bail
          <input
            type="datetime-local"
            value={values.endDate}
            onChange={(e) => update("endDate", e.target.value)}
            {...field("endDate")}
          />
          {error("endDate")}
        </label>
        <label>
          Bail et état des lieux d’entrée
          <input
            type="file"
            onChange={(e) => hashFile(e.target.files?.[0])}
            {...field("leaseHash")}
          />
          <small className="field-hint">
            {values.leaseHash
              ? `${fileName} · empreinte ${values.leaseHash.slice(0, 10)}…`
              : "Le fichier reste sur votre appareil : seule son empreinte est enregistrée."}
          </small>
          {error("leaseHash")}
        </label>
        <TransactionStatus state={action.state} success="Bail créé." />
        <button className="primary" type="submit" disabled={action.busy}>
          {action.busy ? "Création en cours…" : "Créer le bail"}
        </button>
      </form>
    </>
  );
}
