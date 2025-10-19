# Testing Guide

## Overview

Meeple Cart uses a comprehensive testing strategy to ensure code quality, prevent regressions, and enable confident refactoring. This guide covers unit testing with Vitest and end-to-end testing with Playwright.

## Testing Philosophy

**Test pyramid approach:**
- **Many unit tests** - Fast, focused, test individual functions/components
- **Some integration tests** - Test component interactions with mocked dependencies
- **Few E2E tests** - Test critical user flows through the full stack

**What to test:**
- ✅ Business logic (trust tier calculations, validation, pricing)
- ✅ Component behavior (user interactions, conditional rendering)
- ✅ API endpoints (request handling, error cases)
- ✅ Critical user flows (registration, creating listings, trading)
- ❌ Don't test implementation details (internal state, CSS classes)
- ❌ Don't test third-party libraries (PocketBase, SvelteKit)

## Unit Testing with Vitest

### Setup

Vitest is configured in `vite.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
  plugins: [sveltekit()],
  test: {
    include: ['src/**/*.{test,spec}.{js,ts}'],
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['**/*.spec.ts', '**/*.test.ts', '**/node_modules/**']
    }
  }
});
```

### Running Tests

```bash
# Run all tests
npm run test

# Watch mode (re-run on file changes)
npm run test:watch

# Run with coverage
npm run test -- --coverage

# Run specific file
npm run test src/lib/utils/trust.test.ts

# Run tests matching pattern
npm run test -- -t "getTrustTier"
```

### Test Structure

Follow the **Arrange-Act-Assert** pattern:

```typescript
import { describe, it, expect } from 'vitest';
import { getTrustTier } from './trust';

describe('getTrustTier', () => {
  it('returns "new" for users with 0 vouched trades', () => {
    // Arrange
    const user = {
      id: '123',
      joined_date: '2025-10-01',
      vouch_count: 0,
      trade_count: 5
    };

    // Act
    const tier = getTrustTier(user);

    // Assert
    expect(tier).toBe('new');
  });

  it('returns "seedling" for users with 1 vouched trade', () => {
    const user = {
      id: '123',
      joined_date: '2025-10-01',
      vouch_count: 1,
      trade_count: 5
    };

    const tier = getTrustTier(user);

    expect(tier).toBe('seedling');
  });

  it('returns "growing" for users with 2+ vouched trades and 30+ days', () => {
    const user = {
      id: '123',
      joined_date: '2025-09-01', // 50 days ago
      vouch_count: 2,
      trade_count: 10
    };

    const tier = getTrustTier(user);

    expect(tier).toBe('growing');
  });
});
```

### Testing Utility Functions

```typescript
// src/lib/utils/validation.test.ts
import { describe, it, expect } from 'vitest';
import { validatePriceReduction } from './validation';

describe('validatePriceReduction', () => {
  it('returns true for 10% reduction', () => {
    expect(validatePriceReduction(100, 90)).toBe(true);
  });

  it('returns true for >10% reduction', () => {
    expect(validatePriceReduction(100, 85)).toBe(true);
  });

  it('returns false for <10% reduction', () => {
    expect(validatePriceReduction(100, 95)).toBe(false);
  });

  it('returns false for price increase', () => {
    expect(validatePriceReduction(100, 110)).toBe(false);
  });

  it('handles decimal prices correctly', () => {
    expect(validatePriceReduction(49.99, 44.99)).toBe(true);
  });
});
```

### Testing Svelte Components

Use `@testing-library/svelte` for component testing:

```typescript
// src/lib/components/TrustBadge.test.ts
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import TrustBadge from './TrustBadge.svelte';

describe('TrustBadge', () => {
  it('renders new member badge correctly', () => {
    const user = {
      id: '123',
      joined_date: '2025-10-15',
      vouch_count: 0,
      trade_count: 0,
      name: 'John'
    };

    render(TrustBadge, { props: { user } });

    expect(screen.getByText(/new/i)).toBeInTheDocument();
    expect(screen.getByText(/🆕/)).toBeInTheDocument();
  });

  it('renders trusted member badge for qualified users', () => {
    const user = {
      id: '123',
      joined_date: '2023-01-01', // >1 year ago
      vouch_count: 10,
      trade_count: 20,
      name: 'Jane'
    };

    render(TrustBadge, { props: { user } });

    expect(screen.getByText(/trusted/i)).toBeInTheDocument();
    expect(screen.getByText(/⭐/)).toBeInTheDocument();
  });

  it('shows details when showDetails prop is true', () => {
    const user = {
      id: '123',
      joined_date: '2025-01-01',
      vouch_count: 5,
      trade_count: 8,
      name: 'Alice'
    };

    render(TrustBadge, { props: { user, showDetails: true } });

    expect(screen.getByText(/5 vouches/i)).toBeInTheDocument();
    expect(screen.getByText(/8 trades/i)).toBeInTheDocument();
  });
});
```

