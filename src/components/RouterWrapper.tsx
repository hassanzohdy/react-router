import React from "react";
import Renderer from "./Renderer";
import { getHistory } from "./../router-history";
import { Router, Switch } from "react-router-dom";
import { getRouterConfig } from "../configurations";

/**
 * App routes renderer wrapper
 */
export default function RouterWrapper() {
  const RootComponent = getRouterConfig("rootComponent", React.Fragment);

  return (
    <RootComponent>
      <Router history={getHistory()}>
        <Switch>
          <Renderer />
        </Switch>
      </Router>
    </RootComponent>
  );
}
