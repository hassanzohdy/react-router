import { afterEach, describe, expect, it } from "vitest";
import {
  browserHistory,
  getHistory,
  resetHistory,
  setHistory,
  type RouterHistory,
} from "../navigation";

/**
 * Guards the surface of the `@mongez/react-router/navigation` subpath.
 *
 * This entry is deliberately narrow: a host that owns the matcher and the
 * mount (Warlock's server router does) needs the history seam and nothing
 * else, because everything else in this package reaches `router.tsx` and
 * drags the matcher and the renderer along with it. If a symbol is added
 * here it becomes public API, so the surface is asserted exactly.
 */
describe("navigation subpath", () => {
  afterEach(() => {
    resetHistory();
  });

  it("exposes exactly the history seam and nothing else", async () => {
    const subpath = await import("../navigation");

    // `RouterHistory` is type-only, so it is absent at runtime by design.
    expect(Object.keys(subpath).sort()).toEqual([
      "browserHistory",
      "getHistory",
      "resetHistory",
      "setHistory",
    ]);
  });

  it("defaults to the browser history implementation", () => {
    expect(getHistory()).toBe(browserHistory);
  });

  it("lets a host swap the implementation and restore it", () => {
    const calls: string[] = [];

    const hostHistory: RouterHistory = {
      pushState: (_state, _title, url) => calls.push(`push:${url}`),
      replaceState: (_state, _title, url) => calls.push(`replace:${url}`),
      onPopState: () => () => calls.push("unsubscribe"),
    };

    setHistory(hostHistory);
    expect(getHistory()).toBe(hostHistory);

    getHistory().pushState(null, "", "/products");
    getHistory().replaceState({}, "", "/products?page=2");
    getHistory().onPopState(() => undefined)();

    expect(calls).toEqual([
      "push:/products",
      "replace:/products?page=2",
      "unsubscribe",
    ]);

    resetHistory();
    expect(getHistory()).toBe(browserHistory);
  });

  it("routes the router's navigation through the installed history", async () => {
    const { default: router } = await import("../router");

    const pushed: string[] = [];

    setHistory({
      pushState: (_state, _title, url) => pushed.push(url),
      replaceState: () => undefined,
      onPopState: () => () => undefined,
    });

    router.goTo("/subpath-seam-check");

    expect(pushed).toEqual(["/subpath-seam-check"]);
  });
});
