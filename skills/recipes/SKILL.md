---
name: mongez-react-router-recipes
description: |
  End-to-end recipes composing multiple @mongez/react-router features: auth guards, return-to redirects, language switchers, analytics, scroll restoration, loading bars, URL-driven filters, per-route Suspense, and route-driven data with `@mongez/react-atom`.
  TRIGGER when: code wires `routerEvents.onNavigating` / `.onPageRendered` for analytics, scroll restoration, or a loading bar; uses `currentRoute`, `previousRoute`, `NavigationMode` to scope side effects; combines `navigateTo` + `NAVIGATING` + `queryString.get` for an auth `return-to` redirect; sets `suspenseFallback`; pairs the router with `fetchingAtom` from `@mongez/react-atom`; user asks "auth-gate a section", "track pageviews", "URL-driven pagination", "keep scroll on back/forward".
  SKIP: this is @mongez's router, distinct from upstream `react-router-dom` — skip when the project uses `react-router-dom` loaders/`useNavigation`; single-concept questions answered by another skill — locale switching → `mongez-react-router-localization`, `<Link>` props → `mongez-react-router-navigation`, raw `queryString` API → `mongez-react-router-params`.
---

# Recipes

Common flows that compose more than one feature.

## Auth-gated routes

```ts
import { navigateTo, NAVIGATING } from "@mongez/react-router";

function authMiddleware({ route, params, localeCode }) {
  if (!user.isLoggedIn()) {
    navigateTo("/login");
    return NAVIGATING;
  }
  return null;
}

router.group({
  path: "/account",
  middleware: [authMiddleware],
  layout: AccountLayout,
  routes: [
    { path: "/",         component: AccountDashboard },
    { path: "/profile",  component: EditProfile },
    { path: "/orders",   component: Orders },
  ],
});
```

The `NAVIGATING` return value tells the wrapper "I redirected, don't render the page". The `navigateTo` call updates the URL and triggers the new render cycle.

## Authentication redirect with `return-to`

```ts
import { currentRoute, navigateTo, NAVIGATING } from "@mongez/react-router";

function authMiddleware({ route }) {
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

## Language switcher

```tsx
import { changeLocaleCode, Link } from "@mongez/react-router";

function LanguageSwitcher() {
  return (
    <select onChange={(e) => changeLocaleCode(e.target.value)}>
      <option value="en">English</option>
      <option value="fr">Français</option>
      <option value="es">Español</option>
    </select>
  );
}

// Or as links:
<Link to="/about" localeCode="en">EN</Link>
<Link to="/about" localeCode="fr">FR</Link>
<Link to="/about" localeCode="es">ES</Link>
```

## Page analytics on every route change

```ts
import { routerEvents } from "@mongez/react-router";

routerEvents.onPageRendered((route, mode) => {
  // Ignore back/forward navigations if you want
  if (mode === "swinging") return;
  analytics.pageview({ path: route, mode });
});
```

`mode` is one of `"navigation" | "changeLocaleCode" | "swinging" | "refresh"`. Scope side effects accordingly.

## Scroll restoration on back/forward only

```ts
import { routerEvents } from "@mongez/react-router";

let scrollHistory: Record<string, number> = {};

routerEvents.onNavigating((route, mode, previousRoute) => {
  scrollHistory[previousRoute] = window.scrollY;
});

routerEvents.onPageRendered((route, mode) => {
  if (mode === "swinging") {
    window.scrollTo(0, scrollHistory[route] ?? 0);
  } else {
    window.scrollTo(0, 0);
  }
});
```

The built-in `scrollToTop` option always scrolls to top on `navigating`. Disable it (`scrollToTop: false`) when you want custom logic like this.

## Loading bar between navigating and page-rendered

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

The 300ms debounce avoids flashing the bar for fast same-bundle transitions.

## URL-driven filters

```tsx
import { queryString } from "@mongez/react-router";

function ProductsList() {
  const { sort = "name", page = 1 } = queryString.all() as { sort?: string; page?: number };

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

The `true` second arg to `update` triggers `refresh()` so the component re-runs with the new params.

## Suspense per route

```tsx
import HeavyChart from "./HeavyChart"; // a React.lazy(...)

setRouterConfigurations({
  suspenseFallback: <Spinner />,
});

router.add("/dashboard", () => (
  // Wrapped in Suspense by the router; the fallback comes from config.
  <HeavyChart />
));
```

The wrapper already wraps every page in `<Suspense>` with the configured fallback. You don't need to add it yourself unless you want a per-section fallback.

## Composing with state — react-atom

Pair the router with [`@mongez/react-atom`](https://github.com/hassanzohdy/mongez-react-atom) for route-driven state:

```tsx
import { fetchingAtom } from "@mongez/react-atom";
import { routerEvents } from "@mongez/react-router";

const usersAtom = fetchingAtom<User[]>("users");

routerEvents.onPageRendered(async (route) => {
  if (route !== "/users") return;
  usersAtom.startLoading();
  try {
    usersAtom.success(await api.users.list());
  } catch (err) {
    usersAtom.failed(err);
  }
});
```

Now `usersAtom.useData()` / `useLoading()` work inside any component, and the data is invalidated/refetched declaratively whenever the user navigates onto `/users`.
