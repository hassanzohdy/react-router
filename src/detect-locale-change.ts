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

  let newLocaleCode;

  if (getLocaleCodes().includes(localeCode)) {
    newLocaleCode = localeCode;
  } else if (getRouterConfig("defaultLocaleCode")) {
    newLocaleCode = getRouterConfig("defaultLocaleCode");
  }

  if (newLocaleCode !== currentLocale) {
    routerEvents.trigger("localeCodeChange", localeCode, currentLocale);
    currentLocale = newLocaleCode;
  }

  routerEvents.onLocaleCodeChange((newLocaleCode: string) => {
    currentLocale = newLocaleCode;
  });
}

export function getCurrentLocaleCode(): string {
  return currentLocale;
}
