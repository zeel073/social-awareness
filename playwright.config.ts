import { existsSync } from 'node:fs'
import { defineConfig, devices } from '@playwright/test'

/**
 * The build environment ships its own Chromium. Use it when present (or when
 * PLAYWRIGHT_CHROMIUM_PATH points somewhere else); otherwise Playwright uses
 * the browser fetched by `npx playwright install chromium`, as in CI.
 */
const PRESET_CHROMIUM = '/opt/pw-browsers/chromium'
const executablePath =
  process.env.PLAYWRIGHT_CHROMIUM_PATH ||
  (existsSync(PRESET_CHROMIUM) ? PRESET_CHROMIUM : undefined)

const PORT = 4173

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'off',
    launchOptions: executablePath ? { executablePath } : {},
  },
  projects: [
    {
      name: 'phone',
      use: { ...devices['Desktop Chrome'], viewport: { width: 360, height: 740 }, hasTouch: true },
    },
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
  ],
  webServer: {
    command: `npx vite build && npx vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      ...process.env,
      // Matches vite.config.ts default so `/admin?key=e2e-admin` unlocks in tests.
      ADMIN_KEY: process.env.ADMIN_KEY || 'e2e-admin',
    },
  },
})
