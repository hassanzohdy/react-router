/* eslint-disable @typescript-eslint/no-explicit-any */
import type { EventSubscription } from "@mongez/events";
import {
  type ComponentType,
  Fragment,
  type ReactNode,
  Suspense,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";
import { getRouterConfigurations } from "../config";
import routerEvents, { triggerEvent } from "../events";
import { NAVIGATING } from "../helpers";
import router, { generateRouteKey } from "../router";
import { type RouteOptions } from "../types";
import { navigateTo } from "../utilities";

export type Component = ComponentType<any>;

/**
 * RouterWrapper is the React tree's host for the active page. The
 * previous implementation subscribed to `routerEvents.onRendering(...)`
 * directly in the render body (via an IIFE), which leaked one event
 * subscription per React render — particularly bad under React 18
 * concurrent rendering and `StrictMode`'s double-render pass, since
 * effect cleanup only ever unhooked the most recent subscription.
 *
 * The rebuilt version moves the rendering state into a small
 * module-level store and exposes it through `useSyncExternalStore`. A
 * single event subscription is opened by the first React subscriber and
 * closed when the last one detaches; the snapshot is a stable
 * `{ Layout, content, isLoading }` triple that React reads on each
 * commit. All of the original side effects (route.key generation,
 * `router.activeRoute` mutation, `"rendered"` event firing, content
 * caching, middleware execution) still happen — they just live on the
 * store's mutation path instead of inside the render function.
 *
 * Observable behavioral notes:
 *  - Production: identical render sequence to the previous
 *    implementation (single mount → bootstrap → re-render with page).
 *  - StrictMode (dev): the previous implementation rendered an empty
 *    Fragment between the StrictMode unmount+remount because state was
 *    held in `useState`. The new implementation keeps state in a
 *    module-level store, so the re-mounted tree shows the existing
 *    page immediately instead of a blank flash. The bootstrap effect
 *    still re-runs, but `setState` short-circuits when nothing
 *    actually changes — no extra re-render, no extra "rendered" event.
 */

type RendererState = {
  Layout: Component;
  content: ReactNode;
  isLoading: boolean;
};

const initialState: RendererState = {
  Layout: Fragment,
  content: <></>,
  isLoading: false,
};

let state: RendererState = initialState;

const listeners = new Set<() => void>();

let renderingSub: EventSubscription | undefined;

function notify() {
  for (const listener of listeners) listener();
}

function setState(patch: Partial<RendererState>) {
  // Skip the notification when nothing actually changes — avoids
  // spurious re-renders from a no-op middleware return etc.
  const next = { ...state, ...patch };
  if (
    next.Layout === state.Layout &&
    next.content === state.content &&
    next.isLoading === state.isLoading
  ) {
    return;
  }
  state = next;
  notify();
}

function ensureRenderingSubscription() {
  if (renderingSub) return;
  renderingSub = routerEvents.onRendering((path: string) => {
    handleRenderingEvent(path);
  });
}

function teardownRenderingSubscription() {
  renderingSub?.unsubscribe();
  renderingSub = undefined;
}

function handleRenderingEvent(path: string) {
  const routeHandler = router.getRouteByPath(path);

  if (routeHandler) {
    updatePage(routeHandler);
  } else {
    // start lazy loading
    lazyLoading(router.getCurrentRoute());
  }
}

function updatePage(route: RouteOptions) {
  let key: string = route.key || "";

  if (
    route.path === router.activeRoute?.path &&
    router.isForceRefreshEnabled()
  ) {
    // Generate a non-empty random key. `Math.random().toString(36)
    // .substring(7)` can yield an empty string, which would defeat
    // React's reconciler key.
    key = generateRouteKey();
  }

  route.key = key;

  const currentLocale = router.getCurrentLocaleCode();

  if (route.middleware) {
    for (const middleware of route.middleware) {
      const output = middleware({
        params: router.params,
        localeCode: currentLocale,
        route: route,
      });

      if (output === NAVIGATING) return;

      if (output) {
        // Middleware can return ReactNode (not Promise)
        setState({ content: output as ReactNode });
        return;
      }
    }
  }

  const Component = route.component;

  const suspenseFallback = getRouterConfigurations().suspenseFallback || (
    <></>
  );

  const component = (
    <Component key={key} localeCode={currentLocale} params={router.params} />
  );

  const componentContent = (
    <Suspense fallback={suspenseFallback}>{component}</Suspense>
  );

  router.activeRoute = route;

  setState({
    Layout: route.layout || Fragment,
    content: componentContent,
  });

  setTimeout(() => {
    triggerEvent("rendered", route.path, router.navigationMode);
  }, 0);
}

function notFound() {
  if (router.notFound.mode === "redirect") {
    return navigateTo(router.notFound.path || "/404");
  } else {
    const NotFoundComponent =
      router.notFound.component || (() => <h1>Not Found Page</h1>);

    setState({ content: <NotFoundComponent /> });
  }
}

function lazyLoading(route: string) {
  const [loaders, onLoad] = router.getLazyRouter(route) as any;

  if (loaders) {
    setState({ isLoading: true });

    Promise.all(loaders)
      .then(() => {
        // Flip `isLoading` off first, then run `updatePage` / `notFound`.
        // This matches the original implementation's call order
        // (`setIsLoading(false)` before `setContent`), so any consumer
        // observing the state sequence sees the same transitions:
        // loading→idle, then the page swap. React 18 auto-batches the
        // resulting two notifications inside the same microtask, so
        // there is only one commit in practice.
        setState({ isLoading: false });

        onLoad();
        const routeHandler = router.getRouteByPath(route);

        if (routeHandler) {
          updatePage(routeHandler);
        } else {
          notFound();
        }
      })
      .catch(error => {
        setState({ isLoading: false });
        console.error("Lazy loading error:", error);

        // Use the router's chunk error handler
        router.handleChunkLoadError(error, route);
      });
  } else {
    notFound();
  }
}

/**
 * Bootstrap the initial render. Called from a `useEffect` so it runs
 * after the first commit, exactly like the original implementation.
 */
function bootstrap() {
  const currentRoute = router.getCurrentRoute();
  const routeHandler = router.getRouteByPath(currentRoute);

  if (routeHandler) {
    updatePage(routeHandler);
  } else {
    // start lazy loading
    lazyLoading(currentRoute);
  }
}

// Subscribe / getSnapshot are stable function references so each call
// to `useSyncExternalStore` doesn't tear down and re-create the
// subscription unnecessarily.
function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) ensureRenderingSubscription();
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) teardownRenderingSubscription();
  };
}

