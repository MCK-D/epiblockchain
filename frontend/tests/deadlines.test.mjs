import assert from "node:assert/strict";
import { after, test } from "node:test";
import { keccak256, parseEther, toHex } from "viem";
import { createServer } from "vite";

const server = await createServer({
  server: { middlewareMode: true },
  appType: "custom",
  optimizeDeps: { noDiscovery: true, include: [] },
});
after(() => server.close());

const { availableActions, deadlinesOf, formatRemaining } =
  await server.ssrLoadModule("/src/utils/leaseDeadlines.ts");
const { validateClaimForm, validateSplit } = await server.ssrLoadModule(
  "/src/utils/claimForm.ts",
);

const windows = { claim: 120n, response: 120n, arbitration: 120n };
const endDate = 1_800_000_000n;
const deposit = parseEther("0.0001");
const claimHash = keccak256(toHex("état des lieux de sortie"));

function lease(overrides) {
  return {
    id: 1n,
    landlord: "0x1111111111111111111111111111111111111111",
    tenant: "0x2222222222222222222222222222222222222222",
    arbiter: "0x3333333333333333333333333333333333333333",
    status: 1,
    endDate,
    claimedAt: 0n,
    disputedAt: 0n,
    deposit,
    claimAmount: 0n,
    leaseHash: claimHash,
    claimHash: `0x${"0".repeat(64)}`,
    ...overrides,
  };
}

test("deadlinesOf adds each window to the moment it starts from", () => {
  const deadlines = deadlinesOf(
    lease({ claimedAt: endDate + 10n, disputedAt: endDate + 20n }),
    windows,
  );
  assert.equal(deadlines.claimDeadline, endDate + 120n);
  assert.equal(deadlines.responseDeadline, endDate + 130n);
  assert.equal(deadlines.arbitrationDeadline, endDate + 140n);
});

test("an Active lease: the landlord can release at any time, claim only from the end date to the deadline", () => {
  const active = lease({ status: 1 });
  assert.deepEqual(
    availableActions(active, ["Propriétaire"], windows, endDate - 1n),
    ["releaseAll"],
  );
  assert.deepEqual(
    availableActions(active, ["Propriétaire"], windows, endDate),
    ["releaseAll", "claim"],
  );
  // Last second of the window: the claim is still allowed, the timeout is not.
  assert.deepEqual(
    availableActions(active, ["Propriétaire"], windows, endDate + 120n),
    ["releaseAll", "claim"],
  );
  assert.deepEqual(
    availableActions(active, ["Propriétaire"], windows, endDate + 121n),
    ["releaseAll", "refundAfterTimeout"],
  );
});

test("the tenant and strangers only see the refund once the claim window has passed", () => {
  const active = lease({ status: 1 });
  for (const roles of [["Locataire"], ["Arbitre"], []]) {
    assert.deepEqual(
      availableActions(active, roles, windows, endDate + 120n),
      [],
    );
    assert.deepEqual(availableActions(active, roles, windows, endDate + 121n), [
      "refundAfterTimeout",
    ]);
  }
});

test("a Claimed lease: the tenant can accept or dispute in time, anyone can settle once the response window has passed", () => {
  const claimed = lease({ status: 2, claimedAt: endDate + 5n });
  assert.deepEqual(
    availableActions(claimed, ["Locataire"], windows, endDate + 125n),
    ["acceptClaim", "dispute"],
  );
  // Past the response window the tenant can still accept, but no longer dispute.
  assert.deepEqual(
    availableActions(claimed, ["Locataire"], windows, endDate + 126n),
    ["acceptClaim", "acceptAfterTimeout"],
  );
  assert.deepEqual(availableActions(claimed, [], windows, endDate + 125n), []);
  assert.deepEqual(availableActions(claimed, [], windows, endDate + 126n), [
    "acceptAfterTimeout",
  ]);
  // The landlord cannot accept its own claim.
  assert.deepEqual(
    availableActions(claimed, ["Propriétaire"], windows, endDate + 125n),
    [],
  );
});

test("a Disputed lease: anyone can settle once the arbitration window has passed", () => {
  const disputed = lease({
    status: 3,
    claimedAt: endDate,
    disputedAt: endDate + 7n,
  });
  assert.deepEqual(availableActions(disputed, [], windows, endDate + 127n), []);
  assert.deepEqual(availableActions(disputed, [], windows, endDate + 128n), [
    "resolveAfterTimeout",
  ]);
});

test("a Disputed lease: only the arbiter can resolve, and only within the arbitration window", () => {
  const disputed = lease({
    status: 3,
    claimedAt: endDate,
    disputedAt: endDate + 7n,
  });
  assert.deepEqual(
    availableActions(disputed, ["Arbitre"], windows, endDate + 127n),
    ["resolve"],
  );
  assert.deepEqual(
    availableActions(disputed, ["Arbitre"], windows, endDate + 128n),
    ["resolveAfterTimeout"],
  );
  for (const roles of [["Propriétaire"], ["Locataire"]]) {
    assert.deepEqual(
      availableActions(disputed, roles, windows, endDate + 127n),
      [],
    );
  }
});

test("validateSplit accepts 0 up to the claimed amount, and nothing above", () => {
  const claimAmount = parseEther("0.00004");
  assert.deepEqual(validateSplit("0", claimAmount), { toLandlord: 0n });
  assert.deepEqual(validateSplit("0,00004", claimAmount), {
    toLandlord: claimAmount,
  });
  assert.equal(
    validateSplit("0.00005", claimAmount).error,
    "La part du propriétaire ne peut pas dépasser le montant contesté.",
  );
  assert.equal(validateSplit("abc", claimAmount).error, "Montant invalide.");
});

test("Proposed, Closed and Cancelled leases offer no part 2 action", () => {
  for (const status of [0, 4, 5]) {
    assert.deepEqual(
      availableActions(
        lease({ status }),
        ["Propriétaire", "Locataire"],
        windows,
        endDate + 1000n,
      ),
      [],
    );
  }
});

test("formatRemaining reads both short demo windows and long production ones", () => {
  assert.equal(formatRemaining(100n, 55n), "dans 45 s");
  assert.equal(formatRemaining(200n, 75n), "dans 2 min 05 s");
  assert.equal(formatRemaining(10n, 75n), "il y a 1 min 05 s");
  assert.equal(formatRemaining(60n * 86400n + 7200n, 0n), "dans 60 j 2 h");
});

test("validateClaimForm accepts an amount up to the deposit with evidence", () => {
  assert.deepEqual(
    validateClaimForm({ amount: "0,00005", claimHash }, deposit).args,
    [parseEther("0.00005"), claimHash],
  );
  assert.deepEqual(
    validateClaimForm({ amount: "0.0001", claimHash }, deposit).args,
    [deposit, claimHash],
  );
});

test("validateClaimForm explains every rule claim would reject", () => {
  const cases = [
    ["abc", claimHash, "amount", "Montant invalide."],
    [
      "0",
      claimHash,
      "amount",
      "Le montant réclamé doit être supérieur à zéro.",
    ],
    [
      "0.0002",
      claimHash,
      "amount",
      "Le montant réclamé ne peut pas dépasser la caution.",
    ],
    [
      "0.00005",
      undefined,
      "claimHash",
      "Ajoutez les justificatifs (état des lieux de sortie, devis).",
    ],
  ];
  for (const [amount, hash, field, message] of cases) {
    const result = validateClaimForm({ amount, claimHash: hash }, deposit);
    assert.equal(result.args, undefined);
    assert.equal(result.errors[field], message);
  }
});
