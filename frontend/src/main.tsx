import { WalletProvider } from "./providers/WalletProvider";
import "@fontsource-variable/geist";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { AppDemoContextProvider } from "./contexts/AppDemoContext";
import "./styles/index.css";

createRoot(document.getElementById("root")!).render(
  <WalletProvider>
    <AppDemoContextProvider>
      <App />
    </AppDemoContextProvider>
  </WalletProvider>,
);
