import { expect, test } from "@playwright/test";

const account = "0x1111111111111111111111111111111111111111";
const nextAccount = "0x2222222222222222222222222222222222222222";

async function injectWallet(page) {
  await page.addInitScript(() => {
    const listeners = new Map();
    const state = {
      chainId: sessionStorage.getItem("test-chain") || "0x1",
      accounts: JSON.parse(sessionStorage.getItem("test-accounts") || "[]"),
      reject: false,
      waitForApproval: false,
      approve: undefined,
      requests: [],
      emit(event, value) {
        if (event === "accountsChanged")
          sessionStorage.setItem("test-accounts", JSON.stringify(value));
        if (event === "chainChanged")
          sessionStorage.setItem("test-chain", value);
        for (const listener of listeners.get(event) || []) listener(value);
      },
    };
    window.walletTest = state;
    window.ethereum = {
      on(event, listener) {
        if (!listeners.has(event)) listeners.set(event, new Set());
        listeners.get(event).add(listener);
      },
      removeListener(event, listener) {
        listeners.get(event)?.delete(listener);
      },
      async request({ method, params }) {
        state.requests.push(method);
        if (method === "eth_chainId") return state.chainId;
        if (method === "eth_accounts") return state.accounts;
        if (
          method === "eth_requestAccounts" ||
          method === "wallet_requestPermissions"
        ) {
          if (state.reject)
            throw Object.assign(new Error("Rejected"), { code: 4001 });
          if (state.waitForApproval)
            await new Promise((resolve) => {
              state.approve = resolve;
            });
          state.accounts = ["0x1111111111111111111111111111111111111111"];
          sessionStorage.setItem(
            "test-accounts",
            JSON.stringify(state.accounts),
          );
          return method === "eth_requestAccounts"
            ? state.accounts
            : [{ parentCapability: "eth_accounts" }];
        }
        if (method === "wallet_getPermissions") return [];
        if (method === "wallet_revokePermissions") {
          state.accounts = [];
          sessionStorage.removeItem("test-accounts");
          return null;
        }
        if (method === "wallet_switchEthereumChain") {
          if (state.reject)
            throw Object.assign(new Error("Rejected"), { code: 4001 });
          state.chainId = params[0].chainId;
          state.emit("chainChanged", state.chainId);
          return null;
        }
        throw new Error("Unexpected wallet request: " + method);
      },
    };
  });
}

async function connect(page) {
  await page
    .getByRole("button", { name: "Connecter un wallet", exact: true })
    .click();
  await page.getByRole("button", { name: "Injected", exact: true }).click();
}

test("no wallet: install guidance and no fake connection", async ({ page }) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Connecter un wallet", exact: true })
    .click();
  await expect(
    page.getByText(/Installez une extension compatible/),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Injected", exact: true }),
  ).toHaveCount(0);
  await expect(page.getByText("0x71C…4f2A")).toHaveCount(0);
});

