# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🎯 Current Focus: MVP Implementation

**Primary Guide:** [spec/mvp-plan.md](./spec/mvp-plan.md)
**Status:** 70% complete, 3 weeks to MVP launch
**Current Sprint:** Week 1 - Core Trade Flow

### What You're Building

Meeple Cart is a board game trading platform for New Zealand. The **database schema, authentication, messaging, and listing systems are complete**. The critical missing piece is the **trade workflow** - users can message about listings but can't formalize trades.

### Your Mission

1. Implement the trade workflow following the day-by-day plan in [spec/mvp-plan.md](./spec/mvp-plan.md):

1. **Week 1 (Days 1-5):** Trade initiation → confirmation → completion
2. **Week 2 (Days 6-10):** Feedback system (ratings, reviews, vouches)
3. **Week 3 (Days 11-15):** Browse/search pages + launch prep

### Before You Start

1. Read [spec/mvp-plan.md](./spec/mvp-plan.md) sections:
   - Executive Summary (understand the gap)
   - Current week's goals (know what to build)
   - Specific day's tasks (detailed implementation steps)

2. Reference [spec/trade-flow-gaps.md](./spec/trade-flow-gaps.md) for:
   - Detailed code examples
   - Acceptance criteria per feature
   - Expected user flows

3. Check the "Critical Decisions" section if working on Week 2+
   - Get user input on rating system, vouch eligibility, etc.

---

## Commands

### Development

- `just dev` - **Primary dev command**: installs dependencies, sets up .env, downloads PocketBase, applies migrations, and starts both PocketBase and SvelteKit dev servers
- `npm run dev` - Start SvelteKit dev server only (requires PocketBase running separately)

### Testing

- `npm run test` - Run Vitest unit tests
- `npm run test:watch` - Run Vitest in watch mode
- `npm run test:e2e` - Run Playwright end-to-end tests
- `npm run test:e2e:ui` - Run Playwright tests with UI

### Code Quality

- `npm run lint` - Format with Prettier and lint with ESLint
- `npm run format` - Format code with Prettier
- `npm run check` - Run Svelte type checking
- `npm run check:watch` - Run Svelte type checking in watch mode

### Build & Data

- `npm run build` - Production build via SvelteKit
- `npm run preview` - Preview production build
- `npm run seed:demo` - Seed database with demo data using `scripts/seed-demo-data.ts`

---

## Architecture

### Tech Stack

- **Frontend**: SvelteKit 2 with Svelte 5 (runes mode) and Tailwind CSS 4
- **Backend**: PocketBase (embedded SQLite with real-time APIs)
- **Architecture**: Client-side SPA (no SSR, all data via PocketBase client SDK)
- **Testing**: Vitest for unit tests, Playwright for e2e
- **Build**: Vite, ESLint, Prettier

### Critical Architecture Decisions

**✅ Client-Side Only Architecture**

