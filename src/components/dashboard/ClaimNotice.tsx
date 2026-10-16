import { ArrowRight, Clock3 } from "lucide-react";
import useAppDemoContext from "../../contexts/AppDemoContext";

export function ClaimNotice() {
  const { leases, setSelected } = useAppDemoContext();
  return (
    <div className="attention">
      <div className="attention-icon">
        <Clock3 size={20} />
      </div>
      <div>
        <strong>Une réclamation attend votre réponse</strong>
        <p>
          Studio · Lyon 2e — 0,08 ETH réclamé. Répondez avant le 28 octobre
          2026.
        </p>
      </div>
      <button
        onClick={() => {
          setSelected(leases.find((l) => l.status === "Réclamation")!);
        }}
      >
        Voir la réclamation <ArrowRight size={16} />
      </button>
    </div>
  );
}
