import { ArrowRight } from "lucide-react";
import type { DemoApp } from "../../hooks/useDemoApp";
import type { Lease } from "../../types/lease";

type Props = Pick<DemoApp, "leases" | "save" | "setCreate" | "notify">;
export function CreateLeaseForm({ leases, save, setCreate, notify }: Props) {
  return (
    <>
      <h2>Créer un bail</h2>
      <p>Préparez les conditions de votre dépôt de garantie fictif.</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          const tenant = String(f.get("tenant")),
            arbiter = String(f.get("arbiter"));
          if (tenant.toLowerCase() === arbiter.toLowerCase()) {
            notify("L’arbitre doit être distinct du locataire.");
            return;
          }
          const l: Lease = {
            id: Math.max(...leases.map((l) => l.id)) + 1,
            title: String(f.get("title")),
            subtitle: "Bail résidentiel, démonstration",
            deposit: Number(f.get("deposit")),
            end: String(f.get("end")),
            status: "Proposé",
            claim: 0,
            history: ["Bail créé en démonstration"],
          };
          save([l, ...leases]);
          setCreate(false);
          notify("Bail fictif créé. Le locataire peut maintenant le financer.");
        }}
      >
        <label>
          Libellé privé du bien
          <input
            name="title"
            required
            placeholder="Appartement, Paris 11e"
            maxLength={70}
          />
        </label>
        <div className="form-grid">
          <label>
            Caution en ETH
            <input
              name="deposit"
              type="number"
              required
              min="0.0001"
              step="0.0001"
              placeholder="0,45"
            />
          </label>
          <label>
            Fin du bail
            <input
              name="end"
              type="date"
              required
              min={new Date().toISOString().slice(0, 10)}
            />
          </label>
        </div>
        <label>
          Adresse du locataire
          <input
            name="tenant"
            required
            pattern="0x[a-fA-F0-9]{40}"
            placeholder="0x… (40 caractères hexadécimaux)"
          />
        </label>
        <label>
          Adresse de l’arbitre
          <input
            name="arbiter"
            required
            pattern="0x[a-fA-F0-9]{40}"
            placeholder="0x… (distincte du locataire)"
          />
        </label>
        <p className="notice">
          Les libellés restent dans votre navigateur. Aucune donnée personnelle
          n’est envoyée sur une blockchain.
        </p>
        <button className="primary" type="submit">
          Créer le bail fictif <ArrowRight size={16} />
        </button>
      </form>
    </>
  );
}
