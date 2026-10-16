export function DashboardSummary() {
  return (
    <section
      className="ledger"
      aria-label="Disponibilité des données du contrat"
    >
      <div className="ledger-main">
        <p className="ledger-label">Bloqué dans le contrat</p>
        <strong className="ledger-total" aria-label="Montant indisponible">
          —
        </strong>
        <p className="ledger-sub">
          Montant indisponible. La lecture du contrat n’est pas encore intégrée.
        </p>
      </div>
      <div className="ledger-side">
        <div>
          <p>Solde à retirer</p>
          <strong aria-label="Solde indisponible">—</strong>
          <small>
            Les retraits seront disponibles après intégration du contrat.
          </small>
        </div>
        <div>
          <p>Baux en cours</p>
          <strong aria-label="Nombre de baux indisponible">—</strong>
          <small>Aucune lecture du contrat effectuée.</small>
        </div>
      </div>
    </section>
  );
}
