import type { FullConfig } from '@playwright/test';
import {
  startMockPocketBase,
  MOCK_POCKETBASE_HOST,
  MOCK_POCKETBASE_PORT,
  MOCK_POCKETBASE_URL,
} from '../mock-pocketbase-server';

export default async function globalSetup(
  _config: FullConfig /* eslint-disable-line @typescript-eslint/no-unused-vars */
) {
  const server = await startMockPocketBase({
    host: MOCK_POCKETBASE_HOST,
    port: MOCK_POCKETBASE_PORT,
  });

  // Ensure Playwright workers and spawned processes share the target URL.
  process.env.MOCK_POCKETBASE_URL = MOCK_POCKETBASE_URL;

  return async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
  };
}
