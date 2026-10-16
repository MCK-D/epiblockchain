import { Check, Copy } from "lucide-react";
import type { DemoApp } from "../../hooks/useDemoApp";
import { date, eth } from "../../utils/format";
import { LeaseActions } from "./LeaseActions";

type Props = Pick<DemoApp, "selected" | "role" | "act" | "notify">;
export function LeaseDetails({ selected, role, act, notify }: Props) {
  if (!selected) return null;
  return (
    <>
      <span className="eyebrow">BAIL #{selected.id} · DÉMONSTRATION</span>
      <h2>{selected.title}</h2>
      <span className={"badge status-" + selected.status.toLowerCase()}>
        <span />
        {selected.status}
      </span>
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
      <div className="notice">
        Rôle actuel : {role}. Les actions ci-dessous simulent les changements
        d’état, sans envoyer de fonds.
      </div>
      <h3>Historique du bail</h3>
      <ul className="timeline">
        {selected.history.map((s, i) => (
          <li key={i}>
            <Check size={14} />
            {s}
          </li>
        ))}
      </ul>
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
