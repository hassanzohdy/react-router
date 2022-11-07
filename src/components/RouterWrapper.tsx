import React, { useEffect, useMemo, useState } from "react";
import routerEvents, { triggerEvent } from "../events";
import router from "../router";
import { RouteOptions } from "../types";
import { navigateTo } from "../utilities";

export type Component = React.ComponentType<any>;

export default function RouterWrapper() {
  const [Layout, setLayout] = useState<any>(React.Fragment);

  const [content, setContent] = useState<React.ReactNode>(<></>);

  const [isLoading, setIsLoading] = useState(false);

  const updatePage = (route: RouteOptions) => {
    let key: string = route.key || "";

    if (
      route.path === router.activeRoute?.path &&
      router.isForceRefreshEnabled()
    ) {
      key = Math.random().toString(36).substring(7);
    }

    route.key = key;

    if (route.layout) {
      setLayout(() => {
        return route.layout;
      });
    }

    if (route.middleware) {
      for (const middleware of route.middleware) {
        const output = (middleware as any)();

        if (output) {
          setContent(output);
          return;
        }
      }
    }

    const Component = route.component;

    const componentContent = <Component key={key} params={router.params} />;

    setContent(componentContent);

    router.activeRoute = route;

    setTimeout(() => {
      triggerEvent("rendered", route.path, router.navigationMode);
    }, 0);
  };

  const notFound = () => {
    if (router.notFound.mode === "redirect") {
      return navigateTo(router.notFound.path! || "/404");
    } else {
      const NotFoundComponent =
        router.notFound.component! ||
        (() => (
          <>
            <h1>Not Found Page</h1>
          </>
        ));

      setContent(<NotFoundComponent />);
    }
  };

  const lazyLoading = (route: string) => {
    const [loaders, onLoad]: any = router.getLazyRouter(route);

    if (loaders) {
      setIsLoading(true);

      Promise.all(loaders).then(() => {
        setIsLoading(false);

        onLoad();
        const routeHandler = router.getRouteByPath(route);

        if (routeHandler) {
          updatePage(routeHandler!);
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

    const event = routerEvents.onRendering((path: string) => {
      const routeHandler = router.getRouteByPath(path);

      if (routeHandler) {
        updatePage(routeHandler);
      } else {
        // start lazy loading
        lazyLoading(router.getCurrentRoute());
      }
    });

    return () => event.unsubscribe();
  }, []);

  const fullContent = useMemo(() => {
    let fullContent: React.ReactNode;
    if (isLoading) {
      const LoadingComponent = router.lazyLoading?.loadingComponent!;

      if (router.lazyLoading?.renderOverPage) {
        fullContent = (
          <>
            {isLoading && <LoadingComponent loading />}
            {<Layout>{content}</Layout>}
          </>
        );
      } else {
        fullContent = (
          <>
            <LoadingComponent loading />
          </>
        );
      }
    } else {
      fullContent = (
        <>
          <Layout>{content}</Layout>
        </>
      );
    }

    if (router.activeRoute && !isLoading) {
      // will be used in the swinging actions like going back and forward.
      router.cacheRouteContent(router.activeRoute!, fullContent);
    }

    return fullContent;
  }, [Layout, content, isLoading]);

  return fullContent;
}
