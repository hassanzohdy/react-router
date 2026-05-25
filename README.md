# @mongez/react-router

> A configuration-based React router with lazy-loaded apps/modules, locale-aware URLs, middleware, prefetch-on-hover, and production-ready chunk error handling.

Unlike `react-router-dom`'s component-tree-as-routes model, `@mongez/react-router` keeps routes as **data** registered on a singleton (`router.add("/users/:id", UserPage)`) and renders through a single internal `<RouterWrapper>` driven by an event bus. That shape makes lazy-loading whole **apps and modules** declarative, makes locale prefixes (`/en/admin/users`) and base paths first-class, and lets navigation be driven from anywhere — including outside the React tree.

## Install

```sh
yarn add @mongez/react-router
# peer: react >= 18, react-dom >= 18
```

## A 30-second tour

```tsx
// src/index.tsx — entry
import router, { setRouterConfigurations } from "@mongez/react-router";
import "./routes";

setRouterConfigurations({
  strictMode: true,
  scrollToTop: "smooth",
  localization: { defaultLocaleCode: "en", localeCodes: ["en", "fr"] },
});

router.scan(); // start the router; mounts into #root
```

```tsx
// src/routes.tsx
import router, { Link, navigateTo } from "@mongez/react-router";
import HomePage from "./pages/HomePage";
import UserPage from "./pages/UserPage";

router.add("/", HomePage);
router.add("/users/:id", UserPage);

function HomePage() {
  return (
    <nav>
      <Link to="/users/42">User 42</Link>
      <button onClick={() => navigateTo("/users/7")}>Go to user 7</button>
    </nav>
  );
}

function UserPage({ params, localeCode }: { params: { id: string }; localeCode: string }) {
  return <h1>User {params.id} ({localeCode})</h1>;
}
```

That's it: every component receives `params` and `localeCode`, navigation happens via `<Link>` or `navigateTo()`, and the router scans your `add()` calls when you call `scan()`.

## What's in the box

| Export | Purpose |
|---|---|
| `router` (default export) | The singleton `Router` instance. Holds the route table, locale, current app, events. |
| `Router` | The class itself. You almost never instantiate it directly. |
| `Link` | Anchor-replacement with prefetch-on-hover, locale awareness, and silent navigation. |
| `routerEvents` | `onNavigating`, `onPageRendered`, `onLocaleChanging`, `onLocaleChanged`, `onChunkLoadError`, … |
| `queryString` | `.all()`, `.get(key)`, `.update(...)`, `.toQueryString(obj)`. |
| `navigateTo`, `navigateBack`, `silentNavigation`, `refresh` | Programmatic navigation. |
| `currentRoute`, `previousRoute`, `getHash`, `currentApp` | Reads of router state. |
| `changeLocaleCode` | Switch locale (soft re-render or hard reload). |
| `setApps`, `setRouterConfigurations`, `getRouterConfig`, `getRouterConfigurations` | One-call configuration of every router feature. |
| `NAVIGATING` | Sentinel return value for middleware that has redirected. |

## Route registration

### Basic

```tsx
router.add("/", HomePage);
router.add("/about", AboutPage);
```

### Dynamic segments

```tsx
router.add("/users/:id", UserPage);
router.add("/posts/:slug?", PostPage);          // optional segment
router.add("/files/:path+", FilePage);          // one-or-more
router.add("/wildcards/:rest*", WildcardPage);  // zero-or-more
```

Components receive `params` and `localeCode`:

```tsx
function UserPage({ params, localeCode }) {
  return <span>User {params.id} ({localeCode})</span>;
}
```

### With middleware and layout

```tsx
router.add("/dashboard", DashboardPage, [authMiddleware], AdminLayout);

// or object form
router.add({
  path: "/dashboard",
  component: DashboardPage,
  middleware: [authMiddleware],
  layout: AdminLayout,
});
```

### Groups

```tsx
router.group({
  path: "/account",
  middleware: [authMiddleware],
  layout: AccountLayout,
  routes: [
    { path: "/", component: AccountDashboard },
    { path: "/profile", component: EditProfile },
    { path: "/orders/:id", component: OrderDetails },
  ],
});
```

### Shared layout for many routes

```tsx
router.partOf(BaseLayout, [
  { path: "/", component: HomePage },
  { path: "/about", component: AboutPage },
]);
```

`partOf` is a thin wrapper over `group({ layout, routes })`.

## Middleware

```tsx
import { navigateTo, NAVIGATING } from "@mongez/react-router";

function authMiddleware({ route, params, localeCode }) {
  if (!user.isLoggedIn()) {
    navigateTo("/login");
    return NAVIGATING; // stop rendering the page
  }
  return null;         // continue
}

router.add("/dashboard", DashboardPage, [authMiddleware]);
```

Return values:

- `null` / `false` / `undefined` — continue to the next middleware or the page component
- `NAVIGATING` — the middleware called `navigateTo(...)` and the wrapper should not render
- Any other `ReactNode` — render that instead of the page (e.g. a "Loading session" splash)

## `<Link>`

