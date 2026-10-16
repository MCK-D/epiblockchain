import { ArrowDownLeft, ArrowRight, FileText, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";
import useAppDemoContext from "../../contexts/AppDemoContext";
import { eth } from "../../utils/format";

export function DashboardSummary() {
  const { leases, balance, connected, setBalance, notify } =
    useAppDemoContext();
  const locked = leases
    .filter((l) => ["Actif", "Litige", "Réclamation"].includes(l.status))
    .reduce(
      (a, l) =>
        a + l.deposit - (l.status === "Réclamation" ? l.deposit - l.claim : 0),
      0,
    );
  return (
    <motion.div
      className="stats"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="stat stat-dark">
        <div>
          Cautions en cours <ShieldCheck size={19} />
        </div>
        <strong>{eth(locked)}</strong>
        <small>
          <span className="mini-dot" />
          Sécurisées par les règles du contrat
        </small>
        <div className="stat-decoration" />
      </div>
      <div className="stat">
        <div>
          Baux actifs <FileText size={19} />
        </div>
        <strong>
          {leases
            .filter((l) =>
              ["Actif", "Réclamation", "Litige"].includes(l.status),
            )
            .length.toString()
            .padStart(2, "0")}
          <span>baux</span>
        </strong>
        <small>Un suivi à chaque étape de la location</small>
      </div>
      <div className="stat">
        <div>
          Solde disponible <ArrowDownLeft size={19} />
        </div>
        <strong>{eth(balance)}</strong>
        <button
          className="text-button"
          disabled={!balance}
          onClick={() => {
            if (!connected) {
              notify("Connectez le portefeuille de démonstration.");
              return;
            }
            setBalance(0);
            notify("Retrait simulé effectué.");
          }}
        >
          {balance ? "Retirer mon solde" : "Aucun retrait en attente"}{" "}
          <ArrowRight size={14} />
        </button>
      </div>
    </motion.div>
  );
}
