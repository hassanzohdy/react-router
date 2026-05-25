/* eslint-disable @typescript-eslint/no-explicit-any */
import { act, cleanup, render } from "@testing-library/react";
import events from "@mongez/events";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import RouterWrapper, {
  __resetRouterWrapperForTests,
} from "../components/RouterWrapper";
import router from "../router";
import { triggerEvent } from "../events";
import { NavigationMode } from "../types";

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
  r.lazyLoading = { renderOverPage: true };
}

beforeEach(() => {
  resetRouter();
  __resetRouterWrapperForTests();
  // Also clear all router.* subscriptions so left-overs from other test
  // files don't influence the subscription-count assertions below.
  events.unsubscribe("router.rendering");
});

afterEach(() => {
  // @testing-library/react auto-cleans on `afterEach` when it's a
  // global, but this repo's vitest config sets `globals: false`, so we
  // call cleanup() explicitly. Without this, mounted components from
  // earlier tests stay attached to document.body and `getByTestId`
  // returns "found multiple elements".
  cleanup();
  vi.restoreAllMocks();
  __resetRouterWrapperForTests();
});

function HomePage() {
  return <div data-testid="home">home</div>;
}

function AboutPage() {
  return <div data-testid="about">about</div>;
}

describe("<RouterWrapper /> — subscription lifecycle", () => {
  // The previous implementation subscribed to `routerEvents.onRendering`
  // in the render body (via an IIFE), creating one new subscription per
  // React render. Under React 18 concurrent rendering and `StrictMode`,
  // this leaked subscriptions: only the most-recent one was ever
  // unsubscribed by the effect cleanup.
  //
  // The rebuilt version opens a single subscription that is shared
  // across all subscribers, refcounted by listener count.
  it("opens at most one router.rendering subscription regardless of render count", () => {
    const { rerender, unmount } = render(<RouterWrapper />);

    // Force a few more renders. Each render previously added another
    // subscription. Now they all share the single one opened on mount.
    rerender(<RouterWrapper />);
    rerender(<RouterWrapper />);
    rerender(<RouterWrapper />);

    expect(events.subscriptions("router.rendering")).toHaveLength(1);

    unmount();
    // Last subscriber detached => subscription torn down.
    expect(events.subscriptions("router.rendering")).toHaveLength(0);
  });

  it("tears down the subscription on unmount", () => {
    const { unmount } = render(<RouterWrapper />);
    expect(events.subscriptions("router.rendering").length).toBe(1);
    unmount();
    expect(events.subscriptions("router.rendering").length).toBe(0);
  });

  it("shares a single subscription across multiple concurrent RouterWrapper instances", () => {
    // Two roots (e.g. multi-microfrontend) share the one event
    // listener and don't multiply it per instance.
    const a = render(<RouterWrapper />);
    const b = render(<RouterWrapper />);
    expect(events.subscriptions("router.rendering").length).toBe(1);
    a.unmount();
    // Still one listener active because the second wrapper is still mounted.
    expect(events.subscriptions("router.rendering").length).toBe(1);
    b.unmount();
    expect(events.subscriptions("router.rendering").length).toBe(0);
  });
});

describe("<RouterWrapper /> — rendering behavior", () => {
  it("renders the matched route on mount", () => {
    router.add("/", HomePage);
    const { getByTestId } = render(<RouterWrapper />);
    expect(getByTestId("home")).toBeDefined();
  });

  it("re-renders when a rendering event fires with a new path", () => {
    router.add("/", HomePage);
    router.add("/about", AboutPage);

    const { getByTestId, queryByTestId } = render(<RouterWrapper />);
    expect(getByTestId("home")).toBeDefined();

    // Simulate navigating to /about (replicates router.refresh()).
    // `triggerEvent` calls into the rendering subscriber synchronously,
    // which mutates the renderer store and notifies listeners. React's
    // useSyncExternalStore schedules a re-render — wrap in act() so the
    // re-render is flushed before assertions.
    act(() => {
      (router as any).currentRoute = "/about";
      triggerEvent("rendering", "/about", NavigationMode.navigation);
    });

    expect(queryByTestId("home")).toBeNull();
    expect(getByTestId("about")).toBeDefined();
  });

  it("fires the rendered event after a route renders", async () => {
    router.add("/", HomePage);
    const cb = vi.fn();
    const sub = events.subscribe("router.rendered", cb);
    render(<RouterWrapper />);
    // The 'rendered' event is fired via setTimeout(0); flush macrotasks.
    await new Promise(r => setTimeout(r, 10));
    expect(cb).toHaveBeenCalled();
    sub.unsubscribe();
  });

  it("re-mounts a route component on force-refresh (new key applied)", () => {
    // The random-key fix has to keep producing keys that *change* on
    // force-refresh so React's reconciler tears down the old component
    // and mounts a fresh one. The key must also be a non-empty string
    // (the previous `Math.random().toString(36).substring(7)` could
    // produce `""`, which would not satisfy the reconciler's key
    // contract). Verify both with a counting component.
    let mountCount = 0;
    function CountingPage() {
      mountCount += 1;
      return <div data-testid="counting">{mountCount}</div>;
    }
    router.add("/", CountingPage);
    router.forceRefresh(true);

    const { getByTestId } = render(<RouterWrapper />);
    expect(getByTestId("counting").textContent).toBe("1");

    // Re-fire "rendering" with the same path while force refresh is on
    // — should re-mount with a fresh key.
    act(() => {
      triggerEvent("rendering", "/", NavigationMode.refresh);
    });

    expect(getByTestId("counting").textContent).toBe("2");

    // And again, just to be sure successive keys aren't colliding.
    act(() => {
      triggerEvent("rendering", "/", NavigationMode.refresh);
    });
    expect(getByTestId("counting").textContent).toBe("3");
  });
});
