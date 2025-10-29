import { test, expect, type Page } from '@playwright/test';

test.describe('Photo Gallery Manager', () => {
  let page: Page;
  let listingId: string;

  // Generate unique test data for each test run
  const timestamp = Date.now();
  const testUser = {
    email: `photo-test-${timestamp}@example.com`,
    displayName: `PhotoTest${timestamp}`,
    password: 'testpassword123',
  };

  test.beforeEach(async ({ browser, request }) => {
    page = await browser.newPage();

    // Setup: Register a new user
    await page.goto('/register');
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="display_name"]', testUser.displayName);
    await page.fill('input[name="password"]', testUser.password);
    await page.fill('input[name="passwordConfirm"]', testUser.password);
    await page.click('button[type="submit"]');

    // Wait for redirect to profile after registration
    await page.waitForURL('/profile', { timeout: 5000 });

    // Get auth token from localStorage
    const authData = await page.evaluate(() => {
      const data = localStorage.getItem('pocketbase_auth');
      return data ? JSON.parse(data) : null;
    });

    if (!authData || !authData.token) {
      throw new Error('No auth token found after registration');
    }

    // Create a test listing directly via PocketBase REST API
    // (The /listings/new form is broken - uses method="POST" but no server action)
    const response = await request.post('http://127.0.0.1:8090/api/collections/listings/records', {
      headers: {
        'Authorization': authData.token,
        'Content-Type': 'application/json',
      },
      data: {
        title: 'Test Listing for Photos',
        listing_type: 'trade',
        location: 'auckland',
        summary: 'Test listing for photo gallery tests',
        status: 'active',
        owner: authData.record.id,
      },
    });

    if (!response.ok()) {
      const error = await response.text();
      throw new Error(`Failed to create listing: ${response.status()} - ${error}`);
    }

    const listing = await response.json();
    if (!listing || !listing.id) {
      throw new Error(`Listing creation returned invalid data: ${JSON.stringify(listing)}`);
    }

    listingId = listing.id;
  });

  test.afterEach(async () => {
    await page.close();
  });

  test.describe('Photo Upload', () => {
    test('should allow owner to access photo manager', async () => {
      // Navigate to the listing owned by the test user
      await page.goto(`/listings/${listingId}`);

      // Should see "Manage photos" button
      const manageButton = page.getByRole('link', { name: /manage photos/i });
      await expect(manageButton).toBeVisible();

      // Click to go to photo manager
      await manageButton.click();

      // Should be on photo manager page
      await expect(page).toHaveURL(/\/listings\/.*\/photos/);
      await expect(page.getByRole('heading', { name: 'Manage Photos', exact: true })).toBeVisible();
    });

    test('should not show manage button to non-owners', async () => {
      // Login as different user
      await page.goto('/logout');
      await page.goto('/login');
      await page.fill('input[name="email"]', 'other@example.com');
      await page.fill('input[name="password"]', 'testpassword123');
      await page.click('button[type="submit"]');

      // Navigate to listing owned by someone else
      await page.goto(`/listings/${listingId}`);

      // Should NOT see "Manage photos" button
      const manageButton = page.getByRole('link', { name: /manage photos/i });
      await expect(manageButton).not.toBeVisible();
    });

    test('should display photo count correctly', async () => {
      await page.goto(`/listings/${listingId}/photos`);

      // Check photo count display
      const photoCount = page.locator('text=/\\d+ \\/ 6 photos/');
      await expect(photoCount).toBeVisible();
    });

    test('should upload a new photo', async () => {
      await page.goto(`/listings/${listingId}/photos`);

      // Get initial photo count
      const initialCount = await page.locator('[role="button"]').count();

      // Click upload button
      await page.click('button:has-text("Click to upload")');

      // Upload a file (you'll need to have a test image file)
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles('./tests/fixtures/test-image.jpg');

      // Wait for upload to complete
      await page.waitForTimeout(1000);

      // Should have one more photo
      const newCount = await page.locator('[role="button"]').count();
      expect(newCount).toBe(initialCount + 1);
    });

    test('should show error when exceeding 6 photo limit', async () => {
      // This test assumes listing already has 6 photos
      await page.goto(`/listings/${listingId}-with-max-photos/photos`);

      // Upload button should be disabled
      const uploadButton = page.getByRole('button', { name: /maximum photos reached/i });
      await expect(uploadButton).toBeDisabled();
    });

    test('should validate file type', async () => {
      await page.goto(`/listings/${listingId}/photos`);

      // Try to upload invalid file type
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles('./tests/fixtures/test-document.pdf');

      // Should show error message
      await expect(page.getByText(/invalid file type/i)).toBeVisible();
    });

    test('should validate file size', async () => {
      await page.goto(`/listings/${listingId}/photos`);

      // Try to upload file > 5MB
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles('./tests/fixtures/large-image.jpg');

      // Should show error message
      await expect(page.getByText(/file too large/i)).toBeVisible();
    });
  });

  test.describe('Photo Deletion', () => {
    test('should delete a photo with confirmation', async () => {
      await page.goto(`/listings/${listingId}/photos`);

      // Get initial count
      const initialCount = await page.locator('img[alt*="Listing photo"]').count();

      // Hover over first photo to reveal delete button
      await page.hover('img[alt="Listing photo 1"]');

      // Click delete button
      await page.click('button:has-text("Delete")');

      // Confirm deletion in dialog
      page.on('dialog', (dialog) => dialog.accept());

      // Wait for deletion
      await page.waitForTimeout(1000);

      // Should have one fewer photo
      const newCount = await page.locator('img[alt*="Listing photo"]').count();
      expect(newCount).toBe(initialCount - 1);
    });

    test('should cancel deletion on dialog dismiss', async () => {
      await page.goto(`/listings/${listingId}/photos`);

      // Get initial count
      const initialCount = await page.locator('img[alt*="Listing photo"]').count();

      // Hover and click delete
      await page.hover('img[alt="Listing photo 1"]');
      await page.click('button:has-text("Delete")');

      // Dismiss dialog
      page.on('dialog', (dialog) => dialog.dismiss());

      // Wait a moment
      await page.waitForTimeout(500);

      // Count should be unchanged
      const newCount = await page.locator('img[alt*="Listing photo"]').count();
      expect(newCount).toBe(initialCount);
    });
  });

  test.describe('Photo Reordering', () => {
    test('should reorder photos via drag and drop', async () => {
      await page.goto(`/listings/${listingId}/photos`);

      // Get initial order
      const firstPhoto = page.locator('img[alt="Listing photo 1"]');
      const firstPhotoSrc = await firstPhoto.getAttribute('src');

      // Drag first photo to third position
      const dragHandle = page.locator('[role="button"]').first();
      const dropTarget = page.locator('[role="button"]').nth(2);

      await dragHandle.dragTo(dropTarget);

      // Wait for save
      await page.waitForTimeout(1000);

      // First photo should now be third
      const thirdPhoto = page.locator('img[alt="Listing photo 3"]');
      const thirdPhotoSrc = await thirdPhoto.getAttribute('src');

      expect(thirdPhotoSrc).toBe(firstPhotoSrc);
    });

    test('should show saving indicator during reorder', async () => {
      await page.goto(`/listings/${listingId}/photos`);

      // Drag and drop
      const dragHandle = page.locator('[role="button"]').first();
      const dropTarget = page.locator('[role="button"]').nth(1);

      await dragHandle.dragTo(dropTarget);

      // Should show "Saving order..." briefly
      await expect(page.getByText(/saving order/i)).toBeVisible();
    });
  });

  test.describe('Region Editor', () => {
    test('should open region editor for a photo', async () => {
      await page.goto(`/listings/${listingId}/photos`);

      // Hover over first photo
      await page.hover('img[alt="Listing photo 1"]');

      // Click "Edit Regions" button
      await page.click('button:has-text("Edit Regions")');

      // Region editor modal should open
      await expect(page.getByRole('heading', { name: /edit photo regions/i })).toBeVisible();
    });

    test('should close region editor on cancel', async () => {
      await page.goto(`/listings/${listingId}/photos`);

      // Open editor
      await page.hover('img[alt="Listing photo 1"]');
      await page.click('button:has-text("Edit Regions")');

      // Click cancel
      await page.click('button:has-text("Cancel")');

      // Modal should close
      await expect(page.getByRole('heading', { name: /edit photo regions/i })).not.toBeVisible();
    });

    test('should switch between rectangle and polygon modes', async () => {
      await page.goto(`/listings/${listingId}/photos`);

      // Open editor
      await page.hover('img[alt="Listing photo 1"]');
      await page.click('button:has-text("Edit Regions")');

      // Check rectangle mode is selected by default
      const rectangleRadio = page.locator('input[type="radio"][value="rectangle"]');
      await expect(rectangleRadio).toBeChecked();

      // Switch to polygon mode
      await page.click('label:has-text("Polygon")');

      const polygonRadio = page.locator('input[type="radio"][value="polygon"]');
      await expect(polygonRadio).toBeChecked();
    });

    test('should draw a rectangle region', async () => {
      await page.goto(`/listings/${listingId}/photos`);

      // Open editor
      await page.hover('img[alt="Listing photo 1"]');
      await page.click('button:has-text("Edit Regions")');

      // Ensure rectangle mode
      await page.click('label:has-text("Rectangle")');

      // Draw on canvas (simulate click and drag)
      const canvas = page.locator('canvas');
      const box = await canvas.boundingBox();
      if (!box) throw new Error('Canvas not found');

      // Click and drag to create rectangle
      await page.mouse.move(box.x + 100, box.y + 100);
      await page.mouse.down();
      await page.mouse.move(box.x + 200, box.y + 200);
      await page.mouse.up();

      // Should show region in list
      await expect(page.getByText(/rectangle/i)).toBeVisible();
    });

    test('should assign game to region', async () => {
      await page.goto(`/listings/${listingId}/photos`);

      // Open editor and draw region (abbreviated)
      await page.hover('img[alt="Listing photo 1"]');
      await page.click('button:has-text("Edit Regions")');

      // Draw rectangle
      const canvas = page.locator('canvas');
      const box = await canvas.boundingBox();
      if (!box) throw new Error('Canvas not found');

      await page.mouse.move(box.x + 100, box.y + 100);
      await page.mouse.down();
      await page.mouse.move(box.x + 200, box.y + 200);
      await page.mouse.up();

      // Select a game from dropdown
      await page.selectOption('select#game-select', { index: 1 });

      // Save regions
      await page.click('button:has-text("Save Regions")');

      // Should return to photo manager
      await expect(page.getByRole('heading', { name: /manage photos/i })).toBeVisible();
    });

    test('should delete a region', async () => {
      await page.goto(`/listings/${listingId}/photos`);

      // Open editor with existing region
      await page.hover('img[alt="Listing photo 1"]');
      await page.click('button:has-text("Edit Regions")');

      // Assuming there's at least one region, click delete
      const deleteButton = page.locator('button[aria-label="Delete region"]').first();
      await deleteButton.click();

      // Region should be removed from list
      const regionCount = await page.locator('.region-item').count();
      // Assert count decreased (adjust based on initial state)
    });
  });

  test.describe('Region Display on Listing Page', () => {
    test('should display regions on listing detail page', async () => {
      // Navigate to listing with regions
      await page.goto(`/listings/${listingId}-with-regions`);

      // Should see region overlays
      const regions = page.locator('.photo-region, .polygon-region');
      await expect(regions.first()).toBeVisible();
    });

    test('should blur regions for sold games', async () => {
      await page.goto(`/listings/${listingId}-with-sold-game`);

      // Region linked to sold game should have blur effect
      const blurredRegion = page.locator('.region-blurred, .polygon-blurred').first();
      await expect(blurredRegion).toBeVisible();
    });

    test('should show game name on hover for non-blurred regions', async () => {
      await page.goto(`/listings/${listingId}-with-regions`);

      // Hover over region
      const region = page.locator('.photo-region').first();
      await region.hover();

      // Should show label with game name
      const label = page.locator('.region-label');
      await expect(label).toBeVisible();
    });

    test('should scroll to game when region is clicked', async () => {
      await page.goto(`/listings/${listingId}-with-regions`);

      // Click on a region
      const region = page.locator('.photo-region').first();
      await region.click();

      // Should scroll to corresponding game
      // (Check if game element is in viewport)
      const gameElement = page.locator('[id^="game-"]').first();
      await expect(gameElement).toBeInViewport();
    });

    test('should apply highlight animation when region clicked', async () => {
      await page.goto(`/listings/${listingId}-with-regions`);

      // Click region
      const region = page.locator('.photo-region').first();
      await region.click();

      // Game card should have highlight class
      const gameCard = page.locator('.highlight-flash').first();
      await expect(gameCard).toBeVisible();

      // Wait for animation to complete
      await page.waitForTimeout(2100);

      // Highlight should be removed
      await expect(gameCard).not.toHaveClass(/highlight-flash/);
    });
  });

  test.describe('Accessibility', () => {
    test('photo manager should be keyboard navigable', async () => {
      await page.goto(`/listings/${listingId}/photos`);

      // Tab through elements
      await page.keyboard.press('Tab'); // Upload button
      await page.keyboard.press('Tab'); // First photo
      await page.keyboard.press('Tab'); // Edit regions button

      // Should be able to activate with Enter
      await page.keyboard.press('Enter');

      // Region editor should open
      await expect(page.getByRole('heading', { name: /edit photo regions/i })).toBeVisible();
    });

    test('regions should have proper ARIA labels', async () => {
      await page.goto(`/listings/${listingId}-with-regions`);

      // Regions should have role="button"
      const region = page.locator('.photo-region[role="button"]').first();
      await expect(region).toBeVisible();

      // Should be focusable
      await region.focus();
      await expect(region).toBeFocused();
    });

    test('region editor canvas should be accessible', async () => {
      await page.goto(`/listings/${listingId}/photos`);

      // Open editor
      await page.hover('img[alt="Listing photo 1"]');
      await page.click('button:has-text("Edit Regions")');

      // Radio buttons should have labels
      const rectangleLabel = page.getByText('Rectangle');
      await expect(rectangleLabel).toBeVisible();

      const polygonLabel = page.getByText('Polygon');
      await expect(polygonLabel).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('should handle network error gracefully on upload', async () => {
      // Mock network failure
      await page.route('**/api/collections/listings/*', (route) => route.abort());

      await page.goto(`/listings/${listingId}/photos`);

      // Try to upload
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles('./tests/fixtures/test-image.jpg');

      // Should show error message
      await expect(page.getByText(/failed to upload/i)).toBeVisible();
    });

    test('should handle network error gracefully on delete', async () => {
      // Mock network failure
      await page.route('**/api/collections/listings/*', (route) => route.abort());

      await page.goto(`/listings/${listingId}/photos`);

      // Try to delete
      await page.hover('img[alt="Listing photo 1"]');
      await page.click('button:has-text("Delete")');

      page.on('dialog', (dialog) => dialog.accept());

      // Should show error message
      await expect(page.getByText(/failed to delete/i)).toBeVisible();
    });

    test('should handle network error gracefully on region save', async () => {
      // Mock network failure
      await page.route('**/api/collections/listings/*', (route) => route.abort());

      await page.goto(`/listings/${listingId}/photos`);

      // Open editor and try to save
      await page.hover('img[alt="Listing photo 1"]');
      await page.click('button:has-text("Edit Regions")');

      await page.click('button:has-text("Save Regions")');

      // Should show error message
      await expect(page.getByText(/failed to save regions/i)).toBeVisible();
    });
  });
});
