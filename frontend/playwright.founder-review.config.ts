import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  testMatch: 'founder-review-capture.spec.ts',
  timeout: 90000,
  use: {
    baseURL: process.env.FOUNDER_REVIEW_BASE_URL || 'http://127.0.0.1:3012',
    viewport: { width: 1440, height: 900 },
    screenshot: 'off',
    trace: 'off',
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
  reporter: [['list']],
});
