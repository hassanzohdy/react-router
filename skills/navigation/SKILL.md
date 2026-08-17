---
name: mongez-react-router-navigation
description: |
  Declarative `<Link>` and imperative helpers (`navigateTo`, `navigateBack`, `silentNavigation`, `refresh`) in @mongez/react-router, plus prefetch-on-hover, click interception, and the `NAVIGATING` sentinel.
---

# Navigation

## `<Link>`

```tsx
import { Link } from "@mongez/react-router";

<Link to="/about">About</Link>
<Link to="/products" prefetch>Products</Link>
<Link to="/admin/users" app="admin">Admin Users</Link>
<Link to="/about" localeCode="fr">À propos</Link>
<Link to="/terms" newTab>Terms</Link>
<Link to="/tasks/1" silent onClick={openInPopup}>Open task (no navigate)</Link>
<Link href="https://example.com">External</Link>
<Link email="hello@example.com">Email us</Link>
<Link tel="+1234567890">Call us</Link>
<Link to="/account" component={CustomLink}>Account</Link>
```

### Props

| Prop | Type | Behavior |
|---|---|---|
| `to` | `string` | Internal path. Prepended with `basePath`, current app, locale. |
| `href` | `string` | Alias of `to`. If it's a full URL (`isUrl(...)`), `mailto:`, `tel:`, or `#hash`, it renders verbatim and does NOT intercept clicks. |
| `email` | `string` | Forces `mailto:` link. |
| `tel` | `string` | Forces `tel:` link. |
| `localeCode` | `string` | Override the current locale. Use with relative `to` only. |
| `app` | `string` | Override the current app prefix. |
| `newTab` | `boolean` | Sets `target="_blank"` and `rel="noopener noreferrer"`. |
| `silent` | `boolean` | Click triggers `router.silentNavigation(path)` instead of `router.goTo(path)`. URL updates, no render. |
| `prefetch` | `boolean` | Prefetch lazy module on mouseover. Default from `config.prefetch` (`true`). |
| `component` | `Component \| string` | Render-as. Default `"a"` or `config.link.component`. |

### Click interception

`<Link>` intercepts the click and calls `router.goTo(path)` **only** when:

- the resolved path is internal — it starts with `/`, is not protocol-relative (`//host`),
  and contains no backslash. `/\evil.com` and `//evil.com` both start with `/` but resolve
  to a foreign origin, so they are treated as external and left to the browser, AND
- no modifier key is held (Ctrl / Meta / Shift / Alt), AND
- it isn't a middle-click (`e.button === 1`), AND
- `target` is not `"_blank"`.

So Ctrl+Click / Cmd+Click open a new tab as expected.

### Prefetch on hover

If `prefetch` is on and the path is internal, the link attaches a one-shot `mouseover` listener that calls `router.prefetch(path)`. The fetch is deduped via a ref — once it runs, the listener removes itself.

## Imperative navigation

```ts
import { navigateTo, navigateBack, silentNavigation, refresh } from "@mongez/react-router";

navigateTo("/about");
navigateTo("/about", "en");                  // with locale
navigateTo("/dashboard", "en", "admin");     // with locale + app

navigateBack();                              // → navigateTo(router.getPreviousRoute())

silentNavigation("/home");                   // updates URL, no render
silentNavigation("/home", { name: "John" }); // with query string
silentNavigation("/home", "name=John");      // raw query string also accepted

refresh();                                   // force re-render of current route
```

`navigateTo` returns the `NAVIGATING` sentinel so middleware can `return navigateTo(...)`:

```ts
function authMiddleware({ route }) {
  if (!user.isLoggedIn()) return navigateTo("/login");
  return null;
}
```

`navigateBack` is **not** `history.back()`. It calls `navigateTo(router.getPreviousRoute())`, which pushes a new history entry pointing back at the previous route. Browser back/forward buttons trigger `popstate` and run with `NavigationMode.swinging`.

## `refresh()` vs `forceRefresh: true`

| Mechanism | When it fires | Use case |
|---|---|---|
| `refresh()` (utility) | Imperatively re-render the current route | "Reload" button, after writing to a server and wanting fresh data |
| `setRouterConfigurations({ forceRefresh: true })` | Every `navigateTo(currentRoute)` re-renders | Per-link reload semantics |

When `forceRefresh` is off (default), `navigateTo("/current")` is a no-op when the URL hasn't changed. `refresh()` flips it on temporarily, refreshes the active route's key (forcing React to re-mount it), runs `router.refresh(NavigationMode.refresh)`, then restores the original flag.

## The `NAVIGATING` sentinel

```ts
export const NAVIGATING = <></>;
```

Exported as an empty fragment, used as a return value to communicate "I've redirected, don't render the page". The wrapper checks identity (`output === NAVIGATING`). Don't reuse it for empty content — use a real empty render.
