import { defineConfig, devices } from "@playwright/test";

const runAuthE2E = process.env.RUN_AUTH_E2E === "true";

export default defineConfig({
  testDir: "./e2e",
  testIgnore: runAuthE2E ? [] : ["**/authenticated.spec.ts"],
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});