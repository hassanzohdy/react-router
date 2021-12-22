import { baseName } from "./helpers";
import { QueryString } from "./types";
import queryStringParser from "query-string";
import { createBrowserHistory } from "history";
import { Obj, ltrim, rtrim } from "@mongez/reinforcements";

const history: any = createBrowserHistory({
  basename: baseName(),
});

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
