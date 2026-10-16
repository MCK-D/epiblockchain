import { motion } from "motion/react";
import useAppDemoContext from "../../contexts/AppDemoContext";
import type { Lease } from "../../types/lease";
import { eth } from "../../utils/format";

// Amount still held by the contract for a lease. Once a claim is filed, the
// unclaimed part goes back to the tenant, so only the claimed amount stays.
function heldAmount(lease: Lease) {
  if (lease.status === "Actif") return lease.deposit;
  if (lease.status === "Réclamation" || lease.status === "Litige")
    return lease.claim;
  return 0;
}

const heldLabel: Partial<Record<Lease["status"], string>> = {
  Actif: "bloqué jusqu’à la fin du bail",
  Réclamation: "réclamé, en attente du locataire",
  Litige: "contesté, en attente de l’arbitre",
};

export function DashboardSummary() {
  const { leases, balance, connected, setBalance, notify } =
    useAppDemoContext();
  const held = leases
    .map((lease) => ({ lease, amount: heldAmount(lease) }))
    .filter(({ amount }) => amount > 0);
  const total = held.reduce((sum, { amount }) => sum + amount, 0);
  const [whole, unit] = eth(total).split(" ");

  return (
    <motion.section
      className="ledger"
      aria-label="Fonds bloqués dans le contrat"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <div className="ledger-main">
        <p className="ledger-label">Bloqué dans le contrat</p>
        <strong className="ledger-total">
          {whole}
          <span>{unit}</span>
        </strong>
        <p className="ledger-sub">
          {held.length
            ? `Réparti sur ${held.length} ${held.length > 1 ? "baux" : "bail"}. Ni le propriétaire ni la plateforme ne peuvent y toucher en dehors des règles du contrat.`
            : "Aucune caution n’est bloquée pour le moment."}
        </p>
        <div className="ledger-bar" aria-hidden="true">
          {held.length ? (
            held.map(({ lease, amount }) => (
              <span
                key={lease.id}
                className={"seg-" + lease.status.toLowerCase()}
                style={{ flexGrow: amount }}
              />
            ))
          ) : (
            <span className="empty-bar" />
          )}
        </div>
        <ul className="ledger-legend">
          {held.map(({ lease, amount }) => (
            <li key={lease.id}>
              <i className={"seg-" + lease.status.toLowerCase()} />
              <b>{lease.title}</b>
              <small>
                {eth(amount)}, {heldLabel[lease.status]}
              </small>
            </li>
          ))}
        </ul>
      </div>
      <div className="ledger-side">
        <div>
          <p>Solde à retirer</p>
          <strong>{eth(balance)}</strong>
          {balance ? (
            <button
              className="text-button"
              onClick={() => {
                if (!connected) {
                  notify("Connectez le portefeuille de démonstration.");
                  return;
                }
                setBalance(0);
                notify("Retrait simulé effectué.");
              }}
            >
              Retirer mon solde
            </button>
          ) : (
            <small>Rien à retirer pour l’instant.</small>
          )}
        </div>
        <div>
          <p>Baux en cours</p>
          <strong>{held.length}</strong>
          <small>
            sur {leases.length} {leases.length > 1 ? "baux" : "bail"} au total
          </small>
        </div>
      </div>
    </motion.section>
  );
}