### Testing Component Interactions

```typescript
// src/lib/components/SearchBar.test.ts
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import SearchBar from './SearchBar.svelte';

describe('SearchBar', () => {
  it('calls onSearch callback with search term', async () => {
    const onSearch = vi.fn();

    render(SearchBar, { props: { onSearch } });

    const input = screen.getByPlaceholderText(/search/i);
    await fireEvent.input(input, { target: { value: 'Wingspan' } });

    // Assuming debounced search
    await new Promise(resolve => setTimeout(resolve, 400));

    expect(onSearch).toHaveBeenCalledWith('Wingspan');
  });

  it('clears search when clear button clicked', async () => {
    const onSearch = vi.fn();

    render(SearchBar, { props: { onSearch, initialValue: 'test' } });

    const clearButton = screen.getByRole('button', { name: /clear/i });
    await fireEvent.click(clearButton);

    const input = screen.getByPlaceholderText(/search/i);
    expect(input).toHaveValue('');
    expect(onSearch).toHaveBeenCalledWith('');
  });
});
```

### Mocking PocketBase

Create reusable mocks for PocketBase operations:

```typescript
// tests/mocks/pocketbase.ts
import { vi } from 'vitest';

export const createMockPB = () => {
  return {
    collection: vi.fn((name: string) => ({
      getOne: vi.fn(),
      getList: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      subscribe: vi.fn()
    })),
    authStore: {
      model: null,
      isValid: false,
      clear: vi.fn()
    }
  };
};

export const mockUser = (overrides = {}) => ({
  id: 'user123',
  username: 'testuser',
  email: 'test@example.com',
  name: 'Test User',
  vouch_count: 0,
  trade_count: 0,
  joined_date: '2025-10-01',
  phone_verified: false,
  ...overrides
});

export const mockListing = (overrides = {}) => ({
  id: 'listing123',
  owner: 'user123',
  title: 'Test Listing',
  description: 'A test listing',
  type: 'sell',
  status: 'published',
  created: '2025-10-15',
  updated: '2025-10-15',
  ...overrides
});
```

**Using mocks in tests:**

```typescript
// src/routes/listings/[id]/+page.server.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { load } from './+page.server';
import { createMockPB, mockListing } from '../../../tests/mocks/pocketbase';

describe('Listing detail page', () => {
  let mockPb;

  beforeEach(() => {
    mockPb = createMockPB();
  });

  it('loads listing successfully', async () => {
    const listing = mockListing();
    mockPb.collection('listings').getOne.mockResolvedValue(listing);

    const result = await load({
      locals: { pb: mockPb },
      params: { id: 'listing123' }
    });

    expect(result.listing).toEqual(listing);
    expect(mockPb.collection).toHaveBeenCalledWith('listings');
    expect(mockPb.collection('listings').getOne).toHaveBeenCalledWith('listing123', {
      expand: 'owner,games'
    });
  });

  it('throws 404 error when listing not found', async () => {
    mockPb.collection('listings').getOne.mockRejectedValue(new Error('Not found'));

    await expect(
      load({
        locals: { pb: mockPb },
        params: { id: 'nonexistent' }
      })
    ).rejects.toThrow('Listing not found');
  });
});
```

### Testing Form Actions

