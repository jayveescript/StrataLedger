import { defineConfig, devices } from '@playwright/test'

/**
 * Browser end-to-end tests against the real stack: the production build served by `vite preview`, proxying /api to a
 * running API (seeded with demo data) backed by PostgreSQL. Start the API first; see e2e/README.md.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1, // the flows share seeded accounts (e.g. MFA enrollment happens once)
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  timeout: 60_000,
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } : {},
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run build && npx vite preview --strictPort',
    url: 'http://localhost:4173/login',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
