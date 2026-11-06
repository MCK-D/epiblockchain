import type { LucideIcon } from "lucide-react";
import { CircleHelp, House, LayoutDashboard, Leaf, Scale } from "lucide-react";
import useAppContext from "../../contexts/AppContext";
import type { Page } from "../../types/navigation";

const navigation: { label: Page; icon: LucideIcon }[] = [
  { label: "Vue d’ensemble", icon: LayoutDashboard },
  { label: "Mes baux", icon: House },
  { label: "Arbitrage", icon: Scale },
];

export function Sidebar() {
  const { mobile, page, setPage, setMobile, setHelp } = useAppContext();
  return (
    <aside className={mobile ? "sidebar open" : "sidebar"}>
      <a
        className="brand"
        href="#"
        onClick={(e) => {
          e.preventDefault();
          setPage("Vue d’ensemble");
        }}
      >
        <span className="brand-icon">
          <Leaf size={20} />
        </span>
        caution
      </a>
      <div className="account">
        <strong>Espace personnel</strong>
        Portefeuille personnel
      </div>
      <nav aria-label="Navigation principale">
        {navigation.map(({ icon: Icon, label }) => (
          <button
            key={label}
            className={page === label ? "active" : ""}
            aria-current={page === label ? "page" : undefined}
            onClick={() => {
              setPage(label);
              setMobile(false);
            }}
          >
            <Icon size={18} />
            {label}
          </button>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <button className="help-button" onClick={() => setHelp(true)}>
          <CircleHelp size={18} />
          Comprendre Caution
        </button>
        <div className="network">
          Base Sepolia <small>Testnet</small>
        </div>
      </div>
    </aside>
  );
}
