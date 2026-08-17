---
name: mongez-react-router-overview
description: |
  @mongez/react-router — configuration-based singleton router. Routes as data, lazy-loaded apps/modules, locale-aware URLs, middleware per route, prefetch-on-hover, chunk-error recovery.
---

# @mongez/react-router — Overview

A **configuration-based** router for React. Routes are registered as data on a singleton (`router.add("/users/:id", UserPage)`), rendered by one internal wrapper, and reach into browser globals (`history`, `popstate`, `location`) directly. Trades the composability of JSX routes for a simpler mental model: one global table, one render path, one place for middleware and lazy-loading.

## Highlighted features

<div class="mongez-highlights">

<div class="mongez-highlight" data-accent="ice">
  <svg class="mongez-highlight-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 7h18M3 12h18M3 17h12"/></svg>
  <h3>Routes as data</h3>
  <p><code>router.add("/users/:id", UserPage)</code> on a singleton. One global table; refactor without touching JSX trees.</p>
</div>

<div class="mongez-highlight" data-accent="ice">
  <svg class="mongez-highlight-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/></svg>
  <h3>Locale-aware URLs</h3>
  <p><code>/en/admin/users</code>, <code>/fr/admin/users</code> generated from one route declaration. <code>changeLocaleCode</code> swaps the prefix without re-mounting.</p>
</div>

<div class="mongez-highlight" data-accent="fire">
  <svg class="mongez-highlight-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
  <h3>Middleware per route</h3>
  <p>Array of components returning <code>null</code> / <code>NAVIGATING</code> / <code>ReactNode</code>. Auth guards, role checks, redirect-before-render — composable per route or per group.</p>
</div>

<div class="mongez-highlight" data-accent="fire">
  <svg class="mongez-highlight-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
  <h3>Lazy apps + modules</h3>
  <p><code>setApps([...])</code> wires app/module loader pairs. Code-splits at the route boundary; bundles per app instead of per page.</p>
</div>

<div class="mongez-highlight" data-accent="bolt">
  <svg class="mongez-highlight-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
  <h3>Prefetch on <code>&lt;Link&gt;</code> hover</h3>
  <p>Lazy chunks start loading the moment the user hovers a link. Opt out per-link with <code>prefetch={false}</code> when bandwidth matters.</p>
</div>

<div class="mongez-highlight" data-accent="bolt">
  <svg class="mongez-highlight-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><polyline points="21 3 21 8 16 8"/></svg>
  <h3>Chunk-error recovery</h3>
  <p><code>lazyLoading.chunkErrorHandler</code> recovers after deploys when a stale tab requests a hashed chunk that no longer exists. Hard-reload, fallback page, custom — your choice.</p>
</div>

</div>

## Install

```sh
npm install @mongez/react-router
# or: yarn add @mongez/react-router
# or: pnpm add @mongez/react-router
```

Peer deps: `react >= 18`, `react-dom >= 18`.

## Quick peek

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

Register routes as data on the singleton, configure locale-prefixed URLs, then call `router.scan()` to mount the renderer.

## Mental model

```
declare              router.add("/users/:id", UserPage);
                     router.add("/about", AboutPage, [authMiddleware]);

configure            setRouterConfigurations({ localization: {...}, lazyLoading: {...} });

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

One wrapper handles every navigation type. Middleware, lazy-loading, and not-found handling all live inside that one render path.

## Scope vs. alternatives

| Need | This package | Alternative |
|---|---|---|
| Tree-shape routing (`<Routes>` / `<Route>` JSX) | ✗ — singleton-imperative | `react-router-dom` |
| Data loaders & actions with route-level revalidation | ✗ — bring your own ([`@mongez/atomic-query`](/atomic-query/overview/) for cache) | `react-router@6.4+` data API |
| Type-safe paths (compile-time URL params) | ✗ — params are `Record<string, any>` | `@tanstack/router` |
| Lazy-loaded app + module providers | ✓ | DIY with `React.lazy` |
| Locale prefix in path (`/en/admin/users`) | ✓ | DIY |
| Chunk-error recovery after deploys | ✓ | DIY |
| Prefetch lazy chunks on `<Link>` hover | ✓ | DIY |
| Middleware per route + per group | ✓ | `react-router@6.4+` loaders, `@tanstack/router` `beforeLoad` |

## Where to go next

- **[Routes](../routes/)** — `router.add`, route shapes, dynamic segments
- **[Navigation](../navigation/)** — `Link`, `navigateTo`, `navigateBack`, `silentNavigation`
- **[Params](../params/)** — URL params, query-string integration
- **[Lazy loading](../lazy-loading/)** — `setApps`, app/module loader pairs, prefetch
- **[Localization](../localization/)** — locale-prefixed URLs, `changeLocaleCode`
- **[Recipes](../recipes/)** — common patterns
