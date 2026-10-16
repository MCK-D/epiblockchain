import type { LucideIcon } from "lucide-react";
import { CircleHelp, House, LayoutDashboard, Leaf, Scale } from "lucide-react";
import useAppDemoContext from "../../contexts/AppDemoContext";
import type { Page } from "../../types/lease";

const navigation: { label: Page; icon: LucideIcon }[] = [
  { label: "Vue d’ensemble", icon: LayoutDashboard },
  { label: "Mes baux", icon: House },
  { label: "Arbitrage", icon: Scale },
];

export function Sidebar() {
  const { mobile, page, setPage, setMobile, leases, setHelp } =
    useAppDemoContext();
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
        Compte de démonstration
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
            {label === "Mes baux" && (
              <span className="nav-count">{leases.length}</span>
            )}
          </button>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <button className="help-button" onClick={() => setHelp(true)}>
          <CircleHelp size={18} />
          Comprendre Caution
        </button>
        <div className="network">
          <span className="live-dot" />
          Base Sepolia <small>Testnet</small>
        </div>
      </div>
    </aside>
  );
}