- No `+page.server.ts` files (we removed them during Svelte 5 migration)
- All routes use `+page.ts` loaders with client-side PocketBase SDK
- Import from `$lib/pocketbase` (not `$lib/server/*` - that's for PocketBase hooks only)
- Use Svelte 5 runes (`$state`, `$derived`, `$effect`) not reactive statements (`$:`)

**✅ Event Handlers**

- Use new syntax: `onclick={handler}` not `on:click={handler}`
- Same for `onsubmit`, `onchange`, etc.

**✅ PocketBase Access**

```typescript
import { pb, currentUser } from '$lib/pocketbase';

// Check auth
const user = get(currentUser); // or use $currentUser in components

// Create record
await pb.collection('trades').create({ ... });

// Query with relations
await pb.collection('trades').getOne(id, {
  expand: 'buyer,seller,listing'
});
```

### Project Structure

```
src/
├── routes/                    # SvelteKit file-based routing
│   ├── listings/[id]/
│   │   ├── +page.svelte      # ⚠️ ADD "Propose Trade" button here (Day 1)
│   │   └── +page.ts          # Client-side loader
│   ├── trades/
│   │   ├── +page.svelte      # ⚠️ Update trade dashboard (Day 5)
│   │   ├── +page.ts
│   │   └── [id]/
│   │       ├── +page.svelte  # ⚠️ Major updates needed (Days 2-4)
│   │       └── +page.ts
│   ├── browse/               # ⚠️ Need to create (Day 11)
│   └── wanted/               # ⚠️ Need to create (Day 12)
├── lib/
│   ├── components/           # Reusable Svelte components (PascalCase)
│   ├── types/               # TypeScript types for PocketBase
│   ├── utils/               # Utility functions (camelCase)
│   └── pocketbase.ts        # Client instance & currentUser store
└── app.css                   # Tailwind + CSS custom properties
```

### PocketBase Integration

**Schema Location:**

- `pocketbase/schema/pb_schema.json` - Complete schema (11 collections)
- `pocketbase/pb_migrations/` - Migration scripts (auto-applied via PocketBase)

**Data Model: listing → offer_template → game(s)**

The platform uses a three-tier model:

```typescript
// listings - Container/grouping owned by user
{
  owner: relation(users),
  title: text,
  summary: text,
  location: text,
  regions: json,  // array of region strings
  status: 'active' | 'pending' | 'completed' | 'cancelled',
  photos: file[],
  views: number,
  bump_date: date
}

// offer_templates - The "for sale/trade" unit (what appears in activity feed)
{
  listing: relation(listings),
  owner: relation(users),
  items: relation(games[]),  // one or more games in this offer
  display_name: text,        // e.g., "Everdell + Expansions Bundle"
  cash_amount: number,       // asking price (if selling)
  open_to_lower_offers: bool,  // "or nearest offer"
  open_to_trade_offers: bool,  // accepts trades
  trade_for_items: json,     // what they'd accept in trade
  can_post: bool,            // can be posted/shipped
  notes: text,
  status: 'active' | 'accepted' | 'invalidated' | 'withdrawn'
}

// items - Individual tradeable items (games, accessories, 3D printed parts, etc.)
{
  listing: relation(listings),
  bgg_id: number,            // optional - 0 for non-game items
  title: text,               // from BGG or manual entry for other items
  year: number,
  condition: 'mint' | 'excellent' | 'good' | 'fair' | 'poor',
  notes: text,
  status: 'available' | 'pending' | 'sold' | 'bundled',
  photo_regions: json
}

// trades - When a buyer makes an offer on an offer_template
{
  listing: relation(listings),
  buyer: relation(users),
  seller: relation(users),
  status: 'initiated' | 'confirmed' | 'completed' | 'disputed' | 'cancelled',
  offer_status: 'pending' | 'accepted' | 'declined' | 'withdrawn',
  cash_offer_amount: number,
  requested_items: relation(items[]),
  shipping_method: 'in_person' | 'shipped' | 'either',
  offer_message: text,
  rating: number,
  review: text,
  completed_date: date
}

// vouches - Trust system
{
  voucher: relation(users),
  vouchee: relation(users),
  message: text
}

// users - Extended with trade stats
{
  display_name: text,
  trade_count: number,
  vouch_count: number,
  cascade_reputation: number
}
```

**Common Flows:**

- **Single game:** User adds game with price/terms → creates both `game` and `offer_template` records
- **Bundle:** User adds multiple games → groups them into one `offer_template` with combined terms
- **Activity feed:** Shows `offer_templates` with their games, filters on `can_post`, `open_to_trade_offers`, regions

**TypeScript Types:**

- `src/lib/types/pocketbase.ts` - Generated types for all collections
- `src/lib/types/listing.ts` - Domain models for listings/games
- Use these types everywhere for type safety

### Key Domain Models

- **Listings**: Container/grouping owned by users
- **Offer Templates**: The actual "for sale/trade" unit with price, shipping, and trade terms
- **Items**: Individual tradeable items (board games with BGG integration, accessories, 3D parts, etc.)
- **Trades**: Formal trade records tracking buyer/seller, status, and feedback
- **Vouches**: Trust endorsements between users
- **Users**: Extended auth records with profile data, trade history, and trust metrics

---

## Development Workflow for Trade Flow

### Day-by-Day Approach

Each day in the MVP plan follows this pattern:

1. **Morning:**
   - Read the day's section in [spec/mvp-plan.md](./spec/mvp-plan.md)
   - Review acceptance criteria
   - Check referenced files exist

2. **Implementation:**
   - Edit the files listed in the day's tasks
   - Use existing components where possible (see `src/lib/components/`)
   - Follow code style guidelines below
   - Test as you go (two browser windows, different users)

3. **Testing:**
   - Manual test: happy path + error cases
   - Check mobile responsiveness (browser dev tools)
   - Verify notifications sent (check PocketBase admin)
   - Ensure proper error handling

4. **Commit:**
   - Clear commit message: `feat: [what you built]`
   - Reference the day/task: "Day 1: Add trade initiation button"

### Example: Day 1 Implementation Flow

**Task:** Add "Propose Trade" button to listing detail page

**Steps:**

1. Open `src/routes/listings/[id]/+page.svelte`
2. Find the contact/message section (around line 400-500)
3. Add button that creates trade via PocketBase:

```svelte
{#if $currentUser && $currentUser.id !== listing.owner}
  <button
    class="btn-primary"
    onclick={async () => {
      try {
        const trade = await pb.collection('trades').create({
          listing: listing.id,
          buyer: $currentUser.id,
          seller: listing.owner,
          status: 'initiated',
        });

        // Send notification
        await pb.collection('notifications').create({
          user: listing.owner,
          type: 'trade_initiated',
          title: 'New trade proposal',
          message: `${$currentUser.display_name} wants to trade for "${listing.title}"`,
          link: `/trades/${trade.id}`,
          read: false,
        });

        goto(`/trades/${trade.id}`);
      } catch (err) {
        console.error('Failed to initiate trade:', err);
        // Show error to user
      }
    }}
  >
    Propose Trade
  </button>
{/if}
```

4. Test with two users (seller and buyer)
5. Verify notification appears, redirects to trade detail
6. Commit: `feat: add trade initiation from listing detail (Day 1)`

---

## Code Style (Enforced by Prettier/ESLint)

### General

- 2-space indentation, single quotes, trailing commas
- Components use PascalCase, utilities use camelCase
- PocketBase field names use snake_case (e.g., `display_name`)
- TypeScript types at API boundaries

### Svelte 5 Specifics

**✅ Do this:**

```svelte
<script>
  import { pb, currentUser } from '$lib/pocketbase';

  let count = $state(0);
  let doubled = $derived(count * 2);

  $effect(() => {
    console.log('count changed:', count);
  });

  function handleClick() {
    count++;
  }
</script>

<button onclick={handleClick}>Count: {count}</button>
```

**❌ Don't do this:**

```svelte
<script>
  // Old Svelte 4 patterns - don't use these
  let count = 0;
  $: doubled = count * 2;  // ❌ Use $derived instead

  $: {  // ❌ Use $effect instead
    console.log(count);
  }
</script>

<button on:click={handleClick}>  <!-- ❌ Use onclick={} instead -->
```

### Tailwind Classes

Group logically: layout → spacing → typography → colors → states

```svelte
<!-- Good -->
<div class="flex items-center gap-4 rounded-lg border border-subtle bg-surface-card px-4 py-3 text-sm text-primary hover:border-accent">

<!-- Avoid -->
<div class="text-sm flex hover:border-accent px-4 rounded-lg items-center">
```

### Error Handling

Always handle PocketBase errors gracefully:

```typescript
try {
  const result = await pb.collection('trades').create({ ... });
  // Success handling
} catch (err) {
  console.error('Failed to create trade:', err);

  // Show user-friendly error
  if (err.status === 400) {
    alert('Invalid trade data. Please try again.');
  } else if (err.status === 403) {
    alert('You do not have permission to create this trade.');
  } else {
    alert('Something went wrong. Please try again later.');
  }
}
```

---

## Testing Strategy

### Manual Testing (Required Daily)

**Two-Browser Setup:**

1. Open browser window 1: Register as "Alice"
2. Open browser window 2 (incognito): Register as "Bob"
3. Alice creates listing
4. Bob views listing → initiates trade
5. Alice views trade → confirms
6. Follow through complete workflow

**Check:**

- UI updates correctly
- Notifications sent to right user
- Database records created (check PocketBase admin at :8090/\_/)
- Mobile view works (responsive design)

### Unit Tests (Write for Complex Logic)

```typescript
// src/lib/utils/trust-tiers.test.ts
import { describe, it, expect } from 'vitest';
import { calculateTrustTier } from './trust-tiers';

describe('calculateTrustTier', () => {
  it('returns Newcomer for 0-2 vouches', () => {
    expect(calculateTrustTier(0, 5)).toBe('Newcomer');
    expect(calculateTrustTier(2, 10)).toBe('Newcomer');
  });

  it('returns Trusted Member for 3-9 vouches', () => {
    expect(calculateTrustTier(5, 2)).toBe('Trusted Member');
  });

  // ... more tests
});
```

### E2E Tests (Write for Critical Paths)

After Week 1 complete, write E2E test for full trade flow:

```typescript
// tests/e2e/trade-flow.spec.ts
import { test, expect } from '@playwright/test';

test('complete trade workflow', async ({ page, context }) => {
  // Create two users
  const alice = await context.newPage();
  const bob = page;

  // Alice creates listing
  // Bob initiates trade
  // Alice confirms
  // Bob marks shipped
  // Alice marks complete
  // Both leave feedback

  // Assert: trade_count incremented for both
});
```

---

## Common Patterns & Snippets

### Loading User Data

```svelte
<script>
  import type { PageData } from './$types';
  import { currentUser } from '$lib/pocketbase';

  let { data }: { data: PageData } = $props();

  // Access current user
  let user = $derived($currentUser);

  // Check if user is authenticated
  {#if user}
    <p>Welcome, {user.display_name}!</p>
  {:else}
    <a href="/login">Log in</a>
  {/if}
</script>
```

### Creating Records with Relations

```typescript
// In +page.svelte or component
import { pb, currentUser } from '$lib/pocketbase';
import { get } from 'svelte/store';

async function createTrade(listingId: string, sellerId: string) {
  const user = get(currentUser);
  if (!user) throw new Error('Must be authenticated');

  const trade = await pb.collection('trades').create({
    listing: listingId,
    buyer: user.id,
    seller: sellerId,
    status: 'initiated',
    created: new Date().toISOString(),
  });

  return trade;
}
```

### Querying with Expand

```typescript
// Load trade with related buyer, seller, and listing
const trade = await pb.collection('trades').getOne(tradeId, {
  expand: 'buyer,seller,listing,listing.owner',
});

// Access expanded data
const buyer = trade.expand?.buyer;
const seller = trade.expand?.seller;
const listing = trade.expand?.listing;
```

### Sending Notifications

```typescript
async function notifyTradeUpdate(userId: string, tradeId: string, message: string) {
  await pb.collection('notifications').create({
    user: userId,
    type: 'trade_update',
    title: 'Trade Update',
    message: message,
    link: `/trades/${tradeId}`,
    read: false,
    created: new Date().toISOString(),
  });
}
```

### Status Management Pattern

```svelte
<script>
  let status = $state('initiated');

  async function updateStatus(newStatus: string) {
    try {
      await pb.collection('trades').update(tradeId, {
        status: newStatus,
      });
      status = newStatus;
      // Send notifications, update related records, etc.
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  }
</script>

<!-- Visual status indicator -->
<div class="flex items-center gap-2">
  {#each ['initiated', 'confirmed', 'shipped', 'completed'] as s}
    <div class={status === s ? 'bg-accent' : 'bg-muted'}>
      {s}
    </div>
  {/each}
</div>

<!-- Action buttons based on status -->
{#if status === 'initiated' && isCounterparty}
  <button onclick={() => updateStatus('confirmed')}> Confirm Trade </button>
{:else if status === 'confirmed' && isSeller}
  <button onclick={() => updateStatus('shipped')}> Mark as Shipped </button>
{/if}
```

---

## Important Reminders

### What's Already Done (Don't Reinvent)

✅ Authentication & user profiles
✅ Listing creation/management
✅ Messaging system
✅ Notifications infrastructure
✅ Watchlist functionality
✅ Gift cascade system
✅ Database schema (100% complete)

### What You're Building (Focus Here)

⚠️ Trade initiation UI
⚠️ Trade detail page improvements
⚠️ Trade status management
⚠️ Feedback forms (ratings, reviews)
⚠️ Vouch creation workflow
⚠️ Trust tier calculations & display
⚠️ Browse/search pages

### Files You'll Edit Most

**Week 1:**

- `src/routes/listings/[id]/+page.svelte` - Add trade button
- `src/routes/trades/[id]/+page.svelte` - Trade detail improvements
- `src/routes/trades/[id]/+page.ts` - Load trade data
- `src/routes/trades/+page.svelte` - Trade dashboard
- `src/routes/trades/+page.ts` - Load user's trades

**Week 2:**

- `src/routes/trades/[id]/+page.svelte` - Add feedback forms
- `src/routes/users/[id]/+page.svelte` - Display reviews & vouches
- `src/lib/components/TrustBadge.svelte` - NEW component
- `src/lib/utils/trust-tiers.ts` - NEW utility

**Week 3:**

- `src/routes/browse/+page.svelte` - NEW page
- `src/routes/browse/+page.ts` - NEW loader
- `src/routes/wanted/+page.svelte` - NEW page
- `src/routes/wanted/+page.ts` - NEW loader

### Performance Best Practices

- Use pagination (max 50 items): `pb.collection('trades').getList(page, 50)`
- Use `expand` parameter to avoid N+1 queries
- Index fields used in filters (already done in schema)
- Lazy load images: PocketBase provides thumbnails via `?thumb=200x200`
- Cache user data where appropriate (but not trade status - needs to be fresh)

---

## Debugging Tips

### PocketBase Admin Dashboard

Access at http://127.0.0.1:8090/_/

- View all records in collections
- Check if trades/notifications were created
- Verify relationships expanded correctly
- Test auth as different users

### Console Logging

```typescript
// Log PocketBase responses
const trade = await pb.collection('trades').getOne(id, { expand: 'buyer,seller' });
console.log('Trade loaded:', trade);
console.log('Expanded buyer:', trade.expand?.buyer);
```

### Common Issues

**Issue:** "Cannot import from $lib/server"
**Fix:** You're in client-side code. Import from `$lib/pocketbase` instead

**Issue:** "on:click is deprecated"
**Fix:** Use `onclick={}` not `on:click={}`

**Issue:** "$: is not allowed in runes mode"
**Fix:** Use `$derived`for reactive values,`$effect` for side effects

**Issue:** Trade not showing up in dashboard
**Fix:** Check buyer/seller IDs match current user, check expand parameter

**Issue:** Notification not appearing
**Fix:** Verify notification created in PocketBase admin, check `user` field matches

---

## Next Steps

1. **Start Implementation:** Begin with Day 1 in [spec/mvp-plan.md](./spec/mvp-plan.md)
2. **Reference Detailed Specs:** Check [spec/trade-flow-gaps.md](./spec/trade-flow-gaps.md) for code examples
3. **Test Continuously:** Use two-browser setup to test as different users
4. **Commit Often:** Small, focused commits with clear messages

**Questions?** Check the specs first, then ask the user for clarification on decisions.

**Stuck?** Reference existing working code in `src/routes/messages/` or `src/routes/cascades/` for patterns.

---

**Current Target:** Complete Week 1 (Days 1-5) to get basic trade flow working end-to-end.
