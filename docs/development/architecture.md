# Architecture & Patterns

## Overview

Meeple Cart is built with SvelteKit 2 and PocketBase, providing a modern, type-safe, and real-time marketplace experience. This guide covers the architectural decisions, patterns, and best practices used throughout the codebase.

## Tech Stack

| Layer        | Technology          | Purpose                                                 |
| ------------ | ------------------- | ------------------------------------------------------- |
| **Frontend** | SvelteKit 2         | File-based routing, SSR/SSG, progressive enhancement    |
| **Language** | TypeScript          | Type safety across client and server                    |
| **Styling**  | Tailwind CSS 4      | Utility-first CSS with design system consistency        |
| **Backend**  | PocketBase          | Embedded SQLite, REST/realtime APIs, auth, file storage |
| **Testing**  | Vitest + Playwright | Unit tests and end-to-end testing                       |
| **Build**    | Vite                | Fast builds, HMR, optimized production bundles          |

## Project Structure

```
meeple/
├── src/
│   ├── routes/              # SvelteKit file-based routing
│   │   ├── +layout.svelte   # Root layout (applies to all pages)
│   │   ├── +layout.ts       # Root layout data loading
│   │   ├── +page.svelte     # Homepage
│   │   ├── listings/        # Listings section
│   │   │   ├── +page.svelte
│   │   │   ├── [id]/        # Dynamic listing detail
│   │   │   │   └── +page.svelte
│   │   └── api/             # API routes (+server.ts)
│   │       └── games/
│   │           └── search/
│   │               └── +server.ts
│   ├── lib/
│   │   ├── components/      # Reusable Svelte components (PascalCase)
│   │   │   ├── ListingCard.svelte
│   │   │   ├── TrustBadge.svelte
│   │   │   └── forms/
│   │   │       └── GameForm.svelte
│   │   ├── types/           # TypeScript definitions
│   │   │   ├── pocketbase.ts    # Auto-generated PocketBase types
│   │   │   ├── listing.ts       # Domain models
│   │   │   └── cascade.ts
│   │   ├── utils/           # Utility functions (camelCase)
│   │   │   ├── trust.ts         # Trust tier calculations
│   │   │   ├── date.ts          # Date formatting
│   │   │   └── validation.ts
│   │   └── stores/          # Svelte stores for state management
│   │       └── user.ts
│   └── app.html             # HTML template
├── services/
│   └── pocketbase/
│       ├── schema/
│       │   └── pb_schema.json   # PocketBase schema definition
│       └── migrations/          # Database migrations
│           └── 0001_initial.js
├── static/                  # Static assets (images, fonts, etc.)
├── tests/
│   ├── unit/               # Vitest unit tests
│   └── e2e/                # Playwright tests
└── scripts/                # Build and deployment scripts
```

## SvelteKit Architecture

### File-Based Routing

SvelteKit uses the filesystem for routing. Each `+page.svelte` file creates a route:

```
src/routes/
├── +page.svelte              → /
├── about/
│   └── +page.svelte          → /about
├── listings/
│   ├── +page.svelte          → /listings
│   ├── new/
│   │   └── +page.svelte      → /listings/new
│   └── [id]/
│       ├── +page.svelte      → /listings/:id
│       └── edit/
│           └── +page.svelte  → /listings/:id/edit
└── users/
    └── [username]/
        └── +page.svelte      → /users/:username
```

### Special Route Files

| File                | Purpose                         | Runs On               |
| ------------------- | ------------------------------- | --------------------- |
| `+page.svelte`      | Page component                  | Client + Server (SSR) |
| `+page.ts`          | Page data loading (shared)      | Client + Server       |
| `+page.server.ts`   | Server-only data loading        | Server only           |
| `+layout.svelte`    | Layout wrapper for child routes | Client + Server       |
| `+layout.ts`        | Layout data loading (shared)    | Client + Server       |
| `+layout.server.ts` | Server-only layout data         | Server only           |
| `+server.ts`        | API endpoint (no UI)            | Server only           |
| `+error.svelte`     | Error page for this route       | Client + Server       |

### Data Loading Pattern

**Use `+page.server.ts` for:**

- Database queries (PocketBase)
- Authentication checks
- Sensitive operations
- Data that should never be exposed to client

```typescript
// src/routes/listings/[id]/+page.server.ts
import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, params }) => {
  try {
    const listing = await locals.pb.collection('listings').getOne(params.id, {
      expand: 'owner,games',
    });

    return {
      listing,
    };
  } catch (err) {
    throw error(404, 'Listing not found');
  }
};
```

