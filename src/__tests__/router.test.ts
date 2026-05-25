import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import router, { generateRouteKey } from "../router";
import { setRouterConfigurations } from "../config";
import { urlPatternMatcher } from "../matcher";
import type { App, UrlMatcher } from "../types";

function FakeComponent() {
  return null;
}
function OtherComponent() {
  return null;
}
function FakeLayout({ children }: { children?: React.ReactNode }) {
  return children as any;
}

// Reset the singleton's mutable state between tests.
function resetRouter() {
  const r = router as any;
  r.routesList = [];
  r.appsList = [];
  r.currentApp = undefined;
  r.params = {};
  r.activeRoute = null;
  r.currentRoute = "/";
  r.previousRoute = "/";
  r.loadedApps = [];
  r.loadedModules = [];
  r.hasLocaleCode = false;
  r.initialLocaleCode = "";
  r.defaultLocaleCode = "en";
  r.currentLocaleCode = "en";
  r.localeCodes = ["en"];
  r.basePath = "/";
  r._forceRefresh = false;
}

beforeEach(() => {
  resetRouter();
  // Reset the config-module record's `appendLocaleCodeToUrl` to a known value
  // so tests in this file don't inherit state from other test files.
  setRouterConfigurations({ appendLocaleCodeToUrl: true });
});

describe("router.add(...)", () => {
  it("registers a route via positional form", () => {
    router.add("/about", FakeComponent);
    const list = router.list();
    expect(list).toHaveLength(1);
    expect(list[0].path).toBe("/about");
    expect(list[0].component).toBe(FakeComponent);
    expect(list[0].middleware).toEqual([]);
    expect(list[0].layout).toBeUndefined();
  });

  it("registers a route via object form", () => {
    const middleware = [() => null];
    router.add({
      path: "/dashboard",
      component: FakeComponent,
      middleware,
      layout: FakeLayout,
    });
    const list = router.list();
    expect(list[0]).toMatchObject({
      path: "/dashboard",
      component: FakeComponent,
      middleware,
      layout: FakeLayout,
    });
  });

  it("appends to the list and is chainable", () => {
    expect(router.add("/a", FakeComponent)).toBe(router);
    router.add("/b", FakeComponent);
    router.add("/c", FakeComponent);
    expect(router.list().map(r => r.path)).toEqual(["/a", "/b", "/c"]);
  });

  it("prefixes registered paths with the current app's path", () => {
    const app: App = {
      name: "admin",
      path: "/admin",
      modules: [],
      isLoaded: true,
    };
    (router as any).currentApp = app;
    router.add("/customers", FakeComponent);
    expect(router.list()[0].path).toBe("/admin/customers");
  });
});

describe("router.group(...)", () => {
  it("prefixes child paths with the group path", () => {
    router.group({
      path: "/account",
      routes: [
        { path: "/", component: FakeComponent },
        { path: "/profile", component: FakeComponent },
      ],
    });
    expect(router.list().map(r => r.path)).toEqual([
      "/account",
      "/account/profile",
    ]);
  });

  it("prepends group middleware before per-route middleware", () => {
    const groupMw = () => null;
    const routeMw = () => null;
    router.group({
      middleware: [groupMw],
      routes: [
        { path: "/", component: FakeComponent, middleware: [routeMw] },
      ],
    });
    expect(router.list()[0].middleware).toEqual([groupMw, routeMw]);
  });

  it("applies the group layout to every child route", () => {
    router.group({
      layout: FakeLayout,
      routes: [
        { path: "/", component: FakeComponent },
        { path: "/about", component: FakeComponent },
      ],
    });
    expect(router.list().map(r => r.layout)).toEqual([FakeLayout, FakeLayout]);
  });

  it("group layout WINS over per-route layout", () => {
    const RouteLayout = () => null;
    router.group({
      layout: FakeLayout,
      routes: [{ path: "/", component: FakeComponent, layout: RouteLayout }],
    });
    expect(router.list()[0].layout).toBe(FakeLayout);
  });
});

