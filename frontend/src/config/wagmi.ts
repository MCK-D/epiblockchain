import { createConfig, http } from "wagmi";
import { appChain, baseSepolia, hardhatLocal } from "./chain";
import { injected } from "wagmi/connectors";

export const wagmiConfig = createConfig({
  chains: [appChain],
  connectors: [injected({ shimDisconnect: true })],
  multiInjectedProviderDiscovery: true,
  // Une seule chaîne est active (appChain) ; wagmi exige un transport pour
  // chacune de celles que son type peut désigner.
  transports: { [baseSepolia.id]: http(), [hardhatLocal.id]: http() },
  ssr: true,
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