```typescript
// src/routes/listings/new/+page.server.test.ts
import { describe, it, expect, vi } from 'vitest';
import { actions } from './+page.server';
import { createMockPB, mockUser, mockListing } from '../../../tests/mocks/pocketbase';

describe('Create listing form action', () => {
  it('creates listing with valid data', async () => {
    const mockPb = createMockPB();
    const user = mockUser();
    const listing = mockListing({ owner: user.id });

    mockPb.collection('listings').create.mockResolvedValue(listing);

    const formData = new FormData();
    formData.append('title', 'Wingspan');
    formData.append('description', 'Great bird game');
    formData.append('type', 'sell');

    const request = new Request('http://localhost', {
      method: 'POST',
      body: formData
    });

    await expect(
      actions.default({ request, locals: { pb: mockPb, user } })
    ).rejects.toThrow(); // Expects redirect

    expect(mockPb.collection('listings').create).toHaveBeenCalledWith({
      title: 'Wingspan',
      description: 'Great bird game',
      type: 'sell',
      owner: user.id,
      status: 'draft'
    });
  });

  it('returns validation errors for invalid data', async () => {
    const mockPb = createMockPB();
    const user = mockUser();

    const formData = new FormData();
    formData.append('title', 'AB'); // Too short
    formData.append('description', 'Short'); // Too short
    formData.append('type', 'invalid'); // Invalid type

    const request = new Request('http://localhost', {
      method: 'POST',
      body: formData
    });

    const result = await actions.default({
      request,
      locals: { pb: mockPb, user }
    });

    expect(result.status).toBe(400);
    expect(result.data.errors).toBeDefined();
  });

  it('returns 401 for unauthenticated users', async () => {
    const mockPb = createMockPB();

    const formData = new FormData();
    formData.append('title', 'Wingspan');

    const request = new Request('http://localhost', {
      method: 'POST',
      body: formData
    });

    const result = await actions.default({
      request,
      locals: { pb: mockPb, user: null }
    });

    expect(result.status).toBe(401);
  });
});
```

### Testing Date/Time Logic

Handle time-dependent tests carefully:

```typescript
// src/lib/utils/date.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatRelativeTime } from './date';

describe('formatRelativeTime', () => {
  beforeEach(() => {
    // Mock current date to Oct 20, 2025
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-10-20T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('formats today correctly', () => {
    const today = '2025-10-20T08:00:00Z';
    expect(formatRelativeTime(today)).toBe('Today');
  });

  it('formats yesterday correctly', () => {
    const yesterday = '2025-10-19T12:00:00Z';
    expect(formatRelativeTime(yesterday)).toBe('Yesterday');
  });

  it('formats days ago correctly', () => {
    const threeDaysAgo = '2025-10-17T12:00:00Z';
    expect(formatRelativeTime(threeDaysAgo)).toBe('3 days ago');
  });

  it('formats weeks ago correctly', () => {
    const twoWeeksAgo = '2025-10-06T12:00:00Z';
    expect(formatRelativeTime(twoWeeksAgo)).toBe('2 weeks ago');
  });
});
```

### Coverage Goals

Target coverage thresholds:

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      statements: 80,
      branches: 75,
      functions: 80,
      lines: 80,
      exclude: [
        '**/*.spec.ts',
        '**/*.test.ts',
        '**/node_modules/**',
        '**/.svelte-kit/**'
      ]
    }
  }
});
```

**Focus coverage on:**
- Business logic (trust calculations, pricing, validation)
- Complex components
- API endpoints and form actions
- Critical utility functions

## End-to-End Testing with Playwright

### Setup

Playwright is configured in `playwright.config.ts`:

```typescript
import type { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
  webServer: {
    command: 'npm run build && npm run preview',
    port: 4173
  },
  testDir: 'tests/e2e',
  testMatch: /(.+\.)?(test|spec)\.[jt]s/,
  use: {
    baseURL: 'http://localhost:4173'
  }
};

export default config;
```

### Running E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run with UI (interactive mode)
npm run test:e2e:ui

# Run specific test file
npx playwright test tests/e2e/listings.spec.ts

# Debug mode
npx playwright test --debug

# Generate test code (record interactions)
npx playwright codegen http://localhost:5173
```

### Test Structure

```typescript
// tests/e2e/listings.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Listings', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to listings page before each test
    await page.goto('/listings');
  });

  test('displays published listings', async ({ page }) => {
    // Wait for listings to load
    await page.waitForSelector('[data-testid="listing-card"]');

    // Check that listings are visible
    const listings = await page.locator('[data-testid="listing-card"]').all();
    expect(listings.length).toBeGreaterThan(0);
  });

  test('filters listings by type', async ({ page }) => {
    // Select "Sell" filter
    await page.click('[data-testid="filter-type"]');
    await page.click('text=Sell');

    // Wait for filtered results
    await page.waitForLoadState('networkidle');

    // Verify only sell listings shown
    const typeLabels = await page.locator('[data-testid="listing-type"]').allTextContents();
    expect(typeLabels.every(label => label.includes('Sell'))).toBe(true);
  });

  test('searches for listings', async ({ page }) => {
    // Type in search box
    await page.fill('[data-testid="search-input"]', 'Wingspan');
    await page.waitForTimeout(500); // Debounce

    // Verify results contain search term
    const titles = await page.locator('[data-testid="listing-title"]').allTextContents();
    expect(titles.some(title => title.toLowerCase().includes('wingspan'))).toBe(true);
  });
});
```

