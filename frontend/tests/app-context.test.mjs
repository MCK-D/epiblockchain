import assert from "node:assert/strict";
import { after, test } from "node:test";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { createServer } from "vite";

const server = await createServer({
  server: { middlewareMode: true },
  appType: "custom",
  optimizeDeps: { noDiscovery: true, include: [] },
});
after(() => server.close());

const { default: useAppContext, AppContextProvider } =
  await server.ssrLoadModule("/src/contexts/AppContext.tsx");

const { WalletProvider } = await server.ssrLoadModule(
  "/src/providers/WalletProvider.tsx",
);

const { walletErrorMessage } = await server.ssrLoadModule(
  "/src/utils/walletErrors.ts",
);

function CurrentPage() {
  const { page } = useAppContext();
  return createElement("span", null, page);
}

test("using the context without its provider reports the required provider", () => {
  assert.throws(
    () => renderToString(createElement(CurrentPage)),
    /useAppContext must be used within AppContextProvider/,
  );
});

test("the provider makes shared UI state available to nested children", () => {
  const html = renderToString(
    createElement(
      WalletProvider,
      null,
      createElement(
        AppContextProvider,
        null,
        createElement("section", null, createElement(CurrentPage)),
      ),
    ),
  );
  assert.equal(html, "<section><span>Vue d’ensemble</span></section>");
});

test("wallet rejection and pending errors are readable even when nested", () => {
  assert.match(
    walletErrorMessage({ cause: { code: 4001 } }),
    /Demande refusée/,
  );
  assert.match(
    walletErrorMessage({ cause: { cause: { code: -32002 } } }),
    /déjà en attente/,
  );
  assert.match(walletErrorMessage({ code: 4900 }), /déconnecté/);
});

test("unknown errors do not expose raw provider messages", () => {
  assert.equal(
    walletErrorMessage(new Error("internal provider message")),
    "La demande n’a pas abouti. Vérifiez votre portefeuille et réessayez.",
  );
});
