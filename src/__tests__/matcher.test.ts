import { describe, expect, it } from "vitest";
import matchUrl, { urlPatternMatcher } from "../matcher";

describe("urlPatternMatcher", () => {
  it("matches a literal path", () => {
    const [ok, params] = matchUrl("/about", "/about", urlPatternMatcher);
    expect(ok).toBe(true);
    expect(params).toEqual({});
  });

  it("returns [false, null] when the path doesn't match the pattern", () => {
    const [ok, params] = matchUrl(
      "/users/:id",
      "/products/42",
      urlPatternMatcher,
    );
    expect(ok).toBe(false);
    expect(params).toBeNull();
  });

  it("extracts a single required segment", () => {
    const [ok, params] = matchUrl(
      "/users/:id",
      "/users/42",
      urlPatternMatcher,
    );
    expect(ok).toBe(true);
    expect(params).toEqual({ id: "42" });
  });

  it("extracts multiple required segments", () => {
    const [ok, params] = matchUrl(
      "/orgs/:orgId/users/:userId",
      "/orgs/acme/users/42",
      urlPatternMatcher,
    );
    expect(ok).toBe(true);
    expect(params).toEqual({ orgId: "acme", userId: "42" });
  });

  it("supports optional segments — present", () => {
    const [ok, params] = matchUrl(
      "/users/:id?",
      "/users/42",
      urlPatternMatcher,
    );
    expect(ok).toBe(true);
    expect(params).toEqual({ id: "42" });
  });

  it("supports optional segments — absent", () => {
    const [ok, params] = matchUrl(
      "/users/:id?",
      "/users",
      urlPatternMatcher,
    );
    expect(ok).toBe(true);
    expect((params as Record<string, string>).id).toBeUndefined();
  });

  it("supports one-or-more repeating segments", () => {
    const [ok, params] = matchUrl(
      "/files/:path+",
      "/files/a/b/c",
      urlPatternMatcher,
    );
    expect(ok).toBe(true);
    expect(params).toEqual({ path: "a/b/c" });
  });

  it("supports zero-or-more repeating segments — present", () => {
    const [ok, params] = matchUrl(
      "/wildcard/:rest*",
      "/wildcard/a/b/c",
      urlPatternMatcher,
    );
    expect(ok).toBe(true);
    expect(params).toEqual({ rest: "a/b/c" });
  });

  it("supports zero-or-more repeating segments — absent", () => {
    const [ok, params] = matchUrl(
      "/wildcard/:rest*",
      "/wildcard",
      urlPatternMatcher,
    );
    expect(ok).toBe(true);
    expect((params as Record<string, string>).rest).toBeUndefined();
  });

  it("matches case-insensitively", () => {
    const [ok, params] = matchUrl(
      "/About",
      "/about",
      urlPatternMatcher,
    );
    expect(ok).toBe(true);
    expect(params).toEqual({});
  });

  it("allows an optional trailing slash", () => {
    const [ok] = matchUrl("/about", "/about/", urlPatternMatcher);
    expect(ok).toBe(true);
  });

  it("rejects extra segments", () => {
    const [ok] = matchUrl("/about", "/about/team", urlPatternMatcher);
    expect(ok).toBe(false);
  });

  it("returns shape { regexp, keys } from the pattern compiler", () => {
    const compiled = urlPatternMatcher("/users/:id");
    expect(compiled.regexp).toBeInstanceOf(RegExp);
    expect(compiled.keys).toEqual([{ name: "id" }]);
  });
});
