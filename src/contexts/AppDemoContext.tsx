import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ComponentProps,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { useNotification } from "../hooks/useNotification";
import { loadLeases, storeLeases } from "../services/leaseStorage";
import type { Lease, LeaseFilter, Page, Role, Status } from "../types/lease";

export type AppDemoContextProps = {
  leases: Lease[];
  setLeases: Dispatch<SetStateAction<Lease[]>>;
  page: Page;
  setPage: Dispatch<SetStateAction<Page>>;
  role: Role;
  setRole: Dispatch<SetStateAction<Role>>;
  connected: boolean;
  setConnected: Dispatch<SetStateAction<boolean>>;
  query: string;
  setQuery: Dispatch<SetStateAction<string>>;
  filter: LeaseFilter;
  setFilter: Dispatch<SetStateAction<LeaseFilter>>;
  selected: Lease | null;
  setSelected: Dispatch<SetStateAction<Lease | null>>;
  create: boolean;
  setCreate: Dispatch<SetStateAction<boolean>>;
  help: boolean;
  setHelp: Dispatch<SetStateAction<boolean>>;
  toast: string;
  setToast: Dispatch<SetStateAction<string>>;
  balance: number;
  setBalance: Dispatch<SetStateAction<number>>;
  mobile: boolean;
  setMobile: Dispatch<SetStateAction<boolean>>;
  notify: (message: string) => void;
  save: (leases: Lease[]) => void;
  act: (
    status: Status,
    label: string,
    credit?: number,
    claimAmount?: number,
  ) => void;
};

const AppDemoContext = createContext<AppDemoContextProps | undefined>(
  undefined,
);

export default function useAppDemoContext(): AppDemoContextProps {
  const context = useContext(AppDemoContext);
  if (context === undefined) {
    throw new Error(
      "useAppDemoContext must be used within AppDemoContextProvider",
    );
  }
  return context;
}

export const AppDemoContextProvider = ({
  children,
}: ComponentProps<"div"> & { children?: ReactNode }) => {
  const [leases, setLeases] = useState<Lease[]>(loadLeases);
  const { toast, setToast, notify } = useNotification();
  const [page, setPage] = useState<Page>("Vue d’ensemble");
  const [role, setRole] = useState<Role>("Locataire");
  const [connected, setConnected] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<LeaseFilter>("Tous les baux");
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
    notify(label + " — simulation enregistrée.");
  }

  const value: AppDemoContextProps = {
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
  return (
    <AppDemoContext.Provider value={value}>{children}</AppDemoContext.Provider>
  );
};
