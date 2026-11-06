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
  Claimed: 2,
  Disputed: 3,
  Closed: 4,
  Cancelled: 5,
} as const;

const CLAIM_AMOUNT = parseEther("0.3");
const CLAIM_HASH = keccak256(toHex("état des lieux de sortie et devis"));

describe("RentalDeposit", async function () {
  const { viem, ignition, networkHelpers } = await network.create();
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

  // Lease 1 funded by the tenant (Active).
  async function deployWithActiveLease() {
    const { rentalDeposit, endDate } = await deployWithLease();
    await rentalDeposit.write.fund([1n], {
      account: tenant.account,
      value: DEPOSIT,
    });
    return { rentalDeposit, endDate };
  }

  // Lease 1 claimed by the landlord at its end date (Claimed).
  async function deployWithClaimedLease(claimAmount = CLAIM_AMOUNT) {
    const { rentalDeposit, endDate } = await deployWithActiveLease();
    await networkHelpers.time.setNextBlockTimestamp(endDate);
    await rentalDeposit.write.claim([1n, claimAmount, CLAIM_HASH]);
    return { rentalDeposit, endDate, claimedAt: endDate };
  }

  // Lease 1 disputed by the tenant one second after the claim (Disputed).
  async function deployWithDisputedLease() {
    const { rentalDeposit, claimedAt } = await deployWithClaimedLease();
    const disputedAt = claimedAt + 1n;
    await networkHelpers.time.setNextBlockTimestamp(disputedAt);
    await rentalDeposit.write.dispute([1n], { account: tenant.account });
    return { rentalDeposit, claimedAt, disputedAt };
  }

  function balanceOf(address: `0x${string}`) {
    return publicClient.getBalance({ address });
  }

  // Withdraws for `caller` and returns how much its ETH balance rose, gas added back.
  async function withdrawAndMeasure(
    rentalDeposit: Awaited<ReturnType<typeof deploy>>,
    caller: typeof tenant,
  ) {
    const before = await balanceOf(caller.account.address);
    const hash = await rentalDeposit.write.withdraw({ account: caller.account });
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    const after = await balanceOf(caller.account.address);
    return after - before + receipt.gasUsed * receipt.effectiveGasPrice;
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

  describe("releaseAll", function () {
    it("credits the whole deposit to the tenant, who withdraws it", async function () {
      const { rentalDeposit } = await deployWithActiveLease();
      await viem.assertions.emitWithArgs(
        rentalDeposit.write.releaseAll([1n]),
        rentalDeposit,
        "DepositReleased",
        [1n, DEPOSIT, false],
      );
      const lease = await rentalDeposit.read.getLease([1n]);
      assert.equal(lease.status, Status.Closed);
      assert.equal(
        await rentalDeposit.read.balances([tenant.account.address]),
        DEPOSIT,
      );
      // Released means credited, not paid: the ETH is still in the contract.
      assert.equal(await balanceOf(rentalDeposit.address), DEPOSIT);

      assert.equal(await withdrawAndMeasure(rentalDeposit, tenant), DEPOSIT);
      assert.equal(await balanceOf(rentalDeposit.address), 0n);
      assert.equal(
        await rentalDeposit.read.balances([tenant.account.address]),
        0n,
      );
    });

    it("is allowed before the end date", async function () {
      const { rentalDeposit } = await deployWithActiveLease();
      await rentalDeposit.write.releaseAll([1n]);
      const lease = await rentalDeposit.read.getLease([1n]);
      assert.equal(lease.status, Status.Closed);
    });

    it("rejects anyone but the landlord", async function () {
      const { rentalDeposit } = await deployWithActiveLease();
      for (const caller of [tenant, arbiter, stranger]) {
        await assert.rejects(
          rentalDeposit.write.releaseAll([1n], { account: caller.account }),
          /NotLandlord/,
        );
      }
    });

    it("rejects a lease that is not Active", async function () {
      const { rentalDeposit } = await deployWithLease();
      await assert.rejects(rentalDeposit.write.releaseAll([1n]), /WrongStatus/);

      await rentalDeposit.write.fund([1n], {
        account: tenant.account,
        value: DEPOSIT,
      });
      await rentalDeposit.write.releaseAll([1n]);
      await assert.rejects(rentalDeposit.write.releaseAll([1n]), /WrongStatus/);
    });

    it("rejects a lease that does not exist", async function () {
      const rentalDeposit = await deploy();
      await assert.rejects(rentalDeposit.write.releaseAll([1n]), /LeaseNotFound/);
    });
  });

  describe("claim", function () {
    it("records the claim and credits the unclaimed part to the tenant at once", async function () {
      const { rentalDeposit, endDate } = await deployWithActiveLease();
      await networkHelpers.time.setNextBlockTimestamp(endDate);
      await viem.assertions.emitWithArgs(
        rentalDeposit.write.claim([1n, CLAIM_AMOUNT, CLAIM_HASH]),
        rentalDeposit,
        "DepositClaimed",
        [1n, CLAIM_AMOUNT, DEPOSIT - CLAIM_AMOUNT, CLAIM_HASH],
      );

      const lease = await rentalDeposit.read.getLease([1n]);
      assert.equal(lease.status, Status.Claimed);
      assert.equal(lease.claimAmount, CLAIM_AMOUNT);
      assert.equal(lease.claimHash, CLAIM_HASH);
      assert.equal(lease.claimedAt, endDate);
      assert.equal(
        await rentalDeposit.read.balances([tenant.account.address]),
        DEPOSIT - CLAIM_AMOUNT,
      );
      // The claimed amount is held, credited to nobody, until the claim is settled.
      assert.equal(
        await rentalDeposit.read.balances([landlord.account.address]),
        0n,
      );
    });

    it("credits nothing to the tenant when the whole deposit is claimed", async function () {
      const { rentalDeposit } = await deployWithClaimedLease(DEPOSIT);
      assert.equal(
        await rentalDeposit.read.balances([tenant.account.address]),
        0n,
      );
    });

    it("rejects a claim before the end date", async function () {
      const { rentalDeposit, endDate } = await deployWithActiveLease();
      await networkHelpers.time.setNextBlockTimestamp(endDate - 1n);
      await assert.rejects(
        rentalDeposit.write.claim([1n, CLAIM_AMOUNT, CLAIM_HASH]),
        /LeaseNotEnded/,
      );
    });

    it("accepts a claim on the last second of the claim window", async function () {
      const { rentalDeposit, endDate } = await deployWithActiveLease();
      await networkHelpers.time.setNextBlockTimestamp(endDate + WINDOW);
      await rentalDeposit.write.claim([1n, CLAIM_AMOUNT, CLAIM_HASH]);
      const lease = await rentalDeposit.read.getLease([1n]);
      assert.equal(lease.status, Status.Claimed);
    });

    it("rejects a claim after the claim window", async function () {
      const { rentalDeposit, endDate } = await deployWithActiveLease();
      await networkHelpers.time.setNextBlockTimestamp(endDate + WINDOW + 1n);
      await assert.rejects(
        rentalDeposit.write.claim([1n, CLAIM_AMOUNT, CLAIM_HASH]),
        /ClaimWindowExpired/,
      );
    });

    for (const amount of [0n, DEPOSIT + 1n]) {
      it(`rejects an invalid amount (${amount} wei)`, async function () {
        const { rentalDeposit, endDate } = await deployWithActiveLease();
        await networkHelpers.time.setNextBlockTimestamp(endDate);
        await assert.rejects(
          rentalDeposit.write.claim([1n, amount, CLAIM_HASH]),
          /InvalidClaimAmount/,
        );
      });
    }

    it("rejects anyone but the landlord", async function () {
      const { rentalDeposit, endDate } = await deployWithActiveLease();
      await networkHelpers.time.increaseTo(endDate);
      for (const caller of [tenant, arbiter, stranger]) {
        await assert.rejects(
          rentalDeposit.write.claim([1n, CLAIM_AMOUNT, CLAIM_HASH], {
            account: caller.account,
          }),
          /NotLandlord/,
        );
      }
    });

    it("rejects a second claim", async function () {
      const { rentalDeposit } = await deployWithClaimedLease();
      await assert.rejects(
        rentalDeposit.write.claim([1n, CLAIM_AMOUNT, CLAIM_HASH]),
        /WrongStatus/,
      );
    });

    it("rejects a lease that was never funded", async function () {
      const { rentalDeposit, endDate } = await deployWithLease();
      await networkHelpers.time.increaseTo(endDate);
      await assert.rejects(
        rentalDeposit.write.claim([1n, CLAIM_AMOUNT, CLAIM_HASH]),
        /WrongStatus/,
      );
    });
  });

  describe("acceptClaim", function () {
    it("credits the claimed amount to the landlord", async function () {
      const { rentalDeposit } = await deployWithClaimedLease();
      await viem.assertions.emitWithArgs(
        rentalDeposit.write.acceptClaim([1n], { account: tenant.account }),
        rentalDeposit,
        "ClaimAccepted",
        [1n, CLAIM_AMOUNT, false],
      );
      const lease = await rentalDeposit.read.getLease([1n]);
      assert.equal(lease.status, Status.Closed);

      assert.equal(await withdrawAndMeasure(rentalDeposit, landlord), CLAIM_AMOUNT);
      assert.equal(
        await withdrawAndMeasure(rentalDeposit, tenant),
        DEPOSIT - CLAIM_AMOUNT,
      );
      // Every wei of the deposit went to one of the two parties.
      assert.equal(await balanceOf(rentalDeposit.address), 0n);
    });

    it("rejects anyone but the tenant", async function () {
      const { rentalDeposit } = await deployWithClaimedLease();
      for (const caller of [landlord, arbiter, stranger]) {
        await assert.rejects(
          rentalDeposit.write.acceptClaim([1n], { account: caller.account }),
          /NotTenant/,
        );
      }
    });

    it("rejects a lease with no claim", async function () {
      const { rentalDeposit } = await deployWithActiveLease();
      await assert.rejects(
        rentalDeposit.write.acceptClaim([1n], { account: tenant.account }),
        /WrongStatus/,
      );
    });
  });

  describe("refundAfterTimeout", function () {
    it("lets anyone return the deposit to the tenant once the claim window has passed", async function () {
      const { rentalDeposit, endDate } = await deployWithActiveLease();
      await networkHelpers.time.setNextBlockTimestamp(endDate + WINDOW + 1n);
      await viem.assertions.emitWithArgs(
        rentalDeposit.write.refundAfterTimeout([1n], { account: stranger.account }),
        rentalDeposit,
        "DepositReleased",
        [1n, DEPOSIT, true],
      );
      const lease = await rentalDeposit.read.getLease([1n]);
      assert.equal(lease.status, Status.Closed);
      assert.equal(
        await rentalDeposit.read.balances([tenant.account.address]),
        DEPOSIT,
      );
      // The caller gains nothing: the outcome does not depend on who triggers it.
      assert.equal(
        await rentalDeposit.read.balances([stranger.account.address]),
        0n,
      );
    });

    it("rejects a refund while the landlord can still claim", async function () {
      const { rentalDeposit, endDate } = await deployWithActiveLease();
      await networkHelpers.time.setNextBlockTimestamp(endDate + WINDOW);
      await assert.rejects(
        rentalDeposit.write.refundAfterTimeout([1n], { account: stranger.account }),
        /ClaimWindowOpen/,
      );
    });

    it("rejects a lease that was claimed in time", async function () {
      const { rentalDeposit, endDate } = await deployWithClaimedLease();
      await networkHelpers.time.increaseTo(endDate + WINDOW + 1n);
      await assert.rejects(
        rentalDeposit.write.refundAfterTimeout([1n]),
        /WrongStatus/,
      );
    });
  });

  describe("acceptAfterTimeout", function () {
    it("lets anyone settle an unanswered claim in the landlord's favour", async function () {
      const { rentalDeposit, claimedAt } = await deployWithClaimedLease();
      await networkHelpers.time.setNextBlockTimestamp(claimedAt + WINDOW + 1n);
      await viem.assertions.emitWithArgs(
        rentalDeposit.write.acceptAfterTimeout([1n], { account: stranger.account }),
        rentalDeposit,
        "ClaimAccepted",
        [1n, CLAIM_AMOUNT, true],
      );
      assert.equal(
        await rentalDeposit.read.balances([landlord.account.address]),
        CLAIM_AMOUNT,
      );
    });

    it("rejects it while the tenant can still answer", async function () {
      const { rentalDeposit, claimedAt } = await deployWithClaimedLease();
      await networkHelpers.time.setNextBlockTimestamp(claimedAt + WINDOW);
      await assert.rejects(
        rentalDeposit.write.acceptAfterTimeout([1n]),
        /ResponseWindowOpen/,
      );
    });

    it("rejects a lease with no claim", async function () {
      const { rentalDeposit, endDate } = await deployWithActiveLease();
      await networkHelpers.time.increaseTo(endDate + 3n * WINDOW);
      await assert.rejects(
        rentalDeposit.write.acceptAfterTimeout([1n]),
        /WrongStatus/,
      );
    });
  });

  describe("dispute", function () {
    it("lets the tenant contest the claim within the response window", async function () {
      const { rentalDeposit, claimedAt } = await deployWithClaimedLease();
      await networkHelpers.time.setNextBlockTimestamp(claimedAt + WINDOW);
      await viem.assertions.emitWithArgs(
        rentalDeposit.write.dispute([1n], { account: tenant.account }),
        rentalDeposit,
        "ClaimDisputed",
        [1n],
      );
      const lease = await rentalDeposit.read.getLease([1n]);
      assert.equal(lease.status, Status.Disputed);
      assert.equal(lease.disputedAt, claimedAt + WINDOW);
      // Disputing moves no money: the claimed amount stays held.
      assert.equal(
        await rentalDeposit.read.balances([landlord.account.address]),
        0n,
      );
    });

    it("rejects a dispute after the response window", async function () {
      const { rentalDeposit, claimedAt } = await deployWithClaimedLease();
      await networkHelpers.time.setNextBlockTimestamp(claimedAt + WINDOW + 1n);
      await assert.rejects(
        rentalDeposit.write.dispute([1n], { account: tenant.account }),
        /ResponseWindowExpired/,
      );
    });

    it("rejects anyone but the tenant", async function () {
      const { rentalDeposit } = await deployWithClaimedLease();
      for (const caller of [landlord, arbiter, stranger]) {
        await assert.rejects(
          rentalDeposit.write.dispute([1n], { account: caller.account }),
          /NotTenant/,
        );
      }
    });

    it("rejects a lease with no claim, and a second dispute", async function () {
      const { rentalDeposit } = await deployWithActiveLease();
      await assert.rejects(
        rentalDeposit.write.dispute([1n], { account: tenant.account }),
        /WrongStatus/,
      );

      const disputed = await deployWithDisputedLease();
      await assert.rejects(
        disputed.rentalDeposit.write.dispute([1n], { account: tenant.account }),
        /WrongStatus/,
      );
    });
  });

  describe("resolve", function () {
    it("lets the arbiter split the claimed amount, and only the claimed amount", async function () {
      const { rentalDeposit } = await deployWithDisputedLease();
      const toLandlord = parseEther("0.1");
      await viem.assertions.emitWithArgs(
        rentalDeposit.write.resolve([1n, toLandlord], { account: arbiter.account }),
        rentalDeposit,
        "DisputeResolved",
        [1n, toLandlord, CLAIM_AMOUNT - toLandlord, false],
      );
      const lease = await rentalDeposit.read.getLease([1n]);
      assert.equal(lease.status, Status.Closed);

      assert.equal(await withdrawAndMeasure(rentalDeposit, landlord), toLandlord);
      // The tenant gets the unclaimed part (credited at claim time) plus its share.
      assert.equal(
        await withdrawAndMeasure(rentalDeposit, tenant),
        DEPOSIT - toLandlord,
      );
      // The arbiter is never paid out of the deposit.
      assert.equal(
        await rentalDeposit.read.balances([arbiter.account.address]),
        0n,
      );
      assert.equal(await balanceOf(rentalDeposit.address), 0n);
    });

    for (const toLandlord of [0n, CLAIM_AMOUNT]) {
      it(`accepts a split at the boundary (${toLandlord} wei to the landlord)`, async function () {
        const { rentalDeposit } = await deployWithDisputedLease();
        await rentalDeposit.write.resolve([1n, toLandlord], {
          account: arbiter.account,
        });
        assert.equal(
          await rentalDeposit.read.balances([landlord.account.address]),
          toLandlord,
        );
      });
    }

    it("rejects giving the landlord more than the claimed amount", async function () {
      const { rentalDeposit } = await deployWithDisputedLease();
      await assert.rejects(
        rentalDeposit.write.resolve([1n, CLAIM_AMOUNT + 1n], {
          account: arbiter.account,
        }),
        /InvalidSplit/,
      );
    });

    it("rejects anyone but the arbiter", async function () {
      const { rentalDeposit } = await deployWithDisputedLease();
      for (const caller of [landlord, tenant, stranger]) {
        await assert.rejects(
          rentalDeposit.write.resolve([1n, 0n], { account: caller.account }),
          /NotArbiter/,
        );
      }
    });

    it("rejects the arbiter on a lease that is not in dispute", async function () {
      // The arbiter has no power over undisputed funds.
      const { rentalDeposit } = await deployWithActiveLease();
      await assert.rejects(
        rentalDeposit.write.resolve([1n, 0n], { account: arbiter.account }),
        /WrongStatus/,
      );

      const claimed = await deployWithClaimedLease();
      await assert.rejects(
        claimed.rentalDeposit.write.resolve([1n, 0n], { account: arbiter.account }),
        /WrongStatus/,
      );
    });

    it("accepts a decision on the last second of the arbitration window", async function () {
      const { rentalDeposit, disputedAt } = await deployWithDisputedLease();
      await networkHelpers.time.setNextBlockTimestamp(disputedAt + WINDOW);
      await rentalDeposit.write.resolve([1n, 0n], { account: arbiter.account });
      const lease = await rentalDeposit.read.getLease([1n]);
      assert.equal(lease.status, Status.Closed);
    });

    it("rejects a decision after the arbitration window", async function () {
      const { rentalDeposit, disputedAt } = await deployWithDisputedLease();
      await networkHelpers.time.setNextBlockTimestamp(disputedAt + WINDOW + 1n);
      await assert.rejects(
        rentalDeposit.write.resolve([1n, 0n], { account: arbiter.account }),
        /ArbitrationWindowExpired/,
      );
    });
  });

  describe("resolveAfterTimeout", function () {
    it("lets anyone give the claimed amount back to the tenant when the arbiter is silent", async function () {
      const { rentalDeposit, disputedAt } = await deployWithDisputedLease();
      await networkHelpers.time.setNextBlockTimestamp(disputedAt + WINDOW + 1n);
      await viem.assertions.emitWithArgs(
        rentalDeposit.write.resolveAfterTimeout([1n], { account: stranger.account }),
        rentalDeposit,
        "DisputeResolved",
        [1n, 0n, CLAIM_AMOUNT, true],
      );
      const lease = await rentalDeposit.read.getLease([1n]);
      assert.equal(lease.status, Status.Closed);
      assert.equal(
        await rentalDeposit.read.balances([tenant.account.address]),
        DEPOSIT,
      );
      assert.equal(
        await rentalDeposit.read.balances([landlord.account.address]),
        0n,
      );
    });

    it("rejects it while the arbiter can still decide", async function () {
      const { rentalDeposit, disputedAt } = await deployWithDisputedLease();
      await networkHelpers.time.setNextBlockTimestamp(disputedAt + WINDOW);
      await assert.rejects(
        rentalDeposit.write.resolveAfterTimeout([1n]),
        /ArbitrationWindowOpen/,
      );
    });

    it("rejects a lease that is not Disputed", async function () {
      const { rentalDeposit, claimedAt } = await deployWithClaimedLease();
      await networkHelpers.time.increaseTo(claimedAt + 3n * WINDOW);
      await assert.rejects(
        rentalDeposit.write.resolveAfterTimeout([1n]),
        /WrongStatus/,
      );
    });

    it("rejects a lease that does not exist", async function () {
      const rentalDeposit = await deploy();
      await assert.rejects(
        rentalDeposit.write.resolveAfterTimeout([1n]),
        /LeaseNotFound/,
      );
    });
  });

  describe("withdraw", function () {
    it("pays everything an address is owed across several leases, once", async function () {
      const { rentalDeposit } = await deployWithActiveLease();
      const endDate = await futureEndDate();
      await rentalDeposit.write.createLease([
        tenant.account.address,
        arbiter.account.address,
        DEPOSIT,
        endDate,
        LEASE_HASH,
      ]);
      await rentalDeposit.write.fund([2n], { account: tenant.account, value: DEPOSIT });
      await rentalDeposit.write.releaseAll([1n]);
      await rentalDeposit.write.releaseAll([2n]);

      assert.equal(await withdrawAndMeasure(rentalDeposit, tenant), 2n * DEPOSIT);
      await assert.rejects(
        rentalDeposit.write.withdraw({ account: tenant.account }),
        /NothingToWithdraw/,
      );
    });

    it("emits Withdrawn", async function () {
      const { rentalDeposit } = await deployWithActiveLease();
      await rentalDeposit.write.releaseAll([1n]);
      await viem.assertions.emitWithArgs(
        rentalDeposit.write.withdraw({ account: tenant.account }),
        rentalDeposit,
        "Withdrawn",
        [tenant.account.address, DEPOSIT],
      );
    });
  });

  describe("reentrancy attack on withdraw", function () {
    // The attacker is a contract hired as tenant. Its deposit is released, then it
    // withdraws, and its `receive` calls `withdraw` again while the first call is
    // still running. A second lease's deposit sits in the contract: that is what
    // the attacker tries to steal.
    async function setUpAttack() {
      const rentalDeposit = await deploy();
      const attacker = await viem.deployContract("ReentrantTenant", [
        rentalDeposit.address,
      ]);
      const endDate = await futureEndDate();

      await rentalDeposit.write.createLease([
        attacker.address,
        arbiter.account.address,
        DEPOSIT,
        endDate,
        LEASE_HASH,
      ]);
      await attacker.write.fund([1n], { account: stranger.account, value: DEPOSIT });
      await rentalDeposit.write.releaseAll([1n]);

      await rentalDeposit.write.createLease([
        tenant.account.address,
        arbiter.account.address,
        DEPOSIT,
        endDate,
        LEASE_HASH,
      ]);
      await rentalDeposit.write.fund([2n], { account: tenant.account, value: DEPOSIT });

      assert.equal(await balanceOf(rentalDeposit.address), 2n * DEPOSIT);
      return { rentalDeposit, attacker };
    }

    it("drains a withdraw that pays before zeroing the balance (control)", async function () {
      // Proves the attacker works, so that its failure below means something.
      const vault = await viem.deployContract("VulnerableVault");
      const attacker = await viem.deployContract("ReentrantTenant", [vault.address]);
      await vault.write.credit([attacker.address], { value: DEPOSIT });
      await vault.write.credit([tenant.account.address], { value: DEPOSIT });

      await attacker.write.attack({ account: stranger.account });

      assert.equal(await balanceOf(attacker.address), 2n * DEPOSIT);
      assert.equal(await balanceOf(vault.address), 0n);
      assert.equal(await attacker.read.reentries(), 1n);
    });

    it("fails against RentalDeposit and leaves every balance untouched", async function () {
      const { rentalDeposit, attacker } = await setUpAttack();

      // The re-entrant call is refused, so the attacker's `receive` reverts, the
      // transfer fails, and the whole withdrawal is rolled back.
      await assert.rejects(
        attacker.write.attack({ account: stranger.account }),
        /TransferFailed/,
      );

      assert.equal(await balanceOf(rentalDeposit.address), 2n * DEPOSIT);
      assert.equal(await balanceOf(attacker.address), 0n);
      assert.equal(await rentalDeposit.read.balances([attacker.address]), DEPOSIT);
      const lease = await rentalDeposit.read.getLease([2n]);
      assert.equal(lease.status, Status.Active);
    });
  });

  describe("a tenant that cannot receive ETH", function () {
    it("blocks only its own withdrawal, never the other parties", async function () {
      const { rentalDeposit, endDate } = await deployWithActiveLease();
      const rejecter = await viem.deployContract("RejectingTenant", [
        rentalDeposit.address,
      ]);
      await rentalDeposit.write.createLease([
        rejecter.address,
        arbiter.account.address,
        DEPOSIT,
        endDate,
        LEASE_HASH,
      ]);
      await rejecter.write.fund([2n], { account: stranger.account, value: DEPOSIT });

      await networkHelpers.time.setNextBlockTimestamp(endDate);
      await rentalDeposit.write.claim([2n, CLAIM_AMOUNT, CLAIM_HASH]);

      await assert.rejects(
        rejecter.write.withdraw({ account: stranger.account }),
        /TransferFailed/,
      );
      assert.equal(
        await rentalDeposit.read.balances([rejecter.address]),
        DEPOSIT - CLAIM_AMOUNT,
      );

      // The other lease and the landlord are unaffected.
      await rentalDeposit.write.claim([1n, CLAIM_AMOUNT, CLAIM_HASH]);
      await rentalDeposit.write.acceptClaim([1n], { account: tenant.account });
      assert.equal(await withdrawAndMeasure(rentalDeposit, tenant), DEPOSIT - CLAIM_AMOUNT);
      assert.equal(await withdrawAndMeasure(rentalDeposit, landlord), CLAIM_AMOUNT);
    });
  });
});
