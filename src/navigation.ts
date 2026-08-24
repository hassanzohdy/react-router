/**
 * Public subpath entry: `@mongez/react-router/navigation`.
 *
 * This is the **client navigation seam**, and nothing else. It exists for
 * hosts that own the matcher and the mount themselves — Warlock's server
 * router decides which page renders, Warlock mounts `#root` — and only need
 * this package's history plumbing so that `<Link>` clicks and `router.goTo`
 * are driven through the host's navigation instead of touching
 * `window.history` behind its back.
 *
 * ## What this entry deliberately does NOT export
 *
 * Everything that reaches `src/router.tsx`. The router singleton statically
 * imports `./matcher` and `./renderer`, and `./renderer` mounts `#root`
 * itself — exactly one thing may ever mount `#root`, and in a Warlock app
 * that is Warlock. So none of the following are re-exported here, even
 * though they are "navigation" in the colloquial sense:
 *
 *  - `Link`, `navigateTo`, `navigateBack`, `silentNavigation`, `refresh`,
 *    `currentRoute`, `previousRoute`, `changeLocaleCode` — all of them
 *    import the router singleton, which drags the matcher and the renderer
 *    into the importer's bundle graph.
 *  - `router` / `Router` themselves, for the same reason.
 *  - `NAVIGATING` — lives in `helpers.tsx` and is a JSX element, so it pulls
 *    React in for a sentinel value.
 *
 * They all remain available from the root entry (`@mongez/react-router`),
 * which is unchanged. This entry is narrow on purpose: every symbol below is
 * public API we have to keep working.
 *
 * ## The seam
 *
 * `setHistory` was previously marked internal and unexported. It is the
 * announced entry point now: a host installs its own {@link RouterHistory}
 * before any navigation happens, and `resetHistory` puts the default
 * browser implementation back (useful in tests and on teardown).
 *
 * ```ts
 * import { setHistory } from "@mongez/react-router/navigation";
 *
 * setHistory({
 *   pushState: (state, title, url) => hostRouter.push(url),
 *   replaceState: (state, title, url) => hostRouter.replace(url),
 *   onPopState: callback => hostRouter.subscribe(callback),
 * });
 * ```
 */
export {
  browserHistory,
  getHistory,
  resetHistory,
  setHistory,
  type RouterHistory,
} from "./history";
