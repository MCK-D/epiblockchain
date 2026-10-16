import { ArrowRight, Search, ShieldCheck } from "lucide-react";
import type { DemoApp } from "../../hooks/useDemoApp";
import { LeaseRow } from "./LeaseRow";

type Props = Pick<
  DemoApp,
  | "leases"
  | "filter"
  | "setFilter"
  | "page"
  | "setPage"
  | "query"
  | "setQuery"
  | "setSelected"
>;
export function LeaseList({
  leases,
  filter,
  setFilter,
  page,
  setPage,
  query,
  setQuery,
  setSelected,
}: Props) {
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
              : "Une vue simple sur vos engagements."}
          </p>
        </div>
        {page === "Vue d’ensemble" && (
          <button className="text-button" onClick={() => setPage("Mes baux")}>
            Voir tous les baux <ArrowRight size={15} />
          </button>
        )}
      </div>
      <div className="toolbar">
        <div className="filters">
          {[
            "Tous les baux",
            "Actif",
            "Proposé",
            "Réclamation",
            "Litige",
            "Clôturé",
          ].map((f) => (
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
              <th>BAIL / BIEN</th>
              <th>CAUTION</th>
              <th>STATUT</th>
              <th>FIN DU BAIL</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {shown.map((l, i) => (
              <LeaseRow key={l.id} lease={l} index={i} onSelect={setSelected} />
            ))}
          </tbody>
        </table>
        {!shown.length && (
          <div className="empty">
            <Search />
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
          {shown.length} bail{shown.length > 1 ? "s" : ""} affiché
          {shown.length > 1 ? "s" : ""}
        </span>
        <span>
          <ShieldCheck size={13} />
          Données de démonstration
        </span>
      </div>
    </section>
  );
}
