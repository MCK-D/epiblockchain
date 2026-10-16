import { LogOut, Wallet } from "lucide-react";
import { AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";
import { getAddress } from "viem";
import {
  useConnect,
  useConnection,
  useConnectors,
  useDisconnect,
  useSwitchChain,
  type Connector,
} from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { walletErrorMessage } from "../../utils/walletErrors";
import { Modal } from "../ui/Modal";

function WalletOption({
  connector,
  pending,
  onConnect,
}: {
  connector: Connector;
  pending: boolean;
  onConnect: (connector: Connector) => void;
}) {
  const [available, setAvailable] = useState(false);
  useEffect(() => {
    let active = true;
    connector
      .getProvider()
      .then((provider) => {
        if (active) setAvailable(Boolean(provider));
      })
      .catch(() => {
        if (active) setAvailable(false);
      });
    return () => {
      active = false;
    };
  }, [connector]);
  if (!available) return null;
  return (
    <button
      className="secondary wallet-option"
      disabled={pending}
      onClick={() => onConnect(connector)}
    >
      <Wallet size={18} />
      {connector.name}
    </button>
  );
}

export function WalletControls() {
  const [open, setOpen] = useState(false);
  const connection = useConnection();
  const connectors = useConnectors();
  const connect = useConnect();
  const disconnect = useDisconnect();
  const switchChain = useSwitchChain();
  const onBaseSepolia = connection.chainId === baseSepolia.id;
  const address = connection.address
    ? getAddress(connection.address)
    : undefined;
  const busy =
    connect.isPending || switchChain.isPending || disconnect.isPending;
  const reconnecting = connection.status === "reconnecting";
  const error = connect.error || switchChain.error || disconnect.error;

  // Connection may finish while the dialog is closed. Wagmi owns the state.
  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [open]);

  function showWallet() {
    if (!connect.isPending) connect.reset();
    if (!switchChain.isPending) switchChain.reset();
    if (!disconnect.isPending) disconnect.reset();
    setOpen(true);
  }

  return (
    <>
      <button
        className={
          connection.isConnected ? "wallet-button connected" : "wallet-button"
        }
        onClick={showWallet}
        disabled={reconnecting}
        title={
          address
            ? `${address} · ${onBaseSepolia ? "Base Sepolia" : "Réseau non pris en charge"}`
            : undefined
        }
        aria-label={
          connection.isConnected
            ? "Gérer le portefeuille"
            : "Connecter un wallet"
        }
      >
        <Wallet size={16} />
        {reconnecting
          ? "Reconnexion…"
          : address
            ? onBaseSepolia
              ? `${address.slice(0, 6)}…${address.slice(-4)}`
              : "Réseau incorrect"
            : "Connecter un wallet"}
      </button>
      <AnimatePresence>
        {open && (
          <Modal title="Portefeuille" onClose={() => setOpen(false)}>
            <h2>
              {connection.isConnected
                ? "Votre portefeuille"
                : "Connecter un portefeuille"}
            </h2>
            <p>
              La connexion est réelle. Les opérations des baux ne sont pas
              encore disponibles. Aucune signature ni transaction n’est
              demandée.
            </p>
            {connection.isConnected && address ? (
              <>
                <dl className="wallet-details">
                  <dt>Adresse connectée</dt>
                  <dd>{address}</dd>
                  <dt>Réseau</dt>
                  <dd>
                    {onBaseSepolia
                      ? "Base Sepolia · testnet"
                      : `Réseau non pris en charge (ID ${connection.chainId ?? "inconnu"})`}
                  </dd>
                </dl>
                {!onBaseSepolia && (
                  <>
                    <p className="notice">
                      Sélectionnez Base Sepolia pour continuer. Seul ce réseau
                      de test est pris en charge.
                    </p>
                    <button
                      className="primary"
                      disabled={busy}
                      onClick={() => {
                        connect.reset();
                        switchChain.mutate({ chainId: baseSepolia.id });
                      }}
                    >
                      {switchChain.isPending
                        ? "Confirmez dans le portefeuille…"
                        : "Passer sur Base Sepolia"}
                    </button>
                  </>
                )}
                <button
                  className="secondary wallet-disconnect"
                  disabled={busy}
                  onClick={() => {
                    switchChain.reset();
                    disconnect.mutate({});
                  }}
                >
                  <LogOut size={16} />
                  {disconnect.isPending
                    ? "Déconnexion…"
                    : "Déconnecter le portefeuille"}
                </button>
              </>
            ) : (
              <>
                <p>
                  Choisissez une extension installée dans ce navigateur. Base
                  Sepolia (84532) est le seul réseau configuré.
                </p>
                <div className="wallet-options">
                  {connectors.map((connector) => (
                    <WalletOption
                      key={connector.uid}
                      connector={connector}
                      pending={busy}
                      onConnect={(selected) =>
                        connect.mutate({ connector: selected })
                      }
                    />
                  ))}
                </div>
                <p className="wallet-install">
                  Aucun portefeuille affiché ? Installez une extension
                  compatible Ethereum (par exemple MetaMask ou Rabby),
                  déverrouillez-la puis rechargez la page. Les connexions
                  mobiles par QR code ne sont pas encore disponibles.
                </p>
                {connect.isPending && (
                  <p role="status">
                    Confirmez la connexion dans votre portefeuille…
                  </p>
                )}
              </>
            )}
            {error && (
              <p className="wallet-error" role="alert">
                {walletErrorMessage(error)}
              </p>
            )}
          </Modal>
        )}
      </AnimatePresence>
    </>
  );
}
