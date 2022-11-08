import React from "react";
import ReactDOM from "react-dom/client";
import RouterWrapper from "./components/RouterWrapper";
import { Component } from "./types";

export function renderer(Root: Component, strictMode: boolean) {
  const app = (
    <Root>
      <RouterWrapper />
    </Root>
  );

  const root = ReactDOM.createRoot(
    document.getElementById("root") as HTMLElement
  );

  const StrictModeWrapper = strictMode ? React.StrictMode : React.Fragment;

  root.render(<StrictModeWrapper>{app}</StrictModeWrapper>);

  return root;
}
