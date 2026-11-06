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
import type { Page } from "../types/navigation";

export type AppContextProps = {
  page: Page;
  setPage: Dispatch<SetStateAction<Page>>;
  help: boolean;
  setHelp: Dispatch<SetStateAction<boolean>>;
  mobile: boolean;
  setMobile: Dispatch<SetStateAction<boolean>>;
  create: boolean;
  setCreate: Dispatch<SetStateAction<boolean>>;
  selected: bigint | undefined;
  setSelected: Dispatch<SetStateAction<bigint | undefined>>;
};

const AppContext = createContext<AppContextProps | undefined>(undefined);

export default function useAppContext(): AppContextProps {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within AppContextProvider");
  }
  return context;
}

export const AppContextProvider = ({
  children,
}: ComponentProps<"div"> & { children?: ReactNode }) => {
  const [page, setPage] = useState<Page>("Vue d’ensemble");
  const [help, setHelp] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [create, setCreate] = useState(false);
  const [selected, setSelected] = useState<bigint | undefined>(undefined);

  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setHelp(false);
        setMobile(false);
        setCreate(false);
        setSelected(undefined);
      }
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);

  const value: AppContextProps = {
    page,
    setPage,
    help,
    setHelp,
    mobile,
    setMobile,
    create,
    setCreate,
    selected,
    setSelected,
  };
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
