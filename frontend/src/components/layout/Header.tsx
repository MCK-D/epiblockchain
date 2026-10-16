import { Menu, Wallet } from "lucide-react";
import type { DemoApp } from "../../hooks/useDemoApp";

type Props = Pick<
  DemoApp,
  "mobile" | "setMobile" | "page" | "connected" | "setConnected" | "notify"
>;
export function Header({
  mobile,
  setMobile,
  page,
  connected,
  setConnected,
  notify,
}: Props) {
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
        <button
          className={connected ? "wallet-button connected" : "wallet-button"}
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
