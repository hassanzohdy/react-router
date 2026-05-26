---
name: mongez-react-router-overview
description: |
  High-level mental model, install, import pattern, and feature scope of @mongez/react-router — a configuration-based singleton router (routes as data, one wrapper render path).
  TRIGGER when: code imports `router`, `Router`, `Link`, `navigateTo`, `setApps`, `setRouterConfigurations`, `routerEvents`, `queryString`, or `NAVIGATING` from `@mongez/react-router`; user asks "how does @mongez/react-router work", "how do I set up the router", "what's router.scan", "how does this compare to react-router-dom or @tanstack/router"; `import router from "@mongez/react-router"` or `import { ... } from "@mongez/react-router"`.
  SKIP: this is @mongez's router, distinct from upstream `react-router-dom` — skip when the file imports from `react-router`, `react-router-dom`, `@tanstack/router`, or Next.js routing; specific topics (route registration, link/navigation, params, locale, lazy-loading, recipes) — use the matching `mongez-react-router-*` skill instead.
---

# Overview

`@mongez/react-router` is a **configuration-based** router for React. Routes are registered as data on a singleton (`router.add("/users/:id", UserPage)`), rendered by a single internal wrapper, and reach into the browser globals (`history`, `popstate`, `location`) directly. This trades the composability of JSX-routes for a simpler mental model: one global table, one render path, one place to put middleware and lazy-loading.

## Install

```sh
yarn add @mongez/react-router
# peer: react >= 18, react-dom >= 18
```

## Import pattern

```ts
import router, {
  Link,
  navigateTo,
  navigateBack,
  silentNavigation,
  refresh,
  changeLocaleCode,
  currentRoute,
  previousRoute,
  currentApp,
  getHash,
  setApps,
  setRouterConfigurations,
  routerEvents,
  queryString,
  NAVIGATING,
  type Route,
  type Middleware,
  type LinkProps,
} from "@mongez/react-router";
```

`router` is the default export — the singleton `Router` instance. Everything else is a named export.

## Mental model

```
declare              router.add("/users/:id", UserPage);
                     router.add("/about", AboutPage, [authMiddleware]);

configure            setRouterConfigurations({ localization: { ... }, lazyLoading: { ... } });

boot                 router.scan();           // mounts <RouterWrapper> into #root
                                              // parses URL, fires "navigating",
                                              // renders the matching route

run                  <Link to="/about">       // intercepts clicks → router.goTo
                     navigateTo("/about")     // imperative; from anywhere
                     popstate (back/forward)  // detected automatically
                       ↓
                     router.refresh(mode)
                       ↓
                     "navigating" + "rendering" events
                       ↓
                     <RouterWrapper> picks route, runs middleware, renders
```

The same wrapper handles every navigation type. Middleware, lazy-loading, and not-found handling all live inside that one render path.

## Scope vs. alternatives

| Need | This package | Alternative |
|---|---|---|
| Tree-shape routing with `<Routes>` / `<Route>` JSX | ✗ — declarations are imperative on a singleton | `react-router-dom` |
| Data loaders & actions with route-level revalidation | ✗ — bring your own (e.g. `@mongez/atomic-query` for cache) | `react-router@6.4+` data API |
| Type-safe paths (compile-time URL params) | ✗ — params are `Record<string, any>` | `@tanstack/router` |
| Lazy-loaded app + module providers | ✓ — `setApps([...])` + the `app`/`module` loader pair | DIY with `React.lazy` |
| Locale prefix as part of the path (`/en/admin/users`) | ✓ — `appendLocaleCodeToUrl`, `changeLocaleCode` | DIY |
| Chunk-error recovery after deploys | ✓ — `lazyLoading.chunkErrorHandler` | DIY |
| Prefetch lazy chunks on `<Link>` hover | ✓ — opt out per link with `prefetch={false}` | DIY |
| Middleware per route + per group | ✓ — array of components returning `null` / `NAVIGATING` / `ReactNode` | `react-router@6.4+` loaders, `@tanstack/router` `beforeLoad` |

## React version

React 18+. The renderer uses `react-dom/client`'s `createRoot` / `hydrateRoot`. There's no built-in support for SSR of the router state — render your HTML payload elsewhere, then call `router.scan()` in the client bundle (it'll hydrate `#root` automatically if it has children).
