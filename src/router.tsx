import concatRoute from "@mongez/concat-route";
import type { EventSubscription } from "@mongez/events";
import React from "react";
import ReactDOM, { createRoot } from "react-dom/client";
import { shouldAppendLocaleCodeToUrl } from "./config";
import routerEvents, { triggerEvent } from "./events";
import matchUrl, { urlPatternMatcher } from "./matcher";
import queryString from "./query-string";
import { renderer } from "./renderer";
import {
  type App,
  type ChangeLanguageReloadMode,
  ChangeLanguageReloadModeOptions,
  type Component,
  type GroupedRoutesOptions,
  type LazyLoadingOptions,
  type LocalizationOptions,
  type Middleware,
  NavigationMode,
  type NotFoundConfigurations,
  type ObjectType,
  type Route,
  type RouteOptions,
  type RouterConfigurations,
  type UrlMatcher,
} from "./types";
import { changeLocaleCode } from "./utilities";

/**
 * Produce a short, non-empty random key suitable for React's
 * reconciler. `Math.random().toString(36).substring(7)` (the previous
 * implementation) can return an empty string when the random number's
 * base-36 representation is fewer than 7 characters — e.g. very small
 * values like `0.0001`. We compose two random chunks and pad-start to
 * guarantee at least 6 characters every time.
 */
export function generateRouteKey() {
  const chunk = () =>
    ((Math.random() * 1e9) | 0).toString(36).padStart(6, "0");
  return (chunk() + chunk()).slice(0, 8);
}

export class Router {
  /**
   * Root component
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
   * Initial Locale code which will be taken from the browser
   */
  protected initialLocaleCode = "";

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
  public params: Record<string, unknown> = {};

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
  public cacheContent: Record<string, React.ReactNode> = {};

  /**
   * Current navigation mode
   */
  public navigationMode: NavigationMode = NavigationMode.navigation;

  /**
   * Scroll top type
   */
  protected _scrollTopType?: RouterConfigurations["scrollToTop"];

  /**
   * Scroll to top event subscriber
   */
  protected scrollToTopEvent?: EventSubscription;

  /**
   * Auto redirect to the default locale code
   *
   * @default auto
   */
  private autoRedirectToDefaultLocaleCode?: boolean;

  public contents: Record<string, React.ReactNode> = {};

  protected currentPageComponentNode?: React.ReactNode;

  /**
   * Constructor.
   *
   * Historically the constructor attached a `popstate` listener and
   * subscribed to the navigating event for scroll-to-top. Consumers
   * rely on those listeners being active at import time (the singleton
   * is created at the bottom of this module), so we cannot defer them
   * without changing the public contract. The SSR-unsafe parts are
   * guarded behind a `typeof window` check so importing the module on
   * the server side stops being a hard crash.
   *
   * See CHANGELOG.md "Notes" for the full discussion.
   */
  public constructor() {
    if (typeof window !== "undefined") {
      this.detectBrowserUrlChange();
      this.setScrollToTop("smooth");
    }
  }

  public setCurrentPageNode(node: React.ReactNode) {
    this.currentPageComponentNode = node;
  }

  /**
   * Detect auto redirect to default locale code
   */
  protected detectAutoRedirectToDefaultLocaleCode() {
    if (this.autoRedirectToDefaultLocaleCode !== undefined) return;

    this.autoRedirectToDefaultLocaleCode = this.localeCodes.length > 1;
  }

  /**
   * Set scroll to top type
   */
  public setScrollToTop(scrollToTop: RouterConfigurations["scrollToTop"]) {
    this._scrollTopType = scrollToTop;

    if (scrollToTop === false && this.scrollToTopEvent) {
      this.scrollToTopEvent.unsubscribe();
      return;
    }

    if (!scrollToTop) return;

    this.scrollToTopEvent = routerEvents.onNavigating(() => {
      if (scrollToTop === "smooth") {
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      } else {
        window.scrollTo(0, 0);
      }
    });

    return this;
  }

  /**
   * Whether to auto redirect to the default locale code
   */
  public setAutoRedirectToDefaultLocaleCode(
    autoRedirectToDefaultLocaleCode: boolean
  ) {
    this.autoRedirectToDefaultLocaleCode = autoRedirectToDefaultLocaleCode;

    return this;
  }

