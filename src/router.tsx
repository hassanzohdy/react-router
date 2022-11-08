import concatRoute from "@mongez/concat-route";
import React from "react";
import ReactDOM from "react-dom/client";
import routerEvents, { triggerEvent } from "./events";
import matchUrl, { urlPatternMatcher } from "./matcher";
import queryString from "./query-string";
import { renderer } from "./renderer";
import {
  App,
  ChangeLanguageReloadMode,
  ChangeLanguageReloadModeOptions,
  Component,
  GroupedRoutesOptions,
  LazyLoadingOptions,
  LocalizationOptions,
  Middleware,
  NavigationMode,
  NotFoundConfigurations,
  ObjectType,
  Route,
  RouteOptions,
  UrlMatcher,
} from "./types";

export class Router {
  /**
   * Root component
   */
  protected rootComponent: React.ComponentType<any> = React.Fragment;

  /**
   * Apps list
   */
  protected appsList: App[] = [];

  /**
   * Determine whether to enable strict mode
   */
  protected _strictMode = true;

  /**
   * App locale codes
   */
  protected localeCodes: string[] = ["en"];

  /**
   * Not found configurations
   */
  public notFound: NotFoundConfigurations = {
    mode: "render",
  };

  /**
   * Routes list
   */
  protected routesList: RouteOptions[] = [];

  /**
   * Default locale code
   */
  protected defaultLocaleCode = "en";

  /**
   * Change language reload mode
   */
  public changeLanguageReloadMode: ChangeLanguageReloadMode =
    ChangeLanguageReloadModeOptions.soft;

  /**
   * Current locale code
   */
  protected currentLocaleCode: string = this.defaultLocaleCode;

  /**
   * Base path for the app
   */
  public basePath = "/";

  /**
   * Current app
   */
  protected currentApp?: App;

  /**
   * Current route path
   */
  protected currentRoute = "/";

  /**
   * Previous route
   */
  protected previousRoute = "/";

  /**
   * Lazy loading options
   */
  public lazyLoading?: Partial<LazyLoadingOptions> = {
    renderOverPage: true,
  };

  /**
   * Router events
   */
  public events = routerEvents;

  /**
   * Matcher
   */
  protected matcher: UrlMatcher = urlPatternMatcher;

  /**
   * Params list
   */
  public params: any = {};

  /**
   * Root
   */
  protected root?: ReactDOM.Root;

  /**
   * Determine if the router has locale code in the url
   */
  public hasLocaleCode = false;

  /**
   * loaded apps and modules
   */
  protected loadedApps: string[] = [];

  /**
   * Loaded  modules list
   */
  protected loadedModules: string[] = [];

  /**
   * Active route
   */
  public activeRoute: RouteOptions | null = null;

  /**
   * A flag to determine whether to enable force refresh when navigating to same route
   */
  protected _forceRefresh = false;

  /**
   * Cached content
   */
  public cacheContent: any = {};

  /**
   * Current navigation mode
   */
  public navigationMode: NavigationMode = NavigationMode.navigation;

  /**
   * Constructor
   */
  public constructor() {
    this.detectBrowserUrlChange();
  }

  /**
   * Set router matcher
   */
  public setMatcher(matcher: any) {
    this.matcher = matcher;

    return this;
  }

  /**
   * Determine whether to force refresh when navigating to same route
   */
  public forceRefresh(forceRefresh: boolean) {
    this._forceRefresh = forceRefresh;

    return this;
  }

  /**
   * Set the strict mode
   */
  public strictMode(strictMode: boolean) {
    this._strictMode = strictMode;

    return this;
  }

  /**
   * Set root component
   */
  public setRootComponent(component: React.ComponentType<any>) {
    this.rootComponent = component;

    return this;
  }

  /**
   * Set Lazy loading options
   */
  public setLazyLoading(lazyLoading: LazyLoadingOptions) {
    this.lazyLoading = { ...this.lazyLoading, ...lazyLoading };

    return this;
  }

  /**
   * Get current route
   */
  public getCurrentRoute() {
    return this.currentRoute;
  }

  /**
   * Check if router is caching the given route
   */
  public isCachingRoute(route: RouteOptions) {
    return this.cacheContent[this.currentLocaleCode + route.path] !== undefined;
  }

  /**
   * Cache route content
   */
  public cacheRouteContent(route: RouteOptions, content: any) {
    this.cacheContent[this.currentLocaleCode + route.path] = content;
  }

