import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { network } from "hardhat";
import { parseEther } from "viem";

import RentalDepositModule from "../ignition/modules/RentalDeposit.js";

const DAY = 24n * 60n * 60n;
const WINDOW = 120n;

describe("RentalDeposit", async function () {
  const { viem, ignition } = await network.create();
  const [, tenant] = await viem.getWalletClients();

  async function deploy() {
    return viem.deployContract("RentalDeposit", [WINDOW, WINDOW, WINDOW]);
  }

  describe("deployment", function () {
    it("stores the three windows", async function () {
      const rentalDeposit = await viem.deployContract("RentalDeposit", [
        1n,
        2n,
        3n,
      ]);
      assert.equal(await rentalDeposit.read.claimWindow(), 1n);
      assert.equal(await rentalDeposit.read.responseWindow(), 2n);
      assert.equal(await rentalDeposit.read.arbitrationWindow(), 3n);
    });

    it("starts with no lease", async function () {
      const rentalDeposit = await deploy();
      assert.equal(await rentalDeposit.read.leaseCount(), 0n);
    });

    for (const windows of [
      [0n, WINDOW, WINDOW],
      [WINDOW, 0n, WINDOW],
      [WINDOW, WINDOW, 0n],
    ] as const) {
      it(`rejects a zero window (${windows.join(", ")})`, async function () {
        await assert.rejects(
          viem.deployContract("RentalDeposit", [...windows]),
          /InvalidWindow/,
        );
      });
    }
  });

  describe("Ignition module", function () {
    it("uses the production delays by default", async function () {
      const { rentalDeposit } = await ignition.deploy(RentalDepositModule);
      assert.equal(await rentalDeposit.read.claimWindow(), 60n * DAY);
      assert.equal(await rentalDeposit.read.responseWindow(), 14n * DAY);
      assert.equal(await rentalDeposit.read.arbitrationWindow(), 30n * DAY);
    });

    it("uses the demo delays from ignition/parameters/demo.json", async function () {
      const { rentalDeposit } = await ignition.deploy(RentalDepositModule, {
        parameters: "ignition/parameters/demo.json",
      });
      assert.equal(await rentalDeposit.read.claimWindow(), WINDOW);
      assert.equal(await rentalDeposit.read.responseWindow(), WINDOW);
      assert.equal(await rentalDeposit.read.arbitrationWindow(), WINDOW);
    });
  });

  describe("reads", function () {
    it("reverts when reading a lease that does not exist", async function () {
      const rentalDeposit = await deploy();
      await assert.rejects(rentalDeposit.read.getLease([1n]), /LeaseNotFound/);
    });
  });

  describe("funds safety", function () {
    it("reverts withdraw when the balance is zero", async function () {
      const rentalDeposit = await deploy();
      await assert.rejects(
        rentalDeposit.write.withdraw({ account: tenant.account }),
        /NothingToWithdraw/,
      );
    });

    it("rejects plain ETH transfers (funds only enter through fund)", async function () {
      const rentalDeposit = await deploy();
      await assert.rejects(
        tenant.sendTransaction({
          to: rentalDeposit.address,
          value: parseEther("1"),
        }),
      );
    });
  });
});
