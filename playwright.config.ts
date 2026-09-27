import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Playwright configuration for the openIMIS test suite.
 *
 * openIMIS is the open-source insurance/healthcare MIS — Django REST + GraphQL
 * backend with a React (Material UI) frontend. Tests are organised in three
 * independent directories that can be run in isolation:
 *
 *   - tests/ui         — POM-style browser tests against the demo SPA
 *   - tests/api        — GraphQL + REST + FHIR calls against the backend
 *   - tests/database   — PostgreSQL assertions via the `pg` driver
 *
 * Defaults target the public demo at https://demo.openimis.org with the
 * seeded Admin/admin123 account. Override any of these via env vars (see
 * .env.example) when pointing at a local Docker stack.
 *
 * Note on parallelism:
 *   - UI tests touch shared demo state, so they run serially (workers: 1).
 *   - API tests each obtain their own JWT, so they can run in parallel.
 *   - DB tests share the demo DB and must stay serial.
 */
export default defineConfig({
  testDir: './tests',
  globalSetup: './global-setup.ts',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['junit', { outputFile: 'test-results/results.xml' }],
  ],
  timeout: 180_000,
  expect: {
    timeout: 15_000,
  },
  reportSlowTests: { max: 5, threshold: 30_000 },

  /**
   * Project matrix: every suite runs against Chromium by default.
   * Add Firefox / WebKit as separate `npx playwright test --project=...`
   * invocations when needed (openIMIS frontend relies on Material UI and
   * a lot of JS — WebKit occasionally renders dialogs differently).
   */
  use: {
    baseURL: process.env.OPENIMIS_BASE_URL ?? 'https://demo.openimis.org',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 45_000,
    // Persist cookies between API requests so tokenAuth cookies ride along.
    storageState: undefined,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});