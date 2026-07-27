import { defineConfig } from "vitest/config";
import path from "path";

/**
 * Unit tests for the money layer.
 *
 * Deliberately narrow: `tests/unit/**` holds pure-function tests (the fee engine, the
 * formatter) that need no database and no dev server. The browser specs stay with
 * Playwright, which is scoped to `*.e2e.spec.ts`.
 */
export default defineConfig({
  test: {
    include: ["tests/unit/**/*.spec.ts"],
    environment: "node",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
