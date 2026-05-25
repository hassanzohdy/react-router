import { afterEach, beforeEach, describe, expect, it } from "vitest";
import queryString, { setQueryStringOptions } from "../query-string";
import {
  toObjectParser,
  toStringParser,
} from "../query-string-parsers";

const originalLocation = window.location.href;

beforeEach(() => {
  window.history.replaceState({}, "", "/");
});

afterEach(() => {
  // Restore the default parsers in case a test swapped them.
  setQueryStringOptions({
    objectParser: toObjectParser,
    stringParser: toStringParser,
  });
  window.history.replaceState({}, "", originalLocation);
});

describe("queryString.all()", () => {
  it("returns an empty object when the URL has no query string", () => {
    window.history.replaceState({}, "", "/page");
    expect(queryString.all()).toEqual({});
  });

  it("parses numeric values as numbers", () => {
    window.history.replaceState({}, "", "/page?page=2&limit=10");
    expect(queryString.all()).toEqual({ page: 2, limit: 10 });
  });

  it("parses string values as strings (URL-decoded)", () => {
    window.history.replaceState({}, "", "/page?name=John%20Doe");
    expect(queryString.all()).toEqual({ name: "John Doe" });
  });

  it("parses array syntax (key[]=v) into arrays", () => {
    window.history.replaceState({}, "", "/page?tags[]=a&tags[]=b");
    expect(queryString.all()).toEqual({ tags: ["a", "b"] });
  });

  it("parses nested-object syntax (key[sub]=v)", () => {
    window.history.replaceState({}, "", "/page?filter[name]=John&filter[age]=30");
    expect(queryString.all()).toEqual({ filter: { name: "John", age: 30 } });
  });
});

describe("queryString.parse(searchParams)", () => {
  it("accepts a leading '?'", () => {
    expect(queryString.parse("?a=1&b=2")).toEqual({ a: 1, b: 2 });
  });

  it("accepts no leading '?'", () => {
    expect(queryString.parse("a=1&b=2")).toEqual({ a: 1, b: 2 });
  });

  it("returns {} for empty input", () => {
    expect(queryString.parse("")).toEqual({});
    expect(queryString.parse("?")).toEqual({});
  });
});

describe("queryString.get(key, defaultValue?)", () => {
  it("returns the parsed value", () => {
    window.history.replaceState({}, "", "/page?page=3");
    expect(queryString.get("page")).toBe(3);
  });

  it("returns the default value when the key is missing", () => {
    window.history.replaceState({}, "", "/page");
    expect(queryString.get("page", 1)).toBe(1);
  });

  it("returns null by default when the key is missing", () => {
    window.history.replaceState({}, "", "/page");
    expect(queryString.get("page")).toBeNull();
  });
});

describe("queryString.toString()", () => {
  it("returns the current search string without the leading '?'", () => {
    window.history.replaceState({}, "", "/page?a=1&b=2");
    expect(queryString.toString()).toBe("a=1&b=2");
  });

  it("returns an empty string when there's no query string", () => {
    window.history.replaceState({}, "", "/page");
    expect(queryString.toString()).toBe("");
  });
});

describe("queryString.toQueryString(obj | string)", () => {
  it("returns the input verbatim when given a string", () => {
    expect(queryString.toQueryString("a=1&b=2")).toBe("a=1&b=2");
  });

  it("serializes primitives as key=value", () => {
    expect(queryString.toQueryString({ a: 1, b: "x" })).toBe("a=1&b=x");
  });

  it("serializes arrays with key[]= notation", () => {
    expect(queryString.toQueryString({ tags: ["a", "b"] })).toBe(
      "tags[]=a&tags[]=b",
    );
  });

  it("serializes nested objects with key[sub] notation", () => {
    expect(queryString.toQueryString({ filter: { name: "John" } })).toBe(
      "filter[name]=John",
    );
  });
});

describe("queryString.update(...)", () => {
  it("replaces the current query string via history.replaceState", () => {
    window.history.replaceState({}, "", "/page?old=true");
    queryString.update({ page: 2, sort: "date" });
    expect(window.location.search).toBe("?page=2&sort=date");
  });

  it("removes the query string entirely when called with an empty object", () => {
    window.history.replaceState({}, "", "/page?old=true");
    queryString.update({});
    expect(window.location.search).toBe("");
  });

  it("accepts a raw string", () => {
    queryString.update("a=1&b=2");
    expect(window.location.search).toBe("?a=1&b=2");
  });
});

describe("setQueryStringOptions(...)", () => {
  it("swaps the active parsers", () => {
    setQueryStringOptions({
      objectParser: () => ({ custom: true }),
      stringParser: () => "custom=1",
    });
    window.history.replaceState({}, "", "/page?ignored=true");
    expect(queryString.all()).toEqual({ custom: true });
    expect(queryString.toQueryString({ ignored: true })).toBe("custom=1");
  });
});
