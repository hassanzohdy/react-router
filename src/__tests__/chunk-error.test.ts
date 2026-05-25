import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import router from "../router";
import routerEvents from "../events";

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
  // Reset lazyLoading config to defaults.
  r.lazyLoading = { renderOverPage: true };
}

beforeEach(() => {
  resetRouter();
  window.sessionStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
  window.sessionStorage.clear();
});

describe("router.handleChunkLoadError(...) — chunk detection", () => {
  it("ignores non-chunk errors (logs and returns)", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    router.handleChunkLoadError(new Error("regular runtime error"), "/x");
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("recognizes a chunk error by name (ChunkLoadError)", () => {
    const err = new Error("anything");
    err.name = "ChunkLoadError";
    router.setLazyLoading({
      loaders: { app: () => Promise.resolve({}), module: () => Promise.resolve({}) },
      chunkErrorHandler: { strategy: "notify", maxReloadAttempts: 1 },
    });
    const cb = vi.fn();
    const sub = routerEvents.onChunkLoadError(cb);
    router.handleChunkLoadError(err, "/feature");
    expect(cb).toHaveBeenCalled();
    sub.unsubscribe();
  });

  it("recognizes 'Failed to fetch dynamically imported module' messages", () => {
    const err = new Error(
      "Failed to fetch dynamically imported module: /assets/feature.js",
    );
    router.setLazyLoading({
      loaders: { app: () => Promise.resolve({}), module: () => Promise.resolve({}) },
      chunkErrorHandler: { strategy: "notify", maxReloadAttempts: 1 },
    });
    const cb = vi.fn();
    const sub = routerEvents.onChunkLoadError(cb);
    router.handleChunkLoadError(err, "/feature");
    expect(cb).toHaveBeenCalled();
    sub.unsubscribe();
  });

  it("recognizes 'Loading chunk' messages", () => {
    const err = new Error("Loading chunk 42 failed.");
    router.setLazyLoading({
      loaders: { app: () => Promise.resolve({}), module: () => Promise.resolve({}) },
      chunkErrorHandler: { strategy: "notify", maxReloadAttempts: 1 },
    });
    const cb = vi.fn();
    const sub = routerEvents.onChunkLoadError(cb);
    router.handleChunkLoadError(err, "/feature");
    expect(cb).toHaveBeenCalled();
    sub.unsubscribe();
  });
});

describe("router.handleChunkLoadError(...) — strategies", () => {
  it("strategy 'notify' fires the chunkLoadError event with the metadata", () => {
    const err = new Error("Failed to fetch dynamically imported module");
    router.setLazyLoading({
      loaders: { app: () => Promise.resolve({}), module: () => Promise.resolve({}) },
      chunkErrorHandler: { strategy: "notify", maxReloadAttempts: 1 },
    });
    const cb = vi.fn();
    const sub = routerEvents.onChunkLoadError(cb);
    router.handleChunkLoadError(err, "/feature");
    expect(cb).toHaveBeenCalledWith(
      expect.objectContaining({
        error: err,
        path: "/feature",
        attempt: 0,
        maxAttemptsReached: false,
      }),
    );
    sub.unsubscribe();
  });

  it("strategy 'custom' calls onChunkLoadError with (error, path, attempt)", () => {
    const err = new Error("Failed to fetch dynamically imported module");
    const onChunkLoadError = vi.fn().mockReturnValue(false);
    router.setLazyLoading({
      loaders: { app: () => Promise.resolve({}), module: () => Promise.resolve({}) },
      chunkErrorHandler: {
        strategy: "custom",
        maxReloadAttempts: 1,
        onChunkLoadError,
      },
    });
    router.handleChunkLoadError(err, "/feature");
    expect(onChunkLoadError).toHaveBeenCalledWith(err, "/feature", 0);
  });

  it("tracks reload attempts in sessionStorage per path", async () => {
    const err = new Error("Failed to fetch dynamically imported module");
    const onChunkLoadError = vi.fn().mockReturnValue(true);
    router.setLazyLoading({
      loaders: { app: () => Promise.resolve({}), module: () => Promise.resolve({}) },
      chunkErrorHandler: {
        strategy: "custom",
        maxReloadAttempts: 2,
        onChunkLoadError,
      },
    });
    router.handleChunkLoadError(err, "/feature");
    // Resolution of the Promise.resolve(true) is async; await a microtask.
    await Promise.resolve();
    expect(
      window.sessionStorage.getItem("mrr_reload_attempt_/feature"),
    ).toBe("1");
  });

  it("stops auto-reloading once max attempts is reached", () => {
    // Suppress the "Max reload attempts (N) reached" console.error
    // that the source logs as a diagnostic.
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const err = new Error("Failed to fetch dynamically imported module");
    window.sessionStorage.setItem("mrr_reload_attempt_/feature", "1");
    router.setLazyLoading({
      loaders: { app: () => Promise.resolve({}), module: () => Promise.resolve({}) },
      chunkErrorHandler: { strategy: "notify", maxReloadAttempts: 1 },
    });
    const cb = vi.fn();
    const sub = routerEvents.onChunkLoadError(cb);
    router.handleChunkLoadError(err, "/feature");
    expect(cb).toHaveBeenCalledWith(
      expect.objectContaining({ maxAttemptsReached: true }),
    );
    // Counter is cleared so the user can manually try again later.
    expect(
      window.sessionStorage.getItem("mrr_reload_attempt_/feature"),
    ).toBeNull();
    sub.unsubscribe();
    errorSpy.mockRestore();
  });
});
