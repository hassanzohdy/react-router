import React from "react";
import Renderer from "./Renderer";
import history from "./../router-history";
import { Router, Switch } from "react-router-dom";

/**
 * App routes renderer wrapper
 */
export default function RouterWrapper() {
  return (
    <Router history={history}>
      <Switch>
        <Renderer />
      </Switch>
    </Router>
  );
}
