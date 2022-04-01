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

  const reactVersion: number = Number(React.version.split(".")[0]);

  if (reactVersion < 18) {
    ReactDOM.render(
      <React.StrictMode>
        <RouterWrapper />
      </React.StrictMode>,
      document.getElementById("root")
    );
  } else {
    const root = ReactDOM.createRoot(document.getElementById("root"));
    root.render(
      <React.StrictMode>
        <RouterWrapper />
      </React.StrictMode>
    );
  }

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
