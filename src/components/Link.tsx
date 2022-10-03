import Is from "@mongez/supportive-is";
import React from "react";
import { Link as RouterLink } from "react-router-dom";
import { getAppPath, getCurrentAppName } from "./../apps-list";
import { getCurrentLocaleCode } from "./../detect-locale-change";
import { concatRoute } from "./../helpers";
import { hasInitialLocaleCode } from "./../navigator";
import { LinkProps } from "./../types";

const Link: React.FC<LinkProps> = React.forwardRef(function (
  props: LinkProps,
  forwardedRef
) {
  let {
    to,
    href,
    newTab = false,
    localeCode,
    mailTo,
    tel,
    relative: incomingRelative = true,
    app = getCurrentAppName(),
    ...otherLinkProps
  } = props;

  const [path, relative] = React.useMemo(() => {
    let currentLocaleCode = localeCode;

    if (mailTo) {
      return ["mailto:" + mailTo, false];
    }

    if (tel) {
      return ["tel:" + tel, false];
    }

    let anchorHref = href || to || "";

    if (Is.url(anchorHref)) {
      return [anchorHref, false];
    }

    if (!currentLocaleCode && hasInitialLocaleCode()) {
      currentLocaleCode = getCurrentLocaleCode();
    }

    let path = concatRoute(getAppPath(app), anchorHref);

    if (currentLocaleCode) {
      path = concatRoute(currentLocaleCode, path);
    }

    return [concatRoute(path), incomingRelative];
  }, [to, href, mailTo, tel, incomingRelative, app, localeCode]);

  if (newTab) {
    otherLinkProps.target = "_blank";
  }

  // Using target="_blank" without rel="noopener noreferrer" is a security risk:
  // @see https://mathiasbynens.github.io/rel-noopener  react/jsx-no-target-blank
  if (otherLinkProps.target === "_blank") {
    otherLinkProps.rel = "noopener noreferrer";
  }

  if (!relative || mailTo || tel) {
    // eslint-disable-next-line jsx-a11y/anchor-has-content
    return <a {...otherLinkProps} href={path} ref={forwardedRef as any} />;
  }

  otherLinkProps.to = path;

  return <RouterLink to={path} ref={forwardedRef as any} {...otherLinkProps} />;
});

export const MailLink = ({ to, ...props }: LinkProps) => (
  <Link {...props} mailTo={to} />
);

export const TelLink = ({ to, ...props }: LinkProps) => (
  <Link {...props} tel={to} />
);

export const ExternalLink = (props: LinkProps) => (
  <Link newTa {...props} relative={false} />
);

export default Link;
