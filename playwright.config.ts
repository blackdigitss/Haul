import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60000,
  expect: { timeout: 15000 },
  use: {
    baseURL: "https://haulapp.web.app",
    headless: true,
    screenshot: "only-on-failure",
  },
  retries: 1,
});
