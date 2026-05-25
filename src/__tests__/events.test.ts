import { describe, expect, it, vi } from "vitest";
import events from "@mongez/events";
import routerEvents, { triggerEvent } from "../events";
import { NavigationMode } from "../types";

describe("routerEvents", () => {
  it("subscribes to router.navigating and receives (route, mode, previousRoute)", () => {
    const cb = vi.fn();
    const sub = routerEvents.onNavigating(cb);
    triggerEvent("navigating", "/about", NavigationMode.navigation, "/");
    expect(cb).toHaveBeenCalledOnce();
    expect(cb).toHaveBeenCalledWith(
      "/about",
      NavigationMode.navigation,
      "/",
    );
    sub.unsubscribe();
  });

  it("subscribes to router.rendering", () => {
    const cb = vi.fn();
    const sub = routerEvents.onRendering(cb);
    triggerEvent("rendering", "/users/1", NavigationMode.navigation);
    expect(cb).toHaveBeenCalledWith("/users/1", NavigationMode.navigation);
    sub.unsubscribe();
  });

  it("subscribes to router.rendered (onPageRendered)", () => {
    const cb = vi.fn();
    const sub = routerEvents.onPageRendered(cb);
    triggerEvent("rendered", "/users/1", NavigationMode.refresh);
    expect(cb).toHaveBeenCalledWith("/users/1", NavigationMode.refresh);
    sub.unsubscribe();
  });

  it("subscribes to router.localeCodeChanging", () => {
    const cb = vi.fn();
    const sub = routerEvents.onLocaleChanging(cb);
    triggerEvent("localeCodeChanging", "fr", "en");
    expect(cb).toHaveBeenCalledWith("fr", "en");
    sub.unsubscribe();
  });

  it("subscribes to router.localeChanged", () => {
    const cb = vi.fn();
    const sub = routerEvents.onLocaleChanged(cb);
    triggerEvent("localeChanged", "fr", "en");
    expect(cb).toHaveBeenCalledWith("fr", "en");
    sub.unsubscribe();
  });

  it("subscribes to router.initialLocaleCode", () => {
    const cb = vi.fn();
    const sub = routerEvents.onDetectingInitialLocaleCode(cb);
    triggerEvent("initialLocaleCode", "fr");
    expect(cb).toHaveBeenCalledWith("fr");
    sub.unsubscribe();
  });

  it("subscribes to router.chunkLoadError", () => {
    const cb = vi.fn();
    const sub = routerEvents.onChunkLoadError(cb);
    const error = new Error("chunk failed");
    triggerEvent("chunkLoadError", {
      error,
      path: "/feature",
      attempt: 1,
      maxAttemptsReached: false,
    });
    expect(cb).toHaveBeenCalledWith({
      error,
      path: "/feature",
      attempt: 1,
      maxAttemptsReached: false,
    });
    sub.unsubscribe();
  });

  it("unsubscribe stops further notifications", () => {
    const cb = vi.fn();
    const sub = routerEvents.onRendering(cb);
    triggerEvent("rendering", "/a", NavigationMode.navigation);
    sub.unsubscribe();
    triggerEvent("rendering", "/b", NavigationMode.navigation);
    expect(cb).toHaveBeenCalledOnce();
  });

  it("each subscriber is independent (multiple unsubscribers don't affect each other)", () => {
    const cb1 = vi.fn();
    const cb2 = vi.fn();
    const sub1 = routerEvents.onRendering(cb1);
    const sub2 = routerEvents.onRendering(cb2);
    triggerEvent("rendering", "/a", NavigationMode.navigation);
    expect(cb1).toHaveBeenCalledOnce();
    expect(cb2).toHaveBeenCalledOnce();
    sub1.unsubscribe();
    triggerEvent("rendering", "/b", NavigationMode.navigation);
    expect(cb1).toHaveBeenCalledOnce(); // still 1
    expect(cb2).toHaveBeenCalledTimes(2);
    sub2.unsubscribe();
  });

  it("triggerEvent uses the 'router.' prefix on the events bus", () => {
    const cb = vi.fn();
    const sub = events.subscribe("router.rendering", cb);
    triggerEvent("rendering", "/x", NavigationMode.navigation);
    expect(cb).toHaveBeenCalled();
    sub.unsubscribe();
  });
});
