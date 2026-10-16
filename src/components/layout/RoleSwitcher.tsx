import useAppDemoContext from "../../contexts/AppDemoContext";
import type { Role } from "../../types/lease";

export function RoleSwitcher() {
  const { role, setRole, setPage } = useAppDemoContext();
  return (
    <div className="role-row">
      <span>Voir en tant que</span>
      <div className="segmented">
        {(["Locataire", "Propriétaire", "Arbitre"] as Role[]).map((r) => (
          <button
            className={r === role ? "selected" : ""}
            key={r}
            onClick={() => {
              setRole(r);
              if (r === "Arbitre") setPage("Arbitrage");
            }}
          >
            {r}
          </button>
        ))}
      </div>
      <span className="simulation-note">
        Données fictives · aucune transaction réelle
      </span>
    </div>
  );
}
