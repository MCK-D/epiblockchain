import { Copy } from "lucide-react";
import useAppDemoContext from "../../contexts/AppDemoContext";
import type { Lease } from "../../types/lease";
import { date, eth } from "../../utils/format";
import { LeaseActions } from "./LeaseActions";

const steps = ["À financer", "Actif", "Réclamation", "Litige", "Clôturé"];

// Position of the lease in the contract's state machine. A closed lease may
// have skipped the claim or the dispute, which the history tells us.
function stepStates(lease: Lease) {
  const claimed = lease.history.some((h) => h.includes("Réclamation"));
  const disputed = lease.history.some((h) => /contest|Litige/.test(h));
  const current = {
    Proposé: 0,
    Actif: 1,
    Réclamation: 2,
    Litige: 3,
    Clôturé: 4,
    Annulé: 4,
  }[lease.status];
  return steps.map((label, i) => {
    if (lease.status === "Annulé") {
      if (i === 0) return { label, state: "done" };
      if (i === 4) return { label: "Annulé", state: "current" };
      return { label, state: "skipped" };
    }
    if (lease.status === "Clôturé" && i > 1 && i < 4) {
      const reached = i === 2 ? claimed : disputed;
      return { label, state: reached ? "done" : "skipped" };
    }
    if (i < current) return { label, state: "done" };
    if (i === current) return { label, state: "current" };
    return { label, state: "" };
  });
}

export function LeaseDetails() {
  const { selected, role, act, notify } = useAppDemoContext();
  if (!selected) return null;
  return (
    <>
      <p className="modal-kicker">Bail n° {selected.id}</p>
      <h2>{selected.title}</h2>
      <ol className="lifecycle" aria-label="Avancement du bail">
        {stepStates(selected).map(({ label, state }) => (
          <li
            key={label}
            className={state}
            aria-current={state === "current" ? "step" : undefined}
          >
            {label}
          </li>
        ))}
      </ol>
      <div className="detail-metrics">
        <div>
          <small>Dépôt de garantie</small>
          <strong>{eth(selected.deposit)}</strong>
        </div>
        <div>
          <small>Fin du bail</small>
          <strong>{date(selected.end)}</strong>
        </div>
      </div>
      <h3>Historique</h3>
      <ul className="timeline">
        {selected.history.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ul>
      <p className="notice">
        Vous agissez en tant que <strong>{role}</strong>. Les actions simulent
        les changements d’état, sans envoyer de fonds.
      </p>
      <LeaseActions lease={selected} role={role} act={act} />
      <button
        className="text-button copy"
        onClick={() => {
          navigator.clipboard
            ?.writeText(`Bail fictif #${selected.id}`)
            .then(() => notify("Référence copiée."))
            .catch(() => notify("Copie indisponible dans ce navigateur."));
        }}
      >
        <Copy size={14} />
        Copier la référence
      </button>
    </>
  );
}
