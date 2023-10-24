/* eslint-disable @typescript-eslint/no-explicit-any */
import concatRoute from "@mongez/concat-route";
import React, { useMemo } from "react";
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
    localeCode,
    to,
    app,
    component: Component = linkOptions.component,
    ...props
  }: LinkProps,
  ref: any
) {
  if (!localeCode && router.hasLocaleCode) {
    localeCode = router.getCurrentLocaleCode();
  }

  const path = useMemo(() => {
    if (email) return `mailto:${email}`;

    if (tel) return `tel:${tel}`;

    let path = to || (href as string);

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
      // navigate to the path
      router.goTo(path);
    }
  };

  if (newTab && !props.target) {
    props.target = "_blank";
  }

  if (props.target === "_blank") {
    props.rel = "noopener noreferrer";
  }

  return (
    <Component
      ref={ref}
      href={path.startsWith("/") ? concatRoute(router.basePath, path) : path}
      onClick={onClick}
      {...props}
    />
  );
}

const Link: React.FC<LinkProps> = React.forwardRef<LinkProps>(_Link);

export default Link;
