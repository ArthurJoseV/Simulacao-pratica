import { defineConfig, devices } from '@playwright/test';
import config from './playwright.config';

export default defineConfig({
  ...config,
  testDir: './tests/apresentacao',
  // A API é compartilhada e o leitor pode ter até três empréstimos ativos.
  fullyParallel: false,
  workers: 1,
  retries: 0,
  use: {
    ...config.use,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
