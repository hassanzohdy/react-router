/* eslint-disable @typescript-eslint/no-explicit-any */
import concatRoute from "@mongez/concat-route";
import {
  forwardRef,
  type MouseEvent,
  type MutableRefObject,
  type Ref,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { getRouterConfig } from "../../config";
import { isInternalPath, isUrl } from "../../helpers";
import router from "../../router";
import type { LinkOptions, LinkProps } from "../../types";

let linkOptions: Required<LinkOptions> = {
  component: "a",
};

export function setLinkOptions(options: LinkOptions) {
  linkOptions = {
    ...linkOptions,
    ...options,
  };
}

function InnerLink(
  {
    href,
    onClick: baseOnClick,
    email,
    tel,
    newTab,
    prefetch = getRouterConfig("prefetch", true),
    localeCode,
    to,
    app,
    silent = false,
    component: Component = linkOptions.component,
    ...props
  }: LinkProps,
  ref: Ref<HTMLAnchorElement>
) {
  if (!localeCode && router.hasLocaleCode) {
    localeCode = router.getCurrentLocaleCode();
  }

  const linkRef = useRef<HTMLAnchorElement>(null);
  const isPrefetchedRef = useRef(false);

  const path = useMemo(() => {
    if (email) return `mailto:${email}`;

    if (tel) return `tel:${tel}`;

    let path = to || (href as string);

    if (!path) return "";

    if (path.startsWith("#")) return path;

    if (isUrl(path)) return path;

    // Backslashes are treated as "/" by browsers when resolving a URL with a
    // special scheme, so a value like "\evil.com" can slip past `isUrl` and
    // still resolve to a cross-origin address once concatenated into a path
    // that "looks" relative (e.g. "/\evil.com"). Strip them before treating
    // the value as an internal route so it can never smuggle a host.
    path = path.replace(/\\/g, "");

    const appName = app || (router.getCurrentApp()?.name as string);

    const appPath = router.getApp(appName)?.path as string;

    path = concatRoute(appPath, path);

    return localeCode ? concatRoute(localeCode, path) : path;
  }, [href, to, app, localeCode, email, tel]);

  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    baseOnClick?.(e);

    if (
      props.target === "_blank" ||
      e.ctrlKey ||
      e.metaKey ||
      e.shiftKey ||
      e.altKey ||
      // or when clicking on the scroll button
      e.button === 1
    ) {
      return;
    }

    if (isInternalPath(path)) {
      e.preventDefault();

      if (silent === true) {
        router.silentNavigation(path);
      } else {
        // navigate to the path
        router.goTo(path);
      }
    }
  };

  if (newTab && !props.target) {
    props.target = "_blank";
  }

  if (props.target === "_blank") {
    props.rel = "noopener noreferrer";
  }

  useEffect(() => {
    if (!prefetch) return;
    if (!isInternalPath(path)) return;
    if (isPrefetchedRef.current) return;
    const element = linkRef?.current;

    if (!element) return;

    // we ned to prefetch the module on hover
    const callback = () => {
      if (isPrefetchedRef.current) {
        element.removeEventListener("mouseover", callback);
        return;
      }

      isPrefetchedRef.current = true;
      router.prefetch(path);
    };

    element.addEventListener("mouseover", callback);

    return () => {
      element.removeEventListener("mouseover", callback);
    };
  }, [path, prefetch, linkRef]);

  return (
    <Component
      ref={(element: HTMLAnchorElement | null) => {
        // Forward to the parent ref — handle both callback refs and
        // object refs (the forwardRef typing allows either form).
        if (typeof ref === "function") {
          ref(element);
        } else if (ref) {
          (ref as MutableRefObject<HTMLAnchorElement | null>).current =
            element;
        }

        linkRef.current = element;
      }}
      href={
        path && isInternalPath(path)
          ? concatRoute(router.basePath, path)
          : path
      }
      onClick={onClick}
      {...props}
    />
  );
}

// `forwardRef<RefType, PropsType>(...)` — the first generic is the ref
// element type, not the props type. The earlier code passed `LinkProps`
// as the ref type and hid the mismatch with a `React.FC<LinkProps>`
// cast, which made consumers pass a ref of type `LinkProps` (wrong).
// `LinkProps` extends `AnchorHTMLAttributes<HTMLAnchorElement>`, so the
// underlying element is an anchor by default.
const Link = forwardRef<HTMLAnchorElement, LinkProps>(InnerLink);

export default Link;
