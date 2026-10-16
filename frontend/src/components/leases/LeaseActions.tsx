import { useState } from "react";
import type { Lease, Role, Status } from "../../types/lease";
import { date, eth } from "../../utils/format";
type Props = {
  lease: Lease;
  role: Role;
  act: (
    status: Status,
    label: string,
    credit?: number,
    claimAmount?: number,
  ) => void;
};
export function LeaseActions({ lease: selected, role, act }: Props) {
  const [amount, setAmount] = useState("");
  const [proof, setProof] = useState("");
  return (
    <>
      {selected.status === "Proposé" && (
        <div className="actions">
          {role === "Locataire" && (
            <button
              className="primary"
              onClick={() => act("Actif", "Caution versée")}
            >
              Simuler le versement de {eth(selected.deposit)}
            </button>
          )}
          {role === "Propriétaire" && (
            <button
              className="secondary"
              onClick={() => act("Annulé", "Bail annulé")}
            >
              Annuler le bail
            </button>
          )}
        </div>
      )}
      {selected.status === "Actif" && role === "Propriétaire" && (
        <>
          <button
            className="primary"
            onClick={() => act("Clôturé", "Caution restituée au locataire")}
          >
            Restituer toute la caution
          </button>
          {new Date(selected.end) <= new Date() ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                act("Réclamation", "Réclamation déposée", 0, Number(amount));
              }}
            >
              <label>
                Montant réclamé (ETH)
                <input
                  required
                  type="number"
                  min="0.0001"
                  max={selected.deposit}
                  step="0.0001"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </label>
              <label>
                Référence des justificatifs
                <input
                  required
                  value={proof}
                  onChange={(e) => setProof(e.target.value)}
                  placeholder="Hash ou référence fictive"
                />
              </label>
              <button className="secondary">
                Déposer une réclamation fictive
              </button>
            </form>
          ) : (
            <p className="notice">
              Une réclamation sera possible après le {date(selected.end)}.
            </p>
          )}
        </>
      )}
      {selected.status === "Réclamation" && (
        <>
          <div className="claim-box">
            <strong>{eth(selected.claim)} réclamé</strong>
            <p>
              Part non réclamée : {eth(selected.deposit - selected.claim)}. Dans
              le contrat final, cette part sera créditée immédiatement au
              locataire.
            </p>
            <p>Justificatif fictif : devis de remise en état des murs.</p>
          </div>
          {role === "Locataire" && (
            <div className="actions">
              <button
                className="primary"
                onClick={() =>
                  act(
                    "Clôturé",
                    "Réclamation acceptée",
                    selected.deposit - selected.claim,
                  )
                }
              >
                Accepter la réclamation
              </button>
              <button
                className="secondary"
                onClick={() => act("Litige", "Réclamation contestée")}
              >
                Contester
              </button>
            </div>
          )}
        </>
      )}
      {selected.status === "Litige" && (
        <>
          <p className="claim-box">
            Montant contesté : <strong>{eth(selected.claim)}</strong>. Seule
            cette somme peut être répartie par l’arbitre.
          </p>
          {role === "Arbitre" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                act(
                  "Clôturé",
                  `Litige résolu : ${eth(Number(amount))} au propriétaire`,
                );
              }}
            >
              <label>
                Part accordée au propriétaire (ETH)
                <input
                  required
                  type="number"
                  min="0"
                  max={selected.claim}
                  step="0.0001"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </label>
              <button className="primary">Simuler la décision</button>
            </form>
          )}
        </>
      )}
      {["Clôturé", "Annulé"].includes(selected.status) && (
        <p className="notice">
          Ce bail est terminé. Son historique reste consultable.
        </p>
      )}
    </>
  );
}