describe("router.partOf(layout, routes)", () => {
  it("is sugar over group({ layout, routes })", () => {
    router.partOf(FakeLayout, [
      { path: "/", component: FakeComponent },
      { path: "/about", component: OtherComponent },
    ]);
    const list = router.list();
    expect(list).toHaveLength(2);
    expect(list.every(r => r.layout === FakeLayout)).toBe(true);
  });
});

describe("router.getRouteByPath(...)", () => {
  it("returns the route and assigns params for a dynamic match", () => {
    router.add("/users/:id", FakeComponent);
    const route = router.getRouteByPath("/users/42");
    expect(route).toBeDefined();
    expect(route!.component).toBe(FakeComponent);
    expect(router.params).toEqual({ id: "42" });
  });

  it("returns undefined when no route matches", () => {
    router.add("/about", FakeComponent);
    const route = router.getRouteByPath("/nonexistent");
    expect(route).toBeUndefined();
  });

  it("returns the first matching route when multiple are registered", () => {
    router.add("/about", FakeComponent);
    router.add("/about", OtherComponent);
    const route = router.getRouteByPath("/about");
    expect(route?.component).toBe(FakeComponent);
  });

  it("strips query strings from the path before matching", () => {
    router.add("/users/:id", FakeComponent);
    const route = router.getRouteByPath("/users/42?ref=newsletter");
    expect(route).toBeDefined();
    expect(router.params.id).toBe("42");
  });

  it("attaches a stable key to the matched route", () => {
    router.add("/about", FakeComponent);
    const route = router.getRouteByPath("/about");
    expect(typeof route!.key).toBe("string");
    expect(route!.key!.length).toBeGreaterThan(0);
  });
});

describe("router.getCurrentLocaleCode() / setLocaleCodes(...)", () => {
  it("returns the default locale by default", () => {
    expect(router.getCurrentLocaleCode()).toBe("en");
  });

  it("updates after setCurrentLocaleCode", () => {
    router.setCurrentLocaleCode("fr");
    expect(router.getCurrentLocaleCode()).toBe("fr");
  });
});

describe("router.setBasePath / setNotFound / setRootComponent / forceRefresh / strictMode", () => {
  it("setBasePath stores the value and returns the router", () => {
    expect(router.setBasePath("/app")).toBe(router);
    expect(router.basePath).toBe("/app");
  });

  it("setNotFound replaces the not-found configuration", () => {
    router.setNotFound({ mode: "redirect", path: "/oops" });
    expect(router.notFound).toEqual({ mode: "redirect", path: "/oops" });
  });

  it("strictMode flips the flag", () => {
    expect(router.strictMode(false)).toBe(router);
    expect((router as any)._strictMode).toBe(false);
  });

  it("forceRefresh flips the flag", () => {
    router.forceRefresh(true);
    expect(router.isForceRefreshEnabled()).toBe(true);
    router.forceRefresh(false);
    expect(router.isForceRefreshEnabled()).toBe(false);
  });
});

describe("router.setLocalization(...)", () => {
  it("updates each set localization key", () => {
    router.setLocalization({
      defaultLocaleCode: "fr",
      localeCodes: ["en", "fr", "ar"],
      changeLanguageReloadMode: "hard",
    });
    expect(router.getLocalization()).toEqual({
      defaultLocaleCode: "fr",
      localeCodes: ["en", "fr", "ar"],
      changeLanguageReloadMode: "hard",
    });
  });

  it("partial updates leave other keys intact", () => {
    router.setLocalization({ localeCodes: ["en", "fr"] });
    const loc = router.getLocalization();
    expect(loc.localeCodes).toEqual(["en", "fr"]);
    expect(loc.defaultLocaleCode).toBe("en");
  });
});

