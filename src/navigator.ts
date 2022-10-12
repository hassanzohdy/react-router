import { ltrim } from "@mongez/reinforcements";
import { queryString as objectToQueryString } from "object-query-string";
import { getRouterConfig, setRouterConfig } from ".";
import {
  getAppPath,
  getCurrentAppName,
  getCurrentBseAppPath,
} from "./apps-list";
import { getCurrentLocaleCode } from "./detect-locale-change";
import { routerEvents } from "./events";
import { basePath, baseUrl, concatRoute, getLocaleCodes } from "./helpers";
import { getHistory, hash, queryString } from "./router-history";
import { Route } from "./types";

export { objectToQueryString };

let currentFullRoute: string, fullRouteWithoutLocaleCode: string;

let _previousRoute: string = "/";

let currentRouteData: Route;

/**
 * Set current route data
 */
export function setCurrentRouteData(routeData: Route) {
  currentRouteData = routeData;
}

/**
 * Get current route data
 */
export function getCurrentRouteData(): Route {
  return currentRouteData;
}

/**
 * General full url for the given route
 */
export function url(path: string): string {
  return concatRoute(baseUrl(), path);
}

/**
 * Navigate back to the previous route
 */
export function navigateBack(defaultRoute: string = "") {
  if (!_previousRoute) {
    return navigateTo(defaultRoute);
  }

  goTo(_previousRoute);
}

/**
 * Set the full current route and the current route without the locale code
 */
function updateFullRoute(route: string) {
  if (currentFullRoute) {
    _previousRoute = currentFullRoute;
  }

  // /en/users
  currentFullRoute = route;
  // remove any possible locale code
  let regex = new RegExp(`^/(${getLocaleCodes().join("|")})`);

  fullRouteWithoutLocaleCode = currentFullRoute.replace(
    regex,
    (_matched, localeCode): string => {
      routerEvents.trigger("localeCodeChange", localeCode);
      return "";
    }
  );
}

/**
 * Replace the query string of current route
 * This method will not trigger router change
 *
 * If navigate is set to true, then navigate to the current route with the updated query string
 */
export function updateQueryString(
  queryString: string | any,
  navigate: boolean = false
) {
  if (typeof queryString === "object") {
    queryString = objectToQueryString(queryString);
  }

  const [fullUrl] = window.location.href.split("?");

  queryString = ltrim(queryString, "?");

  const withQueryString = queryString ? "?" + queryString : "";

  window.history.replaceState(null, "", fullUrl + withQueryString);

  if (navigate) {
    const [route] = currentRoute().split("?");
    navigateTo(route + withQueryString);
  }
}

/**
 * Get full url of current page
 */
export function fullUrl(): string {
  return baseUrl() + currentRoute();
}

/**
 * navigate to the given path
 */
export function navigateTo(
  path: string,
  localeCode: string | null = null,
  app: string = getCurrentAppName()
) {
  path = concatRoute(getAppPath(app), path);

  // if current initial locale code
  if (localeCode === null && hasInitialLocaleCode()) {
    localeCode = getCurrentLocaleCode();
  }

  if (localeCode) {
    path = concatRoute(localeCode, path);
  }

  goTo(path);
}

/**
 * Go to the given full path
 */
function goTo(path: string) {
  // stackBuilder.add();
  getHistory().push(path);
}

/**
 * Get current route that has the directory path, app path, locale code and route
 */
export function fullRoute(): string {
  return window.location.pathname;
}

/**
 * Get the route without the locale code
 */
export function currentRoute(): string {
  const projectBasePath = basePath();
  const currentApp = getCurrentBseAppPath();
  const localeCode = getCurrentLocaleCode();
  const gluedAppUriWithoutRoute = concatRoute(
    projectBasePath,
    localeCode,
    currentApp
  );

  return concatRoute(fullRoute().replace(gluedAppUriWithoutRoute, ""));
}

/**
 * Update current route without rendering the page
 */
export function updateRoute(newRoute: string, app = getCurrentBseAppPath()) {
  window.history.pushState(
    null,
    "",
    concatRoute(basePath(), app, getCurrentLocaleCode(), newRoute)
  );
}

/**
 * Get previous route
 */
export function previousRoute(): string {
  return _previousRoute;
}

/**
 * Set previous route
 */
export function setPreviousRoute(route: string) {
  _previousRoute = route;
}

/**
 * Force reload current route content
 *
 * @returns {void}
 */
export function refresh() {
  const route = fullRoute().replace(basePath(), "");
  const queryParams = queryString().toString().replace("?", "");
  const hashString = hash();

  // enable force refresh temporarily
  const forceRefresh: boolean = getRouterConfig("forceRefresh");

  setRouterConfig("forceRefresh", true);

  goTo(
    concatRoute(route) +
      (queryParams ? "?" + queryParams : "") +
      (hashString ? "#" + hashString : "")
  );

  // reset force refresh back after refreshing
  setTimeout(() => {
    setRouterConfig("forceRefresh", forceRefresh);
  }, 0);
}

/**
 * Navigate to current location and switch language
 * This will reload the entire pag
 */
export function switchLang(
  localeCode: string,
  reloadMode: "soft" | "hard" = getRouterConfig("switchLangReloadMode", "hard")
) {
  if (reloadMode === "soft") {
    const queryParams = queryString().toString().replace("?", "");
    const hashString = hash();

    navigateTo(
      currentRoute() +
        (queryParams ? "?" + queryParams : "") +
        (hashString ? "#" + hashString : ""),
      localeCode
    );

    routerEvents.trigger("localeCodeChange", localeCode);

    return;
  }

  const queryParams = queryString().toString().replace("?", "");
  const hashString = hash();

  window.location.pathname = concatRoute(
    basePath(),
    localeCode,
    getCurrentBseAppPath(),
    currentRoute() +
      (queryParams ? "?" + queryParams : "") +
      (hashString ? "#" + hashString : "")
  );
}

/**
 * Initialize Navigator
 */
export default function initiateNavigator() {
  /**
   * Listen to any router navigation to update current full route
   * and current route without locale codes
   */
  getHistory().listen((location: Location) => {
    updateFullRoute(location.pathname);

    routerEvents.trigger("change");
  });

  updateFullRoute(getHistory().location.pathname || "/");
}

/**
 * Check if current route has a locale code
 * By comparing the currentFullRoute with fullRouteWithoutLocaleCode
 */
export function hasInitialLocaleCode(): boolean {
  return currentFullRoute !== fullRouteWithoutLocaleCode;
}
