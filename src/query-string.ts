import { toObjectParser, toStringParser } from "./query-string-parsers";
import { ObjectType, QueryStringOptions } from "./types";
import { refresh } from "./utilities";

let queryStringOptions: Required<QueryStringOptions> = {
  objectParser: toObjectParser,
  stringParser: toStringParser,
};

export function setQueryStringOptions(options: QueryStringOptions) {
  queryStringOptions = {
    ...queryStringOptions,
    ...options,
  };
}

const queryString = {
  /**
   * Convert query string to object
   */
  all() {
    const query = window.location.search.substring(1);

    if (!query) return {};

    return queryStringOptions.objectParser(query);
  },
  /**
   * Parse the given query string
   */
  parse(searchParams: string) {
    if (searchParams.startsWith("?")) {
      searchParams = searchParams.substring(1);
    }

    if (!searchParams) return {};
    return queryStringOptions.objectParser(searchParams);
  },
  /**
   * Get key from query string
   */
  get(key: string, defaultValue: any = null) {
    const all = queryString.all();
    return all[key] || defaultValue;
  },
  /**
   * Replace query string in the url with the given object
   */
  update(params: Record<string, any> | string, reRender = false) {
    const queryStringText = queryString.toQueryString(params);

    const url = `${window.location.pathname}${
      queryStringText ? "?" + queryStringText : ""
    }`;

    window.history.replaceState({}, "", url);

    if (reRender) {
      refresh();
    }
  },
  /**
   * Get query string as string
   */
  toString() {
    return window.location.search.substring(1);
  },
  /**
   * Convert the given object|string to query string
   */
  toQueryString(params: ObjectType | string) {
    if (typeof params === "string") return params;

    return queryStringOptions.stringParser(params);
  },
};

export default queryString;
