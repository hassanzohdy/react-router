import { preload, PreloadConfigurations } from "@mongez/react-utils";
import React from "react";
import { getCurrentBseAppPath } from "./apps-list";
import { getRouterConfig } from "./configurations";
import { concatRoute, getLocaleCodes } from "./helpers";
import {
  BasicComponentProps,
  GroupOptions,
  Layout,
  LayoutComponent,
  Middleware,
  Route,
} from "./types";

/**
 * Default Full Page >> It Will be just a React Fragment
 */
export const FULL_PAGE: LayoutComponent = ({
  key,
  children,
}: BasicComponentProps) => <React.Fragment key={key} children={children} />;

/**
 * Set all layouts that will wrap the application routes
 *
 * @const  {Array}
 */
export const layoutsList: Array<Layout> = [];

/**
 * Add new route to the routes list of full page
 */
export function addRouter(
  path: string,
  component: React.FunctionComponent<BasicComponentProps>,
  middleware?: Middleware,
  otherRouteConfigurations: Partial<Route> = {}
) {
  return partOf(FULL_PAGE, [
    {
      path,
      component,
      middleware,
      ...otherRouteConfigurations,
    },
  ]);
}

/**
 * Add the given routes as part of the given layout
 */
export function partOf(LayoutComponent: LayoutComponent, routes: Array<Route>) {
  let layout = layoutsList.find(
    (layout) => layout.LayoutComponent === LayoutComponent
  );

  // if the layout component does not exist
  // then create new one and add it to the layouts list
  if (!layout) {
    layout = {
      LayoutComponent,
      routes: [],
      routesList: [],
    };

    layoutsList.push(layout);
  }

  // join all locale code with | for route matching
  const gluedLocaleCodes = getLocaleCodes().join("|"),
    currentAppBasePath = getCurrentBseAppPath();

  routes = routes.map((route) => {
    // added optional localization
    route.originalPath = route.path;
    route.path = concatRoute(
      gluedLocaleCodes ? `/:localeCode(${gluedLocaleCodes})?` : "",
      currentAppBasePath,
      route.path
    );

    if (route.preload) {
      const cache: boolean =
        route.preloadConfig?.cache !== undefined
          ? route.preloadConfig?.cache
          : getRouterConfig("preload.cache");

      const loadingErrorComponent =
        route.preloadConfig?.loadingErrorComponent ||
        getRouterConfig("preload.loadingErrorComponent");

      const preloadConfigurations: PreloadConfigurations = {};

      if (cache) {
        preloadConfigurations.cache = cache;

        if (!preloadConfigurations.cache.key) {
          preloadConfigurations.cache.key = (props) => JSON.stringify(props);
        }
      }

      if (loadingErrorComponent) {
        preloadConfigurations.loadingErrorComponent = loadingErrorComponent;
      }

      route.component = preload(
        route.component,
        route.preload,
        preloadConfigurations
      );
    }

    (layout as Layout).routesList.push(route.path);

    return route;
  });

  layout.routes = layout.routes.concat(routes);
}

/**
 * Group the given routes with the given options
 */
export function group(groupOptions: GroupOptions) {
  const { routes = [], path, middleware, layout = FULL_PAGE } = groupOptions;

  partOf(
    layout,
    routes.map((route) => {
      if (middleware) {
        route.middleware = middleware;
      }

      if (path) {
        route.path = concatRoute(path, route.path);
      }

      return route;
    })
  );
}

/**
 * Get all routes list in the project
 */
export function routesList() {
  return layoutsList.reduce((routes, layout) => {
    return routes.concat(
      layout.routes.map((route) => {
        route.layout = layout.LayoutComponent;
        return route;
      })
    );
  }, [] as Route[]);
}
