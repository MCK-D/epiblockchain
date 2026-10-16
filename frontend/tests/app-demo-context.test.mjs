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

const { default: useAppDemoContext, AppDemoContextProvider } =
  await server.ssrLoadModule("/src/contexts/AppDemoContext.tsx");

function CurrentRole() {
  const { role } = useAppDemoContext();
  return createElement("span", null, role);
}

test("using the context without its provider reports the required provider", () => {
  assert.throws(
    () => renderToString(createElement(CurrentRole)),
    /useAppDemoContext must be used within AppDemoContextProvider/,
  );
});

test("the provider makes shared demo state available to nested children", () => {
  const html = renderToString(
    createElement(
      AppDemoContextProvider,
      null,
      createElement("section", null, createElement(CurrentRole)),
    ),
  );
  assert.equal(html, "<section><span>Locataire</span></section>");
});
