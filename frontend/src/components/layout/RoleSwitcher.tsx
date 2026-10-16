import type { DemoApp } from "../../hooks/useDemoApp";
import type { Role } from "../../types/lease";

type Props = Pick<DemoApp, "role" | "setRole" | "setPage">;
export function RoleSwitcher({ role, setRole, setPage }: Props) {
  return (
    <div className="role-row">
      <span>Voir en tant que</span>
      <div className="segmented" role="group" aria-label="Rôle affiché">
        {(["Locataire", "Propriétaire", "Arbitre"] as Role[]).map((r) => (
          <button
            className={r === role ? "selected" : ""}
            aria-pressed={r === role}
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
    </div>
  );
}
