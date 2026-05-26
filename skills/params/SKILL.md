---
name: mongez-react-router-params
description: |
  URL parameter extraction, the `queryString` API, custom `urlMatcher`, and swapping the query string parser in @mongez/react-router.
  TRIGGER when: code imports `queryString`, `setQueryStringOptions`, `UrlMatcher`, or `QueryStringOptions` from `@mongez/react-router`, reads `router.params` / `params.id` in a page or middleware, calls `queryString.all`, `queryString.parse`, `queryString.get`, `queryString.toString`, `queryString.toQueryString`, or `queryString.update`, or sets `urlMatcher` / `queryString` keys via `setRouterConfigurations`; user asks "how do I read route params", "how do I read/update the query string", "how do I plug in `qs` or `path-to-regexp`"; `import queryString from "@mongez/react-router"`.
  SKIP: this is @mongez's router, distinct from upstream `react-router-dom` — skip when the file uses `useParams` / `useSearchParams` from `react-router-dom`; registering paths with dynamic segments — use `mongez-react-router-routes`; locale segment parsing — use `mongez-react-router-localization`; native `URLSearchParams` usage without `@mongez/react-router` imports.
---

# Params & query string

## How `params` flows

1. `router.parseLocation()` walks `window.location.pathname` minus `basePath`. It strips locale-code segments and app-path segments, leaving `currentRoute`.
2. `router.getRouteByPath(currentRoute)` walks the registered route list and runs `matchUrl(route.path, currentRoute, matcher)` on each.
3. The matcher returns `[ok, params]`. The matched route is the first hit; its params are placed on `router.params`.
4. `<RouterWrapper>` passes `router.params` as the `params` prop to the page component (and to every middleware via `MiddlewareProps`).

```tsx
router.add("/users/:id", UserPage);

function UserPage({ params, localeCode }: { params: { id: string }; localeCode: string }) {
  return <p>User {params.id}</p>;
}
```

`router.params` is also readable globally outside the React tree.

## URL matcher

Default matcher:

```ts
import type { UrlMatcher } from "@mongez/react-router";

const urlPatternMatcher: UrlMatcher = (pattern) => {
  // handles :name, :name?, :name+, :name*
  return { regexp, keys: [{ name }] };
};
```

Override with `path-to-regexp` (or anything else):

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

The matcher is called once per route per pattern; results are memoized in a `WeakMap` keyed by the matcher function reference (so swapping the matcher via `setRouterConfigurations({ urlMatcher: ... })` starts with a fresh cache).

## Query string

```ts
import { queryString } from "@mongez/react-router";

queryString.all();
queryString.parse(searchParams: string);  // explicit query string
queryString.get(key: string, defaultValue?: any);
queryString.toString();                   // current window.location.search.substring(1)
queryString.toQueryString(params: object | string);
queryString.update(params, reRender?: boolean);
```

### Default parser semantics

```ts
queryString.parse("page=2&sort=name&tags[]=a&tags[]=b&nested[k]=v");
// → { page: 2, sort: "name", tags: ["a", "b"], nested: { k: "v" } }
```

- Numeric-looking values come back as `number` (e.g. `page=2` → `page: 2`).
- `key[]=v1&key[]=v2` becomes `{ key: ["v1", "v2"] }`. With a single occurrence, it's still an array (`{ key: ["v1"] }`).
- `key[sub]=v` becomes `{ key: { sub: "v" } }`. Nested objects compose: `a[b][c]=v` → `{ a: { b: { c: "v" } } }`.

### `queryString.toQueryString(...)`

```ts
queryString.toQueryString({ a: 1, b: [2, 3], nested: { x: 1 } });
// → "a=1&b[]=2&b[]=3&nested[x]=1"
```

### `queryString.update(...)`

```ts
queryString.update({ page: 2, sort: "date" });            // replaceState, no render
queryString.update({ page: 2 }, /* reRender */ true);     // also calls refresh()
queryString.update("page=2&sort=date");                   // raw string accepted
```

Note: `update` **replaces** the entire query string, not merges. Pass the full object you want represented.

## Swap parsers

```ts
import qs from "qs";

setRouterConfigurations({
  queryString: {
    objectParser: (search) => qs.parse(search),
    stringParser: (obj) => qs.stringify(obj),
  },
});
```

Useful when integrating with a library that has its own query-string convention (e.g. PHP-style nesting, comma-separated arrays).
