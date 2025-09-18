import { MOCK_POCKETBASE_URL } from '../mock-pocketbase-server';

const targetUrl = process.env.MOCK_POCKETBASE_URL ?? MOCK_POCKETBASE_URL;

type UpdatePayload = {
  dataset?: 'default' | 'empty' | 'want_focus';
  reset?: boolean;
};

const postConfig = async (payload: UpdatePayload) => {
  const response = await fetch(`${targetUrl}/__mock__/config`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Failed to configure mock PocketBase: ${response.status} ${message}`);
  }
};

export const resetMockPocketBase = async () => {
  await postConfig({ reset: true });
};

export const useMockDataset = async (dataset: 'default' | 'empty' | 'want_focus') => {
  await postConfig({ dataset });
};
