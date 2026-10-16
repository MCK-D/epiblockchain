import { WalletControls } from "../wallet/WalletControls";
import { Menu } from "lucide-react";
import useAppDemoContext from "../../contexts/AppDemoContext";

export function Header() {
  const { mobile, setMobile, page } = useAppDemoContext();
  return (
    <header>
      <button
        className="mobile-menu"
        aria-label="Ouvrir le menu"
        onClick={() => setMobile(!mobile)}
      >
        <Menu />
      </button>
      <div className="breadcrumb">
        <span className="crumb-root">
          Mon espace <span aria-hidden="true">/</span>
        </span>
        <b>{page}</b>
      </div>
      <div className="header-right">
        <span className="demo-pill">Mode démonstration</span>
        <WalletControls />
      </div>
    </header>
  );
}
