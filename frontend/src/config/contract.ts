import type { Address } from "viem";
import { isLocal } from "./chain";

// Adresse de RentalDeposit sur Base Sepolia, reprise de
// ignition/deployments/chain-84532/deployed_addresses.json.
const baseSepoliaAddress: Address =
  "0x4b7F624b7e4c30F825e7f106b8FF5F29c324504C";

// Sur un nœud Hardhat neuf, le premier contrat déployé par le compte #0 a
// toujours cette adresse (elle dérive du déployeur et de son nonce).
// VITE_LOCAL_RENTAL_DEPOSIT la remplace si le nœud a déjà servi.
const localAddress = (import.meta.env.VITE_LOCAL_RENTAL_DEPOSIT ??
  "0x5FbDB2315678afecb367f032d93F642f64180aa3") as Address;

// Tant qu'elle est absente, l'interface affiche le contrat comme non déployé.
export const rentalDepositAddress: Address | undefined = isLocal
  ? localAddress
  : baseSepoliaAddress;
