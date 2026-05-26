<div align="center">

# @mongez/react-router

**Configuration-based React router with lazy-loaded apps/modules, locale-prefixed URLs, per-route middleware, prefetch-on-hover, and production chunk-error recovery.**

[![npm](https://img.shields.io/npm/v/@mongez/react-router.svg)](https://www.npmjs.com/package/@mongez/react-router)
[![license](https://img.shields.io/npm/l/@mongez/react-router.svg)](LICENSE)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@mongez/react-router.svg)](https://bundlephobia.com/package/@mongez/react-router)
[![downloads](https://img.shields.io/npm/dw/@mongez/react-router.svg)](https://www.npmjs.com/package/@mongez/react-router)

</div>

---

## Why @mongez/react-router?

`react-router-dom` treats routes as a JSX tree, leaves lazy-loading, locale prefixing, and middleware as DIY, and ships a wide surface around loaders and actions that you may not want. `@tanstack/router` is typed but heavily Tanstack-flavored — file conventions, context providers, query integration baked in. Next.js routing is excellent but Next-only; it doesn't help if you're shipping a Vite or CRA SPA. `@mongez/react-router` sits in the middle: opinionated and mid-weight, routes-as-data on a singleton, with first-class lazy-loaded apps/modules, locale-prefixed URLs (`/en/admin/users`), per-route middleware, prefetch-on-hover, and chunk-error recovery after deploys — none of which you have to assemble yourself.

```tsx
import router, { Link, setRouterConfigurations } from "@mongez/react-router";

router.add("/", HomePage);
router.add("/users/:id", UserPage, [authMiddleware]);

setRouterConfigurations({
  localization: { defaultLocaleCode: "en", localeCodes: ["en", "fr"] },
});

router.scan(); // mounts <RouterWrapper> into #root

// In any component:
<Link to="/users/42">User 42</Link>
```

---

## Features

| Feature | Description |
|---|---|
| **Routes as data** | `router.add(path, component, middleware?, layout?)` registers a route on a singleton. Nothing renders until `router.scan()`. |
| **Groups & shared layouts** | `router.group({ path, middleware, layout, routes })` and `router.partOf(layout, routes)` for prefixed, layout-wrapped sets. |
| **Per-route middleware** | Array of functions returning `null` (continue), `NAVIGATING` (redirected, skip render), or any `ReactNode` (render instead of page). |
| **Locale-prefixed URLs** | `/en/admin/users` shape derived from `localeCodes`. Switch with `changeLocaleCode("fr")` — soft re-render or hard reload. |
| **Lazy-loaded apps & modules** | `setApps([...])` plus `lazyLoading.loaders.{app,module}` code-splits whole feature areas, keyed by the first URL segment. |
| **Prefetch on hover** | `<Link>` attaches a one-shot `mouseover` listener that calls `router.prefetch(path)`. Opt out per link with `prefetch={false}`. |
| **Chunk-error recovery** | Built-in strategies (`reload` / `notify` / `custom`) to recover when an old chunk vanishes after a deploy. |
| **Programmatic navigation** | `navigateTo`, `navigateBack`, `silentNavigation`, `refresh` — usable from anywhere, including outside the React tree. |
| **Query string helpers** | `queryString.all / get / parse / toString / toQueryString / update` with typed coercion (`"3"` → `3`, `key[]=a&key[]=b` → array). |
| **Custom URL matcher** | Default supports `:name`, `:name?`, `:name+`, `:name*`. Swap in `path-to-regexp` or anything else via `urlMatcher`. |
| **SSR-aware renderer** | Detects whether `#root` already has children: `createRoot` for fresh mount, `hydrateRoot` for pre-rendered HTML. |
| **Event bus** | `routerEvents.onNavigating / onPageRendered / onLocaleChanging / onChunkLoadError / …` for analytics, loading bars, scroll restoration. |
| **TypeScript-first** | Every public type (`Route`, `Middleware`, `LinkProps`, `App`, `RouterConfigurations`, …) re-exported from the package root. |

---

## Installation

```sh
npm install @mongez/react-router
# or
yarn add @mongez/react-router
# or
pnpm add @mongez/react-router
```

Peer: `react >= 18`, `react-dom >= 18`. The renderer uses `react-dom/client`'s `createRoot` / `hydrateRoot`.

---

## Quick start

```tsx
// src/index.tsx — entry point
import router, { setRouterConfigurations } from "@mongez/react-router";
import "./routes";

setRouterConfigurations({
  strictMode: true,
  scrollToTop: "smooth",
  localization: { defaultLocaleCode: "en", localeCodes: ["en", "fr"] },
});

router.scan(); // parse the URL, render the matching route into #root
```

```tsx
// src/routes.tsx — registered route table
import router, { Link, navigateTo } from "@mongez/react-router";

function HomePage() {
  return (
    <nav>
      <Link to="/users/42">User 42</Link>
      <button onClick={() => navigateTo("/users/7")}>Go to user 7</button>
    </nav>
  );
}

function UserPage({ params, localeCode }: {
  params: { id: string };
  localeCode: string;
}) {
  return <h1>User {params.id} ({localeCode})</h1>;
}

router.add("/", HomePage);
router.add("/users/:id", UserPage);
```

That's the entire happy path. Every page receives `{ params, localeCode }` as props, navigation flows through `<Link>` or `navigateTo`, and the singleton scans your `add()` calls when you boot. The rest of this README is depth on the same surface.

---

## Defining routes

`router.add(...)` takes either positional args or an object — identical semantics:

```ts
router.add("/", HomePage);
router.add("/users/:id", UserPage);
router.add("/dashboard", DashboardPage, [authMiddleware], AdminLayout);

// Or:
router.add({
  path: "/dashboard",
  component: DashboardPage,
  middleware: [authMiddleware],
  layout: AdminLayout,
});
```

### Dynamic segments

The built-in matcher handles four modifiers (same conventions as `path-to-regexp` v3):

| Pattern | Means | Example match |
|---|---|---|
| `:name` | one required segment | `/users/:id` → `/users/42` |
| `:name?` | zero or one segment | `/users/:id?` → `/users` and `/users/42` |
| `:name+` | one or more segments | `/files/:path+` → `/files/a/b/c` |
| `:name*` | zero or more segments | `/wildcard/:rest*` → `/wildcard` and `/wildcard/a/b/c` |

Multi-segment captures (`:path+`, `:path*`) come back as the joined string (`"a/b/c"`), not an array.

### Groups

`router.group(...)` prefixes a set of routes with a common path, layout, and middleware:

```ts
router.group({
  path: "/account",
  middleware: [authMiddleware],
  layout: AccountLayout,
  routes: [
    { path: "/",          component: AccountDashboard },
    { path: "/profile",   component: EditProfile },
    { path: "/orders/:id", component: OrderDetails, middleware: [paymentVerified] },
  ],
});
```

- The group `path` is concatenated into each child path (`/account/profile`).
- The group `middleware` runs **before** any per-route middleware.
- The group `layout` wins over per-route `layout` (last-write semantics in the merge).

### Shared layout (`partOf`)

```ts
router.partOf(BaseLayout, [
  { path: "/",      component: HomePage },
  { path: "/about", component: AboutPage },
]);
```

A thin wrapper over `group({ layout, routes })` when you don't need a common path or middleware.

### Middleware

```ts
import { navigateTo, NAVIGATING } from "@mongez/react-router";
import type { MiddlewareProps } from "@mongez/react-router";

function authMiddleware({ route, params, localeCode }: MiddlewareProps) {
  if (!user.isLoggedIn()) {
    navigateTo("/login");
    return NAVIGATING; // bail — middleware redirected
  }
  return null;         // continue to next middleware / the page
}
```

| Return | Effect |
|---|---|
| `null` / `false` / `undefined` | Run the next middleware, then the page component. |
| `NAVIGATING` (re-exported empty fragment sentinel) | The middleware redirected — the wrapper skips rendering the page. |
| Any other `ReactNode` | Render that instead of the page component (e.g. a loading splash). |

> `NAVIGATING` is sentinel-by-identity. The wrapper checks `output === NAVIGATING`. Don't reuse it for empty content — return a real empty element instead.

### Not-found

```ts
setRouterConfigurations({
  notFound: {
    mode: "render",        // or "redirect"
    component: NotFoundPage,
    // path: "/404",         // for redirect mode; route must be registered
  },
});
```

`render` mounts the component in place (URL unchanged); `redirect` calls `navigateTo(path || "/404")`.

---

## Navigation

### `<Link>` — declarative

```tsx
import { Link } from "@mongez/react-router";

<Link to="/about">About</Link>
<Link to="/products" prefetch>Products</Link>
<Link to="/terms" newTab>Terms</Link>
<Link to="/admin/users" app="admin">Admin Users</Link>
<Link to="/about" localeCode="fr">À propos</Link>
<Link to="/tasks/1" silent>Open task (no navigate)</Link>
<Link href="https://example.com">External</Link>
<Link email="hello@example.com">Email us</Link>
<Link tel="+1234567890">Call us</Link>
<Link to="/account" component={CustomLink}>Account</Link>
```

| Prop | Behavior |
|---|---|
| `to` / `href` | Internal path; prepended with `basePath`, current `app`, and `localeCode`. Full URLs, `mailto:`, `tel:`, and `#hash` pass through verbatim. |
| `email`, `tel` | Force `mailto:` / `tel:` links. |
| `localeCode` | Override the current locale (use with relative `to` only). |
| `app` | Override the current app prefix. |
| `newTab` | Sets `target="_blank"` and `rel="noopener noreferrer"`. |
| `silent` | Click triggers `router.silentNavigation(path)` — URL updates, no render. |
| `prefetch` | Prefetch the lazy module on mouseover (default from `config.prefetch`, which is `true`). |
| `component` | Render-as; default `"a"` or `config.link.component`. |

Click interception only fires when the resolved path starts with `/`, no modifier key is held (Ctrl / Meta / Shift / Alt), it isn't a middle-click, and `target` is not `_blank`. So Ctrl+Click / Cmd+Click still opens in a new tab as expected.

### Imperative helpers

```ts
import {
  navigateTo,
  navigateBack,
  silentNavigation,
  refresh,
} from "@mongez/react-router";

navigateTo("/about");
navigateTo("/about", "en");                  // + locale
navigateTo("/dashboard", "en", "admin");     // + locale + app

navigateBack();                              // → navigateTo(previousRoute)
silentNavigation("/home");                   // updates URL only, no render
silentNavigation("/home", { name: "John" }); // with query string
silentNavigation("/home", "name=John");      // raw query also accepted
refresh();                                   // force re-render of current route
```

`navigateTo` returns the `NAVIGATING` sentinel so middleware can short-form `return navigateTo(...)`:

```ts
function authMiddleware({ route }: MiddlewareProps) {
  if (!user.isLoggedIn()) return navigateTo("/login");
  return null;
}
```

> `navigateBack()` is **not** `history.back()`. It calls `navigateTo(router.getPreviousRoute())`, which pushes a new history entry. Browser back/forward buttons fire `popstate` and run with `NavigationMode.swinging`.

### State readers

```ts
import { currentRoute, previousRoute, currentApp, getHash } from "@mongez/react-router";

currentRoute();     // "/users/42"
previousRoute();    // "/users"
currentApp();       // App object or undefined
getHash();          // location.hash without the leading "#"
```

---

## Params & query string

`params` flows in as a prop on every page component (and every middleware via `MiddlewareProps`). It's also kept on `router.params` for code outside the React tree.

```tsx
router.add("/users/:id", UserPage);

function UserPage({ params }: { params: { id: string } }) {
  return <p>User {params.id}</p>;
}
```

### Query string API

```ts
import queryString from "@mongez/react-router";

queryString.all();                          // { page: 2, sort: "name" }
queryString.get("page", 1);                 // single key, with default
queryString.parse("?page=2&sort=name");     // explicit string
queryString.toString();                     // raw current query, no leading "?"

queryString.update({ page: 2, sort: "date" });        // replaceState, no render
queryString.update({ page: 2 }, true);                // also calls refresh()
queryString.update("page=2&sort=date");               // raw string accepted

queryString.toQueryString({ a: 1, b: [2, 3], nested: { x: 1 } });
// → "a=1&b[]=2&b[]=3&nested[x]=1"
```

Numeric-looking values come back as `number`s. Arrays use `key[]=v1&key[]=v2`. Nested objects use `key[subkey]=v` (composable: `a[b][c]=v`).

> `queryString.update(...)` **replaces** the entire query string, not merges. Pass the full object you want represented.

Swap parsers for a different convention:

```ts
import qs from "qs";

setRouterConfigurations({
  queryString: {
    objectParser: (search) => qs.parse(search),
    stringParser: (obj) => qs.stringify(obj),
  },
});
```

### Custom URL matcher

```ts
import { pathToRegexp } from "path-to-regexp";

setRouterConfigurations({
  urlMatcher: (pattern) => {
    const keys: Array<{ name: string }> = [];
    const regexp = pathToRegexp(pattern, keys);
    return { regexp, keys };
  },
});
```

Pattern results are memoized per matcher in a `WeakMap` — swapping the matcher implicitly resets the cache.

---

## Lazy-loading apps and modules

For larger projects, split routes into **apps** (a top-level prefix like `/admin`, `/`) and **modules** (a feature like `account`, `products`, `checkout`). Each module's routes are fetched the first time the user visits an entry path.

### Manifest

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

`entry` lists only the **first segment** of each route under that module. `entry: ["/account"]` matches `/account`, `/account/orders`, `/account/orders/42`. Listing deeper paths (`["/account/orders"]`) never matches — the router only looks at the first segment.

### Wire-up

```ts
// src/index.ts
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

import router from "@mongez/react-router";
router.scan();
```

Each `provider.ts` imports its own `routes.ts`, which calls `router.add(...)` to register that module's routes. After the provider runs, the wrapper retries `getRouteByPath(...)`. `renderOverPage: true` (default) renders `loadingComponent` over the previous page inside `<div id="__preloader__">`; `false` unmounts the previous page first.

### Chunk-error handler

Old chunks vanish on every deploy. A client with the pre-deploy JS in memory will see `"Failed to fetch dynamically imported module"` on the next lazy navigation.

```ts
setRouterConfigurations({
  lazyLoading: {
    loaders: { /* … */ },
    chunkErrorHandler: {
      strategy: "reload",   // "reload" | "notify" | "custom"
      maxReloadAttempts: 1, // guards against infinite reload loops
    },
  },
});
```

| Strategy | What it does |
|---|---|
| `"reload"` (default) | `window.location.href = path`. Reload counter kept in `sessionStorage`, keyed by path. After `maxReloadAttempts`, fires `chunkLoadError` with `maxAttemptsReached: true` and stops. |
| `"custom"` | Calls `onChunkLoadError(error, path, attempt)`. Returning `true` (or a Promise resolving to `true`) reloads; anything else hands off. |
| `"notify"` | Fires the `chunkLoadError` event. If `notificationComponent` is set, the router renders it into a sidecar `<div id="mrr-cle">` appended to `<body>`. |

```ts
router.events.onChunkLoadError(({ error, path, attempt, maxAttemptsReached }) => {
  if (maxAttemptsReached) showRefreshModal();
});
```

---

## Localization (locale prefixes)

```ts
setRouterConfigurations({
  localization: {
    defaultLocaleCode: "en",
    localeCodes: ["en", "fr", "es", "ar"],
    changeLanguageReloadMode: "soft", // "soft" | "hard"
  },
  appendLocaleCodeToUrl: true,        // default true
  autoRedirectToLocaleCode: true,     // default: localeCodes.length > 1
});
```

URL shape: `/basePath/(localeCode?)/appPath/routePath`. When you call `router.add("/customers", …)` from an `/admin` app, write the route **without** the locale or `/admin` prefix — both are prepended automatically based on the active app and locale.

| URL | Parsed |
|---|---|
| `/` | locale unset, app `/`, route `/` |
| `/en` | locale `en`, app `/`, route `/` |
| `/en/contact-us` | locale `en`, app `/`, route `/contact-us` |
| `/en/admin/customers` | locale `en`, app `/admin`, route `/customers` |

### Switching at runtime

```ts
import { changeLocaleCode, routerEvents } from "@mongez/react-router";

changeLocaleCode("fr");          // soft — re-render, fires localeChanged
changeLocaleCode("fr", "hard");  // hard — window.location.href = …

routerEvents.onDetectingInitialLocaleCode((localeCode) => {
  // Boot-time hook: load translations, set <html lang>, …
});
```

Soft mode fires `localeCodeChanging`, refreshes the active route's key (so the page remounts), navigates to the new locale-prefixed URL with mode `changeLocaleCode`, then fires `localeChanged`. Hard mode builds the full URL with query string and hash preserved, then does `window.location.href = …` — useful when third-party scripts cache locale state on init.

---

## Recipes

### Add a protected route gated by auth middleware

Reach for this when a section of the app requires login — `/account`, `/admin`, anything behind a check.

```tsx
import router, { navigateTo, NAVIGATING } from "@mongez/react-router";
import type { MiddlewareProps } from "@mongez/react-router";

function authMiddleware({ route }: MiddlewareProps) {
  if (!user.isLoggedIn()) {
    navigateTo("/login");
    return NAVIGATING; // wrapper bails out of rendering the page
  }
  return null;
}

router.group({
  path: "/account",
  middleware: [authMiddleware],
  layout: AccountLayout,
  routes: [
    { path: "/",        component: AccountDashboard },
    { path: "/profile", component: EditProfile },
    { path: "/orders",  component: Orders },
  ],
});
```

The `NAVIGATING` return value tells the wrapper "I redirected, don't render". For a return-to flow, encode the current path into the redirect target:

```ts
import { currentRoute, navigateTo, NAVIGATING } from "@mongez/react-router";
import queryString from "@mongez/react-router";

function authMiddleware({ route }: MiddlewareProps) {
  if (!user.isLoggedIn()) {
    const returnTo = encodeURIComponent(currentRoute());
    navigateTo(`/login?returnTo=${returnTo}`);
    return NAVIGATING;
  }
  return null;
}

// After successful login:
function onLogin() {
  const returnTo = queryString.get("returnTo", "/");
  navigateTo(decodeURIComponent(returnTo));
}
```

### Lazy-load a feature module with React.lazy

Reach for this when you want a single heavy page (chart library, rich text editor) deferred — without setting up the full apps/modules manifest.

```tsx
import { lazy } from "react";
import router, { setRouterConfigurations } from "@mongez/react-router";

const HeavyChart = lazy(() => import("./pages/HeavyChart"));

setRouterConfigurations({
  suspenseFallback: <Spinner />,
});

router.add("/dashboard", HeavyChart);
```

The wrapper already wraps every page in `<Suspense>` with the configured fallback. `React.lazy` works without any further setup — the chart bundle only loads when the user visits `/dashboard`.

For larger code-splitting (a whole `/admin` app, multiple feature modules), use `setApps([...])` and `lazyLoading.loaders` — see the [Lazy-loading](#lazy-loading-apps-and-modules) section.

### Build a language switcher

Reach for this when the app supports multiple locales and you need an in-page control to switch them.

```tsx
import { changeLocaleCode, Link } from "@mongez/react-router";

// As a select control — soft re-render:
function LanguageSwitcher() {
  return (
    <select onChange={(e) => changeLocaleCode(e.target.value)}>
      <option value="en">English</option>
      <option value="fr">Français</option>
      <option value="es">Español</option>
    </select>
  );
}

// As locale-pinned links to the same logical page:
<Link to="/about" localeCode="en">EN</Link>
<Link to="/about" localeCode="fr">FR</Link>
<Link to="/about" localeCode="es">ES</Link>
```

Listen for `localeChanged` to refresh locale-dependent data:

```ts
routerEvents.onLocaleChanged((next, prev) => {
  i18n.load(next).then(refresh);
});
```

### Track pageviews on every navigation

Reach for this when you want analytics that runs after the page is on screen — not on `navigating` (which fires before render).

```ts
import { routerEvents } from "@mongez/react-router";

routerEvents.onPageRendered((route, mode) => {
  if (mode === "swinging") return; // skip browser back/forward, optional
  analytics.pageview({ path: route, mode });
});
```

`mode` is one of `"navigation" | "changeLocaleCode" | "swinging" | "refresh"` (browser back/forward is `"swinging"`). Scope side effects accordingly.

### Show a loading bar between navigations

Reach for this when long lazy-module loads need a top-of-page progress indicator. The 300ms debounce avoids flashing the bar on instant same-bundle transitions.

```tsx
import { routerEvents } from "@mongez/react-router";

let timer: ReturnType<typeof setTimeout> | null = null;

routerEvents.onNavigating(() => {
  timer = setTimeout(() => loadingBar.start(), 300);
});

routerEvents.onPageRendered(() => {
  if (timer) { clearTimeout(timer); timer = null; }
  loadingBar.stop();
});
```

### Drive a filter UI from the query string

Reach for this when filters / sort / pagination should be shareable and survive reloads — bookmarkable URLs, no Redux needed.

```tsx
import queryString from "@mongez/react-router";

function ProductsList() {
  const { sort = "name", page = 1 } = queryString.all() as {
    sort?: string;
    page?: number;
  };

  return (
    <>
      <button onClick={() => queryString.update({ sort: "price", page: 1 }, true)}>
        Sort by price
      </button>
      <Pager
        page={page}
        onChange={(next) => queryString.update({ sort, page: next }, true)}
      />
      <ul>…</ul>
    </>
  );
}
```

The `true` second arg to `update` triggers `refresh()` so the component re-runs with the new params. Drop it to update the URL silently (e.g. while typing in a search input — only re-render when the user pauses).

### Recover from chunk-load errors after a deploy

Reach for this in production. The default `"reload"` strategy is what most apps want; pair with `maxReloadAttempts: 1` to prevent infinite loops if the new chunk also fails.

```ts
setRouterConfigurations({
  lazyLoading: {
    loaders: { /* … */ },
    chunkErrorHandler: {
      strategy: "reload",
      maxReloadAttempts: 1,
    },
  },
});
```

For a custom toast / modal flow, use `"notify"` and listen for the event:

```ts
setRouterConfigurations({
  lazyLoading: {
    loaders: { /* … */ },
    chunkErrorHandler: { strategy: "notify" },
  },
});

router.events.onChunkLoadError(({ error, path, attempt, maxAttemptsReached }) => {
  if (maxAttemptsReached) {
    showRefreshModal({ message: "App was updated — please reload." });
  } else {
    toast.info("New version available", { action: () => window.location.reload() });
  }
});
```

---

## Related packages

| Package | Use when you need |
|---|---|
| [`@mongez/concat-route`](https://github.com/hassanzohdy/mongez-concat-route) | The tiny path joiner used internally to compose `basePath` + `app.path` + `localeCode` + route — also useful for building URLs at call sites without `string +` gymnastics. |
| [`@mongez/events`](https://github.com/hassanzohdy/events) | The event bus that powers `routerEvents`. Sister package, identical conventions — use directly for app-level pub/sub alongside the router. |
| [`@mongez/localization`](https://github.com/hassanzohdy/mongez-localization) | Translation messages + locale-aware formatters. Pairs naturally with `appendLocaleCodeToUrl` and the `localeChanged` event for loading translation catalogues. |

---

## Further reading

- [`llms-full.txt`](./llms-full.txt) — exhaustive single-file API surface for tool-assisted development.
- [`llms.txt`](./llms.txt) — short index with deep-link references into the docs.
- [`skills/`](./skills) — per-topic deep-dives. [`CHANGELOG.md`](./CHANGELOG.md) — release notes.

---

## License

MIT
