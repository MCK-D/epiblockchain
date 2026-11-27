import { useEffect, useState } from "react";
import { useReadContracts } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { rentalDepositAddress } from "../config/contract";
import { rentalDepositAbi } from "../contracts/rentalDepositAbi";
import type { Windows } from "../utils/leaseDeadlines";

// Les trois délais sont immutables : une seule lecture suffit.
export function useWindows(): Windows | undefined {
  const address = rentalDepositAddress;
  const contract = {
    address,
    abi: rentalDepositAbi,
    chainId: baseSepolia.id,
  } as const;
  const read = useReadContracts({
    contracts: [
      { ...contract, functionName: "claimWindow" },
      { ...contract, functionName: "responseWindow" },
      { ...contract, functionName: "arbitrationWindow" },
    ],
    allowFailure: false,
    query: { enabled: address !== undefined, staleTime: Infinity },
  });
  if (!read.data) return undefined;
  const [claim, response, arbitration] = read.data;
  return { claim, response, arbitration };
}

// Heure courante en secondes, mise à jour chaque seconde, pour qu'un bouton
// apparaisse dès qu'un délai expire. Le contrat se fie à l'horodatage du bloc :
// un appel envoyé à la limite est simulé avant signature et refusé s'il est trop tôt.
export function useNow(): bigint {
  const [now, setNow] = useState(() => BigInt(Math.floor(Date.now() / 1000)));
  useEffect(() => {
    const timer = setInterval(
      () => setNow(BigInt(Math.floor(Date.now() / 1000))),
      1000,
    );
    return () => clearInterval(timer);
  }, []);
  return now;
}
