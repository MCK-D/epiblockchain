import { Plus } from "lucide-react";
import useAppDemoContext from "../../contexts/AppDemoContext";

export function PageHeading() {
  const { page, setCreate } = useAppDemoContext();
  return (
    <div className="page-heading">
      <div>
        <h1>
          {page === "Vue d’ensemble"
            ? "Chaque bail commence par la confiance."
            : page === "Mes baux"
              ? "Vos baux, au même endroit."
              : "Un désaccord, un cadre clair."}
        </h1>
        <p>
          {page === "Arbitrage"
            ? "Consultez les litiges et répartissez uniquement les montants contestés."
            : "Suivez vos dépôts de garantie, de la remise des clés à leur restitution."}
        </p>
      </div>
      <button className="primary" onClick={() => setCreate(true)}>
        <Plus size={18} />
        Créer un bail
      </button>
    </div>
  );
}