  /**
   * Get cached route content
   */
  public getCachedRouteContent(route: RouteOptions) {
    return this.cacheContent[this.currentLocaleCode + route.path];
  }

  /**
   * Set apps list
   */
  public setAppsList(appsList: App[]) {
    this.appsList = appsList;

    return this;
  }

  /**
   * Set base path
   */
  public setBasePath(basePath: string) {
    this.basePath = basePath;

    return this;
  }

  /**
   * Set not found options
   */
  public setNotFound(notFound: NotFoundConfigurations) {
    this.notFound = notFound;

    return this;
  }

  /**
   * Set default locale code
   */
  public setDefaultLocaleCode(localeCode: string) {
    this.defaultLocaleCode = localeCode;

    return this;
  }

  /**
   * Get current locale code
   */
  public getCurrentLocaleCode() {
    return this.currentLocaleCode;
  }

  /**
   * Set locale codes
   */
  public setLocaleCodes(localeCodes: string[]) {
    this.localeCodes = localeCodes;

    return this;
  }

  /**
   * Set localization settings
   */
  public setLocalization(localization: LocalizationOptions) {
    if (localization.defaultLocaleCode) {
      this.defaultLocaleCode = localization.defaultLocaleCode;
    }

    if (localization.localeCodes) {
      this.localeCodes = localization.localeCodes;
    }

    if (localization.changeLanguageReloadMode) {
      this.changeLanguageReloadMode = localization.changeLanguageReloadMode;
    }

    return this;
  }

  /**
   * Scan routes
   */
  public scan() {
    this.parseLocation();

    triggerEvent(
      "navigating",
      this.currentRoute,
      NavigationMode.navigation,
      "/",
    );

    this.render();

    triggerEvent("rendering", this.currentRoute, NavigationMode.navigation);
  }

  /**
   * Add new route
   */
  public add(routeOptions: Route): Router;
  public add(
    path: string,
    component: React.ComponentType<any>,
    middleware?: Middleware,
    layout?: React.ComponentType<any>,
  ): Router;
  public add(...args: any[]) {
    let routeOptions: Route;
    if (args.length === 1) {
      routeOptions = args[0];
    } else {
      const [path, component, middleware, layout] = args;
      routeOptions = {
        path,
        component,
        middleware,
        layout,
      };
    }

    this.routesList.push({
      path: concatRoute(this.currentApp?.path || "/", routeOptions.path),
      component: routeOptions.component,
      middleware: routeOptions.middleware || [],
      layout: routeOptions.layout,
    });

    return this;
  }

  /**
   * Group route by options
   */
  public group(groupOptions: GroupedRoutesOptions) {
    for (const routeOptions of groupOptions.routes) {
      const finalRouteOptions = { ...routeOptions };

      if (groupOptions.path) {
        finalRouteOptions.path = concatRoute(
          groupOptions.path,
          routeOptions.path,
        );
      }

      if (groupOptions.middleware) {
        finalRouteOptions.middleware = [
          ...(groupOptions.middleware || []),
          ...(routeOptions.middleware || []),
        ];
      }

      if (groupOptions.layout) {
        finalRouteOptions.layout = groupOptions.layout;
      }

      this.add(finalRouteOptions);
    }

    return this;
  }

  /**
   * Group routes by one layout
   */
  public partOf(layout: Component, routes: Route[]) {
    return this.group({
      layout,
      routes,
    });
  }

  /**
   * Get route object by path
   */
  public getRouteByPath(path: string) {
    path = concatRoute(this.currentApp?.path || "/", path);
    // find the proper route for the given path
    // also check for dynamic segments and parse it into params object

    const route = this.routesList.find(route => {
      const [found, params] = matchUrl(route.path, path, this.matcher);

      if (params) {
        this.params = params;
      }

      return found;
    });

    if (route) {
      route.key = path + "/" + this.getCurrentLocaleCode();
    }

    return route;
  }

  /**
   * Refresh current route key
   */
  public refreshActiveRouteKey() {
    const activeRoute = this.activeRoute;

    const internalActiveRoute = this.list().find(
      route => route.path === activeRoute?.path,
    );

    if (internalActiveRoute) {
      // generate random key
      internalActiveRoute.key = Math.random().toString(36).substring(7);
    }
  }

  /**
   * Get current app instance
   */
  public getCurrentApp() {
    return this.currentApp;
  }

  /**
   * Navigate to the given path
   */
  public goTo(
    fullPath: string,
    navigationMode: NavigationMode = NavigationMode.navigation,
  ) {
    fullPath = concatRoute(this.basePath, fullPath);

    // update the current route for browser
    window.history.pushState(null, "", fullPath);

    this.refresh(navigationMode);
  }

