import type { LucideIcon } from "lucide-react";
import {
  ArrowUpRight,
  ChevronDown,
  CircleHelp,
  House,
  LayoutDashboard,
  Leaf,
  Scale,
  ShieldCheck,
} from "lucide-react";
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
          <Leaf size={24} />
        </span>
        caution<span className="brand-dot">.</span>
      </a>
      <div className="workspace">
        <span className="avatar">D</span>
        <div>
          Espace personnel<small>Compte de démonstration</small>
        </div>
        <ChevronDown size={15} />
      </div>
      <span className="nav-label">VOTRE ESPACE</span>
      <nav>
        {navigation.map(({ icon: Icon, label }) => {
          return (
            <button
              key={label}
              className={page === label ? "active" : ""}
              onClick={() => {
                setPage(label);
                setMobile(false);
              }}
            >
              <Icon size={19} />
              {label}
              {label === "Mes baux" && (
                <span className="nav-count">{leases.length}</span>
              )}
            </button>
          );
        })}
      </nav>
      <div className="sidebar-bottom">
        <div className="trust-card">
          <ShieldCheck size={23} />
          <strong>La confiance, par contrat.</strong>
          <p>Des règles transparentes pour votre dépôt de garantie.</p>
          <button onClick={() => setHelp(true)}>
            Comment ça marche <ArrowUpRight size={14} />
          </button>
        </div>
        <button className="help-button" onClick={() => setHelp(true)}>
          <CircleHelp size={18} />
          Comprendre Caution
          <ArrowUpRight size={15} />
        </button>
        <div className="network">
          <span />
          Base Sepolia <small>TESTNET</small>
        </div>
      </div>
    </aside>
  );
}