test("connect, switch, account change, reconnect and disconnect without signing", async ({
  page,
}) => {
  await injectWallet(page);
  await page.goto("/");
  await connect(page);
  await expect(page.getByText(account, { exact: true })).toBeVisible();
  await expect(page.getByText(/Réseau non pris en charge/)).toBeVisible();
  await page.getByRole("button", { name: "Passer sur Base Sepolia" }).click();
  await expect(
    page.getByText("Base Sepolia · testnet", { exact: true }),
  ).toBeVisible();
  await page.evaluate((address) => {
    window.walletTest.accounts = [address];
    window.walletTest.emit("accountsChanged", [address]);
  }, nextAccount);
  await expect(page.getByText(nextAccount, { exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "Gérer le portefeuille" }).click();
  await expect(page.getByText(nextAccount, { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Déconnecter le portefeuille", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Connecter un portefeuille" }),
  ).toBeVisible();
  await expect(page.getByText(account, { exact: true })).toHaveCount(0);
  const requests = await page.evaluate(() => window.walletTest.requests);
  expect(requests).not.toContain("eth_sendTransaction");
  expect(requests).not.toContain("personal_sign");
  expect(requests).not.toContain("eth_signTypedData_v4");
});

test("connection and switch rejection show a readable error and allow retry", async ({
  page,
}) => {
  await injectWallet(page);
  await page.goto("/");
  await page.evaluate(() => {
    window.walletTest.reject = true;
  });
  await connect(page);
  await expect(page.getByRole("alert")).toContainText("Demande refusée");
  await page.evaluate(() => {
    window.walletTest.reject = false;
  });
  await page.getByRole("button", { name: "Injected", exact: true }).click();
  await expect(page.getByText(account, { exact: true })).toBeVisible();
  await page.evaluate(() => {
    window.walletTest.reject = true;
  });
  await page.getByRole("button", { name: "Passer sur Base Sepolia" }).click();
  await expect(page.getByRole("alert")).toContainText("Demande refusée");
  await expect(page.getByText(/Réseau non pris en charge/)).toBeVisible();
  await page.evaluate(() => {
    window.walletTest.reject = false;
  });
  await page.getByRole("button", { name: "Passer sur Base Sepolia" }).click();
  await expect(
    page.getByText("Base Sepolia · testnet", { exact: true }),
  ).toBeVisible();
});

test("pending requests disable repeated connections", async ({ page }) => {
  await injectWallet(page);
  await page.goto("/");
  await page.evaluate(() => {
    window.walletTest.waitForApproval = true;
  });
  await connect(page);
  await expect(
    page.getByText("Confirmez la connexion dans votre portefeuille…"),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Injected", exact: true }),
  ).toBeDisabled();
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "Connecter un wallet", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Injected", exact: true }),
  ).toBeDisabled();
  await page.evaluate(() => {
    window.walletTest.waitForApproval = false;
    window.walletTest.approve();
  });
  await expect(page.getByText(account, { exact: true })).toBeVisible();
});

test("wrong-chain and disconnected wallets cannot advance a demo lease", async ({
  page,
}) => {
  await injectWallet(page);
  await page.goto("/");
  await connect(page);
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Mes baux", exact: false }).click();
  await page
    .getByRole("row", { name: /Ouvrir le bail Appartement.*Nantes/ })
    .click();
  await page
    .getByRole("button", { name: "Simuler le versement de 0,36 ETH" })
    .click();
  await expect(
    page.getByText("Passez sur Base Sepolia dans le menu du portefeuille.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Simuler le versement de 0,36 ETH" }),
  ).toBeVisible();
  await page.evaluate(() => {
    window.walletTest.chainId = "0x14a34";
    window.walletTest.emit("chainChanged", "0x14a34");
  });
  await page
    .getByRole("button", { name: "Simuler le versement de 0,36 ETH" })
    .click();
  await expect(
    page.getByRole("dialog").getByText("Caution versée", { exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await page.evaluate(() => {
    window.walletTest.accounts = [];
    window.walletTest.emit("accountsChanged", []);
  });
  await expect(
    page.getByRole("button", { name: "Connecter un wallet", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("row", { name: /Ouvrir le bail Appartement.*Nantes/ })
    .click();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Propriétaire", exact: true }).click();
  await page
    .getByRole("row", { name: /Ouvrir le bail Appartement.*Nantes/ })
    .click();
  await page
    .getByRole("button", { name: "Restituer toute la caution" })
    .click();
  await expect(
    page.getByText("Connectez votre portefeuille pour continuer.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Restituer toute la caution" }),
  ).toBeVisible();
  // A new wallet connection cannot authorize the simulated roles; those remain a demo selector.
  const requests = await page.evaluate(() => window.walletTest.requests);
  expect(
    requests.every(
      (method) => !method.includes("sign") && method !== "eth_sendTransaction",
    ),
  ).toBe(true);
});
