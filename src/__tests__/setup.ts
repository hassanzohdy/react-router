// Vitest setup for the react-router package.
//
// The router's `render()` path looks up `#root`, hydrates if it has
// children, otherwise mounts via `createRoot`. Tests that don't call
// `router.scan()` directly don't need this, but having `#root` present
// keeps the renderer path safe to hit.
export {};
