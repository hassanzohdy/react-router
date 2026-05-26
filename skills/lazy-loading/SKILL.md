---
name: mongez-react-router-lazy-loading
description: |
  Code-splitting via apps and modules, module manifests, loader wiring, loading UI, and chunk-error recovery in @mongez/react-router.
  TRIGGER when: code calls `setApps`, configures `lazyLoading` (`loaders.app` / `loaders.module`, `loadingComponent`, `renderOverPage`, `chunkErrorHandler`) via `setRouterConfigurations`, references `App`, `PublicApp`, `Module`, `Loaders`, `LazyLoadingOptions`, `LazyLoadingProps`, `ChunkErrorHandler`, or `ChunkErrorStrategy`, writes a `*-modules.json` manifest, or listens to `routerEvents.onChunkLoadError`; user asks "how do I lazy-load modules", "configure app/module loaders", "show a loading spinner over the previous page", "recover from chunk-load errors after a deploy".
  SKIP: this is @mongez's router, distinct from upstream `react-router-dom` — skip when the file uses bare `React.lazy` + `<Suspense>` without `@mongez/react-router` apps/modules, or `react-router`'s `loader`/`lazy` route options; registering individual routes — use `mongez-react-router-routes`; per-route `suspenseFallback` and Suspense recipe — use `mongez-react-router-recipes`.
---

# Lazy loading apps & modules

Split your app into two units of code-splitting: **apps** (top-level prefix like `/admin`, `/`) and **modules** (a feature like `account`, `products`). Each module's routes load on demand the first time the user visits an entry path.

## Layout

```
src/
├── apps/
│   ├── front-office/
│   │   ├── home/
│   │   │   ├── provider.ts            // calls router.add(...)
│   │   │   └── routes.ts
│   │   ├── account/
│   │   │   ├── provider.ts
│   │   │   └── routes.ts
│   │   ├── front-office-modules.json
│   │   └── front-office-provider.ts   // app-wide setup
│   └── admin/
│       ├── …
│       ├── admin-modules.json
│       └── admin-provider.ts
└── index.ts
```

## Module manifest

```jsonc
// front-office-modules.json
{
  "name": "front-office",
  "path": "/",
  "modules": [
    { "entry": ["/"],         "name": "home" },
    { "entry": ["/account"],  "name": "account" }
  ]
}
```

`entry` lists the **first segment** of each route under that module. Examples:

✅ Correct: `entry: ["/account"]` — matches `/account`, `/account/orders`, `/account/orders/42`
❌ Wrong: `entry: ["/account/orders"]` — never matches because the router only looks at the first segment

## Wire up the loaders

```ts
// src/index.ts
import { setApps, setRouterConfigurations } from "@mongez/react-router";
import frontOfficeApp from "./apps/front-office/front-office-modules.json";
import adminApp from "./apps/admin/admin-modules.json";

setApps([frontOfficeApp, adminApp]);

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

## What the loaders should do

Each provider module's job is to import that app or module's `routes.ts`, which calls `router.add(...)` for its routes:

```ts
// src/apps/front-office/account/provider.ts
import "./routes";
```

```ts
// src/apps/front-office/account/routes.ts
import router from "@mongez/react-router";
import AccountDashboard from "./pages/AccountDashboard";

router.add("/account", AccountDashboard);
// …
```

Once the provider is imported, the routes are registered and the wrapper retries `getRouteByPath(...)`.

## `loadingComponent` and `renderOverPage`

| Setting | Behavior |
|---|---|
| `renderOverPage: true` (default) | The loading component is rendered into `<div id="__preloader__">` above the previous page, which stays visible behind. Good for spinners. |
| `renderOverPage: false` | The previous page unmounts and the loading component is rendered alone. Good for full-screen splashes. |

The loading component receives a `loading: true` prop when non-`Fragment`.

## Chunk error handler

Old chunks get deleted on every deploy. A user with the previous JS in memory will see "Failed to fetch dynamically imported module" the first time they hit a lazy module after a deploy.

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

### Strategies

| Strategy | What it does |
|---|---|
| `"reload"` (default) | `window.location.href = path`. Reload counter kept in `sessionStorage` keyed by path. After `maxReloadAttempts`, fires `chunkLoadError` with `maxAttemptsReached: true` and stops. |
| `"custom"` | Calls `onChunkLoadError(error, path, attempt)`. If it returns `true` (or a Promise resolving to `true`), reloads. |
| `"notify"` | Fires `chunkLoadError` event for app to handle. If `notificationComponent` is set, renders it into `<div id="mrr-cle">` appended to `<body>` (using `createRoot`). |

### Custom example

```ts
chunkErrorHandler: {
  strategy: "custom",
  maxReloadAttempts: 2,
  onChunkLoadError: (error, path, attempt) => {
    toast.info("New version available. Reloading...");
    analytics.track("chunk_error", { path, attempt });
    return true;
  },
}
```

### Notify example

```ts
chunkErrorHandler: { strategy: "notify" }

router.events.onChunkLoadError(({ error, path, attempt, maxAttemptsReached }) => {
  if (maxAttemptsReached) {
    showRefreshModal();
  } else {
    toast.info({
      title: "New version available",
      action: () => window.location.reload(),
    });
  }
});
```

## Internal dedup

The router maintains two arrays — `loadedApps` and `loadedModules` (keyed `${appName}_${moduleName}`) — to avoid re-fetching providers across navigations. Once a module has loaded, subsequent navigations under that module hit the registered routes directly.

If you HMR-replace a module's `provider.ts`, mark it as un-loaded by mutating those arrays directly, or do a full reload.
