import { test, expect } from '@playwright/test';

test('landing page loads', async ({ page }) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Trade board games across Aotearoa' })
  ).toBeVisible();
  await expect(page.getByRole('link', { name: 'Product spec' })).toBeVisible();
});
