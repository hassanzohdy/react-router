import fs from "node:fs";
import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

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