function getSnapshot() {
  return state;
}

export default function RouterWrapper() {
  // `subscribe` and `getSnapshot` are module-level functions with
  // stable identities, which is what `useSyncExternalStore` wants —
  // changing the subscribe reference triggers a tear-down + re-subscribe.
  const { Layout, content, isLoading } = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getSnapshot
  );

  // Bootstrap the very first render. Runs once on mount; under
  // `StrictMode` it runs twice (mount → unmount → mount), the same as
  // the original implementation. `updatePage` is idempotent for the
  // same route, so the second invocation just refires `"rendered"`
  // (preserving the pre-existing dev-mode behavior).
  useEffect(() => {
    bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Memoize the assembled tree on the same inputs the original
  // implementation used.
  const fullContent = useMemo(() => {
    let fullContent: ReactNode;
    if (isLoading) {
      const LoadingComponent = router.lazyLoading?.loadingComponent || Fragment;

      const loadingProps: any = {};

      if (LoadingComponent !== Fragment) {
        loadingProps["loading"] = true;
      }

      if (router.lazyLoading?.renderOverPage) {
        fullContent = (
          <>
            <div id="__preloader__" hidden={!isLoading}>
              <LoadingComponent {...loadingProps} />
            </div>
            {<Layout>{content}</Layout>}
          </>
        );
      } else {
        fullContent = (
          <>
            <LoadingComponent {...loadingProps} />
          </>
        );
      }
    } else {
      fullContent = (
        <>
          {router.lazyLoading?.renderOverPage && (
            <div id="__preloader__" hidden />
          )}
          <Layout>{content}</Layout>
        </>
      );
    }

    if (router.activeRoute && !isLoading) {
      // will be used in the swinging actions like going back and forward.
      router.cacheRouteContent(router.activeRoute, fullContent);
    }

    return fullContent;
  }, [Layout, content, isLoading]);

  return <>{fullContent}</>;
}

/**
 * Test-only hook: reset the renderer state and tear down the event
 * subscription so a fresh test starts from `Fragment` / empty content
 * with no listeners attached. Not part of the public package API.
 */
export function __resetRouterWrapperForTests() {
  state = initialState;
  listeners.clear();
  teardownRenderingSubscription();
}
