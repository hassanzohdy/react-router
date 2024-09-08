/* eslint-disable @typescript-eslint/no-explicit-any */
import concatRoute from "@mongez/concat-route";
import { forwardRef, useEffect, useMemo, useRef } from "react";
import { getRouterConfig } from "../../config";
import { isUrl } from "../../helpers";
import router from "../../router";
import { LinkOptions, LinkProps } from "../../types";

let linkOptions: Required<LinkOptions> = {
  component: "a",
};

export function setLinkOptions(options: LinkOptions) {
  linkOptions = {
    ...linkOptions,
    ...options,
  };
}

function _Link(
  {
    href,
    onClick: baseOnClick,
    email,
    tel,
    newTab,
    prefetch = getRouterConfig("prefetch", true),
    localeCode,
    to,
    app,
    silent = false,
    component: Component = linkOptions.component,
    ...props
  }: LinkProps,
  ref: any,
) {
  if (!localeCode && router.hasLocaleCode) {
    localeCode = router.getCurrentLocaleCode();
  }

  const linkRef = useRef<HTMLAnchorElement>(null);
  const isPrefetchedRef = useRef(false);

  const path = useMemo(() => {
    if (email) return `mailto:${email}`;

    if (tel) return `tel:${tel}`;

    let path = to || (href as string);

    if (!path) return path;

    if (path.startsWith("#")) return path;

    if (isUrl(path)) return path;

    const appName = app || (router.getCurrentApp()?.name as string);

    const appPath = router.getApp(appName)?.path as string;

    path = concatRoute(appPath, path);

    return localeCode ? concatRoute(localeCode, path) : path;
  }, [href, to, app, localeCode, email, tel]);

  const onClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    baseOnClick && baseOnClick(e);

    if (
      props.target === "_blank" ||
      e.ctrlKey ||
      e.metaKey ||
      e.shiftKey ||
      e.altKey ||
      // or when clicking on the scroll button
      e.button === 1
    ) {
      return;
    }

    if (path.startsWith("/")) {
      e.preventDefault();

      if (silent === true) {
        router.silentNavigation(path);
      } else {
        // navigate to the path
        router.goTo(path);
      }
    }
  };

  if (newTab && !props.target) {
    props.target = "_blank";
  }

  if (props.target === "_blank") {
    props.rel = "noopener noreferrer";
  }

  useEffect(() => {
    if (!prefetch) return;
    if (!path.startsWith("/")) return;
    if (isPrefetchedRef.current) return;
    const element = linkRef?.current;

    if (!element) return;

    // we ned to prefetch the module on hover
    const callback = () => {
      if (isPrefetchedRef.current) {
        element.removeEventListener("mouseover", callback);
        return;
      }

      isPrefetchedRef.current = true;
      router.prefetch(path);
    };

    element.addEventListener("mouseover", callback);

    return () => {
      element.removeEventListener("mouseover", callback);
    };
  }, [path, prefetch, linkRef]);

  return (
    <Component
      ref={element => {
        if (ref) {
          ref.current = element;
        }

        if (linkRef) {
          linkRef.current = element;
        }
      }}
      href={path?.startsWith("/") ? concatRoute(router.basePath, path) : path}
      onClick={onClick}
      {...props}
    />
  );
}

const Link = forwardRef<LinkProps>(_Link) as React.FC<LinkProps>;

export default Link;
