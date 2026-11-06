import { Plus } from "lucide-react";
import { useConnection } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { rentalDepositAddress } from "../../config/contract";
import useAppContext from "../../contexts/AppContext";

export function PageHeading() {
  const { page, setCreate } = useAppContext();
  const { isConnected, chainId } = useConnection();
  const unavailable = !rentalDepositAddress
    ? "Le contrat n’est pas encore déployé"
    : !isConnected
      ? "Connectez votre portefeuille"
      : chainId !== baseSepolia.id
        ? "Passez sur Base Sepolia"
        : undefined;
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
      <button
        className="primary"
        disabled={unavailable !== undefined}
        title={unavailable}
        onClick={() => setCreate(true)}
      >
        <Plus size={18} />
        Créer un bail
      </button>
    </div>
  );
}
