import { Clock3 } from "lucide-react";
import type { DemoApp } from "../../hooks/useDemoApp";
import { eth } from "../../utils/format";

type Props = Pick<DemoApp, "leases" | "setSelected">;
export function ClaimNotice({ leases, setSelected }: Props) {
  const lease = leases.find((l) => l.status === "Réclamation");
  if (!lease) return null;
  return (
    <div className="attention" role="status">
      <div className="attention-icon">
        <Clock3 size={20} />
      </div>
      <div>
        <strong>Une réclamation attend une réponse</strong>
        <p>
          {lease.title} : {eth(lease.claim)} réclamés. Le locataire a 14 jours
          pour accepter ou contester, sinon la réclamation est acquise.
        </p>
      </div>
      <button className="primary" onClick={() => setSelected(lease)}>
        Voir la réclamation
      </button>
    </div>
  );
}
