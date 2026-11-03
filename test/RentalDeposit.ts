import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { network } from "hardhat";
import { getAddress, keccak256, parseEther, toHex } from "viem";

import RentalDepositModule from "../ignition/modules/RentalDeposit.js";

const DAY = 24n * 60n * 60n;
const WINDOW = 120n;
const DEPOSIT = parseEther("1");
const LEASE_HASH = keccak256(toHex("bail et état des lieux d'entrée"));

// Values of the Solidity Status enum.
const Status = {
  Proposed: 0,
  Active: 1,
  Cancelled: 5,
} as const;

describe("RentalDeposit", async function () {
  const { viem, ignition } = await network.create();
  const publicClient = await viem.getPublicClient();
  const [landlord, tenant, arbiter, stranger] = await viem.getWalletClients();

  async function deploy() {
    return viem.deployContract("RentalDeposit", [WINDOW, WINDOW, WINDOW]);
  }

  async function futureEndDate() {
    const { timestamp } = await publicClient.getBlock();
    return timestamp + 30n * DAY;
  }

  // Deploys the contract and creates lease 1 (Proposed) from the landlord.
  async function deployWithLease() {
    const rentalDeposit = await deploy();
    const endDate = await futureEndDate();
    await rentalDeposit.write.createLease([
      tenant.account.address,
      arbiter.account.address,
      DEPOSIT,
      endDate,
      LEASE_HASH,
    ]);
    return { rentalDeposit, endDate };
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

  describe("createLease", function () {
    it("stores a Proposed lease owned by the caller", async function () {
      const { rentalDeposit, endDate } = await deployWithLease();
      assert.equal(await rentalDeposit.read.leaseCount(), 1n);

      const lease = await rentalDeposit.read.getLease([1n]);
      assert.equal(lease.landlord, getAddress(landlord.account.address));
      assert.equal(lease.tenant, getAddress(tenant.account.address));
      assert.equal(lease.arbiter, getAddress(arbiter.account.address));
      assert.equal(lease.status, Status.Proposed);
      assert.equal(lease.endDate, endDate);
      assert.equal(lease.deposit, DEPOSIT);
      assert.equal(lease.leaseHash, LEASE_HASH);
      assert.equal(lease.claimAmount, 0n);
      assert.equal(lease.claimedAt, 0n);
      assert.equal(lease.disputedAt, 0n);
    });

    it("emits LeaseCreated and numbers leases from 1", async function () {
      const { rentalDeposit, endDate } = await deployWithLease();
      await viem.assertions.emitWithArgs(
        rentalDeposit.write.createLease([
          tenant.account.address,
          arbiter.account.address,
          DEPOSIT,
          endDate,
          LEASE_HASH,
        ]),
        rentalDeposit,
        "LeaseCreated",
        [
          2n,
          landlord.account.address,
          tenant.account.address,
          arbiter.account.address,
          DEPOSIT,
          endDate,
          LEASE_HASH,
        ],
      );
      assert.equal(await rentalDeposit.read.leaseCount(), 2n);
    });

    const invalidLeases = [
      ["a zero tenant", "InvalidTenant", { tenant: "zero" }],
      ["the landlord as tenant", "InvalidTenant", { tenant: "landlord" }],
      ["a zero arbiter", "InvalidArbiter", { arbiter: "zero" }],
      ["the landlord as arbiter", "InvalidArbiter", { arbiter: "landlord" }],
      ["the tenant as arbiter", "InvalidArbiter", { arbiter: "tenant" }],
      ["a zero deposit", "ZeroDeposit", { deposit: 0n }],
    ] as const;

    for (const [label, error, override] of invalidLeases) {
      it(`rejects ${label}`, async function () {
        const rentalDeposit = await deploy();
        const addresses = {
          zero: "0x0000000000000000000000000000000000000000",
          landlord: landlord.account.address,
          tenant: tenant.account.address,
          arbiter: arbiter.account.address,
        } as const;
        await assert.rejects(
          rentalDeposit.write.createLease([
            addresses["tenant" in override ? override.tenant : "tenant"],
            addresses["arbiter" in override ? override.arbiter : "arbiter"],
            "deposit" in override ? override.deposit : DEPOSIT,
            await futureEndDate(),
            LEASE_HASH,
          ]),
          new RegExp(error),
        );
      });
    }

    it("rejects an end date that is not in the future", async function () {
      const rentalDeposit = await deploy();
      const { timestamp } = await publicClient.getBlock();
      await assert.rejects(
        rentalDeposit.write.createLease([
          tenant.account.address,
          arbiter.account.address,
          DEPOSIT,
          timestamp,
          LEASE_HASH,
        ]),
        /EndDateInPast/,
      );
    });
  });

  describe("cancel", function () {
    it("lets the landlord cancel a Proposed lease", async function () {
      const { rentalDeposit } = await deployWithLease();
      await viem.assertions.emitWithArgs(
        rentalDeposit.write.cancel([1n]),
        rentalDeposit,
        "LeaseCancelled",
        [1n],
      );
      const lease = await rentalDeposit.read.getLease([1n]);
      assert.equal(lease.status, Status.Cancelled);
    });

    it("rejects anyone but the landlord", async function () {
      const { rentalDeposit } = await deployWithLease();
      for (const caller of [tenant, arbiter, stranger]) {
        await assert.rejects(
          rentalDeposit.write.cancel([1n], { account: caller.account }),
          /NotLandlord/,
        );
      }
    });

    it("rejects a lease that is already funded", async function () {
      const { rentalDeposit } = await deployWithLease();
      await rentalDeposit.write.fund([1n], {
        account: tenant.account,
        value: DEPOSIT,
      });
      await assert.rejects(rentalDeposit.write.cancel([1n]), /WrongStatus/);
    });

    it("rejects a lease that is already cancelled", async function () {
      const { rentalDeposit } = await deployWithLease();
      await rentalDeposit.write.cancel([1n]);
      await assert.rejects(rentalDeposit.write.cancel([1n]), /WrongStatus/);
    });

    it("rejects a lease that does not exist", async function () {
      const rentalDeposit = await deploy();
      await assert.rejects(rentalDeposit.write.cancel([1n]), /LeaseNotFound/);
    });
  });

  describe("fund", function () {
    it("lets the tenant lock the exact deposit", async function () {
      const { rentalDeposit } = await deployWithLease();
      await viem.assertions.emitWithArgs(
        rentalDeposit.write.fund([1n], {
          account: tenant.account,
          value: DEPOSIT,
        }),
        rentalDeposit,
        "LeaseFunded",
        [1n, DEPOSIT],
      );
      const lease = await rentalDeposit.read.getLease([1n]);
      assert.equal(lease.status, Status.Active);
      assert.equal(
        await publicClient.getBalance({ address: rentalDeposit.address }),
        DEPOSIT,
      );
      // Funds stay locked: nobody is credited yet.
      assert.equal(
        await rentalDeposit.read.balances([landlord.account.address]),
        0n,
      );
      assert.equal(
        await rentalDeposit.read.balances([tenant.account.address]),
        0n,
      );
    });

    it("rejects anyone but the tenant", async function () {
      const { rentalDeposit } = await deployWithLease();
      for (const caller of [landlord, arbiter, stranger]) {
        await assert.rejects(
          rentalDeposit.write.fund([1n], {
            account: caller.account,
            value: DEPOSIT,
          }),
          /NotTenant/,
        );
      }
    });

    for (const value of [DEPOSIT - 1n, DEPOSIT + 1n, 0n]) {
      it(`rejects a wrong amount (${value} wei)`, async function () {
        const { rentalDeposit } = await deployWithLease();
        await assert.rejects(
          rentalDeposit.write.fund([1n], { account: tenant.account, value }),
          /WrongDepositAmount/,
        );
      });
    }

    it("rejects a second payment", async function () {
      const { rentalDeposit } = await deployWithLease();
      await rentalDeposit.write.fund([1n], {
        account: tenant.account,
        value: DEPOSIT,
      });
      await assert.rejects(
        rentalDeposit.write.fund([1n], {
          account: tenant.account,
          value: DEPOSIT,
        }),
        /WrongStatus/,
      );
    });

    it("rejects a cancelled lease", async function () {
      const { rentalDeposit } = await deployWithLease();
      await rentalDeposit.write.cancel([1n]);
      await assert.rejects(
        rentalDeposit.write.fund([1n], {
          account: tenant.account,
          value: DEPOSIT,
        }),
        /WrongStatus/,
      );
    });

    it("rejects a lease that does not exist", async function () {
      const rentalDeposit = await deploy();
      await assert.rejects(
        rentalDeposit.write.fund([1n], {
          account: tenant.account,
          value: DEPOSIT,
        }),
        /LeaseNotFound/,
      );
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
