---
name: mongez-react-router-routes
description: Registering routes, dynamic segments, groups, layouts, middleware, and not-found handling in @mongez/react-router.
when_to_use: User calls router.add(), router.group(), or router.partOf(). User asks about dynamic route patterns (:id, :id?, :path+, :path*), route middleware, shared layouts, or not-found configuration.
---

# Routes

## Registering a route

```ts
router.add("/users/:id", UserPage);
router.add("/dashboard", DashboardPage, [authMiddleware], AdminLayout);

// or the object form
router.add({
  path: "/dashboard",
  component: DashboardPage,
  middleware: [authMiddleware],
  layout: AdminLayout,
});
```

`add(...)` only registers — it doesn't render. Call `router.scan()` once at app startup to mount the wrapper into `#root`.

## What the component receives

```tsx
function UserPage({ params, localeCode }: { params: { id: string }; localeCode: string }) {
  return <h1>User {params.id} ({localeCode})</h1>;
}
```

`params` is also kept on `router.params` for code that runs outside the React tree (e.g. middleware, event handlers).

## Dynamic segments

| Pattern | Means | Example match |
|---|---|---|
| `:name` | one required segment | `/users/:id` matches `/users/42` |
| `:name?` | zero or one segment | `/users/:id?` matches `/users` AND `/users/42` |
| `:name+` | one or more segments | `/files/:path+` matches `/files/a/b/c` |
| `:name*` | zero or more segments | `/wildcard/:rest*` matches `/wildcard` AND `/wildcard/a/b/c` |

Multi-segment captures (`:path+`, `:path*`) return the joined string (e.g. `"a/b/c"`), not an array.

## Groups

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

- The group `path` prefixes each route (`/account/profile`, `/account/orders/:id`).
- The group `middleware` runs **before** any per-route middleware.
- The group `layout` wins over per-route `layout` (last-write semantics in the merge).

## Shared layout for many routes

```ts
router.partOf(BaseLayout, [
  { path: "/",      component: HomePage },
  { path: "/about", component: AboutPage },
]);
```

Equivalent to `router.group({ layout: BaseLayout, routes: [...] })`.

## Middleware return values

```ts
type Middleware = (
  | FC<MiddlewareProps>
  | ((options: MiddlewareProps) => ReactNode)
)[];

type MiddlewareProps = {
  route: RouteOptions;
  params: ObjectType;
  localeCode: string;
};
```

| Return | Effect |
|---|---|
| `null` / `false` / `undefined` | Run the next middleware, then the page |
| `NAVIGATING` (`<></>` re-exported as a sentinel) | Bail — the middleware called `navigateTo`, so don't render |
| Anything else (`ReactNode`) | Render that instead of the page component |

```tsx
import { navigateTo, NAVIGATING } from "@mongez/react-router";

function authMiddleware({ route, params, localeCode }) {
  if (!user.isLoggedIn()) {
    navigateTo("/login");
    return NAVIGATING;
  }
  return null;
}

function loadingMiddleware({ route }) {
  if (route.path === "/heavy-thing" && !ready) {
    return <FullScreenSpinner />;
  }
  return null;
}
```

## Multiple `add` calls overwrite nothing

`router.add(...)` always appends. The matcher walks the list in registration order and returns the first hit. If you register the same path twice, the first one wins for matching, but both stay in the list.

If you want to replace, mutate `router.list()` directly — there's no public unregister API.

## Not-found

```ts
setRouterConfigurations({
  notFound: {
    mode: "render",                 // or "redirect"
    component: NotFoundPage,
    // path: "/404",                 // for redirect mode
  },
});
```

`render` renders the component in place (URL unchanged). `redirect` calls `navigateTo(path || "/404")`. The redirect mode requires you to have registered that path.
