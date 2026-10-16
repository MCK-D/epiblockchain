import { Menu, Wallet } from "lucide-react";
import useAppDemoContext from "../../contexts/AppDemoContext";

export function Header() {
  const { mobile, setMobile, page, connected, setConnected, notify } =
    useAppDemoContext();
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
        Mon espace <span>/</span> <b>{page}</b>
      </div>
      <div className="header-right">
        <span className="demo-pill">
          <span />
          Mode démonstration
        </span>
        <button
          className="wallet-button"
          onClick={() => {
            setConnected(!connected);
            notify(
              connected
                ? "Portefeuille déconnecté."
                : "Portefeuille fictif connecté. Aucune transaction réelle.",
            );
          }}
        >
          <Wallet size={16} />
          {connected ? "0x71C…4f2A" : "Connecter un wallet"}
        </button>
      </div>
    </header>
  );
}
