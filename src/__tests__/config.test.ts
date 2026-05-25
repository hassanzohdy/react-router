import { beforeEach, describe, expect, it } from "vitest";
import {
  getRouterConfig,
  getRouterConfigurations,
  setRouterConfigurations,
  shouldAppendLocaleCodeToUrl,
} from "../config";
import router from "../router";

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
  r._strictMode = true;
}

beforeEach(() => {
  resetRouter();
  // Resetting the config module's internal record is intentionally
  // not exposed. Tests below only assert keys they themselves wrote.
});

describe("setRouterConfigurations(...)", () => {
  it("applies basePath onto the router", () => {
    setRouterConfigurations({ basePath: "/app" });
    expect(router.basePath).toBe("/app");
  });

  it("applies strictMode onto the router", () => {
    setRouterConfigurations({ strictMode: false });
    expect((router as any)._strictMode).toBe(false);
  });

  it("applies forceRefresh onto the router", () => {
    setRouterConfigurations({ forceRefresh: true });
    expect(router.isForceRefreshEnabled()).toBe(true);
  });

  it("applies localization onto the router", () => {
    setRouterConfigurations({
      localization: {
        defaultLocaleCode: "fr",
        localeCodes: ["en", "fr"],
        changeLanguageReloadMode: "hard",
      },
    });
    const loc = router.getLocalization();
    expect(loc.defaultLocaleCode).toBe("fr");
    expect(loc.localeCodes).toEqual(["en", "fr"]);
    expect(loc.changeLanguageReloadMode).toBe("hard");
  });

  it("applies notFound onto the router", () => {
    const NotFound = () => null;
    setRouterConfigurations({
      notFound: { mode: "render", component: NotFound },
    });
    expect(router.notFound.mode).toBe("render");
    expect(router.notFound.component).toBe(NotFound);
  });

  it("merges into the internal config record (later calls override prior keys)", () => {
    setRouterConfigurations({ basePath: "/a" });
    setRouterConfigurations({ basePath: "/b" });
    expect(getRouterConfig("basePath")).toBe("/b");
  });
});

describe("getRouterConfig(key, defaultValue?)", () => {
  it("returns the stored value", () => {
    setRouterConfigurations({ prefetch: true });
    expect(getRouterConfig("prefetch")).toBe(true);
  });

  it("returns the default value when unset", () => {
    // Use a key that no other test sets, to avoid pollution from the
    // shared module-level config record.
    expect(
      getRouterConfig("__never_set_in_any_test__" as any, "fallback"),
    ).toBe("fallback");
  });
});

describe("getRouterConfigurations()", () => {
  it("returns the merged config object", () => {
    setRouterConfigurations({ basePath: "/x", prefetch: true });
    const all = getRouterConfigurations();
    expect(all.basePath).toBe("/x");
    expect(all.prefetch).toBe(true);
  });
});

describe("shouldAppendLocaleCodeToUrl()", () => {
  it("defaults to true when unset", () => {
    // setRouterConfigurations leaves earlier keys in place; reset to undefined.
    setRouterConfigurations({ appendLocaleCodeToUrl: undefined as any });
    expect(shouldAppendLocaleCodeToUrl()).toBe(true);
  });

  it("respects explicit false", () => {
    setRouterConfigurations({ appendLocaleCodeToUrl: false });
    expect(shouldAppendLocaleCodeToUrl()).toBe(false);
  });

  it("respects explicit true", () => {
    setRouterConfigurations({ appendLocaleCodeToUrl: true });
    expect(shouldAppendLocaleCodeToUrl()).toBe(true);
  });
});
