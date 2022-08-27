import React from "react";
import Middleware from "./Middleware";
import { concatRoute } from "./../../helpers";
import history from "./../../router-history";
import { navigateTo } from "../../navigator";
import { layoutsList, routesList } from "./../../routes-list";
import { getCurrentBseAppPath } from "./../../apps-list";
import { getRouterConfig } from "./../../configurations";
import { Layout, Route as ModuleRoute, Module } from "./../../types";
import { Route, RouteComponentProps } from "react-router-dom";
import { appDynamicRouteModule, modulesList } from "./../../apps-list";
import { firstSegmentOfRoute, isPartOfLazyModules } from "./renderer-helpers";
import { setCurrentRouteData } from "../..";

interface CurrentRouteHolder {
  routeInfo: null | ModuleRoute;
}

const currentRoute: CurrentRouteHolder = {
  routeInfo: null,
};

const renderRoute = (routeData: RouteComponentProps, route: ModuleRoute) => {
  if (currentRoute.routeInfo) return null;

  currentRoute.routeInfo = route;

  setCurrentRouteData(route);

  // timestamp
  // When forceRefresh flag is set to true
  // then the route component will be re-rendered every time
  // the user clicks on the same route
  // otherwise, the user will stay in the same page without re-rendering
  const middlewareKey = getRouterConfig("forceRefresh", true)
    ? Date.now()
    : null;
  return (
    <Middleware
      key={middlewareKey}
      match={routeData.match as any}
      location={routeData.location}
      route={route}
      history={history}
    />
  );
};

let isLoadingDynamicRoute = false;

const loadedApps: any[] = [];
const loadedModulesList: any[] = [];

export default function Renderer(props: any): any {
  const { location } = props;

  let firstSegment: string = firstSegmentOfRoute(location);

  const currentBasePath = getCurrentBseAppPath();

  firstSegment = concatRoute(currentBasePath, firstSegment);

  const [loadedModules, loadModule] = React.useState([] as string[]);

  // check if module is loaded
  const moduleIsLoaded = loadedModules.includes(firstSegment);

  React.useEffect(() => {
    const moduleInfo: Module = modulesList[firstSegment];

    if (!moduleIsLoaded && moduleInfo) {
      const loadingModulePaths: any = [];
      isLoadingDynamicRoute = false;

      // load main app provider file
      if (moduleInfo.loadApp) {
        loadingModulePaths.push(moduleInfo.loadApp());
      }

      // load module provider
      moduleInfo.loadModule && loadingModulePaths.push(moduleInfo.loadModule());

      Promise.all(loadingModulePaths).then(() => {
        if (!loadedApps.includes(moduleInfo.app)) {
          loadedApps.push(moduleInfo.app);
        }

        if (!loadedModulesList.includes(moduleInfo.module)) {
          loadedModulesList.push(moduleInfo.module);
        }

        moduleInfo.entry && loadModule(loadedModules.concat(moduleInfo.entry));
      });
    }
  }, [firstSegment, moduleIsLoaded, loadedModules]);

  // scroll to the top page when navigating to new page
  getRouterConfig("scrollTop", true) && window.scrollTo(0, 0);

  // if route does not exist, then check if it is dynamic module
  if (!moduleIsLoaded && !modulesList[firstSegment]) {
    if (!modulesList[firstSegment]) {
      const dynamicRouteModule = appDynamicRouteModule();

      if (dynamicRouteModule) {
        const dynamicModuleIsLoaded =
          loadedApps.includes(dynamicRouteModule.app) &&
          loadedModulesList.includes(dynamicRouteModule.module);

        if (dynamicModuleIsLoaded === false) {
          isLoadingDynamicRoute = true;

          const modulesToBeLoaded = [
            dynamicRouteModule.loadApp && dynamicRouteModule.loadApp(),
            dynamicRouteModule.loadModule && dynamicRouteModule.loadModule(),
          ];

          Promise.all(modulesToBeLoaded).then(() => {
            isLoadingDynamicRoute = false;

            if (!loadedApps.includes(dynamicRouteModule.app)) {
              loadedApps.push(dynamicRouteModule.app);
            }

            if (!loadedModulesList.includes(dynamicRouteModule.module)) {
              loadedModulesList.push(dynamicRouteModule.module);
            }

            loadModule([...loadedModules, dynamicRouteModule.module]);
          });
        }
      } else if (
        !routesList().find((route) => route.path.match(firstSegment))
      ) {
        const notFoundMode = getRouterConfig("notFound.mode", "render");

        if (notFoundMode === "redirect") {
          navigateTo(getRouterConfig("notFound.route", "/404"));
          return null;
        } else if (notFoundMode === "render") {
          const NotFoundComponent = getRouterConfig(
            "notFound.component",
            React.Fragment
          );
          return <NotFoundComponent />;
        }
      }
    }
  }

  // Display the progress bar
  // if the first segment is not in the
  // loadedModules and
  // the first segment is part of modules list that will be loaded
  const performPreLoading =
    (!moduleIsLoaded && isPartOfLazyModules(firstSegment)) ||
    isLoadingDynamicRoute;

  const preloadOverlay = getRouterConfig("preloadOverlay", true);

  let preload;

  const parentProps: any = {};

  if (performPreLoading) {
    const PreLoader: any = getRouterConfig("preloader", React.Fragment);
    preload = <PreLoader />;

    if (preloadOverlay === false) return preload;

    parentProps.style = {
      position: "relative",
    };
  }

  currentRoute.routeInfo = null;
  return (
    <div {...parentProps}>
      {preload}
      {layoutsList.map((layout: Layout) => {
        const { LayoutComponent, routes, routesList } = layout;

        return (
          <Route
            key={routesList.join("_")}
            exact
            path={routesList}
            render={(props: RouteComponentProps) => {
              const currentRoute = routes.find(
                (route) => route.path === props.match.path
              );

              if (currentRoute && currentRoute.middleware) {
                let middlewareList = currentRoute.middleware;
                if (!Array.isArray(middlewareList)) {
                  middlewareList = [middlewareList];
                }

                for (let middleware of middlewareList as Function[]) {
                  let output = middleware(
                    currentRoute,
                    history,
                    props.match.params
                  );

                  if (output) {
                    return output;
                  }
                }
              }

              // list of routes
              let layoutRoutes = routes.map((route) => {
                return (
                  <Route
                    path={route.path}
                    exact
                    key={route.path}
                    render={(props: RouteComponentProps) =>
                      renderRoute(props, route)
                    }
                  />
                );
              });

              return (
                <LayoutComponent {...props}>{layoutRoutes}</LayoutComponent>
              );
            }}
          />
        );
      })}
    </div>
  );
}
