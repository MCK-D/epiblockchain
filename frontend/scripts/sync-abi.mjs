// Copies the RentalDeposit ABI from the Hardhat artifacts into the frontend.
// Run `npx hardhat compile` at the repository root first.
import { readFile, writeFile } from "node:fs/promises";

const artifact = JSON.parse(
  await readFile(
    new URL(
      "../../artifacts/contracts/RentalDeposit.sol/RentalDeposit.json",
      import.meta.url,
    ),
  ),
);

await writeFile(
  new URL("../src/contracts/rentalDepositAbi.ts", import.meta.url),
  "// Généré par `npm run abi` depuis artifacts/contracts/RentalDeposit.sol : ne pas modifier à la main.\n" +
    `export const rentalDepositAbi = ${JSON.stringify(artifact.abi, null, 2)} as const;\n`,
);
