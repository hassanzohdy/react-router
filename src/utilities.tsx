import concatRoute from "@mongez/concat-route";
import { triggerEvent } from "./events";
import router from "./router";
import {
  ChangeLanguageReloadMode,
  ChangeLanguageReloadModeOptions,
  NavigationMode,
  ObjectType,
  PublicApp,
} from "./types";

/**
 * Navigate to a given route
 */
export function navigateTo(
  path: string,
  localeCode?: string,
  appName = router.getCurrentApp()?.name
) {
  if (!localeCode && router.hasLocaleCode) {
    localeCode = router.getCurrentLocaleCode();
  }

  const appPath = router.getApp(appName!)?.path!;

  router.goTo(concatRoute(localeCode || "", appPath, path));
}

/**
 * Navigate back to the previous route
 */
export function navigateBack() {
  navigateTo(router.getPreviousRoute());
}

/**
 * Get previous route
 */
export function previousRoute() {
  return router.getPreviousRoute();
}

/**
 * Get the current route
 */
export function currentRoute() {
  return router.getCurrentRoute();
}

/**
 * Change the current locale code
 * The reload mode will work based on the type
 * if it is soft reload, then it will re-render the page.
 * if it is hard reload, then it will reload the page fully.
 */
export function changeLocaleCode(
  localeCode: string,
  reloadMode: ChangeLanguageReloadMode = ChangeLanguageReloadModeOptions.soft
) {
  const currentLocaleCode = router.getCurrentLocaleCode();

  triggerEvent("localeCodeChanging", localeCode, currentLocaleCode);

  const currentRoute = router.getCurrentRoute();
  const currentAppPath = router.getCurrentAppPath();

  if (reloadMode === ChangeLanguageReloadModeOptions.hard) {
    const basePath = router.basePath;
    const queryString = window.location.search;
    const hash = window.location.hash;
    const fullPath =
      concatRoute(basePath, localeCode, currentAppPath, currentRoute) +
      queryString +
      hash;

    window.location.href = fullPath;
    return;
  }

  router.refreshActiveRouteKey();
  router.goTo(
    concatRoute(localeCode, currentAppPath, currentRoute),
    NavigationMode.changeLocaleCode
  );
  triggerEvent("localeChanged", localeCode, currentLocaleCode);
}

/**
 * Refresh current page
 */
export function refresh() {
  router.refreshActiveRouteKey();
  router.refresh(NavigationMode.refresh);
}

/**
 * Update the route without  reloading the page
 */
export function silentNavigation(
  path: string,
  querySting?: string | ObjectType
) {
  router.silentNavigation(path, querySting);
}

/**
 * Get hash value from the url
 */
export function getHash() {
  return window.location.hash.replace("#", "");
}

/**
 * Set apps list
 */
export function setApps(apps: PublicApp[]) {
  router.setAppsList(apps);
}