### Authentication Flow

```typescript
// tests/e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('user can register and login', async ({ page }) => {
    // Navigate to registration
    await page.goto('/register');

    // Fill registration form
    await page.fill('[name="email"]', 'newuser@example.com');
    await page.fill('[name="password"]', 'SecurePassword123');
    await page.fill('[name="passwordConfirm"]', 'SecurePassword123');
    await page.fill('[name="name"]', 'New User');

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to dashboard/home
    await expect(page).toHaveURL(/\/(dashboard|home)/);

    // Verify logged in state
    await expect(page.locator('text=Hi, New User')).toBeVisible();
  });

  test('shows error for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.fill('[name="email"]', 'wrong@example.com');
    await page.fill('[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator('text=/Invalid credentials/i')).toBeVisible();
  });
});
```

### Testing with Authenticated User

Use Playwright's `storageState` to persist authentication:

```typescript
// tests/e2e/auth.setup.ts
import { test as setup } from '@playwright/test';

const authFile = 'tests/e2e/.auth/user.json';

setup('authenticate', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'testpassword');
  await page.click('button[type="submit"]');

  // Wait for auth to complete
  await page.waitForURL('/');

  // Save authentication state
  await page.context().storageState({ path: authFile });
});
```

**Use authenticated state in tests:**

```typescript
// tests/e2e/create-listing.spec.ts
import { test, expect } from '@playwright/test';

test.use({ storageState: 'tests/e2e/.auth/user.json' });

test.describe('Create Listing', () => {
  test('authenticated user can create listing', async ({ page }) => {
    await page.goto('/listings/new');

    await page.fill('[name="title"]', 'My Test Listing');
    await page.fill('[name="description"]', 'This is a test listing description');
    await page.selectOption('[name="type"]', 'sell');

    await page.click('button[type="submit"]');

    // Should redirect to new listing
    await expect(page).toHaveURL(/\/listings\/[a-z0-9]+/);
    await expect(page.locator('h1')).toContainText('My Test Listing');
  });
});
```

### Testing Real-Time Updates

```typescript
// tests/e2e/realtime.spec.ts
import { test, expect } from '@playwright/test';

test('listings update in real-time', async ({ browser }) => {
  // Open two contexts (simulating two users)
  const context1 = await browser.newContext();
  const context2 = await browser.newContext();

  const page1 = await context1.newPage();
  const page2 = await context2.newPage();

  // Both navigate to listings
  await page1.goto('/listings');
  await page2.goto('/listings');

  // Get initial count
  const initialCount = await page2.locator('[data-testid="listing-card"]').count();

  // User 1 creates a listing
  await page1.goto('/listings/new');
  await page1.fill('[name="title"]', 'Real-time Test Listing');
  await page1.fill('[name="description"]', 'Testing real-time updates');
  await page1.selectOption('[name="type"]', 'trade');
  await page1.click('button[type="submit"]');

  // Wait for real-time update on page 2
  await page2.waitForTimeout(1000);

  // Verify new listing appears on page 2
  const newCount = await page2.locator('[data-testid="listing-card"]').count();
  expect(newCount).toBe(initialCount + 1);

  await context1.close();
  await context2.close();
});
```

### Testing File Uploads

```typescript
// tests/e2e/photo-upload.spec.ts
import { test, expect } from '@playwright/test';
import path from 'path';

test('user can upload listing photos', async ({ page }) => {
  await page.goto('/listings/new');

  // Upload file
  const filePath = path.join(__dirname, 'fixtures', 'test-image.jpg');
  await page.setInputFiles('[data-testid="photo-upload"]', filePath);

  // Verify preview appears
  await expect(page.locator('[data-testid="photo-preview"]')).toBeVisible();

  // Submit form
  await page.fill('[name="title"]', 'Listing with Photo');
  await page.fill('[name="description"]', 'Test description');
  await page.click('button[type="submit"]');

  // Verify photo displays on listing page
  await expect(page.locator('[data-testid="listing-photo"]')).toBeVisible();
});
```

### Testing Mobile Responsiveness

