import React from "react";
import RouterWrapper from "./components/RouterWrapper";
import type { Component } from "./types";

/**
 * Mount (or hydrate) the router's React tree into `#root`.
 *
 * `react-dom/client` is loaded with a dynamic `import()` instead of a
 * module-scope one. Importing `Link` (or the package barrel) reaches
 * this module through `router.tsx`, so a static import here dragged
 * `react-dom` into the graph of every consumer — including a server
 * one. Only this function actually mounts, so only this function needs
 * `react-dom`.
 *
 * Two details keep the browser behaviour byte-identical:
 *  - the `#root` lookup and the `hasChildNodes()` check still happen
 *    synchronously, in the original order, *before* the dynamic import;
 *  - this function is intentionally NOT `async`, so a missing `#root`
 *    still throws synchronously to the caller (`router.scan()`) rather
 *    than turning into a rejected promise.
 *
 * The returned promise resolves to the same `Root` the function used to
 * return directly. Its only consumer is `Router.render()`, which stores
 * it on a protected field that nothing reads.
 */
export function renderer(Root: Component, strictMode: boolean) {
  const rootElement = document.getElementById("root") as HTMLElement;

  const app = (
    <Root>
      <RouterWrapper />
    </Root>
  );

  const shouldHydrate = rootElement.hasChildNodes();

  return import("react-dom/client").then(({ createRoot, hydrateRoot }) => {
    if (shouldHydrate) {
      return hydrateRoot(rootElement, app);
    } else {
      const root = createRoot(rootElement);

      const StrictModeWrapper = strictMode ? React.StrictMode : React.Fragment;

      root.render(<StrictModeWrapper>{app}</StrictModeWrapper>);

      return root;
    }
  });
}
