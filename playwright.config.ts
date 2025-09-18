import type { PlaywrightTestConfig } from '@playwright/test';
import { MOCK_POCKETBASE_URL } from './tests/e2e/mock-pocketbase-server';

const config: PlaywrightTestConfig = {
  testDir: 'tests/e2e',
  timeout: 30_000,
  retries: process.env.CI ? 2 : 0,
  globalSetup: './tests/e2e/setup/global-setup.ts',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:5173',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 5173',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: !process.env.CI,
    env: {
      ...process.env,
      POCKETBASE_URL: process.env.MOCK_POCKETBASE_URL ?? MOCK_POCKETBASE_URL,
    },
  },
};

export default config;
