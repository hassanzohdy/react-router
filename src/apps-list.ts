import { App, Module } from "./types";
import { concatRoute } from "./helpers";

let currentBaseAppPath = "/";

// List of all apps routes
export const appsList: string[] = [];

// current app name
export let currentAppName: string;

// all apps with its entire data
export let allApps: App[] = [];

/**
 * All modules list
 */
export const modulesList: { [key: string]: any } = {};

/**
 * Add new app base path
 *
 * @param  {string} path
 */
export function addBaseAppPath(path: string) {
  appsList.push(path);
}

/**
 * Get app path
 *
 * @param  {string} appName
 * @returns {string}
 */
export function getAppPath(appName: string): string {
  return allApps.find((app) => app.name === appName)?.path || "";
}

/**
 * Get all apps
 *
 * @returns {App[]}
 */
export function getAppsList(): App[] {
  return allApps;
}

/**
 * Get current app name
 *
 * @returns {string}
 */
export function getCurrentAppName(): string {
  return currentAppName;
}

/**
 * Set current base App path
 *
 * @param  {string} path
 */
export function setCurrentBseAppPath(path: string) {
  currentBaseAppPath = concatRoute(path);
  currentAppName = allApps.find((app) => app.path === currentBaseAppPath)
    ?.name as string;
}

/**
 * Get current base app path
 *
 * @returns {string}
 */
export function getCurrentBseAppPath() {
  return currentBaseAppPath;
}

/**
 * Create modules list for all available applications
 *
 * @param  {array} modules
 * @returns {void}
 */
export function setApps(apps: App[]) {
  allApps = apps;

  for (const app of apps) {
    const { path, name, modules } = app;

    if (path) {
      addBaseAppPath(path);
    }

    // spread all entries into object
    for (let moduleInfo of modules) {
      moduleInfo.app = name;
      setModuleLoaders(moduleInfo);

      moduleInfo.entry = (moduleInfo.entry || []).map((route) =>
        concatRoute(path, route)
      );

      // loop over the entry array
      for (let entryRoute of moduleInfo.entry) {
        modulesList[entryRoute] = moduleInfo;
      }
    }
  }
}

/**
 * Set module loaders
 *
 * @param   {Module} moduleInfo
 * @returns {void}
 */
function setModuleLoaders(moduleInfo: Module) {
  const app = moduleInfo.app;
  moduleInfo.loadModule = () =>
    import(`apps/${app}/${moduleInfo.module}/provider`); // module/provider
  moduleInfo.loadApp = () => import(`apps/${app}/${app}-provider`); // apps/app-name/app-name-provider
}

/**
 * Get the dynamic route module for current application
 *
 * @returns {object|null}
 */
export function appDynamicRouteModule(): Module | null {
  const currentBaseApp = getCurrentBseAppPath();

  for (const app of allApps) {
    const { name, path, dynamicRouteModule } = app;

    if (!dynamicRouteModule) continue;

    if (currentBaseApp !== path) continue;

    const moduleInfo: Module = {
      app: name,
      module: dynamicRouteModule,
    };

    setModuleLoaders(moduleInfo);

    return moduleInfo;
  }

  return null;
}
