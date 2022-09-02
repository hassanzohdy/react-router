import React from "react";
import ReactDOM from "react-dom";
import RouterWrapper from "./components/RouterWrapper";
import { getRouterConfig } from "./configurations";
import detectLocaleCodeChange from "./detect-locale-change";
import { isScanned, markAsScanned } from "./is-scanned";
import initiateNavigator, { currentRoute, setPreviousRoute } from "./navigator";
import { addRouter, group, partOf, routesList } from "./routes-list";

/**
 * Scan the entire routes list
 *
 * @returns {void}
 */
function scan(strictMode: boolean = true) {
  if (isScanned()) return;

  detectLocaleCodeChange();
  initiateNavigator();
  setPreviousRoute(currentRoute());

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
