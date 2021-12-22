import React from "react";
import { concatRoute } from "./../helpers";
import { RedirectProps } from "./../types";
import { getAppPath, getCurrentAppName } from "./../apps-list";
import { hasInitialLocaleCode } from "./../navigator";
import { Redirect as ReactRedirect } from "react-router-dom";
import { getCurrentLocaleCode } from "./../detect-locale-change";

const Redirect = React.forwardRef(function (
  props: RedirectProps | any,
  forwardedRef
) {
  let { to, localeCode, app = getCurrentAppName(), ...otherProps } = props;

  if (!localeCode && hasInitialLocaleCode()) {
    localeCode = getCurrentLocaleCode();
  }

  otherProps.to = React.useMemo(() => {
    let path = concatRoute(getAppPath(app), to);

    if (localeCode) {
      path = concatRoute(localeCode, path);
    }

    return concatRoute(path);
  }, [app, to, localeCode]);

  return <ReactRedirect {...otherProps} ref={forwardedRef} />;
});

export default Redirect;
