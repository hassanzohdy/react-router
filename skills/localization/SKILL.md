---
name: mongez-react-router-localization
description: |
  Locale-prefixed URLs (`/en/admin/users`), runtime language switching, and locale-detection configuration in @mongez/react-router.
  TRIGGER when: code imports `changeLocaleCode`, `shouldAppendLocaleCodeToUrl`, `LocalizationOptions`, or `ChangeLanguageReloadMode` from `@mongez/react-router`, sets `localization` (`defaultLocaleCode`, `localeCodes`, `changeLanguageReloadMode`), `appendLocaleCodeToUrl`, or `autoRedirectToLocaleCode` via `setRouterConfigurations`, reads `router.getCurrentLocaleCode()` or the `localeCode` prop, renders `<Link localeCode=...>`, or listens to `routerEvents.onLocaleChanging` / `.onLocaleChanged` / `.onDetectingInitialLocaleCode`; user asks "how do I add a language prefix to URLs", "how do I switch language at runtime", "soft vs hard locale reload".
  SKIP: this is @mongez's router, distinct from upstream `react-router-dom` — skip when the project uses `react-i18next` / `next-intl` routing without `@mongez/react-router`; translation message catalogs (this skill only covers URL/locale plumbing, not translation strings); base `<Link>` props unrelated to locale — use `mongez-react-router-navigation`.
---

# Localization

## Configure

```ts
setRouterConfigurations({
  localization: {
    defaultLocaleCode: "en",
    localeCodes: ["en", "fr", "es", "ar"],
    changeLanguageReloadMode: "soft",   // "soft" | "hard"
  },
  appendLocaleCodeToUrl: true,          // default true
  autoRedirectToLocaleCode: true,       // default: localeCodes.length > 1
});
```

| Option | Effect |
|---|---|
| `defaultLocaleCode` | Used when `autoRedirectToLocaleCode` is on and the URL has no locale segment. |
| `localeCodes` | The set of allowed locale segments. URL parser only treats a segment as a locale if it's in this list. |
| `changeLanguageReloadMode` | Default mode for `changeLocaleCode(code)`. `"soft"` re-renders; `"hard"` does `window.location.href = …`. |
| `appendLocaleCodeToUrl` | When false, the locale doesn't appear in the URL — useful for cookie/header-driven i18n. |
| `autoRedirectToLocaleCode` | When true and the URL has no locale segment, `router.scan()` redirects to `defaultLocaleCode` on first boot. |

## URL shape

```
/basePath/(localeCode?)/appPath/routePath
```

Examples (with `basePath: "/"`, app `admin` at `/admin`):

| User-facing URL | Parsed |
|---|---|
| `/` | locale unset, app `/`, route `/` |
| `/en` | locale `en`, app `/`, route `/` |
| `/en/contact-us` | locale `en`, app `/`, route `/contact-us` |
| `/admin` | locale unset, app `/admin`, route `/` |
| `/en/admin/customers` | locale `en`, app `/admin`, route `/customers` |

When you call `router.add("/customers", …)`, do NOT include the locale or the `/admin` prefix — they're prepended automatically based on the active app and locale.

## Receiving the locale in a component

```tsx
function UserPage({ params, localeCode }: { params: { id: string }; localeCode: string }) {
  return <p>{t(localeCode, "userIs", { id: params.id })}</p>;
}
```

The locale also lives on `router.getCurrentLocaleCode()` for use outside the React tree.

## Switching at runtime

```ts
import { changeLocaleCode } from "@mongez/react-router";

changeLocaleCode("fr");           // soft: fires localeCodeChanging, re-renders
changeLocaleCode("fr", "hard");   // hard: window.location.href = …
```

### Soft

1. `router.setCurrentLocaleCode(localeCode)`
2. Fires `localeCodeChanging` (new, old)
3. Refreshes the active route's `key` so the page remounts
4. Calls `router.goTo(...)` with the new locale-prefixed URL, mode `changeLocaleCode`
5. Fires `localeChanged` (new, old)

Listen for `localeChanged` to re-fetch locale-dependent data (translations, dates, currency).

### Hard

Builds the full URL (with query string + hash preserved) and does `window.location.href = fullPath`. Used when you need a clean state across language changes (e.g. when third-party scripts cache locale state on init).

## `<Link>` with locale

```tsx
<Link to="/about">About</Link>                  // current locale automatically
<Link to="/about" localeCode="fr">À propos</Link>  // explicit locale override
```

When no `localeCode` prop is set and the router currently has a locale code in the URL, `<Link>` uses it. Set `localeCode` explicitly to render a link to a different language (e.g. a language switcher).

## Detecting the initial locale

The first time the URL contains a recognized locale segment, the router fires `initialLocaleCode`:

```ts
routerEvents.onDetectingInitialLocaleCode((localeCode) => {
  console.log("Boot locale:", localeCode);
  // good place to load translations, set <html lang>, etc.
});
```

This fires once per page load; subsequent locale changes fire `localeChanging` / `localeChanged` instead.

## `autoRedirectToLocaleCode` default

If you don't set it, the router derives it: `true` when `localeCodes.length > 1`, otherwise `false`. The reasoning: single-locale apps never want a locale segment, multi-locale apps usually do.

Set it explicitly to override (e.g. `false` when you're driving i18n from a cookie and don't want it in the URL even with multiple locales).