**Use `+page.ts` for:**

- Client-side data transformation
- Fetching from external APIs (that can run on client)
- Non-sensitive operations

```typescript
// src/routes/games/[id]/+page.ts
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch, params }) => {
  // Can run on client or server
  const response = await fetch(`https://boardgamegeek.com/xmlapi2/thing?id=${params.id}`);
  const xml = await response.text();

  return {
    bggData: parseXML(xml),
  };
};
```

### Layout Hierarchy

Layouts wrap child routes and can be nested:

```
src/routes/
├── +layout.svelte           # Root layout (always present)
├── +layout.server.ts        # Load user auth state
├── listings/
│   ├── +layout.svelte       # Listings section layout
│   ├── +page.svelte         # /listings
│   └── [id]/
│       └── +page.svelte     # /listings/:id (inherits both layouts)
```

**Example root layout:**

```svelte
<!-- src/routes/+layout.svelte -->
<script lang="ts">
  import type { LayoutData } from './$types';

  export let data: LayoutData;
</script>

<nav>
  <!-- Navigation bar -->
  {#if data.user}
    <a href="/profile">Hi, {data.user.name}</a>
  {:else}
    <a href="/login">Login</a>
  {/if}
</nav>

<main>
  <slot />
  <!-- Child routes render here -->
</main>

<footer>
  <!-- Footer content -->
</footer>
```

## PocketBase Integration

### Client Initialization

PocketBase client is initialized in hooks and made available via `locals`:

```typescript
// src/hooks.server.ts
import PocketBase from 'pocketbase';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  event.locals.pb = new PocketBase(process.env.POCKETBASE_URL || 'http://127.0.0.1:8090');

  // Load auth from cookie
  event.locals.pb.authStore.loadFromCookie(event.request.headers.get('cookie') || '');

  try {
    // Refresh auth if needed
    if (event.locals.pb.authStore.isValid) {
      await event.locals.pb.collection('users').authRefresh();
    }
  } catch (_) {
    event.locals.pb.authStore.clear();
  }

  event.locals.user = event.locals.pb.authStore.model;

  const response = await resolve(event);

  // Save auth to cookie
  response.headers.set('set-cookie', event.locals.pb.authStore.exportToCookie());

  return response;
};
```

### CRUD Patterns

**Create:**

```typescript
const listing = await locals.pb.collection('listings').create({
  owner: userId,
  title: 'Wingspan Collection',
  type: 'sell',
  status: 'published',
});
```

**Read (single):**

```typescript
const listing = await locals.pb.collection('listings').getOne(listingId, {
  expand: 'owner,games', // Expand relations
});
```

**Read (list):**

```typescript
const listings = await locals.pb.collection('listings').getList(1, 20, {
  filter: 'status="published" && type="sell"',
  sort: '-created',
  expand: 'owner',
});
```

**Update:**

```typescript
const updated = await locals.pb.collection('listings').update(listingId, {
  status: 'completed',
});
```

**Delete:**

```typescript
await locals.pb.collection('listings').delete(listingId);
```

### Real-Time Subscriptions

Subscribe to collection changes for real-time updates:

```svelte
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { pb } from '$lib/pocketbase';
  import type { ListingsRecord } from '$lib/types/pocketbase';

  let listings: ListingsRecord[] = [];
  let unsubscribe: (() => void) | null = null;

  onMount(async () => {
    // Initial fetch
    const result = await pb.collection('listings').getList(1, 50);
    listings = result.items;

    // Subscribe to changes
    unsubscribe = await pb.collection('listings').subscribe('*', (e) => {
      if (e.action === 'create') {
        listings = [e.record, ...listings];
      } else if (e.action === 'update') {
        listings = listings.map((l) => (l.id === e.record.id ? e.record : l));
      } else if (e.action === 'delete') {
        listings = listings.filter((l) => l.id !== e.record.id);
      }
    });
  });

  onDestroy(() => {
    unsubscribe?.();
  });
</script>

