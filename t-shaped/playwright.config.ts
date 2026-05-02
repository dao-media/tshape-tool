import { defineConfig, devices } from "@playwright/test";

/** One-time (or after Playwright upgrade): `npm run test:e2e:install` */
const PORT = 4173;
const HOST = "127.0.0.1";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  timeout: 60_000,
  use: {
    baseURL: `http://${HOST}:${PORT}`,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: `npm run build && vite preview --host ${HOST} --port ${String(PORT)} --strictPort`,
    url: `http://${HOST}:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
