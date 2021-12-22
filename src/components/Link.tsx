import React from "react";
import Is from "@mongez/supportive-is";
import { LinkProps } from "./../types";
import { concatRoute } from "./../helpers";
import { Link as RouterLink } from "react-router-dom";
import { getAppPath, getCurrentAppName } from "./../apps-list";
import { hasInitialLocaleCode } from "./../navigator";
import { getCurrentLocaleCode } from "./../detect-locale-change";

const Link = React.forwardRef(function (props: LinkProps, forwardedRef) {
  let {
    to,
    href,
    newTab = false,
    localeCode,
    mailTo,
    tel,
    relative = true,
    app = getCurrentAppName(),
    ...otherLinkProps
  } = props;

  const path = React.useMemo(() => {
    if (!to && href) {
      to = href;
    }

    if (!to) {
      to = "";
    }

    if (mailTo) {
      to = "mailTo:" + mailTo;
    }

    if (tel) {
      to = "tel:" + tel;
    }

    if (Is.url(to)) {
      relative = false;
    }

    // if not relative, then use the normal anchor tag
    if (!relative) {
      if (!to.startsWith("http") && !to.startsWith("mailto")) {
        to = "http://" + to;
      }
      return to;
    }

    if (!localeCode && hasInitialLocaleCode()) {
      localeCode = getCurrentLocaleCode();
    }

    let path = concatRoute(getAppPath(app), to);

    if (localeCode) {
      path = concatRoute(localeCode, path);
    }

    return concatRoute(path);
  }, [to, href, mailTo, tel, relative, app, localeCode]);

  // Using target="_blank" without rel="noopener noreferrer" is a security risk:
  // @see https://mathiasbynens.github.io/rel-noopener  react/jsx-no-target-blank
  if (otherLinkProps.target) {
    otherLinkProps.rel = "noopener noreferrer";
  }

  if (newTab) {
    otherLinkProps.target = "_blank";
  }

  otherLinkProps.to = path;

  return <RouterLink {...otherLinkProps} ref={forwardedRef} />;
});

export default Link;
