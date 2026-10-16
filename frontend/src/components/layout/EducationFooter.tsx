import useAppDemoContext from "../../contexts/AppDemoContext";

const rules = [
  {
    title: "La caution est bloquée",
    text: "Le locataire verse le montant exact. Pendant le bail, personne ne peut le déplacer.",
  },
  {
    title: "Le propriétaire réclame sur justificatifs",
    text: "Après la fin du bail, il a 60 jours. La part non réclamée revient tout de suite au locataire.",
  },
  {
    title: "Seul le désaccord va à l’arbitre",
    text: "Le locataire a 14 jours pour contester. L’arbitre ne répartit que la somme contestée.",
  },
];

export function EducationFooter() {
  const { setHelp } = useAppDemoContext();
  return (
    <>
      <section className="rules" aria-labelledby="rules-title">
        <div className="rules-intro">
          <h2 id="rules-title">Des règles, pas des promesses.</h2>
          <p>
            Chaque délai expiré peut être déclenché par n’importe qui. Le
            silence ne profite jamais à celui qui se tait.
          </p>
          <button className="text-button" onClick={() => setHelp(true)}>
            Comprendre Caution
          </button>
        </div>
        <ol>
          {rules.map((rule) => (
            <li key={rule.title}>
              <h3>{rule.title}</h3>
              <p>{rule.text}</p>
            </li>
          ))}
        </ol>
      </section>
      <footer>
        <span>© 2026 Caution. La confiance, par contrat.</span>
        <span>Prototype sur Base Sepolia, ETH de test uniquement</span>
      </footer>
    </>
  );
}
