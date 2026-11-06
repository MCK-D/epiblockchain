import { FileText } from "lucide-react";
import type { ReactNode } from "react";
import { useConnection } from "wagmi";
import useAppContext from "../../contexts/AppContext";
import { useLeases } from "../../hooks/useLeases";
import { formatDate, formatEth, statusLabel } from "../../utils/format";
import { rolesOf } from "../../utils/leaseRoles";

function Empty({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="empty" role="status">
      <FileText size={24} aria-hidden="true" />
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}

export function LeaseList() {
  const { page, setSelected } = useAppContext();
  const { address } = useConnection();
  const state = useLeases();
  const arbitration = page === "Arbitrage";

  // La page d'arbitrage appartient à la partie 3.
  if (arbitration)
    return (
      <section className="lease-section">
        <div className="section-heading">
          <h2>Litiges à examiner</h2>
        </div>
        <div className="table-scroll">
          <Empty title="Litiges indisponibles">
            L’arbitrage n’est pas encore intégré. Les litiges ne peuvent pas
            être chargés pour le moment.
          </Empty>
        </div>
      </section>
    );

  let content: ReactNode;
  if (state.status === "undeployed")
    content = (
      <Empty title="Baux indisponibles">
        Le contrat n’est pas encore déployé sur Base Sepolia. Les baux ne
        peuvent pas être chargés pour le moment.
      </Empty>
    );
  else if (state.status === "loading")
    content = <Empty title="Lecture du contrat…">Chargement des baux.</Empty>;
  else if (state.status === "error")
    content = (
      <div className="empty" role="alert">
        <FileText size={24} aria-hidden="true" />
        <h3>Lecture du contrat impossible</h3>
        <p>Les baux n’ont pas pu être lus. Ce n’est pas une liste vide.</p>
        <button className="secondary" onClick={state.retry}>
          Réessayer
        </button>
      </div>
    );
  else if (!address)
    content = (
      <Empty title="Connectez votre portefeuille">
        Vos baux sont ceux où votre adresse est propriétaire, locataire ou
        arbitre.
      </Empty>
    );
  else {
    const mine = state.leases.filter(
      (read) =>
        read.status === "failure" || rolesOf(read.lease, address).length > 0,
    );
    content =
      mine.length === 0 ? (
        <Empty title="Aucun bail">
          Aucun bail du contrat ne concerne votre adresse.
        </Empty>
      ) : (
        <table className="lease-table">
          <thead>
            <tr>
              <th scope="col">Bail</th>
              <th scope="col">État</th>
              <th scope="col">Caution</th>
              <th scope="col">Fin</th>
              <th scope="col">Votre rôle</th>
            </tr>
          </thead>
          <tbody>
            {mine.map((read) =>
              read.status === "failure" ? (
                <tr key={read.id.toString()}>
                  <td>n°{read.id.toString()}</td>
                  <td colSpan={4} className="read-error">
                    Lecture impossible
                  </td>
                </tr>
              ) : (
                <tr key={read.id.toString()}>
                  <td>
                    <button
                      className="text-button"
                      onClick={() => setSelected(read.id)}
                    >
                      n°{read.id.toString()}
                    </button>
                  </td>
                  <td>
                    <span className={`badge status-${read.lease.status}`}>
                      {statusLabel(read.lease.status)}
                    </span>
                  </td>
                  <td>{formatEth(read.lease.deposit)}</td>
                  <td>{formatDate(read.lease.endDate)}</td>
                  <td>{rolesOf(read.lease, address).join(", ")}</td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      );
  }

  return (
    <section className="lease-section">
      <div className="section-heading">
        <h2>Mes baux</h2>
      </div>
      <div className="table-scroll">{content}</div>
    </section>
  );
}