```typescript
// tests/e2e/mobile.spec.ts
import { test, expect, devices } from '@playwright/test';

test.use(devices['iPhone 13']);

test.describe('Mobile experience', () => {
  test('navigation works on mobile', async ({ page }) => {
    await page.goto('/');

    // Open mobile menu
    await page.click('[data-testid="mobile-menu-button"]');

    // Verify menu is visible
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();

    // Click listings link
    await page.click('[data-testid="mobile-menu"] >> text=Listings');

    // Verify navigation
    await expect(page).toHaveURL('/listings');
  });

  test('listing cards are readable on mobile', async ({ page }) => {
    await page.goto('/listings');

    // Verify listing cards don't overflow
    const card = page.locator('[data-testid="listing-card"]').first();
    const boundingBox = await card.boundingBox();

    expect(boundingBox.width).toBeLessThanOrEqual(390); // iPhone 13 width
  });
});
```

## Testing Best Practices

### 1. Use Data Attributes for Selectors

Prefer `data-testid` over CSS classes or text content:

```svelte
<!-- ✅ Good -->
<button data-testid="create-listing-button" type="submit">
  Create Listing
</button>

<!-- ❌ Avoid (fragile) -->
<button class="btn btn-primary" type="submit">
  Create Listing
</button>
```

### 2. Test User Behavior, Not Implementation

```typescript
// ✅ Good - tests what user experiences
test('displays error for invalid email', async ({ page }) => {
  await page.fill('[name="email"]', 'invalid-email');
  await page.click('button[type="submit"]');
  await expect(page.locator('text=/invalid email/i')).toBeVisible();
});

// ❌ Bad - tests implementation details
test('sets emailError state to true', () => {
  const component = render(LoginForm);
  component.emailError = true;
  expect(component.emailError).toBe(true);
});
```

### 3. Keep Tests Independent

Each test should be able to run independently:

```typescript
// ✅ Good
test.beforeEach(async ({ page }) => {
  // Reset state before each test
  await page.goto('/listings');
});

// ❌ Bad - tests depend on order
test('creates listing', () => { /* ... */ });
test('edits listing created in previous test', () => { /* ... */ });
```

### 4. Use Descriptive Test Names

```typescript
// ✅ Good
test('displays "New member" badge for users with 0 vouched trades', () => {});

// ❌ Bad
test('badge test', () => {});
```

### 5. Mock External Dependencies

Don't make real API calls to BGG, payment providers, etc.:

```typescript
// tests/mocks/bgg.ts
export const mockBGGResponse = (gameId: string) => {
  return `<?xml version="1.0"?>
    <items>
      <item id="${gameId}">
        <name value="Wingspan" />
        <yearpublished value="2019" />
      </item>
    </items>`;
};

// In test
beforeEach(() => {
  global.fetch = vi.fn((url) => {
    if (url.includes('boardgamegeek.com')) {
      return Promise.resolve({
        ok: true,
        text: () => Promise.resolve(mockBGGResponse('266192'))
      });
    }
  });
});
```

### 6. Test Error States

Always test error handling:

```typescript
test('shows error message when listing fetch fails', async () => {
  mockPb.collection('listings').getOne.mockRejectedValue(
    new Error('Network error')
  );

  const { container } = render(ListingDetail, {
    props: { listingId: '123' }
  });

  await waitFor(() => {
    expect(screen.getByText(/error loading listing/i)).toBeInTheDocument();
  });
});
```

## CI/CD Integration

### GitHub Actions Example

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test -- --coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3

  e2e:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Build app
        run: npm run build

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload test results
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

## Debugging Tests

### Vitest Debugging

```bash
# Run single test in debug mode
node --inspect-brk ./node_modules/vitest/vitest.mjs run src/lib/utils/trust.test.ts

# Then open chrome://inspect in Chrome
```

### Playwright Debugging

```bash
# Run with UI
npx playwright test --ui

# Debug mode (opens browser)
npx playwright test --debug

# Headed mode (see browser during test)
npx playwright test --headed

# Show trace
npx playwright show-trace trace.zip
```

### VS Code Integration

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Vitest: Current File",
      "program": "${workspaceFolder}/node_modules/vitest/vitest.mjs",
      "args": ["run", "${relativeFile}"],
      "console": "integratedTerminal"
    }
  ]
}
```

## Related Documentation

- [Architecture & Patterns](./architecture.md) - Component and code patterns
- [Getting Started](./getting-started.md) - Development environment setup
- [Data Models](./data-models.md) - PocketBase schema reference

---

**Last updated:** 2025-10-20
**Maintainer:** Development Team
