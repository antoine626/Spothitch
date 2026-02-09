import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 2,
  timeout: 60000,
  expect: {
    timeout: 15000,
  },
  reporter: [
    ['html', { open: 'never' }],
    ['json', { outputFile: 'playwright-report/results.json' }],
  ],
  
  use: {
    baseURL: 'http://localhost:4173/Spothitch/',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  webServer: {
    command: 'npm run preview',
    url: 'http://localhost:4173/Spothitch/',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
