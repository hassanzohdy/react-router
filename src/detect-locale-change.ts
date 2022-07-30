import { routerEvents } from "./events";
import { getHistory } from "./router-history";
import { getLocaleCodes } from "./helpers";
import { getRouterConfig } from "./configurations";

let currentLocale: string = "";

/**
 * Set current locale code at the beginning of the application
 */
export default function detectLocaleCodeChange() {
  // first remove the first slash from the url
  // then split the pathname by the /
  // then get the first segment of the created array
  let [localeCode] = getHistory()
    .location.pathname.replace(/^\//, "")
    .split("/");

  if (getLocaleCodes().includes(localeCode)) {
    currentLocale = localeCode;
  } else if (getRouterConfig("defaultLocaleCode")) {
    currentLocale = getRouterConfig("defaultLocaleCode");
  }

  routerEvents.onLocaleCodeChange((newLocaleCode: string) => {
    currentLocale = newLocaleCode;
  });
}

export function getCurrentLocaleCode(): string {
  return currentLocale;
}
