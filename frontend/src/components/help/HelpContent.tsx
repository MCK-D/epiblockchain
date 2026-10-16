import { ShieldCheck } from "lucide-react";
import { demoLeases } from "../../data/demoLeases";
import useAppDemoContext from "../../contexts/AppDemoContext";
import { clearLeases } from "../../services/leaseStorage";

export function HelpContent() {
  const { setLeases, setBalance, notify, setHelp } = useAppDemoContext();
  return (
    <>
      <ShieldCheck size={32} />
      <h2>Un cadre clair pour votre caution.</h2>
      <p>
        Ce prototype interactif simule un contrat de dépôt de garantie, sans
        backend ni portefeuille réel.
      </p>
      {[
        [
          "1",
          "Un bail, trois rôles",
          "Le propriétaire définit le bail, le locataire verse la caution et un arbitre distinct est désigné.",
        ],
        [
          "2",
          "Des fonds encadrés",
          "Après la fin du bail, une réclamation peut être déposée pendant 60 jours. La part non réclamée revient immédiatement au locataire.",
        ],
        [
          "3",
          "Le droit de contester",
          "Le locataire dispose de 14 jours pour répondre. L’arbitre dispose ensuite de 30 jours pour répartir uniquement la somme contestée.",
        ],
      ].map(([n, t, d]) => (
        <div className="help-step" key={n}>
          <span>{n}</span>
          <div>
            <h3>{t}</h3>
            <p>{d}</p>
          </div>
        </div>
      ))}
      <p className="notice">
        Si l’arbitre ne tranche pas à temps, le montant contesté revient au
        locataire. Il reste une part de confiance : l’arbitre, la véracité des
        justificatifs et le réseau Base.
      </p>
      <button
        className="text-button"
        onClick={() => {
          clearLeases();
          setLeases(demoLeases);
          setBalance(0);
          notify("Démonstration réinitialisée.");
          setHelp(false);
        }}
      >
        Réinitialiser les données de démonstration
      </button>
    </>
  );
}
