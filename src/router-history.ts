import { baseName } from "./helpers";
import { QueryString } from "./types";
import queryStringParser from "query-string";
import { createBrowserHistory, BrowserHistory } from "history";
import { Obj, ltrim, rtrim } from "@mongez/reinforcements";

let history: BrowserHistory;

/**
 * Create browser history
 */
export function createHistory() {
  history = createBrowserHistory({
    basename: baseName(),
  });
}

/**
 * Get history instance
 */
export function getHistory(): BrowserHistory {
  if (!history) createHistory();

  return history;
}

/**
 * Get has value if provided
 * If the withHash is set to true, then the # will be returned,
 * otherwise it will be trimmed off
 *
 * @param {boolean} withHash
 */
export function hash(withHash = false) {
  let hash = history.location.hash;

  return withHash ? hash : ltrim(hash, "#");
}

/**
 * Parse the query string then get an object the provides an API to get value(s) from it
 *
 * @returns {object}
 */
export function queryString(): QueryString {
  const queryString = queryStringParser.parse(history.location.search, {
    parseNumbers: true,
    parseBooleans: true,
    arrayFormat: "bracket",
  });

  for (let key in queryString) {
    if (key.endsWith("[]")) {
      const oldKey = key;
      key = rtrim(key, "[]");
      queryString[key] = queryString[oldKey];
    }
  }

  return {
    get(key: string, defaultValue: any = null): any {
      if (key.endsWith("[]")) {
        key = rtrim(key, "[]");
      }

      return Obj.get(queryString, key, defaultValue);
    },
    all(): object {
      return queryString;
    },
    toString(): string {
      return history.location.search;
    },
  };
}

export default history;
