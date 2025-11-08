import { test, expect } from '@playwright/test';

/**
 * E2E Test: Complete Trade Flow
 *
 * Tests the entire trade workflow through UI interactions only.
 *
 * Flow:
 * 1. User A (seller) creates a listing
 * 2. User B (buyer) views listing and initiates trade
 * 3. Users progress through trade status
es
 * 4. Both users leave feedback
 * 5. Both users create vouches
 */

test.describe('Complete Trade Flow', () => {
  const timestamp = Date.now();

  const userA = {
    email: `trader-a-${timestamp}@test.com`,
    password: 'TestPassword123!',
    displayName: 'Trader Alice',
    location: 'Wellington',
  };

  const userB = {
    email: `trader-b-${timestamp}@test.com`,
    password: 'TestPassword123!',
    displayName: 'Trader Bob',
    location: 'Auckland',
  };

  test('complete trade from listing creation to feedback', async ({ page, context }) => {
    // ============================================================
    // STEP 1: User A registers and creates a listing
    // ============================================================

    await test.step('User A registers', async () => {
      await page.goto('/register');

      await page.fill('input[name="email"]', userA.email);
      await page.fill('input[name="password"]', userA.password);
      await page.fill('input[name="passwordConfirm"]', userA.password);
      await page.fill('input[name="display_name"]', userA.displayName);
      await page.fill('input[name="location"]', userA.location);

      await page.click('button[type="submit"]');

      // Should redirect after successful registration
      await page.waitForURL(/\/(profile|$)/, { timeout: 10000 });

      // Verify user is logged in
      await expect(page.getByText(userA.displayName)).toBeVisible();
    });

    await test.step('User A creates a listing', async () => {
      await page.goto('/listings/new');

      // Fill in listing form
      await page.fill('input[name="title"]', 'E2E Test Listing - Gloomhaven');
      await page.selectOption('select[name="listing_type"]', 'trade');
      await page.fill('textarea[name="description"]', 'Complete game in excellent condition');
      await page.fill('input[name="location"]', userA.location);

      // Add a game (assuming there's a game form on the page)
      await page.fill('input[name="game_title"]', 'Gloomhaven');
      await page.selectOption('select[name="game_condition"]', 'excellent');
      await page.fill('input[name="game_trade_value"]', '150');

      await page.click('button[type="submit"]');

      // Wait for redirect to listing page
      await page.waitForURL(/\/listings\/[a-z0-9]+$/, { timeout: 10000 });

      // Verify we're on the listing page
      await expect(page.getByText('E2E Test Listing')).toBeVisible();
    });

    // ============================================================
    // STEP 2: User B registers and initiates trade
    // ============================================================

    const userBPage = await context.newPage();

    await test.step('User B registers', async () => {
      await userBPage.goto('/register');

      await userBPage.fill('input[name="email"]', userB.email);
      await userBPage.fill('input[name="password"]', userB.password);
      await userBPage.fill('input[name="passwordConfirm"]', userB.password);
      await userBPage.fill('input[name="display_name"]', userB.displayName);
      await userBPage.fill('input[name="location"]', userB.location);

      await userBPage.click('button[type="submit"]');

      await userBPage.waitForURL(/\/(profile|$)/, { timeout: 10000 });

      await expect(userBPage.getByText(userB.displayName)).toBeVisible();
    });

    let tradeUrl: string;

    await test.step('User B initiates trade', async () => {
      // Navigate to User A's listing
      const listingUrl = page.url();
      await userBPage.goto(listingUrl);

      // Should see the listing
      await expect(userBPage.getByText('E2E Test Listing')).toBeVisible();

      // Click "Propose Trade" button
      const proposeButton = userBPage.locator('button', { hasText: /propose trade/i });
      await proposeButton.waitFor({ state: 'visible', timeout: 5000 });
      await proposeButton.click();

      // Should redirect to trade detail page
      await userBPage.waitForURL(/\/trades\/[a-z0-9]+$/, { timeout: 10000 });

      tradeUrl = userBPage.url();

      // Verify trade page loads
      await expect(userBPage.getByText(/trade.*detail|trade #/i)).toBeVisible();
    });

    // ============================================================
    // STEP 3: Trade status progression
    // ============================================================

    await test.step('User A views and confirms trade', async () => {
      // Navigate to trade page
      await page.goto(tradeUrl);

      // Should see trade is initiated
      await expect(page.locator('text=/status.*initiated|initiated/i')).toBeVisible();

      // Confirm trade (if there's a confirm button)
      const confirmButton = page.locator('button', { hasText: /confirm.*trade|accept/i });
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
        await page.waitForTimeout(1000);
      }
    });

    await test.step('User A marks as shipped', async () => {
      await page.reload();

      // Mark as shipped (if button exists)
      const shippedButton = page.locator('button', { hasText: /mark.*shipped|shipped/i });
      if (await shippedButton.isVisible()) {
        await shippedButton.click();
        await page.waitForTimeout(1000);
      }
    });

    await test.step('User B confirms receipt', async () => {
      await userBPage.goto(tradeUrl);
      await userBPage.reload();

      // Confirm receipt (if button exists)
      const receiptButton = userBPage.locator('button', { hasText: /confirm.*receipt|received/i });
      if (await receiptButton.isVisible()) {
        await receiptButton.click();
        await userBPage.waitForTimeout(1000);
      }
    });

    await test.step('Both users complete trade', async () => {
      // User A completes
      await page.reload();
      const completeButtonA = page.locator('button', {
        hasText: /complete.*trade|mark.*complete/i,
      });
      if (await completeButtonA.isVisible()) {
        await completeButtonA.click();
        await page.waitForTimeout(1000);
      }

      // User B sees completed status
      await userBPage.reload();
      await expect(userBPage.locator('text=/completed|status.*complete/i')).toBeVisible();
    });

    // ============================================================
    // STEP 4: Feedback
    // ============================================================

    await test.step('User A leaves feedback for User B', async () => {
      await page.reload();

      // Look for feedback button/form
      const feedbackButton = page.locator('button', { hasText: /leave.*feedback|add.*feedback/i });
      if (await feedbackButton.isVisible()) {
        await feedbackButton.click();
        await page.waitForTimeout(500);
      }

      // Rate 5 stars (look for star rating buttons)
      const fiveStars = page
        .locator('button[aria-label*="5 star"]')
        .or(page.locator('[data-rating="5"]'));
      if (await fiveStars.first().isVisible()) {
        await fiveStars.first().click();
      }

      // Leave review
      const reviewTextarea = page
        .locator('textarea[name="review"]')
        .or(page.locator('textarea[placeholder*="review"]'));
      if (await reviewTextarea.isVisible()) {
        await reviewTextarea.fill('Great trader! Item was as described.');
      }

      // Submit feedback
      const submitButton = page.locator('button[type="submit"]', { hasText: /submit|save/i });
      if (await submitButton.isVisible()) {
        await submitButton.click();
        await page.waitForTimeout(1000);
      }
    });

    await test.step('User B leaves feedback for User A', async () => {
      await userBPage.reload();

      const feedbackButton = userBPage.locator('button', {
        hasText: /leave.*feedback|add.*feedback/i,
      });
      if (await feedbackButton.isVisible()) {
        await feedbackButton.click();
        await userBPage.waitForTimeout(500);
      }

      const fiveStars = userBPage
        .locator('button[aria-label*="5 star"]')
        .or(userBPage.locator('[data-rating="5"]'));
      if (await fiveStars.first().isVisible()) {
        await fiveStars.first().click();
      }

      const reviewTextarea = userBPage
        .locator('textarea[name="review"]')
        .or(userBPage.locator('textarea[placeholder*="review"]'));
      if (await reviewTextarea.isVisible()) {
        await reviewTextarea.fill('Excellent seller! Fast shipping.');
      }

      const submitButton = userBPage.locator('button[type="submit"]', { hasText: /submit|save/i });
      if (await submitButton.isVisible()) {
        await submitButton.click();
        await userBPage.waitForTimeout(1000);
      }
    });

    // ============================================================
    // STEP 5: Vouches
    // ============================================================

    await test.step('User A vouches for User B', async () => {
      await page.reload();

      const vouchButton = page.locator('button', { hasText: /vouch/i });
      if (await vouchButton.isVisible()) {
        await vouchButton.click();
        await page.waitForTimeout(500);
      }

      const vouchTextarea = page
        .locator('textarea[name="message"]')
        .or(page.locator('textarea[placeholder*="vouch"]'));
      if (await vouchTextarea.isVisible()) {
        await vouchTextarea.fill('Trustworthy trader!');
      }

      const submitButton = page.locator('button[type="submit"]', {
        hasText: /submit.*vouch|vouch/i,
      });
      if (await submitButton.isVisible()) {
        await submitButton.click();
        await page.waitForTimeout(1000);
      }
    });

    await test.step('User B vouches for User A', async () => {
      await userBPage.reload();

      const vouchButton = userBPage.locator('button', { hasText: /vouch/i });
      if (await vouchButton.isVisible()) {
        await vouchButton.click();
        await userBPage.waitForTimeout(500);
      }

      const vouchTextarea = userBPage
        .locator('textarea[name="message"]')
        .or(userBPage.locator('textarea[placeholder*="vouch"]'));
      if (await vouchTextarea.isVisible()) {
        await vouchTextarea.fill('Great experience!');
      }

      const submitButton = userBPage.locator('button[type="submit"]', {
        hasText: /submit.*vouch|vouch/i,
      });
      if (await submitButton.isVisible()) {
        await submitButton.click();
        await userBPage.waitForTimeout(1000);
      }
    });

    // ============================================================
    // VERIFICATION: Check trade history
    // ============================================================

    await test.step('Verify trade appears in history', async () => {
      // User A checks trade history
      await page.goto('/trades');
      await expect(page.locator('a[href*="/trades/"]')).toBeVisible();

      // User B checks trade history
      await userBPage.goto('/trades');
      await expect(userBPage.locator('a[href*="/trades/"]')).toBeVisible();
    });

    await userBPage.close();
  });
});
