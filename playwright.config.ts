import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL: 'http://localhost:3001',
    trace: 'on-first-retry',
  },

  // APIRequestContext não precisa abrir um navegador.
  projects: [{ name: 'api' }],

  webServer: {
    command: 'npm --prefix biblioteca-api run dev',
    url: 'http://localhost:3001/api/health',
    reuseExistingServer: !process.env.CI,
    env: { PORT: '3001', NODE_ENV: 'development' },
    timeout: 30_000,
  },
});
