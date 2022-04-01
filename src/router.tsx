import React from "react";
import { createRoot } from "react-dom/client";
import initiateNavigator from "./navigator";
import RouterWrapper from "./components/RouterWrapper";
import { addRouter, partOf, group, routesList } from "./routes-list";
import detectLocaleCodeChange from "./detect-locale-change";
import ReactDOM from "react-dom";

let isScanned = false;

/**
 * Scan the entire routes list
 *
 * @returns {void}
 */
function scan() {
  if (isScanned) return;

  detectLocaleCodeChange();
  initiateNavigator();

  ReactDOM.render(
    <React.StrictMode>
      <RouterWrapper />
    </React.StrictMode>,
    document.getElementById("root")
  );

  // const root = createRoot(document.getElementById("root") as HTMLElement);
  // root.render(
  //   <React.StrictMode>
  //     <RouterWrapper />
  //   </React.StrictMode>
  // );

  isScanned = true;
}

const router = {
  add: addRouter,
  partOf,
  group,
  scan,
  list: routesList,
};

export default router;
