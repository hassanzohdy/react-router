/**
 * Internal history abstraction.
 *
 * The router used to call `window.history` / `window.addEventListener`
 * inline, which made two things impossible: importing the router in a
 * non-browser context, and driving navigation from anything other than
 * a real browser.
 *
 * This module puts a seam behind those call sites. The default
 * implementation is *exactly* the previous inline behaviour — the same
 * methods, called with the same arguments, in the same order — so the
 * browser path is unchanged. `window` is only ever touched inside a
 * function body, never at module scope, so importing this module (and
 * therefore the router) is safe on a server.
 *
 * NOTE: this module is not re-exported from `src/index.ts` — the root
 * entry's surface is unchanged. The seam is announced instead through the
 * dedicated `@mongez/react-router/navigation` subpath (`src/navigation.ts`),
 * which re-exports exactly the four values below plus `RouterHistory`.
 * That subpath exists precisely because this file imports nothing: a host
 * can swap the history implementation without pulling the router, the
 * matcher or the renderer into its bundle.
 */
export type RouterHistory = {
  /**
   * Push a new entry onto the session history stack.
   */
  pushState(state: unknown, title: string, url: string): void;
  /**
   * Replace the current session history entry.
   */
  replaceState(state: unknown, title: string, url: string): void;
  /**
   * Subscribe to "the user moved through session history" (back/forward).
   *
   * Returns an unsubscribe function. The router currently keeps the
   * listener for the lifetime of the page and discards the returned
   * function, matching the previous `window.addEventListener` call
   * which was likewise never removed.
   */
  onPopState(callback: () => void): () => void;
};

/**
 * The default implementation: raw `window.history`, identical to what
 * the router called inline before this module existed.
 */
export const browserHistory: RouterHistory = {
  pushState(state, title, url) {
    window.history.pushState(state, title, url);
  },
  replaceState(state, title, url) {
    window.history.replaceState(state, title, url);
  },
  onPopState(callback) {
    window.addEventListener("popstate", callback);

    return () => {
      window.removeEventListener("popstate", callback);
    };
  },
};

let currentHistory: RouterHistory = browserHistory;

/**
 * Get the history implementation the router should use.
 */
export function getHistory(): RouterHistory {
  return currentHistory;
}

/**
 * Swap the history implementation.
 */
export function setHistory(history: RouterHistory) {
  currentHistory = history;
}

/**
 * Restore the default (browser) history implementation.
 */
export function resetHistory() {
  currentHistory = browserHistory;
}
