import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const DAY = 24n * 60n * 60n;

// Default values are the production delays (inspired by article 22 of the
// French law of 6 July 1989). The demo deployment overrides them with
// ignition/parameters/demo.json.
export default buildModule("RentalDepositModule", (m) => {
  const claimWindow = m.getParameter("claimWindow", 60n * DAY);
  const responseWindow = m.getParameter("responseWindow", 14n * DAY);
  const arbitrationWindow = m.getParameter("arbitrationWindow", 30n * DAY);

  const rentalDeposit = m.contract("RentalDeposit", [
    claimWindow,
    responseWindow,
    arbitrationWindow,
  ]);

  return { rentalDeposit };
});
