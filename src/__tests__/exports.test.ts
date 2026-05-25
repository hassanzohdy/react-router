import { describe, expect, it } from "vitest";
import router, {
  Router,
  Link,
  routerEvents,
  queryString,
  setQueryStringOptions,
  NAVIGATING,
  navigateTo,
  navigateBack,
  silentNavigation,
  refresh,
  currentRoute,
  previousRoute,
  currentApp,
  getHash,
  changeLocaleCode,
  setApps,
  setRouterConfigurations,
  getRouterConfig,
  getRouterConfigurations,
  shouldAppendLocaleCodeToUrl,
} from "../index";

describe("public exports", () => {
  it("exports the singleton router as the default", () => {
    expect(router).toBeDefined();
    expect(typeof router.add).toBe("function");
    expect(typeof router.scan).toBe("function");
    expect(typeof router.goTo).toBe("function");
  });

  it("exports the Router class", () => {
    expect(typeof Router).toBe("function");
    expect(router).toBeInstanceOf(Router);
  });

  it("exports Link as a React component", () => {
    expect(Link).toBeDefined();
  });

  it("exports routerEvents with the expected subscribe methods", () => {
    expect(typeof routerEvents.onNavigating).toBe("function");
    expect(typeof routerEvents.onRendering).toBe("function");
    expect(typeof routerEvents.onPageRendered).toBe("function");
    expect(typeof routerEvents.onLocaleChanging).toBe("function");
    expect(typeof routerEvents.onLocaleChanged).toBe("function");
    expect(typeof routerEvents.onDetectingInitialLocaleCode).toBe("function");
    expect(typeof routerEvents.onChunkLoadError).toBe("function");
  });

  it("exports queryString helpers", () => {
    expect(typeof queryString.all).toBe("function");
    expect(typeof queryString.get).toBe("function");
    expect(typeof queryString.parse).toBe("function");
    expect(typeof queryString.update).toBe("function");
    expect(typeof queryString.toString).toBe("function");
    expect(typeof queryString.toQueryString).toBe("function");
    expect(typeof setQueryStringOptions).toBe("function");
  });

  it("exports the NAVIGATING sentinel as a React element", () => {
    expect(NAVIGATING).toBeDefined();
  });

  it("exports the imperative navigation utilities", () => {
    expect(typeof navigateTo).toBe("function");
    expect(typeof navigateBack).toBe("function");
    expect(typeof silentNavigation).toBe("function");
    expect(typeof refresh).toBe("function");
  });

  it("exports the route-reading utilities", () => {
    expect(typeof currentRoute).toBe("function");
    expect(typeof previousRoute).toBe("function");
    expect(typeof currentApp).toBe("function");
    expect(typeof getHash).toBe("function");
  });

  it("exports the localization and app helpers", () => {
    expect(typeof changeLocaleCode).toBe("function");
    expect(typeof setApps).toBe("function");
  });

  it("exports the config helpers", () => {
    expect(typeof setRouterConfigurations).toBe("function");
    expect(typeof getRouterConfig).toBe("function");
    expect(typeof getRouterConfigurations).toBe("function");
    expect(typeof shouldAppendLocaleCodeToUrl).toBe("function");
  });
});
