import { defineConfig, devices } from "@playwright/test";

const frontendPort = 4173;
const backendPort = 4174;
const backendBaseUrl = `http://127.0.0.1:${backendPort}`;

export default defineConfig({
  testDir: "./tests/browser",
  testIgnore: ["**/real-*.spec.ts"],
  timeout: 30_000,
  expect: {
    timeout: 5_000
  },
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: `http://127.0.0.1:${frontendPort}`,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure"
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"]
      }
    }
  ],
  webServer: [
    {
      command: `PLAYWRIGHT_MOCK_PORT=${backendPort} node ./tests/fixtures/e2e/mock-backend.mjs`,
      port: backendPort,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000
    },
    {
      command: `VITE_API_BASE_URL=${backendBaseUrl}/api VITE_WS_BASE_URL=ws://127.0.0.1:${backendPort}/ws/chat VITE_AUTO_LOCK_IDLE_MS=1200 npm run dev -- --host 127.0.0.1 --port ${frontendPort} --strictPort`,
      port: frontendPort,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000
    }
  ]
});
