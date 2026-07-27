import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  // Only the browser specs. Vitest owns `tests/unit/**`, which must not be handed to
  // Playwright — it would try to boot a dev server for pure-function tests.
  testMatch: /.*\.e2e\.spec\.ts$/,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  reporter: [["list"]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
    video: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "npm run dev",
    port: 3000,
    reuseExistingServer: true,
    timeout: 120_000,
    env: {
      NODE_ENV: "test",
      PLAYWRIGHT: "1",
      NEXTAUTH_URL: "http://localhost:3000",
      NEXTAUTH_SECRET: "test_secret_please_change",
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
