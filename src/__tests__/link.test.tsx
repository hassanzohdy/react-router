import { fireEvent, render } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Link from "../components/Link";
import { setLinkOptions } from "../components/Link/Link";
import router from "../router";

function resetRouter() {
  const r = router as any;
  r.routesList = [];
  r.appsList = [];
  r.currentApp = undefined;
  r.params = {};
  r.activeRoute = null;
  r.currentRoute = "/";
  r.previousRoute = "/";
  r.hasLocaleCode = false;
  r.initialLocaleCode = "";
  r.currentLocaleCode = r.defaultLocaleCode;
  r.localeCodes = ["en"];
  r.basePath = "/";
  r._forceRefresh = false;
}

beforeEach(() => {
  resetRouter();
  // Reset link options that other tests may have changed.
  setLinkOptions({ component: "a" });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("<Link> — rendering", () => {
  it("renders an <a> with the given path as href", () => {
    const { container } = render(<Link to="/about">About</Link>);
    const a = container.querySelector("a")!;
    expect(a).toBeDefined();
    expect(a.getAttribute("href")).toBe("/about");
    expect(a.textContent).toBe("About");
  });

  it("renders the configured custom component", () => {
    setLinkOptions({ component: "button" });
    const { container } = render(<Link to="/x">x</Link>);
    expect(container.querySelector("button")).not.toBeNull();
    expect(container.querySelector("a")).toBeNull();
  });

  it("prepends the basePath", () => {
    router.setBasePath("/app");
    const { container } = render(<Link to="/about">About</Link>);
    expect(container.querySelector("a")!.getAttribute("href")).toBe(
      "/app/about",
    );
  });

  it("prepends the active locale code when one is set", () => {
    router.setLocaleCodes(["en", "fr"]);
    (router as any).hasLocaleCode = true;
    (router as any).currentLocaleCode = "fr";
    const { container } = render(<Link to="/about">x</Link>);
    expect(container.querySelector("a")!.getAttribute("href")).toBe(
      "/fr/about",
    );
  });

  it("uses an explicit localeCode prop over the active one", () => {
    router.setLocaleCodes(["en", "fr"]);
    (router as any).hasLocaleCode = true;
    (router as any).currentLocaleCode = "en";
    const { container } = render(
      <Link to="/about" localeCode="fr">
        x
      </Link>,
    );
    expect(container.querySelector("a")!.getAttribute("href")).toBe(
      "/fr/about",
    );
  });

  it("prepends the specified app's path", () => {
    router.setAppsList([
      { name: "admin", path: "/admin", modules: [], isLoaded: true },
    ]);
    const { container } = render(
      <Link to="/users" app="admin">
        x
      </Link>,
    );
    expect(container.querySelector("a")!.getAttribute("href")).toBe(
      "/admin/users",
    );
  });

  it("renders mailto: link from the email prop", () => {
    const { container } = render(<Link email="hi@example.com">mail</Link>);
    expect(container.querySelector("a")!.getAttribute("href")).toBe(
      "mailto:hi@example.com",
    );
  });

  it("renders tel: link from the tel prop", () => {
    const { container } = render(<Link tel="+15551234">call</Link>);
    expect(container.querySelector("a")!.getAttribute("href")).toBe(
      "tel:+15551234",
    );
  });

  it("renders an external URL verbatim", () => {
    const { container } = render(
      <Link href="https://example.com">external</Link>,
    );
    expect(container.querySelector("a")!.getAttribute("href")).toBe(
      "https://example.com",
    );
  });

  it("strips backslashes from an internal path (open-redirect guard)", () => {
    const { container } = render(<Link to="\\evil.com">x</Link>);
    const href = container.querySelector("a")!.getAttribute("href")!;
    expect(href).not.toContain("\\");
    expect(href.startsWith("/")).toBe(true);
    expect(href).not.toMatch(/^\/\//);
  });

  it("strips backslashes from a /\\host-style path (open-redirect guard)", () => {
    const { container } = render(<Link to="/\evil.com">x</Link>);
    const href = container.querySelector("a")!.getAttribute("href")!;
    expect(href).not.toContain("\\");
    expect(href).not.toMatch(/^\/\//);
  });

  it("still navigates to legitimate internal routes", () => {
    const { container } = render(<Link to="/dashboard/settings">x</Link>);
    expect(container.querySelector("a")!.getAttribute("href")).toBe(
      "/dashboard/settings",
    );
  });

  it("renders a #hash link verbatim", () => {
    const { container } = render(<Link to="#section">hash</Link>);
    expect(container.querySelector("a")!.getAttribute("href")).toBe(
      "#section",
    );
  });

  it("sets target=_blank and rel=noopener noreferrer when newTab is true", () => {
    const { container } = render(
      <Link to="/about" newTab>
        new tab
      </Link>,
    );
    const a = container.querySelector("a")!;
    expect(a.getAttribute("target")).toBe("_blank");
    expect(a.getAttribute("rel")).toBe("noopener noreferrer");
  });
});

describe("<Link> — forwardRef", () => {
  // The previous `forwardRef<LinkProps>(InnerLink) as React.FC<LinkProps>`
  // typed the FIRST generic as the ref type (it's actually the props
  // type's slot). Consumers couldn't get a typed ref through; the cast
  // masked the mistake. After the fix, both object refs and callback
  // refs receive the underlying HTMLAnchorElement.
  it("forwards an object ref to the underlying anchor", () => {
    const ref = React.createRef<HTMLAnchorElement>();
    render(
      <Link to="/about" ref={ref}>
        about
      </Link>,
    );
    expect(ref.current).toBeInstanceOf(HTMLAnchorElement);
  });

  it("forwards a callback ref to the underlying anchor", () => {
    const observed: (HTMLAnchorElement | null)[] = [];
    render(
      <Link to="/about" ref={el => observed.push(el)}>
        about
      </Link>,
    );
    // The callback gets fired with the element on mount.
    expect(observed.some(el => el instanceof HTMLAnchorElement)).toBe(true);
  });
});

describe("<Link> — click interception", () => {
  it("intercepts left-click on internal paths and calls router.goTo", () => {
    const spy = vi.spyOn(router, "goTo").mockImplementation(() => {});
    const { container } = render(<Link to="/about">x</Link>);
    const a = container.querySelector("a")!;
    fireEvent.click(a);
    expect(spy).toHaveBeenCalledWith("/about");
    spy.mockRestore();
  });

  it("does NOT intercept when ctrlKey is held", () => {
    const spy = vi.spyOn(router, "goTo");
    const { container } = render(<Link to="/about">x</Link>);
    fireEvent.click(container.querySelector("a")!, { ctrlKey: true });
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("does NOT intercept when metaKey is held", () => {
    const spy = vi.spyOn(router, "goTo");
    const { container } = render(<Link to="/about">x</Link>);
    fireEvent.click(container.querySelector("a")!, { metaKey: true });
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("does NOT intercept middle-click (button === 1)", () => {
    const spy = vi.spyOn(router, "goTo");
    const { container } = render(<Link to="/about">x</Link>);
    fireEvent.click(container.querySelector("a")!, { button: 1 });
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("does NOT intercept when target=_blank", () => {
    const spy = vi.spyOn(router, "goTo");
    const { container } = render(
      <Link to="/about" target="_blank">
        x
      </Link>,
    );
    fireEvent.click(container.querySelector("a")!);
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("does NOT intercept external URLs", () => {
    const spy = vi.spyOn(router, "goTo");
    const { container } = render(<Link href="https://example.com">x</Link>);
    fireEvent.click(container.querySelector("a")!);
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("intercepts a backslash-smuggled target as a plain internal route, never as a cross-origin navigation", () => {
    const spy = vi.spyOn(router, "goTo").mockImplementation(() => {});
    const { container } = render(<Link to="\\evil.com">x</Link>);
    fireEvent.click(container.querySelector("a")!);
    expect(spy).toHaveBeenCalledOnce();
    const calledWith = spy.mock.calls[0][0] as string;
    expect(calledWith).not.toContain("\\");
    expect(calledWith).not.toMatch(/^\/\//);
    spy.mockRestore();
  });

  it("runs the user's onClick handler before intercepting", () => {
    const userOnClick = vi.fn();
    const goToSpy = vi.spyOn(router, "goTo").mockImplementation(() => {});
    const { container } = render(
      <Link to="/about" onClick={userOnClick}>
        x
      </Link>,
    );
    fireEvent.click(container.querySelector("a")!);
    expect(userOnClick).toHaveBeenCalledOnce();
    expect(goToSpy).toHaveBeenCalledWith("/about");
    goToSpy.mockRestore();
  });

  it("calls router.silentNavigation when silent is true", () => {
    const silentSpy = vi
      .spyOn(router, "silentNavigation")
      .mockImplementation(() => {});
    const goToSpy = vi.spyOn(router, "goTo");
    const { container } = render(
      <Link to="/about" silent>
        x
      </Link>,
    );
    fireEvent.click(container.querySelector("a")!);
    expect(silentSpy).toHaveBeenCalledWith("/about");
    expect(goToSpy).not.toHaveBeenCalled();
    silentSpy.mockRestore();
    goToSpy.mockRestore();
  });
});

describe("<Link> — prefetch on hover", () => {
  it("calls router.prefetch on mouseover for internal paths", () => {
    const spy = vi.spyOn(router, "prefetch").mockImplementation(() => {});
    const { container } = render(
      <Link to="/about" prefetch>
        x
      </Link>,
    );
    fireEvent.mouseOver(container.querySelector("a")!);
    expect(spy).toHaveBeenCalledWith("/about");
    spy.mockRestore();
  });

  it("dedupes — prefetch fires only once per link", () => {
    const spy = vi.spyOn(router, "prefetch").mockImplementation(() => {});
    const { container } = render(
      <Link to="/about" prefetch>
        x
      </Link>,
    );
    const a = container.querySelector("a")!;
    fireEvent.mouseOver(a);
    fireEvent.mouseOver(a);
    fireEvent.mouseOver(a);
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });

  it("does NOT prefetch when prefetch is false", () => {
    const spy = vi.spyOn(router, "prefetch").mockImplementation(() => {});
    const { container } = render(
      <Link to="/about" prefetch={false}>
        x
      </Link>,
    );
    fireEvent.mouseOver(container.querySelector("a")!);
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("does NOT prefetch external URLs", () => {
    const spy = vi.spyOn(router, "prefetch").mockImplementation(() => {});
    const { container } = render(
      <Link href="https://example.com" prefetch>
        x
      </Link>,
    );
    fireEvent.mouseOver(container.querySelector("a")!);
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});
