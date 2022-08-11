import React from "react";

export type routerEventType = "localeCodeChange" | "change";

export type RouterEventLocaleChangeCallback = (
  newLocaleCode: string,
  currentLocaleCode?: string
) => void;

export type MiddlewareProps = {
  route: Route;
  key?: any;
  history: History;
  location: Location | any;
  component?: React.ReactNode;
  match?: {
    [key: string]: string;
  };
};

/**
 * App Module Interface
 */
export type Module = {
  /**
   * Module name
   */
  module: string;
  /**
   * Module possible entry list
   */
  entry?: string[];
  /**
   * App name
   */
  app?: string;
  /**
   * Module loader function
   */
  loadModule?: Function;
  /**
   * Module App loader function
   */
  loadApp?: Function;
};

/**
 * App data interface
 */
export type App = {
  /**
   * Application name
   * The application name must be the same as its directory name
   */
  name: string;
  /**
   * Application starting path
   */
  path: string;
  /**
   * Defines the module name that has a dynamic route
   */
  dynamicRouteModule?: string;
  /**
   * Application modules list
   */
  modules: Module[];
};

/**
 * Basic component props
 */
export type BasicComponentProps = {
  /**
   * Component key
   */
  key?: string;
  /**
   * Children list of the component
   */
  children?: React.ReactNode;
  /**
   * Any other props
   */
  [key: string]: any;
};

/**
 * Middleware type
 * It can be a react node | function or an array of single middleware
 */
export type Middleware = React.ComponentType | React.ComponentType[];

/**
 * Page component wrapper
 * Useful when many pages has same layout,
 * it will prevent re-rendering the layout wrapper from beginning each time
 */
export type LayoutComponent = React.ComponentType<BasicComponentProps>;

export type RedirectProps = {
  /**
   * The location that will be redirected into
   */
  to: string;
  /**
   * Set locale code for the redirection
   *
   * @default: auto
   */
  localeCode?: string;
  /**
   * App name
   *
   * @default: auto
   */
  app?: string;
};

export type LinkProps = {
  /**
   * Link Path
   */
  to?: string;
  /**
   * Alias to `to` prop
   */
  href?: string;
  /**
   * Set the link as a mail link
   */
  mailTo?: string;
  /**
   * Set the link as a telephone link
   */
  tel?: string;
  /**
   * The locale code for the link
   * Please note that this props must be used only with relative paths only
   */
  localeCode?: string;
  /**
   * Base app name to navigate to
   *
   * @default current app bath
   */
  apps?: string;
  /**
   * Determine whether the link should be opened in a new tab
   *
   * @default: false
   */
  newTab?: boolean;
  /**
   * Determine whether the current link is relative to our application
   *
   * @default true
   */
  relative?: boolean;
  /**
   * Other props
   */
  [id: string]: any;
};

/**
 * Route options
 */
export interface Route {
  /**
   * Route path
   */
  path: string;
  /**
   * Original Path
   */
  originalPath?: string;
  /**
   * Route name
   */
  name?: string;
  /**
   * Route middleware
   */
  middleware?: Middleware;
  /**
   * Route rendered component
   */
  component: React.ComponentType<BasicComponentProps>;
  /**
   * Route Layout
   */
  layout?: LayoutComponent;
}

/**
 * Layout options
 */
export type Layout = {
  /**
   * Routes list
   */
  routes: Route[];
  routesList: string[];
  LayoutComponent: LayoutComponent;
};

/**
 * Router group options
 */
export type GroupOptions = {
  /**
   * routes base path
   */
  path?: string;
  /**
   * Grouped routes list
   */
  routes?: Route[];
  /**
   * Layout that will be rendered on top of all routes in the group
   */
  layout?: LayoutComponent;
  /**
   * Routes middleware, it will be merged with each route middleware(s) if provided
   */
  middleware?: Middleware;
};

export type QueryString = {
  /**
   * Get a value from query string params, if the key does not exist, return default value
   */
  get(key: string, defaultValue?: any): any;
  /**
   * Get all query params
   */
  all(): object;
  /**
   * Return query string as string with & as concat parameter
   */
  toString(): string;
};

/**
 * Router configuration options list
 */
export type RouterConfigurations = {
  /**
   * Default locale code
   */
  defaultLocaleCode?: string;
  /**
   * Locale codes list
   */
  localeCodes?: string[];
  /**
   * Router preloader that will be displayed until the module is loaded
   *
   * @default React.Fragment
   */
  preloader?: React.ComponentType;
  /**
   * App base path in production
   *
   * @default: /
   */
  basePath?: string;
  /**
   * Determine whether to re-render the page
   * When navigating to any page, even same current page
   *
   * Please note that can not be changed during the application is running
   * as its value is cached at the application bootstrap
   *
   * @default: true
   */
  forceRefresh?: boolean;
  /**
   * Scroll to top of the page when rendering new page
   *
   * @default true
   */
  scrollTop?: boolean;
  /**
   * Top Root component that will wrap the entire application regardless the lazy module
   */
  rootComponent?: React.ComponentType;
  /**
   * NotFound Options
   */
  notFound?: {
    /**
     * Not found mode
     * The redirect mode will redirect the client to the path
     *
     * Please note that can not be changed during the application is running
     * as its value is cached at the application bootstrap
     *
     * @default: render
     */
    mode?: "redirect" | "render";
    /**
     * The route that will be redirected when the page is not found
     * Works only when the mode is set to redirect
     *
     * @default: /404
     */
    route?: string;
    /**
     * The component that will be rendered when the page is not found
     * Works only when the mode is set to render
     *
     * @default: React.Fragment
     */
    component?: React.ComponentType;
  };
};

export type RouterConfigKey = keyof RouterConfigurations;
