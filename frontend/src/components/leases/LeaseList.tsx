import { FileText } from "lucide-react";
import useAppContext from "../../contexts/AppContext";

export function LeaseList() {
  const { page } = useAppContext();
  const arbitration = page === "Arbitrage";
  return (
    <section className="lease-section">
      <div className="section-heading">
        <h2>{arbitration ? "Litiges à examiner" : "Mes baux"}</h2>
      </div>
      <div className="table-scroll">
        <div className="empty" role="status">
          <FileText size={24} aria-hidden="true" />
          <h3>
            {arbitration ? "Litiges indisponibles" : "Baux indisponibles"}
          </h3>
          <p>
            La lecture du contrat n’est pas encore intégrée.{" "}
            {arbitration ? "Les litiges" : "Les baux"} ne peuvent pas être
            chargés pour le moment.
          </p>
        </div>
      </div>
    </section>
  );
}
