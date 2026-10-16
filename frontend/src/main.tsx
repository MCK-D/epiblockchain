import { WalletProvider } from "./providers/WalletProvider";
import "@fontsource-variable/geist";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { AppContextProvider } from "./contexts/AppContext";
import "./styles/index.css";

createRoot(document.getElementById("root")!).render(
  <WalletProvider>
    <AppContextProvider>
      <App />
    </AppContextProvider>
  </WalletProvider>,
);