```tsx
import { Link } from "@mongez/react-router";

<Link to="/about">About</Link>
<Link to="/products" prefetch>Products</Link>
<Link to="/terms" newTab>Terms</Link>
<Link to="/admin/users" app="admin">Admin Users</Link>
<Link to="/about" localeCode="fr">À propos</Link>
<Link href="https://example.com">External</Link>
<Link email="hello@example.com">Email us</Link>
<Link tel="+1234567890">Call us</Link>
<Link to="/tasks/1" silent>Open task (no navigate)</Link>
<Link to="/account" component={CustomLink}>Account</Link>
```

The component automatically:

- prepends the current locale code when one is active and `localeCode` is not provided
- prepends the current/specified app path
- prepends the configured base path to the rendered `href`
- prefetches on hover when `prefetch` is `true` (default; see configuration)
- preserves modifier-key / middle-click behavior (opens in a new tab without intercepting)
- adds `target="_blank"` and `rel="noopener noreferrer"` when `newTab` is set

## Programmatic navigation

```tsx
import {
  navigateTo,
  navigateBack,
  silentNavigation,
  refresh,
} from "@mongez/react-router";

navigateTo("/about");
navigateTo("/about", "en");                  // with locale
navigateTo("/dashboard", "en", "admin");     // with locale + app

navigateBack();                              // re-navigates to previousRoute
silentNavigation("/home");                   // updates URL only; no re-render
silentNavigation("/home", { name: "John" }); // with query string
refresh();                                   // force re-render of current route
```

`navigateTo` returns the `NAVIGATING` sentinel so middleware can `return navigateTo(...)`.

## Localization

```tsx
setRouterConfigurations({
  localization: {
    defaultLocaleCode: "en",
    localeCodes: ["en", "fr", "es"],
    changeLanguageReloadMode: "soft",
  },
  appendLocaleCodeToUrl: true,
  autoRedirectToLocaleCode: true,
});
```

```tsx
import { changeLocaleCode } from "@mongez/react-router";

changeLocaleCode("fr");          // soft — re-render
changeLocaleCode("fr", "hard");  // hard — full window.location reload
```

URL shape (full): `/basePath/appPath/(localeCode?)/routePath`. The locale segment is added/removed automatically based on `appendLocaleCodeToUrl`; when you `router.add("/about", ...)`, you write the route **without** the locale and app prefix.

## Lazy loading apps and modules

For larger projects, partition routes into **apps** (a top-level prefix like `/admin`) and **modules** (a feature like `account`, `products`, `checkout`). Each module's routes load on demand the first time the user visits an entry path.

```jsonc
// src/apps/front-office/front-office-modules.json
{
  "name": "front-office",
  "path": "/",
  "modules": [
    { "entry": ["/"],         "name": "home" },
    { "entry": ["/account"],  "name": "account" }
  ]
}
```

```tsx
// src/index.tsx
import { setApps, setRouterConfigurations } from "@mongez/react-router";
import frontOfficeApp from "./apps/front-office/front-office-modules.json";

setApps([frontOfficeApp]);

setRouterConfigurations({
  lazyLoading: {
    loaders: {
      app:    (app)         => import(`./apps/${app}/${app}-provider.ts`),
      module: (app, module) => import(`./apps/${app}/${module}/provider.ts`),
    },
    loadingComponent: LoadingSpinner,
    renderOverPage: true,
  },
});
```

The `entry` array lists only the **first segment** of each route under that module — the router uses it to decide which module to fetch when a route isn't yet in the table.

## Chunk error handling (production)

Old chunks get deleted on every deploy. A user who loaded the app before a deploy will see "Failed to fetch dynamically imported module" the first time they navigate. Configure a strategy:

```tsx
setRouterConfigurations({
  lazyLoading: {
    loaders: { /* … */ },
    chunkErrorHandler: {
      strategy: "reload",     // "reload" | "notify" | "custom"
      maxReloadAttempts: 1,   // guard against infinite reload loops
    },
  },
});
```

Strategies:

- `reload` — `window.location.href = path`; reload counter is kept in `sessionStorage` keyed by path.
- `notify` — fires `router.events.onChunkLoadError(...)` for your app to handle; optionally renders a `notificationComponent` in a sidecar `<div id="mrr-cle">`.
- `custom` — calls `onChunkLoadError(error, path, attempt)`; if it (or its resolved Promise) returns `true`, the router reloads.

```tsx
router.events.onChunkLoadError(({ error, path, attempt, maxAttemptsReached }) => {
  if (maxAttemptsReached) showRefreshModal();
});
```

## Query string

```tsx
import queryString from "@mongez/react-router";

queryString.all();                          // { page: 1, sort: "name" }
queryString.get("page", 1);                 // single key, with default
queryString.toString();                     // "page=1&sort=name"
queryString.update({ page: 2, sort: "date" });
queryString.update({ page: 2 }, true);      // also re-render
queryString.toQueryString({ a: 1, b: [2, 3], nested: { x: 1 } });
// → "a=1&b[]=2&b[]=3&nested[x]=1"
```

