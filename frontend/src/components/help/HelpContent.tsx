import { ShieldCheck } from "lucide-react";

export function HelpContent() {
  return (
    <>
      <ShieldCheck size={32} />
      <h2>Un cadre clair pour votre caution.</h2>
      <p>
        Le portefeuille peut être connecté à Base Sepolia. Les données et
        opérations des baux ne sont pas encore reliées au contrat. Les règles
        ci-dessous décrivent le fonctionnement prévu.
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
    </>
  );
}
