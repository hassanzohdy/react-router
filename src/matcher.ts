import { UrlMatcher } from "./types";

let cache: any = {};
// creates a matcher function
export default function matchUrl(
  pattern: any,
  path: string,
  matchMaker: UrlMatcher
) {
  // obtains a cached regexp version of the pattern
  const getRegexp = (pattern: any) =>
    cache[pattern] || (cache[pattern] = matchMaker(pattern));

  const { regexp, keys } = getRegexp(pattern || "");

  const out = regexp.exec(path);

  if (!out) return [false, null];

  // formats an object with matched params
  const params = keys.reduce((params: any, key: any, i: number) => {
    params[key.name] = out[i + 1];
    return params;
  }, {});

  return [true, params];
}

// escapes a regexp string (borrowed from path-to-regexp sources)
// https://github.com/pillarjs/path-to-regexp/blob/v3.0.0/index.js#L202
const escapeRx = (str: string) =>
  str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");

// returns a segment representation in RegExp based on flags
// adapted and simplified version from path-to-regexp sources
const rxForSegment = (repeat: any, optional: any, prefix: any) => {
  let capture = repeat ? "((?:[^\\/]+?)(?:\\/(?:[^\\/]+?))*)" : "([^\\/]+?)";
  if (optional && prefix) capture = "(?:\\/" + capture + ")";
  return capture + (optional ? "?" : "");
};

export const urlPatternMatcher: UrlMatcher = (pattern: any) => {
  const groupRx = /:([A-Za-z0-9_]+)([?+*]?)/g;

  let match = null,
    lastIndex = 0,
    keys = [],
    result = "";

  while ((match = groupRx.exec(pattern)) !== null) {
    const [_, segment, mod] = match;

    // :foo  [1]      (  )
    // :foo? [0 - 1]  ( o)
    // :foo+ [1 - ∞]  (r )
    // :foo* [0 - ∞]  (ro)
    const repeat = mod === "+" || mod === "*";
    const optional = mod === "?" || mod === "*";
    const prefix = optional && pattern[match.index - 1] === "/" ? 1 : 0;

    const prev = pattern.substring(lastIndex, match.index - prefix);

    keys.push({ name: segment });
    lastIndex = groupRx.lastIndex;

    result += escapeRx(prev) + rxForSegment(repeat, optional, prefix);
  }

  result += escapeRx(pattern.substring(lastIndex));
  return { keys, regexp: new RegExp("^" + result + "(?:\\/)?$", "i") };
};