describe("router.parseLocation()", () => {
  it("extracts the route from window.location.pathname", () => {
    window.history.replaceState({}, "", "/about");
    router.parseLocation();
    expect(router.getCurrentRoute()).toBe("/about");
  });

  it("recognizes a registered locale code segment", () => {
    router.setLocaleCodes(["en", "fr"]);
    window.history.replaceState({}, "", "/fr/about");
    router.parseLocation();
    expect(router.getCurrentLocaleCode()).toBe("fr");
    expect(router.hasLocaleCode).toBe(true);
    expect(router.getCurrentRoute()).toBe("/about");
  });

  it("recognizes a registered app prefix", () => {
    const adminApp: App = {
      name: "admin",
      path: "/admin",
      modules: [],
      isLoaded: true,
    };
    router.setAppsList([adminApp]);
    window.history.replaceState({}, "", "/admin/users");
    router.parseLocation();
    expect(router.getCurrentApp()?.name).toBe("admin");
    expect(router.getCurrentRoute()).toBe("/users");
  });

  it("recognizes locale + app together", () => {
    const adminApp: App = {
      name: "admin",
      path: "/admin",
      modules: [],
      isLoaded: true,
    };
    router.setAppsList([adminApp]);
    router.setLocaleCodes(["en", "fr"]);
    window.history.replaceState({}, "", "/fr/admin/users");
    router.parseLocation();
    expect(router.getCurrentLocaleCode()).toBe("fr");
    expect(router.getCurrentApp()?.name).toBe("admin");
    expect(router.getCurrentRoute()).toBe("/users");
  });

  it("strips basePath before parsing", () => {
    router.setBasePath("/app");
    window.history.replaceState({}, "", "/app/about");
    router.parseLocation();
    expect(router.getCurrentRoute()).toBe("/about");
  });
});

describe("router.goTo(...)", () => {
  it("updates window.location via pushState and calls refresh", () => {
    router.add("/about", FakeComponent);
    const before = window.history.length;
    router.goTo("/about");
    expect(window.location.pathname).toBe("/about");
    expect(window.history.length).toBeGreaterThanOrEqual(before);
  });

  it("is a no-op when navigating to the current route and forceRefresh is off", () => {
    window.history.replaceState({}, "", "/about");
    router.parseLocation();
    router.forceRefresh(false);
    const refreshSpy = vi.spyOn(router, "refresh");
    router.goTo("/about");
    expect(refreshSpy).not.toHaveBeenCalled();
    refreshSpy.mockRestore();
  });

  it("refreshes when navigating to the same route AND forceRefresh is on", () => {
    window.history.replaceState({}, "", "/about");
    router.parseLocation();
    router.forceRefresh(true);
    const refreshSpy = vi.spyOn(router, "refresh");
    router.goTo("/about");
    expect(refreshSpy).toHaveBeenCalled();
    refreshSpy.mockRestore();
  });
});

describe("router.silentNavigation(...)", () => {
  beforeEach(() => {
    // silentNavigation prepends currentLocaleCode when appendLocaleCodeToUrl
    // is true. Disable it so these tests can focus on the navigation itself.
    setRouterConfigurations({ appendLocaleCodeToUrl: false });
  });

  it("replaces the URL without firing events", () => {
    router.silentNavigation("/silent");
    expect(window.location.pathname).toBe("/silent");
  });

  it("appends a query string when provided as an object", () => {
    router.silentNavigation("/silent", { foo: "bar" });
    expect(window.location.pathname).toBe("/silent");
    expect(window.location.search).toBe("?foo=bar");
  });

  it("updates currentRoute and previousRoute", () => {
    router.silentNavigation("/first");
    expect(router.getCurrentRoute()).toBe("/first");
    router.silentNavigation("/second");
    expect(router.getCurrentRoute()).toBe("/second");
    expect(router.getPreviousRoute()).toBe("/first");
  });
});