Numeric-looking values come back as `number`s; arrays use `key[]=v1&key[]=v2`; nested objects use `key[subkey]=v`.

Override with your own parser if you want a different convention:

```tsx
setRouterConfigurations({
  queryString: {
    objectParser: (search) => qs.parse(search),
    stringParser: (obj) => qs.stringify(obj),
  },
});
```

## Router events

```tsx
import { routerEvents } from "@mongez/react-router";

const sub = routerEvents.onNavigating((route, mode, previousRoute) => {
  console.log("→", route, "from", previousRoute, "via", mode);
});
sub.unsubscribe();

routerEvents.onPageRendered((route, mode) => /* … */);
routerEvents.onLocaleChanging((next, prev) => /* … */);
routerEvents.onLocaleChanged((next, prev) => /* … */);
routerEvents.onDetectingInitialLocaleCode((locale) => /* … */);
routerEvents.onChunkLoadError(({ error, path, attempt, maxAttemptsReached }) => /* … */);
```

`mode` is one of `"navigation" | "changeLocaleCode" | "swinging" | "refresh"` (browser back/forward is `"swinging"`).

## Custom URL matcher

The built-in matcher handles `:name`, `:name?`, `:name+`, `:name*`. Plug in `path-to-regexp` (or anything else) if you need richer patterns:

```tsx
import { pathToRegexp } from "path-to-regexp";

setRouterConfigurations({
  urlMatcher: (pattern) => {
    const keys: Array<{ name: string }> = [];
    const regexp = pathToRegexp(pattern, keys);
    return { regexp, keys };
  },
});
```

## SSR / hydration

The renderer auto-detects whether `#root` already has children:

- empty → `createRoot` + `root.render(...)`
- pre-rendered → `hydrateRoot(rootElement, ...)`

This means an HTML payload generated with `renderToString` will hydrate in place. The router itself is browser-only — `window.history`, `window.location`, and `window.addEventListener("popstate")` are touched in the constructor.

## Configuration reference

| Option | Type | Default |
|---|---|---|
| `basePath` | `string` | `"/"` |
| `strictMode` | `boolean` | `true` |
| `forceRefresh` | `boolean` | `true` (when calling `goTo` to the current route; see below) |
| `scrollToTop` | `false \| "smooth" \| "default"` | `"smooth"` |
| `localization.defaultLocaleCode` | `string` | `"en"` |
| `localization.localeCodes` | `string[]` | `["en"]` |
| `localization.changeLanguageReloadMode` | `"soft" \| "hard"` | `"soft"` |
| `appendLocaleCodeToUrl` | `boolean` | `true` |
| `autoRedirectToLocaleCode` | `boolean` | derived: `localeCodes.length > 1` |
| `lazyLoading.loaders` | `{ app, module }` | — |
| `lazyLoading.loadingComponent` | `Component` | — |
| `lazyLoading.renderOverPage` | `boolean` | `true` |
| `lazyLoading.chunkErrorHandler` | `ChunkErrorHandler` | — |
| `notFound.mode` | `"render" \| "redirect"` | `"render"` |
| `notFound.component` | `Component` | built-in `<h1>Not Found Page</h1>` |
| `notFound.path` | `string` | `"/404"` |
| `rootComponent` | `Component` | `React.Fragment` |
| `suspenseFallback` | `ReactNode` | `<></>` |
| `urlMatcher` | `UrlMatcher` | built-in `:name` matcher |
| `queryString.objectParser` | `(qs: string) => object` | built-in |
| `queryString.stringParser` | `(obj: object) => string` | built-in |
| `link.component` | `Component \| string` | `"a"` |
| `prefetch` | `boolean` | `true` |

`forceRefresh: false` means `navigateTo("/current")` is a no-op when the URL hasn't changed; with `forceRefresh: true` it re-renders.

## TypeScript

Public types ship from the package root:

```ts
import type {
  Route,
  RouteOptions,
  RouterConfigurations,
  Middleware,
  MiddlewareProps,
  LinkProps,
  LinkOptions,
  App,
  PublicApp,
  Module,
  Loaders,
  NavigationMode,
  ChunkErrorHandler,
  ChunkErrorStrategy,
  LazyLoadingOptions,
  LocalizationOptions,
  NotFoundConfigurations,
  GroupedRoutesOptions,
  QueryStringOptions,
  UrlMatcher,
  ObjectType,
  Component,
} from "@mongez/react-router";
```

## Related packages

| Package | Purpose |
|---|---|
| [`@mongez/concat-route`](https://github.com/hassanzohdy/mongez-concat-route) | The tiny path joiner used internally. |
| [`@mongez/events`](https://github.com/hassanzohdy/events) | The event bus that powers `routerEvents`. |
| [`@mongez/react-atom`](https://github.com/hassanzohdy/mongez-react-atom) | State management; pairs well with this router for route-driven state. |

## React version

React **18 or newer**. The renderer uses `react-dom/client`'s `createRoot` / `hydrateRoot`. Version 1.x supports React 17 and earlier ([version-1 branch](https://github.com/hassanzohdy/react-router/tree/version-1)).

## License

MIT
