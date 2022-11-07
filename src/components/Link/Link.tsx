import concatRoute from "@mongez/concat-route";
import Is from "@mongez/supportive-is";
import React, { useMemo } from "react";
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
  const path = useMemo(() => {
    if (email) return `mailto:${email}`;

    if (tel) return `tel:${tel}`;

    let path = to || (href as string);

    if (Is.url(path)) return path;

    let appPath = app || router.getCurrentAppPath();

    let currentLocale = localeCode;
    path = concatRoute(appPath, path);

    if (!localeCode && router.hasLocaleCode) {
      currentLocale = router.getCurrentLocaleCode();
    }

    return currentLocale ? concatRoute(currentLocale, path) : path;
  }, [href, to, app, localeCode, email, tel]);

  const onClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (Is.url(path) || !path.startsWith("/")) return;

    if (props.target === "_blank") {
      return;
    }

    e.preventDefault();
    // navigate to the path
    router.goTo(path);

    baseOnClick && baseOnClick(e);
  };

  if (newTab) {
    props.target = "_blank";
  }

  if (props.target === "_blank") {
    props.rel = "noopener noreferrer";
  }

  return <Component ref={ref} href={path} onClick={onClick} {...props} />;
}

const Link = React.forwardRef(_Link);

export default Link;
