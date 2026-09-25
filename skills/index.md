---
description: "Use @mongez/react-router to register React routes on its singleton router, boot the router once, and navigate with Link or imperative helpers. Start by declaring routes and shared layouts, then choose navigation, URL params, locale prefixes, or lazy app and module loading as the application needs them. This package is for configuration-driven client-side routing with route middleware and layouts; its guides cover the concrete APIs for composing paths, rendering pages, and responding to navigation events."
---

# @mongez/react-router

## Start here

Register pages with the singleton, configure the router, then scan it once at
application startup:

```tsx
import router, { Link, setRouterConfigurations } from "@mongez/react-router";

router.add("/", HomePage);
router.add("/users/:id", UserPage, [authMiddleware]);

setRouterConfigurations({
  localization: { defaultLocaleCode: "en", localeCodes: ["en", "fr"] },
});

router.scan();

function AppNavigation() {
  return <Link to="/users/42">View user</Link>;
}
```

Use this path for most work:

1. Define paths, route groups, layouts, middleware, and not-found behavior in
   [Routes](routes/).
2. Move between those routes with `Link`, `navigateTo`, or `navigateBack` in
   [Navigation](navigation/).
3. Read dynamic path values and update query strings in [Params](params/).

## Topics

- [Routes](routes/) — route registration, groups, layouts, middleware, and 404s.
- [Navigation](navigation/) — `Link`, imperative navigation, refresh, and prefetching.
- [Params](params/) — dynamic segments, URL matching, and query strings.
- [Lazy loading](lazy-loading/) — app/module manifests, loaders, and chunk recovery.
- [Localization](localization/) — locale URL prefixes and language switching.
- [Recipes](recipes/) — complete patterns such as auth guards and URL-driven filters.

## Not this package →

- Need JSX route trees, route data loaders, or actions? Use `react-router-dom`.
- Need compile-time type-safe route paths? Use `@tanstack/router`.
- Need application state or route-driven stores? Use `@mongez/react-atom`.
