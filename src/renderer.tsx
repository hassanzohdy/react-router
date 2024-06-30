import React from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import RouterWrapper from "./components/RouterWrapper";
import { Component } from "./types";

export function renderer(Root: Component, strictMode: boolean) {
  const rootElement = document.getElementById("root") as HTMLElement;

  const app = (
    <Root>
      <RouterWrapper />
    </Root>
  );

  if (rootElement.hasChildNodes()) {
    return hydrateRoot(rootElement, app);
  } else {
    const root = createRoot(rootElement);

    const StrictModeWrapper = strictMode ? React.StrictMode : React.Fragment;

    root.render(<StrictModeWrapper>{app}</StrictModeWrapper>);

    return root;
  }
}