  /**
   * Set router matcher.
   *
   * The pattern cache in `matcher.ts` is keyed by the matcher reference,
   * so swapping in a new matcher implicitly starts with a fresh cache —
   * old compiled patterns from the previous matcher are not reused.
   */
  public setMatcher(matcher: UrlMatcher) {
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
   * Get lazy loading config
   */
  public getLazyLoadingConfig(
    string: keyof LazyLoadingOptions,
    defaultValue?: unknown
  ) {
    return this.lazyLoading?.[string] ?? defaultValue;
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
  public cacheRouteContent(route: RouteOptions, content: React.ReactNode) {
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
   * Set current locale code
   */
  public setCurrentLocaleCode(localeCode: string) {
    this.currentLocaleCode = localeCode;

    return this;
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
   * Get localization settings
   */
  public getLocalization() {
    return {
      defaultLocaleCode: this.defaultLocaleCode,
      localeCodes: this.localeCodes,
      changeLanguageReloadMode: this.changeLanguageReloadMode,
    };
  }

  /**
   * Get change language reload mode
   */
  public getChangeLanguageReloadMode() {
    return this.changeLanguageReloadMode;
  }

  /**
   * Scan routes
   */
  public scan() {
    this.detectAutoRedirectToDefaultLocaleCode();

    this.parseLocation();

    if (this.initialLocaleCode) {
      triggerEvent("initialLocaleCode", this.initialLocaleCode);
    } else if (
      this.autoRedirectToDefaultLocaleCode &&
      shouldAppendLocaleCodeToUrl()
    ) {
      return changeLocaleCode(this.defaultLocaleCode, "hard");
    }

    triggerEvent(
      "navigating",
      this.currentRoute,
      NavigationMode.navigation,
      "/"
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    component: React.ComponentType<any>,
    middleware?: Middleware,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    layout?: React.ComponentType<any>
  ): Router;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
          routeOptions.path
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

    const route = this.routesList.find((route) => {
      // We need to trim out the query string/hash segment from the path for proper path matching
      const [found, params] = matchUrl(
        route.path.split("?")[0],
        path.split("?")[0],
        this.matcher
      );

      if (params) {
        this.params = params;
      }

      return found;
    });

    if (route) {
      route.key = concatRoute(
        this.getCurrentLocaleCode(),
        this.currentApp?.path || "/",
        path
      );
    }

    return route;
  }

  /**
   * Refresh current route key
   */
  public refreshActiveRouteKey() {
    const activeRoute = this.activeRoute;

    const internalActiveRoute = this.list().find(
      (route) => route.path === activeRoute?.path
    );

    if (internalActiveRoute) {
      // Generate a random key. `Math.random().toString(36).substring(7)`
      // can return an empty string when the base-36 representation has
      // fewer than 7 chars before the slice point, which would make React
      // treat the route as keyless. Pad to a stable length instead.
      internalActiveRoute.key = generateRouteKey();
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
    navigationMode: NavigationMode = NavigationMode.navigation
  ) {
    fullPath = concatRoute(this.basePath, fullPath);

    const localeCode = shouldAppendLocaleCodeToUrl()
      ? this.currentLocaleCode
      : "";

    // check if the fullPath equals to current path
    // if so and force refresh is disabled, then do nothing
    if (
      !this.isForceRefreshEnabled() &&
      localeCode + this.currentRoute === localeCode + fullPath
    ) {
      return;
    }

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
      this.previousRoute
    );

    triggerEvent(
      "rendering",
      concatRoute(this.currentApp?.path || "/", this.currentRoute),
      navigationMode
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
   * Prefetch the given path
   */
  public prefetch(path: string) {
    const [loaders, callback] = this.getLazyRouter(path) as [
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Promise<any>[],
      () => void,
    ];

    if (loaders) {
      Promise.all(loaders)
        .then(() => {
          callback();
        })
        .catch(error => {
          this.handleChunkLoadError(error, path);
        });
    }
  }

  /**
   * Handle chunk load errors
   * This is called when a lazy-loaded chunk fails to load
   */
  public handleChunkLoadError(error: Error, path: string) {
    // Check if it's a chunk load error
    const isChunkLoadError =
      error.name === "ChunkLoadError" ||
      error.message.includes("Failed to fetch dynamically imported module") ||
      error.message.includes("Loading chunk") ||
      error.message.includes("dynamic import") ||
      error.message.includes("failed to load") ||
      error.message.includes("Importing a module script failed");

    if (!isChunkLoadError) {
      console.error("Non-chunk error:", error);
      return;
    }

    const strategy =
      this.lazyLoading?.chunkErrorHandler?.strategy || "reload";
    const maxAttempts =
      this.lazyLoading?.chunkErrorHandler?.maxReloadAttempts ?? 1;

    // Check if we've exceeded max attempts (stored in sessionStorage)
    const storageKey = `mrr_reload_attempt_${path}`;
    const currentAttempt = parseInt(
      sessionStorage.getItem(storageKey) || "0",
      10,
    );

    if (currentAttempt >= maxAttempts) {
      console.error(
        `Max reload attempts (${maxAttempts}) reached for ${path}`,
      );
      sessionStorage.removeItem(storageKey);

      // Emit event for developer to handle
      triggerEvent("chunkLoadError", {
        error,
        path,
        attempt: currentAttempt,
        maxAttemptsReached: true,
      });
      return;
    }

    switch (strategy) {
      case "reload":
        console.warn(
          `Chunk load failed for ${path}. Reloading page... (attempt ${currentAttempt + 1}/${maxAttempts})`,
        );
        sessionStorage.setItem(storageKey, String(currentAttempt + 1));

        // Clear the attempt counter after successful reload
        setTimeout(() => sessionStorage.removeItem(storageKey), 100);

        // Reload to the target path
        window.location.href = path;
        break;

      case "custom":
        if (this.lazyLoading?.chunkErrorHandler?.onChunkLoadError) {
          const result = this.lazyLoading.chunkErrorHandler.onChunkLoadError(
            error,
            path,
            currentAttempt,
          );

          // Handle both sync and async custom handlers
          Promise.resolve(result).then(shouldReload => {
            if (shouldReload) {
              sessionStorage.setItem(storageKey, String(currentAttempt + 1));
              window.location.href = path;
            }
          });
        }
        break;

      case "notify":
        // Emit event for developer to handle with custom UI
        // if there is a component, create it and render it in a portal
        { const NotificationComponent = this.lazyLoading?.chunkErrorHandler?.notificationComponent;
        if (NotificationComponent) {
          let notifyElement = document.getElementById("mrr-cle"); // Mongez React Router - Chunk Load Error
          if (!notifyElement) {
            notifyElement = document.createElement("div");
            notifyElement.id = "mrr-cle";
            notifyElement.innerHTML = "";
            // append it to the body
            document.body.appendChild(notifyElement);
          } 
          
          // Render the component using createRoot instead of createPortal
          const root = createRoot(notifyElement);
          root.render(<NotificationComponent />);
        }

        triggerEvent("chunkLoadError", {
          error,
          path,
          attempt: currentAttempt,
          maxAttemptsReached: false,
        });
        break; }
    }
  }

  /**
   * Get the lazy loader of the given route
   */
  public getLazyRouter(route: string) {
    const firstSegment = "/" + route.split("/")[1];

    const appModule = this.currentApp?.modules?.find((module) => {
      return module.entry.includes(firstSegment);
    });

    if (appModule) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const loaders: any[] = [];

      if (!this.loadedApps.includes(this.currentApp?.name || "")) {
        loaders.push(
          this.lazyLoading?.loaders?.app(this.currentApp?.name || "")
        );
      }

      if (
        !this.loadedModules.includes(
          this.currentApp?.name + "_" + appModule.name
        )
      ) {
        loaders.push(
          this.lazyLoading?.loaders?.module(
            this.currentApp!.name!,
            appModule.name
          )
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
    updateQuerySting?: string | ObjectType
  ) {
    const localeCode = shouldAppendLocaleCodeToUrl()
      ? this.currentLocaleCode
      : "";

    let url = concatRoute(
      this.basePath,
      localeCode,
      this.currentApp?.path || "",
      route
    );

    if (updateQuerySting) {
      url += "?" + queryString.toQueryString(updateQuerySting);
    }

    // update the current route for browser
    window.history.replaceState({}, document.title, url);

    this.previousRoute = this.currentRoute;
    this.currentRoute = route;
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
      ""
    );

    let currentRoute = "/";

    this.currentApp = undefined;

    const segments = path.split("/");

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];

      if (this.localeCodes.includes(segment)) {
        this.currentLocaleCode = segment;

        this.hasLocaleCode = true;

        if (!this.initialLocaleCode) {
          this.initialLocaleCode = segment;
        }

        continue;
      } else if (this.isApp(segment)) {
        this.currentApp = this.getAppByPath("/" + segment);

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
    return this.appsList.find((app) => app.path === path);
  }

  /**
   * Get app by name
   */
  public getApp(name: string) {
    return this.appsList.find((app) => app.name === name);
  }

  /**
   * Detect if the given path is an app
   */
  public isApp(path: string) {
    return this.appsList.find((app) => app.path === "/" + path) !== undefined;
  }
}

const router = new Router();

export default router;
