import { Search } from "lucide-react";
import useAppDemoContext from "../../contexts/AppDemoContext";
import type { LeaseFilter } from "../../types/lease";
import { LeaseRow } from "./LeaseRow";

export function LeaseList() {
  const {
    leases,
    filter,
    setFilter,
    page,
    setPage,
    query,
    setQuery,
    setSelected,
  } = useAppDemoContext();
  const shown = leases.filter(
    (l) =>
      (filter === "Tous les baux" || l.status === filter) &&
      (page !== "Arbitrage" || l.status === "Litige") &&
      `${l.title} ${l.id}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <section className="lease-section">
      <div className="section-heading">
        <div>
          <h2>
            {page === "Arbitrage" ? "Litiges à examiner" : "Mes baux"}
            <span>{shown.length}</span>
          </h2>
          <p>
            {page === "Arbitrage"
              ? "Les fonds non contestés restent hors de portée de l’arbitre."
              : "Cliquez sur un bail pour voir son historique et les actions possibles."}
          </p>
        </div>
        {page === "Vue d’ensemble" && (
          <button className="text-button" onClick={() => setPage("Mes baux")}>
            Voir tous les baux
          </button>
        )}
      </div>
      <div className="toolbar">
        <div className="filters">
          {(
            [
              "Tous les baux",
              "Actif",
              "Proposé",
              "Réclamation",
              "Litige",
              "Clôturé",
            ] satisfies LeaseFilter[]
          ).map((f) => (
            <button
              key={f}
              className={filter === f ? "chosen" : ""}
              onClick={() => setFilter(f)}
            >
              {f === "Actif"
                ? "Actifs"
                : f === "Proposé"
                  ? "À financer"
                  : f === "Clôturé"
                    ? "Clôturés"
                    : f}
            </button>
          ))}
        </div>
        <label className="search">
          <Search size={16} />
          <input
            aria-label="Rechercher un bail"
            placeholder="Rechercher un bail…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Bien</th>
              <th>Caution</th>
              <th>État</th>
              <th>Fin du bail</th>
              <th>
                <span className="visually-hidden">Ouvrir</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {shown.map((l) => (
              <LeaseRow key={l.id} lease={l} onSelect={setSelected} />
            ))}
          </tbody>
        </table>
        {!shown.length && (
          <div className="empty">
            <Search size={22} />
            <h3>Aucun bail trouvé</h3>
            <p>Essayez un autre filtre ou créez votre premier bail.</p>
            <button
              className="text-button"
              onClick={() => {
                setFilter("Tous les baux");
                setQuery("");
              }}
            >
              Réinitialiser la recherche
            </button>
          </div>
        )}
      </div>
      <div className="table-footer">
        <span>
          {shown.length} {shown.length > 1 ? "baux affichés" : "bail affiché"}
        </span>
      </div>
    </section>
  );
}
