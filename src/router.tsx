import React from "react";
import ReactDOM from "react-dom";
import initiateNavigator from "./navigator";
import RouterWrapper from "./components/RouterWrapper";
import { addRouter, partOf, group, routesList } from "./routes-list";
import detectLocaleCodeChange from "./detect-locale-change";

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
