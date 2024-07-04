import React, { FC } from "react";

/**
 * Object Type
 */
export type ObjectType = Record<string, any>;

/**
 * React Component Type
 */
export type Component = React.FC<any> | React.ComponentType<any>;

/**
 * Url Matcher handler
 */
export type UrlMatcher = (pattern: string) => {
  regexp: RegExp;
  keys: { name: string }[];
};

/**
 * Not found configurations
 */
export type NotFoundConfigurations = {
  /**
   * Mode Type
   * If set to `render`, then the 404 component will be rendered.
   * Which requires you to define the 404 component.
   *
   * If set to `redirect`, then the user will be redirected to the defined path.
   * Which requires you to define the redirect path (/404 by default).
   */
  mode?: "render" | "redirect";
  /**
   * 404 Component
   *
   * @default Internal404
   */
  component?: Component;
  /**
   * 404 Redirect Path
   *
   * @default /404
   */
  path?: string;
};

/**
 * Change languages Mode options
 */
export enum ChangeLanguageReloadModeOptions {
  hard = "hard",
  soft = "soft",
}

/**
 * Change languages Mode
 */
export type ChangeLanguageReloadMode = "soft" | "hard";

/**
 * Lazy loading options
 */
export type LazyLoadingOptions = {
  /**
   * Loaders Options
   */
  loaders: Loaders;
  /**
   * Preload Component which will be displayed while the app/module is being loading
   */
  loadingComponent?: Component;
  /**
   * Whether to render only the loader or render the loader over the current page
   *
   * If set to `true` then the loader will be rendered over the current page
   * By rendering the loader before the page component, no styling will
   * be applied to the page, you can use this to show a loading screen in your loader
   */
  renderOverPage?: boolean;
};

/**
 * Localization Options
 */
export type LocalizationOptions = {
  /**
   * Change Language reload mode
   * Used when calling `changeLocaleCode` function
   *
   *  If st to `soft` then it will update the url with the new locale code
   * and re-render the current page.
   *
   * If set to `hard` then it will reload the page with the new locale code.
   * @default soft
   */
  changeLanguageReloadMode?: ChangeLanguageReloadMode;
  /**
   * Default locale code
   *
   * @default en
   */
  defaultLocaleCode?: string;
  /**
   * Project localeCodes
   *
   * @default ["en"]
   */
  localeCodes?: string[];
};

/**
 * Query String Options
 */
export type QueryStringOptions = {
  /**
   * Query String Object to String parser
   */
  objectParser?: (queryString: string) => ObjectType;
  /**
   * Query String Object to String parser
   */
  stringParser?: (queryObject: ObjectType) => string;
};

/**
 * Grouped routes options
 */
export type GroupedRoutesOptions = {
  /**
   * Grouped routes
   */
  routes: Route[];
  /**
   * Prefix path for all routes
   */
  path?: string;
  /**
   * Middleware
   */
  middleware?: Middleware;
  /**
   * Layout
   */
  layout?: Component;
};

/**
 * Link component options
 */
export type LinkOptions = {
  /**
   * Component to be used as a link
   *
   * @default 'a'
   */
  component?: Component | string;
};

/**
 * Router Configurations
 */
export type RouterConfigurations = {
  /**
   * Project Base Path
   * Its recommended to set it with production check like this:
   * process.env.NODE_ENV === "production" ? "/project-name" : "/"
   *
   * @default "/"
   */
  basePath?: string;
  /**
   * Enable force refresh,
   * If set to true, when the user navigates to the same page,
   * it will re-render the page again.
   *
   * @default true
   */
  forceRefresh?: boolean;
  /**
   * Auto redirect to locale code if no locale code is found in the url
   *
   * @default true
   */
  autoRedirectToLocaleCode?: boolean;
  /**
   * Scroll to top when navigating to a new page
   *
   * @default smooth
   */
  scrollToTop?: false | "smooth" | "default";
  /**
   * Whether to enable strict mode
   *
   * @default false
   */
  strictMode?: boolean;
  /**
   * Localization settings
   */
  localization?: LocalizationOptions;
  /**
   * Url Matcher
   * This can be used to allow more dynamic url matching.
   */
  urlMatcher?: UrlMatcher;
  /**
   * Query string options
   */
  queryString?: QueryStringOptions;
  /**
   * Root component that will be used to wrap all the pages
   * This component will be rendered only once.
   */
  rootComponent?: Component;
  /**
   * Suspense fallback
   *
   * @default <></>
   */
  suspenseFallback?: React.ReactNode;
  /**
   * App And Module Loading Options
   */
  lazyLoading?: LazyLoadingOptions;
  /**
   * Not Found Page Settings
   */
  notFound?: NotFoundConfigurations;
  /**
   * Link component options
   */
  link?: LinkOptions;
};

/**
 * Module structure
 */
export type Module = {
  /**
   * Module name
   */
  name: string;
  /**
   * Module entry paths
   */
  entry: string[];
};

/**
 * App structure
 */
export type App = {
  /**
   * App name
   */
  name: string;
  /**
   * App Path
   */
  path: string;
  /**
   * App modules list
   */
  modules: Module[];
  /**
   * Is Loaded App
   */
  isLoaded: boolean;
};

export type PublicApp = Omit<App, "isLoaded">;

/**
 * Router Loaders
 */
export type Loaders = {
  /**
   * App loader
   * It receives the app name, and return a promise that
   * should use dynamic import to load the app provider
   */
  app: (app: string) => Promise<any>;
  /**
   * Module loader
   * It receives the app name and the module name, and return a promise that
   * should use dynamic import to load the module provider
   */
  module: (appName: string, moduleName: string) => Promise<any>;
};

export type MiddlewareProps = {
  route: RouteOptions;
  params: ObjectType;
  localeCode: string;
};

/**
 * Route middleware type
 */
export type Middleware = (
  | FC<MiddlewareProps>
  | ((options: MiddlewareProps) => React.ReactNode)
)[];

/**
 * Route structure
 */
export type RouteOptions = {
  /**
   * Route path
   */
  path: string;
  /**
   * Route component
   */
  component: React.ComponentType<any>;
  /**
   * Route middleware
   */
  middleware?: Middleware;
  /**
   * Route Base Layout
   */
  layout?: React.ComponentType<any>;
  /**
   * Route path Unique key
   * Used for force refreshing the route
   */
  key?: string;
};

/**
 * Public route options that will be used by developers
 */
export type Route = Required<Pick<RouteOptions, "component" | "path">> &
  Pick<RouteOptions, "layout" | "middleware">;

/**
 * Navigation modes
 */
export enum NavigationMode {
  /**
   * Triggered when route is changed normally
   */
  navigation = "navigation",
  /**
   * Triggered when calling the `changeLocaleCode`
   */
  changeLocaleCode = "changeLocaleCode",
  /**
   * Triggered when route is changed by history.back() or history.forward()
   */
  swinging = "swinging",
  /**
   * Triggered when the user navigates to the same route or when calling `refresh` function
   */
  refresh = "refresh",
}

export type LinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  /**
   * Link Path
   */
  to?: string;
  /**
   * Set link component type
   */
  component?: React.ComponentType<any> | string;
  /**
   * Alias to `to` prop
   */
  href?: string;
  /**
   * Set the link as a mail link
   */
  email?: string;
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
  app?: string;
  /**
   * Determine whether the link should be opened in a new tab
   *
   * @default: false
   */
  newTab?: boolean;
};

/**
 * Lazy Loading props
 */
export type LazyLoadingProps = {
  /**
   * Whether the app or module is being loaded
   */
  loading: boolean;
};
