import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import router from "../router";
import {
  changeLocaleCode,
  currentApp,
  currentRoute,
  getHash,
  navigateBack,
  navigateTo,
  previousRoute,
  refresh,
  setApps,
  silentNavigation,
} from "../utilities";
import { NAVIGATING } from "../helpers";
import { NavigationMode, type PublicApp } from "../types";

function resetRouter() {
  const r = router as any;
  r.routesList = [];
  r.appsList = [];
  r.currentApp = undefined;
  r.params = {};
  r.activeRoute = null;
  r.currentRoute = "/";
  r.previousRoute = "/";
  r.hasLocaleCode = false;
  r.initialLocaleCode = "";
  r.currentLocaleCode = r.defaultLocaleCode;
  r.localeCodes = ["en"];
  r.basePath = "/";
  r._forceRefresh = false;
}

beforeEach(() => {
  resetRouter();
  window.history.replaceState({}, "", "/");
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("navigateTo(...)", () => {
  it("calls router.goTo with the resolved path", () => {
    const spy = vi.spyOn(router, "goTo");
    navigateTo("/about");
    expect(spy).toHaveBeenCalled();
    expect(spy.mock.calls[0][0]).toBe("/about");
  });

  it("returns NAVIGATING (the sentinel)", () => {
    const result = navigateTo("/about");
    expect(result).toBe(NAVIGATING);
  });

  it("prefixes the locale code when one is active", () => {
    router.setLocaleCodes(["en", "fr"]);
    (router as any).hasLocaleCode = true;
    (router as any).currentLocaleCode = "fr";
    const spy = vi.spyOn(router, "goTo");
    navigateTo("/about");
    expect(spy.mock.calls[0][0]).toBe("/fr/about");
  });

  it("prefixes the app path when an app is active", () => {
    setApps([
      { name: "admin", path: "/admin", modules: [] } as PublicApp,
    ]);
    (router as any).currentApp = router.getApp("admin");
    const spy = vi.spyOn(router, "goTo");
    navigateTo("/customers");
    expect(spy.mock.calls[0][0]).toBe("/admin/customers");
  });

  it("accepts an explicit appName arg", () => {
    setApps([
      { name: "admin", path: "/admin", modules: [] } as PublicApp,
      { name: "front", path: "/", modules: [] } as PublicApp,
    ]);
    const spy = vi.spyOn(router, "goTo");
    navigateTo("/customers", undefined, "admin");
    expect(spy.mock.calls[0][0]).toBe("/admin/customers");
  });
});

describe("navigateBack()", () => {
  it("navigates to the router's previousRoute", () => {
    (router as any).previousRoute = "/from-here";
    const spy = vi.spyOn(router, "goTo");
    navigateBack();
    expect(spy.mock.calls[0][0]).toBe("/from-here");
  });

  it("returns the NAVIGATING sentinel", () => {
    expect(navigateBack()).toBe(NAVIGATING);
  });
});

describe("silentNavigation(...)", () => {
  it("forwards to router.silentNavigation", () => {
    const spy = vi.spyOn(router, "silentNavigation");
    silentNavigation("/silent", { x: 1 });
    expect(spy).toHaveBeenCalledWith("/silent", { x: 1 });
  });
});

describe("refresh()", () => {
  it("calls router.refresh with NavigationMode.refresh", () => {
    const spy = vi.spyOn(router, "refresh");
    refresh();
    expect(spy).toHaveBeenCalledWith(NavigationMode.refresh);
  });

  it("temporarily forces refresh, then restores the prior setting", () => {
    router.forceRefresh(false);
    let observed: boolean | undefined;
    const spy = vi.spyOn(router, "refresh").mockImplementation(() => {
      observed = router.isForceRefreshEnabled();
    });
    refresh();
    expect(observed).toBe(true);
    // Restored after the call.
    expect(router.isForceRefreshEnabled()).toBe(false);
    spy.mockRestore();
  });
});

describe("currentRoute() / previousRoute()", () => {
  it("returns the router's currentRoute", () => {
    (router as any).currentRoute = "/zzz";
    expect(currentRoute()).toBe("/zzz");
  });

  it("returns the router's previousRoute", () => {
    (router as any).previousRoute = "/yyy";
    expect(previousRoute()).toBe("/yyy");
  });
});

describe("getHash()", () => {
  it("returns the hash without the leading '#'", () => {
    window.history.replaceState({}, "", "/page#section");
    expect(getHash()).toBe("section");
  });

  it("returns an empty string when there's no hash", () => {
    window.history.replaceState({}, "", "/page");
    expect(getHash()).toBe("");
  });
});

describe("setApps / currentApp", () => {
  it("registers apps on the router", () => {
    setApps([
      { name: "admin", path: "/admin", modules: [] } as PublicApp,
      { name: "front", path: "/", modules: [] } as PublicApp,
    ]);
    expect(router.getApp("admin")?.path).toBe("/admin");
    expect(router.getApp("front")?.path).toBe("/");
  });

  it("currentApp() exposes the router's current app", () => {
    setApps([
      { name: "front", path: "/", modules: [] } as PublicApp,
    ]);
    (router as any).currentApp = router.getApp("front");
    expect(currentApp()?.name).toBe("front");
  });
});

describe("changeLocaleCode(...)", () => {
  it("soft mode updates currentLocaleCode and fires the lifecycle events", () => {
    router.setLocaleCodes(["en", "fr"]);
    (router as any).hasLocaleCode = true;
    router.setCurrentLocaleCode("en");
    const goToSpy = vi.spyOn(router, "goTo").mockImplementation(() => {});

    changeLocaleCode("fr", "soft");
    expect(router.getCurrentLocaleCode()).toBe("fr");
    // soft mode navigates to the new locale URL
    expect(goToSpy).toHaveBeenCalled();
    goToSpy.mockRestore();
  });

  it("hard mode sets window.location.href", () => {
    router.setLocaleCodes(["en", "fr"]);
    const original = window.location.href;
    // happy-dom allows assigning to location.href; mock it so the test
    // doesn't actually navigate.
    const hrefSetter = vi.fn();
    Object.defineProperty(window.location, "href", {
      configurable: true,
      get: () => original,
      set: hrefSetter,
    });

    try {
      changeLocaleCode("fr", "hard");
      expect(hrefSetter).toHaveBeenCalled();
      const target = hrefSetter.mock.calls[0][0];
      expect(target).toContain("/fr");
    } finally {
      // Restore the property descriptor so other tests aren't affected.
      Object.defineProperty(window.location, "href", {
        configurable: true,
        writable: true,
        value: original,
      });
    }
  });
});
