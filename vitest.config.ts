import { defineConfig } from "vitest/config";

export default defineConfig({
  // Pin the root so the app's Vite `root: "app"` never leaks into test resolution.
  root: ".",
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
