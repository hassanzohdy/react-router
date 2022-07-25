import React from "react";
import { createRoot } from "react-dom/client";
import initiateNavigator from "./navigator";
import RouterWrapper from "./components/RouterWrapper";
import { addRouter, partOf, group, routesList } from "./routes-list";
import detectLocaleCodeChange from "./detect-locale-change";
import ReactDOM from "react-dom";
import { getRouterConfig } from "./configurations";
import { isScanned, markAsScanned } from "./is-scanned";

/**
 * Scan the entire routes list
 *
 * @returns {void}
 */
function scan(strictMode: boolean = true) {
  if (isScanned()) return;

  detectLocaleCodeChange();
  initiateNavigator();

  const RootComponent = getRouterConfig("rootComponent", React.Fragment);

  const StrictWrapper = strictMode ? React.StrictMode : React.Fragment;

  ReactDOM.render(
    <StrictWrapper>
      <RootComponent>
        <RouterWrapper />
      </RootComponent>
    </StrictWrapper>,
    document.getElementById("root")
  );

  // const root = createRoot(document.getElementById("root") as HTMLElement);
  // root.render(
  //   <React.StrictMode>
  //     <RouterWrapper />
  //   </React.StrictMode>
  // );

  markAsScanned();
}

const router = {
  add: addRouter,
  partOf,
  group,
  scan,
  list: routesList,
};

export default router;