describe("router.isApp / getApp / getAppByPath", () => {
  beforeEach(() => {
    router.setAppsList([
      { name: "front", path: "/", modules: [], isLoaded: false },
      { name: "admin", path: "/admin", modules: [], isLoaded: false },
    ]);
  });

  it("isApp returns true for a registered app path segment", () => {
    expect(router.isApp("admin")).toBe(true);
    expect(router.isApp("unknown")).toBe(false);
  });

  it("getApp(name) returns the app by name", () => {
    expect(router.getApp("admin")?.path).toBe("/admin");
  });

  it("getAppByPath(path) returns the app by path", () => {
    expect(router.getAppByPath("/admin")?.name).toBe("admin");
  });
});

describe("generateRouteKey()", () => {
  it("always returns a non-empty string", () => {
    // Math.random().toString(36).substring(7) could return "" when the
    // base-36 representation has fewer than 7 characters. Stress-test
    // the replacement: even when Math.random returns very small values
    // (where the base-36 representation is short), the key must be
    // a non-empty stable-length string.
    const tinyValues = [0, 0.0001, 0.0000001, 0.99999999, 0.5];
    for (const v of tinyValues) {
      const spy = vi.spyOn(Math, "random").mockReturnValue(v);
      const key = generateRouteKey();
      expect(typeof key).toBe("string");
      expect(key.length).toBeGreaterThan(0);
      spy.mockRestore();
    }
  });

  it("produces keys of a stable, predictable length", () => {
    // Doesn't have to be exactly N — just non-empty and bounded so
    // React's reconciler can use it as a stable string key.
    for (let i = 0; i < 100; i++) {
      const key = generateRouteKey();
      expect(key.length).toBeGreaterThanOrEqual(6);
      expect(key.length).toBeLessThanOrEqual(12);
    }
  });

  it("refreshActiveRouteKey assigns a non-empty key", () => {
    router.add("/about", FakeComponent);
    (router as any).activeRoute = router.list()[0];
    router.refreshActiveRouteKey();
    const key = router.list()[0].key;
    expect(typeof key).toBe("string");
    expect((key as string).length).toBeGreaterThan(0);
  });
});

describe("router.setMatcher(...) — cache invalidation", () => {
  // Restore the default matcher after every test so a failure in the
  // body doesn't leak a custom matcher into later tests.
  afterEach(() => {
    router.setMatcher(urlPatternMatcher);
  });

  // The matcher pattern cache used to live in a module-level object and
  // never invalidated when `router.setMatcher(...)` swapped the
  // compiler. After the fix the cache is keyed by the matcher
  // reference, so a new matcher implicitly starts with a fresh cache.
  it("uses the new matcher's compiled output (not the previous matcher's cached one)", () => {
    const calls: string[] = [];

    const matcherA: UrlMatcher = (pattern: string) => {
      calls.push(`A:${pattern}`);
      return {
        // matcherA matches everything
        regexp: /^.*$/,
        keys: [],
      };
    };

    const matcherB: UrlMatcher = (pattern: string) => {
      calls.push(`B:${pattern}`);
      return {
        // matcherB matches nothing
        regexp: /^__never__$/,
        keys: [],
      };
    };

    // Install matcher A.
    router.setMatcher(matcherA);
    router.add("/anything", FakeComponent);
    // Force a lookup so matcher A compiles "/anything".
    const matchedWithA = router.getRouteByPath("/anything");
    expect(matchedWithA).toBeDefined();

    // Swap to matcher B. Without invalidation, the cached
    // compile from matcher A would still be used. With the fix,
    // matcher B is consulted and the route should NOT match.
    router.setMatcher(matcherB);
    const matchedWithB = router.getRouteByPath("/anything");
    expect(matchedWithB).toBeUndefined();

    // Sanity check: matcher B was actually invoked (proves the cache
    // wasn't reused).
    expect(calls.some(c => c.startsWith("B:"))).toBe(true);
  });
});
