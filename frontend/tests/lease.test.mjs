import assert from "node:assert/strict";
import { after, test } from "node:test";
import {
  ContractFunctionExecutionError,
  ContractFunctionRevertedError,
  encodeErrorResult,
  keccak256,
  parseEther,
  toHex,
  UserRejectedRequestError,
} from "viem";
import { createServer } from "vite";

const server = await createServer({
  server: { middlewareMode: true },
  appType: "custom",
  optimizeDeps: { noDiscovery: true, include: [] },
});
after(() => server.close());

const { validateLeaseForm } = await server.ssrLoadModule(
  "/src/utils/leaseForm.ts",
);
const { contractErrorMessage } = await server.ssrLoadModule(
  "/src/utils/contractErrors.ts",
);
const { rolesOf } = await server.ssrLoadModule("/src/utils/leaseRoles.ts");
const { rentalDepositAbi } = await server.ssrLoadModule(
  "/src/contracts/rentalDepositAbi.ts",
);

const landlord = "0x1111111111111111111111111111111111111111";
const tenant = "0x2222222222222222222222222222222222222222";
const arbiter = "0x3333333333333333333333333333333333333333";
const leaseHash = keccak256(toHex("bail"));
const now = 1_800_000_000n;
// datetime-local is read in local time: two days of margin cover any time zone.
const future = new Date(Number(now + 2n * 86400n) * 1000)
  .toISOString()
  .slice(0, 16);

const valid = {
  tenant,
  arbiter,
  deposit: "0,5",
  endDate: future,
  leaseHash,
};

test("a valid form gives the createLease arguments", () => {
  const { args, errors } = validateLeaseForm(valid, landlord, now);
  assert.equal(errors, undefined);
  assert.equal(args[0], tenant);
  assert.equal(args[1], arbiter);
  assert.equal(args[2], parseEther("0.5"));
  assert.ok(args[3] > now);
  assert.equal(args[4], leaseHash);
});

for (const [label, values, field] of [
  ["an invalid tenant", { tenant: "0x12" }, "tenant"],
  ["the landlord as tenant", { tenant: landlord }, "tenant"],
  ["the landlord as arbiter", { arbiter: landlord }, "arbiter"],
  ["the tenant as arbiter", { arbiter: tenant }, "arbiter"],
  ["a zero deposit", { deposit: "0" }, "deposit"],
  ["a non numeric deposit", { deposit: "abc" }, "deposit"],
  ["a past end date", { endDate: "2020-01-01T00:00" }, "endDate"],
  ["a missing document", { leaseHash: undefined }, "leaseHash"],
]) {
  test(`the form rejects ${label}`, () => {
    const { args, errors } = validateLeaseForm(
      { ...valid, ...values },
      landlord,
      now,
    );
    assert.equal(args, undefined);
    assert.ok(errors[field], `expected an error on ${field}`);
  });
}

test("contract reverts are explained with a readable reason", () => {
  const reverted = new ContractFunctionRevertedError({
    abi: rentalDepositAbi,
    functionName: "fund",
    data: encodeErrorResult({ abi: rentalDepositAbi, errorName: "NotTenant" }),
  });
  const wrapped = new ContractFunctionExecutionError(reverted, {
    abi: rentalDepositAbi,
    args: [1n],
    functionName: "fund",
  });
  assert.equal(
    contractErrorMessage(wrapped),
    "Seul le locataire du bail peut faire cette action.",
  );
});

test("wallet rejections keep the wallet message", () => {
  assert.match(
    contractErrorMessage(new UserRejectedRequestError(new Error("no"))),
    /Demande refusée/,
  );
});

test("roles come from the addresses stored in the lease", () => {
  const lease = { landlord, tenant, arbiter };
  assert.deepEqual(rolesOf(lease, landlord.toUpperCase().replace("0X", "0x")), [
    "Propriétaire",
  ]);
  assert.deepEqual(rolesOf(lease, tenant), ["Locataire"]);
  assert.deepEqual(rolesOf(lease, arbiter), ["Arbitre"]);
  assert.deepEqual(rolesOf(lease, undefined), []);
  assert.deepEqual(
    rolesOf(lease, "0x4444444444444444444444444444444444444444"),
    [],
  );
});