{#each listings as listing}
  <!-- Render listing -->
{/each}
```

### Type Safety with PocketBase

Generate TypeScript types from PocketBase schema:

```typescript
// src/lib/types/pocketbase.ts (auto-generated)
export interface ListingsRecord {
  id: string;
  owner: string;
  title: string;
  type: 'trade' | 'sell' | 'want';
  status: 'draft' | 'published' | 'pending' | 'completed' | 'archived';
  created: string;
  updated: string;
}

export interface UsersRecord {
  id: string;
  username: string;
  email: string;
  name: string;
  vouch_count: number;
  trade_count: number;
  joined_date: string;
}
```

**Using expanded relations:**

```typescript
// When using expand: 'owner'
interface ListingWithOwner extends ListingsRecord {
  expand?: {
    owner: UsersRecord;
  };
}

const listing = await pb.collection('listings').getOne<ListingWithOwner>(id, {
  expand: 'owner',
});

// Type-safe access
const ownerName = listing.expand?.owner.name;
```

## Component Patterns

### Component Naming

- **PascalCase** for components: `ListingCard.svelte`, `TrustBadge.svelte`
- **camelCase** for utilities: `formatDate.ts`, `calculateTier.ts`
- **snake_case** for PocketBase fields: `vouch_count`, `joined_date`

### Props and TypeScript

```svelte
<script lang="ts">
  import type { ListingsRecord, UsersRecord } from '$lib/types/pocketbase';

  export let listing: ListingsRecord;
  export let showOwner: boolean = true;
  export let onClick: ((id: string) => void) | undefined = undefined;
</script>

<article class="listing-card">
  <h3>{listing.title}</h3>

  {#if showOwner && listing.expand?.owner}
    <p>By {listing.expand.owner.name}</p>
  {/if}

  {#if onClick}
    <button on:click={() => onClick?.(listing.id)}>View</button>
  {/if}
</article>
```

### Form Actions Pattern

Use SvelteKit form actions for mutations:

```typescript
// src/routes/listings/new/+page.server.ts
import type { Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';

const listingSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().min(10),
  type: z.enum(['trade', 'sell', 'want']),
});

export const actions: Actions = {
  default: async ({ request, locals }) => {
    if (!locals.user) {
      return fail(401, { error: 'Must be logged in' });
    }

    const formData = await request.formData();
    const data = {
      title: formData.get('title'),
      description: formData.get('description'),
      type: formData.get('type'),
    };

    // Validate
    const result = listingSchema.safeParse(data);
    if (!result.success) {
      return fail(400, {
        errors: result.error.flatten().fieldErrors,
        data,
      });
    }

    // Create listing
    try {
      const listing = await locals.pb.collection('listings').create({
        ...result.data,
        owner: locals.user.id,
        status: 'draft',
      });

      throw redirect(303, `/listings/${listing.id}`);
    } catch (err) {
      return fail(500, { error: 'Failed to create listing' });
    }
  },
};
```

**Corresponding form component:**

```svelte
<script lang="ts">
  import type { ActionData } from './$types';

  export let form: ActionData;
</script>

<form method="POST">
  <label>
    Title
    <input
      name="title"
      value={form?.data?.title ?? ''}
      aria-invalid={form?.errors?.title ? 'true' : undefined}
    />
    {#if form?.errors?.title}
      <span class="error">{form.errors.title[0]}</span>
    {/if}
  </label>

  <label>
    Type
    <select name="type">
      <option value="trade">Trade</option>
      <option value="sell">Sell</option>
      <option value="want">Want to Buy</option>
    </select>
  </label>

  <button type="submit">Create Listing</button>

  {#if form?.error}
    <p class="error">{form.error}</p>
  {/if}
</form>
```

### Reusable Component Example

```svelte
<!-- src/lib/components/TrustBadge.svelte -->
<script lang="ts">
  import { getTrustTier } from '$lib/utils/trust';
  import type { UsersRecord } from '$lib/types/pocketbase';

  export let user: UsersRecord;
  export let showDetails: boolean = false;

  $: tier = getTrustTier(user);
  $: icon = {
    new: '🆕',
    seedling: '🌱',
    growing: '🪴',
    established: '🌳',
    trusted: '⭐',
  }[tier];

  $: colorClass = {
    new: 'border-amber-500/80 bg-amber-500/10 text-amber-200',
    seedling: 'border-lime-500/80 bg-lime-500/10 text-lime-200',
    growing: 'border-sky-500/80 bg-sky-500/10 text-sky-200',
    established: 'border-emerald-500/80 bg-emerald-500/10 text-emerald-200',
    trusted: 'border-violet-500/80 bg-violet-500/10 text-violet-200',
  }[tier];
</script>

<span class="trust-badge {colorClass}" title={tier}>
  {icon}
  {tier}
  {#if showDetails}
    <span class="details">
      ({user.vouch_count} vouches, {user.trade_count} trades)
    </span>
  {/if}
</span>

<style>
  .trust-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    border-width: 1px;
    font-size: 0.875rem;
    font-weight: 500;
  }
</style>
```

## State Management

### Svelte Stores

For shared state across components:

```typescript
// src/lib/stores/user.ts
import { writable, derived } from 'svelte/store';
import type { UsersRecord } from '$lib/types/pocketbase';
import { getTrustTier } from '$lib/utils/trust';

export const currentUser = writable<UsersRecord | null>(null);

export const userTier = derived(currentUser, ($user) => {
  return $user ? getTrustTier($user) : null;
});

export const canVouch = derived(currentUser, ($user) => {
  if (!$user) return false;
  return $user.vouch_count >= 1 || $user.phone_verified;
});
```

**Using stores in components:**

```svelte
<script lang="ts">
  import { currentUser, canVouch } from '$lib/stores/user';
</script>

{#if $currentUser}
  <p>Welcome, {$currentUser.name}!</p>

  {#if $canVouch}
    <button>Vouch for this trader</button>
  {/if}
{/if}
```

### Page-Level State

For state that doesn't need to be shared, use reactive declarations:

```svelte
<script lang="ts">
  let searchTerm = '';
  let selectedType: 'all' | 'trade' | 'sell' | 'want' = 'all';

  // Reactive - recalculates when dependencies change
  $: filteredListings = listings.filter((l) => {
    const matchesSearch = l.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || l.type === selectedType;
    return matchesSearch && matchesType;
  });
</script>
```

## Styling Patterns

### Tailwind CSS Organization

Group Tailwind classes logically for readability:

```svelte
<article
  class="
  flex flex-col gap-4
  p-6 rounded-lg
  bg-white dark:bg-gray-800
  border border-gray-200 dark:border-gray-700
  hover:shadow-lg transition-shadow
"
>
  <!-- Content -->
</article>
```

**Order:**

1. Layout (flex, grid, block)
2. Spacing (padding, margin, gap)
3. Typography (text size, weight, color)
4. Backgrounds and borders
5. Effects (shadow, opacity, transitions)
6. Responsive modifiers (sm:, md:, lg:)
7. State modifiers (hover:, focus:, dark:)

### Component-Scoped Styles

Use `<style>` blocks for complex styles not easily expressed in Tailwind:

```svelte
<script>
  export let progress = 0; // 0-100
</script>

<div class="progress-bar">
  <div class="progress-fill" style="width: {progress}%"></div>
</div>

<style>
  .progress-bar {
    position: relative;
    height: 8px;
    background: #e5e7eb;
    border-radius: 9999px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #3b82f6, #8b5cf6);
    transition: width 0.3s ease;
  }
</style>
```

## Utility Function Patterns

### Trust Tier Calculation

```typescript
// src/lib/utils/trust.ts
import type { UsersRecord } from '$lib/types/pocketbase';

export type TrustTier = 'new' | 'seedling' | 'growing' | 'established' | 'trusted';

export function getTrustTier(user: UsersRecord): TrustTier {
  const accountAgeDays = Math.floor(
    (Date.now() - new Date(user.joined_date).getTime()) / (1000 * 60 * 60 * 24)
  );

  const vouchedTrades = user.vouch_count; // Assuming this tracks vouched trades

  if (accountAgeDays >= 365 && vouchedTrades >= 8) {
    return 'trusted';
  }

  if (vouchedTrades >= 5) {
    return 'established';
  }

  if (accountAgeDays >= 30 && vouchedTrades >= 2) {
    return 'growing';
  }

  if (vouchedTrades >= 1) {
    return 'seedling';
  }

  return 'new';
}

export function canUserVouch(user: UsersRecord): boolean {
  return user.vouch_count >= 1 || user.phone_verified === true;
}
```

### Date Formatting

```typescript
// src/lib/utils/date.ts

export function formatRelativeTime(date: string | Date): string {
  const now = Date.now();
  const then = typeof date === 'string' ? new Date(date).getTime() : date.getTime();
  const diffMs = now - then;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

export function formatAccountAge(joinedDate: string): string {
  const days = Math.floor((Date.now() - new Date(joinedDate).getTime()) / (1000 * 60 * 60 * 24));

  if (days < 30) return `${days} days`;
  if (days < 365) return `${Math.floor(days / 30)} months`;
  return `${Math.floor(days / 365)} years`;
}
```

## Error Handling

### Server-Side Errors

```typescript
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
  // 404 Not Found
  const listing = await locals.pb
    .collection('listings')
    .getOne(params.id)
    .catch(() => {
      throw error(404, { message: 'Listing not found' });
    });

  // 403 Forbidden
  if (listing.owner !== locals.user?.id && listing.status === 'draft') {
    throw error(403, { message: 'You do not have permission to view this draft' });
  }

  // 401 Unauthorized
  if (!locals.user) {
    throw error(401, { message: 'You must be logged in' });
  }

  return { listing };
};
```

### Client-Side Error Handling

```svelte
<script lang="ts">
  import { goto } from '$app/navigation';

  let loading = false;
  let error: string | null = null;

  async function handleSubmit() {
    loading = true;
    error = null;

    try {
      const response = await fetch('/api/listings', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || 'Failed to create listing');
      }

      const listing = await response.json();
      goto(`/listings/${listing.id}`);
    } catch (err) {
      error = err instanceof Error ? err.message : 'An error occurred';
    } finally {
      loading = false;
    }
  }
</script>

<form on:submit|preventDefault={handleSubmit}>
  <!-- Form fields -->

  {#if error}
    <div class="error" role="alert">
      {error}
    </div>
  {/if}

  <button type="submit" disabled={loading}>
    {loading ? 'Creating...' : 'Create Listing'}
  </button>
</form>
```

## Performance Best Practices

### Lazy Loading Components

```svelte
<script lang="ts">
  import { onMount } from 'svelte';

  let HeavyComponent;

  onMount(async () => {
    // Only load when component mounts
    const module = await import('$lib/components/HeavyComponent.svelte');
    HeavyComponent = module.default;
  });
</script>

{#if HeavyComponent}
  <svelte:component this={HeavyComponent} />
{:else}
  <p>Loading...</p>
{/if}
```

### Debouncing Search Input

```svelte
<script lang="ts">
  import { debounce } from '$lib/utils/debounce';

  let searchTerm = '';
  let results = [];

  const performSearch = debounce(async (term: string) => {
    if (!term) {
      results = [];
      return;
    }

    const response = await fetch(`/api/search?q=${encodeURIComponent(term)}`);
    results = await response.json();
  }, 300);

  $: performSearch(searchTerm);
</script>

<input type="search" bind:value={searchTerm} placeholder="Search listings..." />
```

### Pagination

```typescript
// src/routes/listings/+page.server.ts
export const load: PageServerLoad = async ({ locals, url }) => {
  const page = parseInt(url.searchParams.get('page') || '1');
  const perPage = 20;

  const listings = await locals.pb.collection('listings').getList(page, perPage, {
    filter: 'status="published"',
    sort: '-created',
    expand: 'owner',
  });

  return {
    listings: listings.items,
    page: listings.page,
    totalPages: listings.totalPages,
  };
};
```

## Security Considerations

### Authentication Guards

```typescript
// src/routes/listings/new/+page.server.ts
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) {
    throw redirect(303, '/login?redirectTo=/listings/new');
  }

  return {};
};
```

### CSRF Protection

SvelteKit provides CSRF protection automatically for form actions. Always use form actions for mutations:

```svelte
<!-- ✅ Protected by CSRF token -->
<form method="POST" action="?/delete">
  <button type="submit">Delete</button>
</form>

<!-- ❌ Not protected - avoid -->
<button on:click={() => fetch('/api/delete', { method: 'POST' })}> Delete </button>
```

### Input Validation

Always validate on both client and server:

```typescript
// Server-side validation (required)
import { z } from 'zod';

const schema = z.object({
  title: z.string().min(3).max(100),
  price: z.number().positive().max(10000),
});

export const actions: Actions = {
  default: async ({ request }) => {
    const data = Object.fromEntries(await request.formData());
    const result = schema.safeParse(data);

    if (!result.success) {
      return fail(400, { errors: result.error.flatten() });
    }

    // Proceed with validated data
  },
};
```

## Related Documentation

- [Getting Started](./getting-started.md) - Setup and installation
- [Data Models](./data-models.md) - PocketBase schema reference
- [Testing Guide](./testing.md) - Unit and E2E testing patterns
- [Trust Tiers](../reputation/trust-tiers.md) - Trust tier implementation

---

**Last updated:** 2025-10-20
**Maintainer:** Development Team
