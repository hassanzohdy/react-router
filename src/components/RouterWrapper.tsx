/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { Suspense, useEffect, useMemo, useState } from "react";
import { getRouterConfigurations } from "../config";
import routerEvents, { triggerEvent } from "../events";
import { NAVIGATING } from "../helpers";
import router from "../router";
import { RouteOptions } from "../types";
import { navigateTo } from "../utilities";

export type Component = React.ComponentType<any>;

export default function RouterWrapper() {
  const [Layout, setLayout] = useState<Component>(React.Fragment);

  const [content, setContent] = useState<React.ReactNode>(<></>);

  const [isLoading, setIsLoading] = useState(false);

  const renderingEvent = useMemo(() => {
    return routerEvents.onRendering((path: string) => {
      const routeHandler = router.getRouteByPath(path);

      if (routeHandler) {
        updatePage(routeHandler);
      } else {
        // start lazy loading
        lazyLoading(router.getCurrentRoute());
      }
    });
  }, []);

  const updatePage = (route: RouteOptions) => {
    let key: string = route.key || "";

    if (
      route.path === router.activeRoute?.path &&
      router.isForceRefreshEnabled()
    ) {
      key = Math.random().toString(36).substring(7);
    }

    route.key = key;

    if (route.middleware) {
      for (const middleware of route.middleware) {
        const output = middleware({
          params: router.params,
          localeCode: router.getCurrentLocaleCode(),
          route: route,
        });

        if (output === NAVIGATING) return;

        if (output) {
          setContent(output);
          return;
        }
      }
    }

    setLayout(() => {
      return route.layout || React.Fragment;
    });

    const Component = route.component;

    const suspenseFallback = getRouterConfigurations().suspenseFallback || (
      <></>
    );

    const component = <Component key={key} params={router.params} />;

    const componentContent = (
      <Suspense fallback={suspenseFallback}>{component}</Suspense>
    );

    router.activeRoute = route;

    setContent(componentContent);

    setTimeout(() => {
      triggerEvent("rendered", route.path, router.navigationMode);
    }, 0);
  };

  const notFound = () => {
    if (router.notFound.mode === "redirect") {
      return navigateTo(router.notFound.path || "/404");
    } else {
      const NotFoundComponent =
        router.notFound.component || (() => <h1>Not Found Page</h1>);

      setContent(<NotFoundComponent />);
    }
  };

  const lazyLoading = (route: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any

    const [loaders, onLoad] = router.getLazyRouter(route) as any;

    if (loaders) {
      setIsLoading(true);

      Promise.all(loaders).then(() => {
        setIsLoading(false);

        onLoad();
        const routeHandler = router.getRouteByPath(route);

        if (routeHandler) {
          updatePage(routeHandler);
        } else {
          notFound();
        }
      });
    } else {
      notFound();
    }
  };

  useEffect(() => {
    const currentRoute = router.getCurrentRoute();

    const routeHandler = router.getRouteByPath(currentRoute);

    if (routeHandler) {
      updatePage(routeHandler);
    } else {
      // start lazy loading
      lazyLoading(currentRoute);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      renderingEvent.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [renderingEvent]);

  const fullContent = useMemo(() => {
    let fullContent: React.ReactNode;
    if (isLoading) {
      const LoadingComponent =
        router.lazyLoading?.loadingComponent || React.Fragment;

      const loadingProps: any = {};

      if (LoadingComponent !== React.Fragment) {
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
