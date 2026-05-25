# Changelog — @mongez/react-router

## Unreleased

### Fixed

- **`RouterWrapper` event-subscription leak (BIG)**: the previous implementation called `routerEvents.onRendering(...)` inside the render body via an IIFE, which created a *new* event subscription on every React render and only cleaned up the most recent one — leaking subscriptions under React 18 concurrent rendering and `StrictMode`'s double-render pass. Rebuilt the component on `useSyncExternalStore` with a single module-level store. `subscribe` opens at most one `router.rendering` subscription (refcounted by listener count) and cleans up when the last subscriber detaches; `getSnapshot` returns the current `{ Layout, content, isLoading }` triple. All original side effects (route key generation, `router.activeRoute` mutation, `"rendered"` event firing on `setTimeout(0)`, content caching, middleware execution) are preserved on the store's mutation path. (`src/components/RouterWrapper.tsx`)
- **Matcher pattern-cache invalidation**: the module-level `cache: any = {}` in `src/matcher.ts` was never cleared when `router.setMatcher(...)` replaced the matcher, so swapping matchers would silently keep using regexps compiled by the previous matcher. The cache is now scoped per matcher reference via a `WeakMap<UrlMatcher, ...>`, so a new matcher implicitly starts with a fresh cache and old caches become garbage-collectable along with the matcher they belong to. (`src/matcher.ts`)
- **`Math.random().toString(36).substring(7)` can return an empty string**: occurred at `src/router.tsx` (`refreshActiveRouteKey`) and `src/components/RouterWrapper.tsx` (`updatePage`) when the base-36 representation of the random value had fewer than 7 characters. An empty React `key` defeats the reconciler's mount/unmount. Replaced with `generateRouteKey()`, which composes two padded base-36 chunks and is guaranteed non-empty (6–12 chars). (`src/router.tsx`, `src/components/RouterWrapper.tsx`)
- **`Link` `forwardRef` generic order**: `forwardRef<LinkProps>(InnerLink) as React.FC<LinkProps>` typed the first generic as the ref element (it's actually the props slot) and the cast hid the mismatch — consumers got an incorrectly typed ref. Now `forwardRef<HTMLAnchorElement, LinkProps>(InnerLink)`; the inner ref-forwarding callback also now handles both object refs and callback refs, where it previously assumed an object ref. (`src/components/Link/Link.tsx`)
- **Router constructor SSR crash**: the singleton was instantiated at module load and called `window.addEventListener("popstate", ...)` plus `routerEvents.onNavigating(...)` (via `setScrollToTop("smooth")`) unconditionally, making `import "@mongez/react-router"` throw under SSR/Node where `window` is undefined. The constructor now guards both with `typeof window !== "undefined"`. Browser behaviour is unchanged — consumers that rely on listeners-being-active-on-import still get that. See Notes below for why the listeners weren't deferred to a `start()` call. (`src/router.tsx`)

### Added

- **AI kit**: `llms.txt`, `llms-full.txt`, and `skills/` folder (`README`, `overview`, `routes`, `navigation`, `params`, `lazy-loading`, `localization`, `recipes`) for tool-assisted development against the public API.
- **README rewrite**: technical reference covering every export, with the configuration table generated from the actual `RouterConfigurations` type. Removed examples that referenced non-exported helpers (e.g. `getCurrentLocaleCode`, `getApps`).
- **Test suite**: vitest + happy-dom + `@testing-library/react`. Covers route registration, dynamic segment parsing (`:id`, `:id?`, `:id+`, `:id*`), groups and `partOf`, programmatic navigation (`navigateTo` / `navigateBack` / `silentNavigation` / `refresh`), `<Link>` rendering and click interception (incl. modifier keys, `target="_blank"`, `email` / `tel` / external URL passthrough), the query-string parser/serializer, the URL pattern matcher, router events, base path, and not-found handling.
- **CHANGELOG**: this file.
- **CI**: GitHub Actions workflow `Test` running Node 18/20/22 on Ubuntu, Node 20 on Windows, plus a React 19 cross-matrix entry on Node 20 / Ubuntu.
- **`vitest.config.ts`**: happy-dom environment, React plugin, self-detecting sibling-alias resolver. The aliases for `@mongez/concat-route` and `@mongez/events` short-circuit `node_modules` when their source folders exist locally (monorepo dev), and silently fall back to the published packages in CI.
- **`package.json` metadata**:
  - `description` updated from "A powerful react router system with lazy loading" to a feature-list-shaped one-liner.
  - `keywords` expanded with `routing`, `lazy-loading`, `code-splitting`, `middleware`, `i18n`, `localization`, `prefetch`, `chunk-error`, `react-router`.
  - `sideEffects: false` (enables tree-shaking; the package source has no top-level side effects beyond the singleton instantiation in `router.tsx`, which consumers must opt into by importing the default export anyway).
  - `scripts.test` and `scripts.test:watch` for vitest.
  - `devDependencies` for the vitest stack (`vitest`, `happy-dom`, `@vitejs/plugin-react`, `@testing-library/react`, `@testing-library/dom`, `react`, `react-dom`, `@types/react`, `@types/react-dom`, `typescript`).
- **`router-wrapper.test.tsx`**: new test file covering the rebuilt `RouterWrapper` — subscription-lifecycle assertions (at most one `router.rendering` subscription regardless of render count, single subscription shared across multiple wrapper instances, tear-down on unmount) and rendering-behavior assertions (initial render of the matched route, re-render in response to a `"rendering"` event, `"rendered"` event firing).
- **`generateRouteKey` tests in `router.test.ts`**: explicit coverage of the random-key replacement — non-empty for all `Math.random()` corner cases (0, tiny, near-1), stable length bounds, and `refreshActiveRouteKey` always assigning a non-empty key.
- **Link `forwardRef` tests in `link.test.tsx`**: object refs and callback refs both receive the underlying `HTMLAnchorElement`.
- **Matcher cache-invalidation test in `router.test.ts`**: swapping the matcher via `setMatcher` produces results from the new matcher, not from the prior matcher's compiled cache.

### Changed

_None — the public API is identical._

### Removed

_None._

### Notes

The router constructor still calls `window.addEventListener("popstate", ...)` and `routerEvents.onNavigating(...)` (via `setScrollToTop`) at import time when a `window` is present. That means `import "@mongez/react-router"` has observable side effects in a browser environment: the singleton subscribes to `popstate` and scroll-to-top. Tree-shakers will still drop the named exports you don't use, but the default export drags the singleton in. `sideEffects: false` is set because consumers always have to opt into the singleton explicitly (via `import router from "@mongez/react-router"`); tools that follow re-exports treat the singleton init as part of that opt-in.

These listeners were intentionally **not** deferred to a `router.start()` call: consumers in the wild may depend on `popstate` being handled immediately after import (e.g. they wire `<Link>`s before `router.scan()` finishes the initial render and expect back/forward to work). Moving to a deferred init would silently break those flows. The fix in this entry adds an SSR guard so the import no longer crashes under Node, but the browser semantics are unchanged.

The `RouterWrapper` rebuild has one user-visible difference in `React.StrictMode` (dev only): under StrictMode the previous implementation rendered an empty Fragment between the simulated unmount and remount because the renderer state lived in `useState`. The new implementation holds the renderer state in a module-level store, so on the remount the previous page is shown immediately instead of a blank flash. The `"rendered"` event still fires the same number of times. Production rendering (no StrictMode) is identical to the old behaviour.
