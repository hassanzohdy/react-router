import fs from "node:fs";
import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// React ships `act` only in its development build; `cjs/react.production.js`
// omits the export entirely. `@testing-library/react` resolves act as
// `React.act ?? ReactDOMTestUtils.act`, and under React 19 that fallback is
// itself just `return React.act(callback)` — so if NODE_ENV=production leaks
// in from the surrounding shell, every render()/fireEvent() in the suite dies
// with "React.act is not a function". That looks like a library-compatibility
// failure but is purely an environment one.
//
// Vitest already defaults NODE_ENV to "test", but only when it is unset; an
// inherited "production" is respected. Pin it so the suite never depends on
// what the ambient shell happens to export.
if (process.env.NODE_ENV === "production") process.env.NODE_ENV = "test";

/**
 * Resolve sibling `@mongez/*` packages from the local monorepo when their
 * source folders exist, otherwise let Vite fall back to `node_modules`.
 *
 * In day-to-day development every package lives next to its siblings, so
 * the alias short-circuits the published-package resolution and gives us
 * live cross-package edits. In a CI environment that only checked out
 * THIS repo, the sibling directories are absent and the alias is omitted,
 * so the test run resolves siblings from npm exactly like a consumer.
 */
function localSiblingAliases(): Record<string, string> {
  const candidates: Record<string, string> = {
    "@mongez/concat-route": "../concat-route/src",
    "@mongez/events": "../events/src",
  };
  const aliases: Record<string, string> = {};
  for (const [pkg, rel] of Object.entries(candidates)) {
    const abs = path.resolve(__dirname, rel);
    if (fs.existsSync(abs)) aliases[pkg] = abs;
  }
  return aliases;
}

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "happy-dom",
    globals: false,
    // Belt-and-braces for the NODE_ENV pin above: the guard fixes the config
    // loader's process (which workers inherit), this fixes the workers even if
    // the pool is spawned with a fresh environment.
    env: { NODE_ENV: "test" },
    include: ["src/**/*.test.{ts,tsx}"],
    setupFiles: ["./src/__tests__/setup.ts"],
    // Suppress happy-dom's "Failed to fetch …" warnings. They fire when a
    // simulated <a> click isn't prevent-defaulted (e.g. our Ctrl+Click
    // tests intentionally let the browser handle it); happy-dom then tries
    // to navigate by fetching the URL. We're testing click-interception,
    // not browser navigation — disabling the main-frame navigation makes
    // the test output clean.
    environmentOptions: {
      happyDOM: {
        settings: {
          navigation: {
            disableMainFrameNavigation: true,
            disableChildFrameNavigation: true,
            disableChildPageNavigation: true,
            disableFallbackToSetURL: false,
          },
        },
      },
    },
  },
  resolve: {
    alias: localSiblingAliases(),
  },
});
