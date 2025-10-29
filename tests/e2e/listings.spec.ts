import { test, expect } from '@playwright/test';
import { resetMockPocketBase, useMockDataset } from './utils/mockPocketBase';

test.describe('Listings page filters', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async () => {
    await resetMockPocketBase();
  });

  // Skip: These tests require mock PocketBase server, but the app uses compile-time
  // PUBLIC_POCKETBASE_URL which requires rebuilding the app. The reuseExistingServer
  // setting means Playwright reuses the dev server (connected to real PocketBase).
  // To enable: either rebuild app with VITE_PUBLIC_POCKETBASE_URL=mock or use runtime env vars.
  test.skip('allows filtering by location and type with clear reset', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Active listings' })).toBeVisible();
    await expect(page.getByText('Ticket to Ride')).toBeVisible();

    const locationInput = page.getByLabel('Location');
    await locationInput.fill('Wellington');

    const typeSelect = page.getByLabel('Listing type');
    await typeSelect.selectOption('sell');

    await page.getByRole('button', { name: 'Apply filters' }).click();

    await expect(page).toHaveURL(/location=Wellington/);
    await expect(page).toHaveURL(/type=sell/);
    await expect(locationInput).toHaveValue('Wellington');
    await expect(typeSelect).toHaveValue('sell');
    await expect(page.getByRole('link', { name: 'Clear filters' })).toBeVisible();

    await page.getByRole('link', { name: 'Clear filters' }).click();

    await expect(page).toHaveURL('http://127.0.0.1:5173/');
    await expect(locationInput).toHaveValue('');
    await expect(typeSelect).toHaveValue('');
  });

  test.skip('displays offline message when listings service is unavailable', async ({ page }) => {
    await page.goto('/?location=SimulateOffline');

    await expect(
      page.getByText(
        "We couldn't reach the listings service. Try refreshing once PocketBase is running."
      )
    ).toBeVisible();
    await expect(page.getByLabel('Location')).toHaveValue('SimulateOffline');
  });

  test.skip('shows empty state when no listings exist', async ({ page }) => {
    await useMockDataset('empty');

    await page.goto('/');

    await expect(
      page.getByText(
        'No active listings match your filters yet. Check back soon or create the first one.'
      )
    ).toBeVisible();
  });

  test.skip('can surface want-to-buy focused dataset', async ({ page }) => {
    await useMockDataset('want_focus');

    await page.goto('/');

    await expect(page.getByText('Want to buy Heat: Pedal to the Metal')).toBeVisible();
    await expect(page.getByLabel('Listing type')).toHaveValue('');

    await page.getByLabel('Listing type').selectOption('want');
    await page.getByRole('button', { name: 'Apply filters' }).click();

    await expect(page.getByText('Want to buy Heat: Pedal to the Metal')).toBeVisible();
  });
});
