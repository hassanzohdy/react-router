import { routerEvents } from "./events";
import history from "./router-history";
import { getLocaleCodes } from "./helpers";

let currentLocale: string = "";

/**
 * Set current locale code at the beginning of the application
 */
export default function detectLocaleCodeChange() {
  // first remove the first slash from the url
  // then split the pathname by the /
  // then get the first segment of the created array
  let [localeCode] = history.location.pathname.replace(/^\//, "").split("/");

  if (getLocaleCodes().includes(localeCode)) {
    routerEvents.trigger("localeCodeChange", localeCode, currentLocale);
    currentLocale = localeCode;
  }

  routerEvents.onLocaleCodeChange((newLocaleCode: string) => {
    currentLocale = newLocaleCode;
  });
}

export function getCurrentLocaleCode(): string {
  return currentLocale;
}