  /**
   * Detect browser url change
   */
  protected detectBrowserUrlChange() {
    // detect when the browser url changes using the popstate event
    window.addEventListener("popstate", () => {
      this.parseLocation();

      if (this.cacheContent[this.currentLocaleCode + this.currentRoute]) {
        const content =
          this.cacheContent[this.currentLocaleCode + this.currentRoute];

        this.root?.render(content);

        return;
      }

      this.refresh(NavigationMode.swinging);
    });
  }

  /**
   * Refresh current page
   */
  public refresh(navigationMode: NavigationMode) {
    this.parseLocation();
    this.navigationMode = navigationMode;

    triggerEvent(
      "navigating",
      this.currentRoute,
      navigationMode,
      this.previousRoute,
    );

    triggerEvent(
      "rendering",
      concatRoute(this.currentApp?.path || "/", this.currentRoute),
      navigationMode,
    );
  }

  /**
   * Detect if router enables force refresh
   */
  public isForceRefreshEnabled() {
    return this._forceRefresh;
  }

  /**
   * Render content
   */
  protected render() {
    this.root = renderer(this.rootComponent, this._strictMode);
  }

  /**
   * Get the lazy loader of the given route
   */
  public getLazyRouter(route: string) {
    const firstSegment = "/" + route.split("/")[1];

    const appModule = this.currentApp?.modules?.find(module => {
      return module?.entry.includes(firstSegment);
    });

    if (appModule) {
      const loaders: any[] = [];

      if (!this.loadedApps.includes(this.currentApp?.name || "")) {
        loaders.push(
          this.lazyLoading?.loaders?.app(this.currentApp?.name || ""),
        );
      }

      if (
        !this.loadedModules.includes(
          this.currentApp?.name + "_" + appModule.name,
        )
      ) {
        loaders.push(
          this.lazyLoading?.loaders?.module(
            this.currentApp?.name!,
            appModule.name,
          ),
        );
      }

      return [
        loaders,
        () => {
          this.loadedApps.push(this.currentApp?.name || "");
          this.loadedModules.push(this.currentApp?.name + "_" + appModule.name);
        },
      ];
    }

    return [null, null];
  }

  /**
   * Get all routes list
   */
  public list() {
    return this.routesList;
  }

  /**
   * Get current app path
   */
  public getCurrentAppPath() {
    return this.currentApp?.path || "/";
  }

  /**
   * Get previous route
   */
  public getPreviousRoute() {
    return this.previousRoute;
  }

  /**
   * Update route without reloading the page
   */
  public silentNavigation(
    route: string,
    updateQuerySting?: string | ObjectType,
  ) {
    let url = concatRoute(
      this.basePath,
      this.currentLocaleCode,
      this.currentApp?.path || "",
      route,
    );

    if (updateQuerySting) {
      url += "?" + queryString.toQueryString(updateQuerySting);
    }

    // update the current route for browser
    window.history.replaceState({}, document.title, url);
  }

  /**
   * Parse location
   */
  public parseLocation() {
    this.previousRoute = this.currentRoute;
    this.params = {};
    // remove the base path from the URL
    // current route will be the pathname without the base path and locale code and without the app path
    const path = window.location.pathname.replace(
      new RegExp(`^${this.basePath}`),
      "",
    );

    let currentRoute = "/";

    this.currentApp = undefined;

    const segments = path.split("/");

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];

      if (this.localeCodes.includes(segment)) {
        this.currentLocaleCode = segment;

        this.hasLocaleCode = true;

        continue;
      } else if (this.isApp(segment)) {
        this.currentApp = this.getApp(segment);

        continue;
      } else {
        currentRoute = concatRoute(currentRoute, segment);
      }
    }

    this.currentRoute = currentRoute;

    if (this.appsList.length > 0 && !this.currentApp) {
      this.currentApp = this.getAppByPath("/");
    }
  }

  /**
   * Get app by path
   */
  public getAppByPath(path: string) {
    return this.appsList.find(app => app.path === path);
  }

  /**
   * Get app by name
   */
  public getApp(name: string) {
    return this.appsList.find(app => app.name === name);
  }

  /**
   * Detect if the given path is an app
   */
  public isApp(path: string) {
    return this.appsList.find(app => app.path === "/" + path) !== undefined;
  }
}

const router = new Router();

export default router;
