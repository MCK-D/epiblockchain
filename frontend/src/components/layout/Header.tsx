import { WalletControls } from "../wallet/WalletControls";
import { Menu } from "lucide-react";
import useAppContext from "../../contexts/AppContext";

export function Header() {
  const { mobile, setMobile, page } = useAppContext();
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
        <span className="testnet-pill">Testnet</span>
        <WalletControls />
      </div>
    </header>
  );
}
