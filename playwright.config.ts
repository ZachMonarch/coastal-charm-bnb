import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 120000,
  expect: { timeout: 5000 },
  fullyParallel: false,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report' }]],
  use: {
    baseURL: 'http://localhost:8080',
    headless: true,
    viewport: { width: 1280, height: 720 },
    actionTimeout: 10000,
    trace: 'on-first-retry'
  },
  webServer: {
    command: 'npm run dev',
    port: 8080,
    reuseExistingServer: true,
    timeout: 120000
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } }
  ],
  globalSetup: './tests/e2e/global-setup.ts',
  globalTeardown: './tests/e2e/global-teardown.ts'
})
