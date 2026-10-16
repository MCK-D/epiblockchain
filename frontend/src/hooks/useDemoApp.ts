import { useEffect, useState } from "react";
import { loadLeases, storeLeases } from "../services/leaseStorage";
import type { Lease, Page, Role, Status } from "../types/lease";
import { useNotification } from "./useNotification";

export function useDemoApp() {
  const [leases, setLeases] = useState<Lease[]>(loadLeases);
  const { toast, setToast, notify } = useNotification();
  const [page, setPage] = useState<Page>("Vue d’ensemble");
  const [role, setRole] = useState<Role>("Locataire");
  const [connected, setConnected] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("Tous les baux");
  const [selected, setSelected] = useState<Lease | null>(null);
  const [create, setCreate] = useState(false);
  const [help, setHelp] = useState(false);
  const [balance, setBalance] = useState(0);
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const close = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setCreate(false);
        setSelected(null);
        setHelp(false);
        setMobile(false);
      }
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);
  function save(next: Lease[]) {
    setLeases(next);
    storeLeases(next);
  }
  function act(status: Status, label: string, credit = 0, claimAmount = 0) {
    if (!selected) return;
    if (!connected) {
      notify("Connectez le portefeuille de démonstration pour continuer.");
      return;
    }
    const updated = {
      ...selected,
      status,
      history: [...selected.history, label],
      claim: status === "Réclamation" ? claimAmount : selected.claim,
    };
    save(leases.map((l) => (l.id === selected.id ? updated : l)));
    setSelected(updated);
    setBalance((b) => b + credit);
    notify(label + ". Simulation enregistrée.");
  }

  return {
    leases,
    setLeases,
    page,
    setPage,
    role,
    setRole,
    connected,
    setConnected,
    query,
    setQuery,
    filter,
    setFilter,
    selected,
    setSelected,
    create,
    setCreate,
    help,
    setHelp,
    toast,
    setToast,
    balance,
    setBalance,
    mobile,
    setMobile,
    notify,
    save,
    act,
  };
}
export type DemoApp = ReturnType<typeof useDemoApp>;
