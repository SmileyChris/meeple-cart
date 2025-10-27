# Trade Flow Implementation Gaps

**Document Version:** 1.0
**Date:** 2025-10-22
**Status:** Analysis Complete
**Priority:** P0 - Critical for MVP Launch

---

## Executive Summary

This document identifies missing components in the Meeple Cart trade flow implementation. While the database schema and documentation are complete, **critical UI and API endpoints are missing** that prevent users from completing trades end-to-end.

**Current State:** Users can create listings, message each other, and manually update game status, but cannot formally initiate trades, track trade progress, or complete the feedback loop.

**Impact:** The platform lacks the core transaction workflow described in the Phase 1 MVP requirements. Users cannot build trust through the trade counter or vouch system without these features.

**Estimated Effort:** 3 weeks to complete all Phase 1 trade flow requirements.

---

## What's Implemented ✅

The following components are fully functional:

### 1. Communication System

- **Status:** ✅ Complete
- **Location:** `src/routes/messages/`
- Private messaging between users per listing
- Public comments on listings
- Email notifications for new messages
- Message threading and read status

### 2. Database Schema

- **Status:** ✅ Complete
- **Location:** `services/pocketbase/schema/pb_schema.json`
- `trades` collection with all required fields:
  - `listing`, `buyer`, `seller` relations
  - `status` (initiated, confirmed, completed, disputed)
  - `rating`, `review`, `completed_date`
- `vouches` collection ready for use
- Proper indexes and access rules configured

### 3. Listing Management

- **Status:** ✅ Complete
- **Location:** `src/routes/listings/[id]/manage/`
- Create multi-game listings
- Edit game details (title, condition, notes, BGG ID)
- Update individual game status (available/pending/sold/bundled)
- Add/remove games from listings

### 4. Documentation

- **Status:** ✅ Complete
- **Location:** `docs/trust-and-vouches.md`, `spec/prd.md`
- Trade flow requirements documented
- Vouch system lifecycle defined
- Trust tier specifications complete

---

## Critical Gaps (Blocking MVP Launch) ❌

### Gap 1: Trade Record Creation

**Impact:** HIGH - Users cannot formally initiate trades
**Effort:** 2 days

#### What's Missing

No way for users to create a formal trade record when buyer and seller reach agreement.

#### Expected Flow

```
1. Buyer and seller agree via messages
2. Either party clicks "Initiate Trade" button
3. System creates trade record:
   - listing: [current listing]
   - buyer: [interested user]
   - seller: [listing owner]
   - status: "initiated"
4. Both parties notified
5. Trade appears in "My Trades" dashboard
```

#### Required Implementation

**New API Endpoint:**

```typescript
// src/routes/listings/[id]/+page.server.ts
export const actions: Actions = {
  initiate_trade: async ({ locals, params, request }) => {
    // Verify authenticated
    // Verify not trading with self
    // Create trade record
    // Send notification to counterparty
    // Return trade ID
  },
};
```

**UI Changes:**

```svelte
<!-- src/routes/listings/[id]/+page.svelte -->
<!-- Add to sidebar contact section -->
<form method="POST" action="?/initiate_trade">
  <button>Propose Trade</button>
</form>
```

**Acceptance Criteria:**

- [x] Button appears for logged-in non-owners
- [x] Creates trade record in database
- [x] Sends notification to seller
- [x] Prevents duplicate trades for same listing/buyer pair
- [x] Redirects to trade detail page

---

### Gap 2: Trade Detail & Status Management

**Impact:** HIGH - No way to track or complete trades
**Effort:** 3 days

#### What's Missing

No dedicated page to view trade details, communicate about specific trade, or update trade status.

#### Expected Flow

```
1. User navigates to /trades/[id]
2. View shows:
   - Both parties (names, reputation)
   - Listing/games involved
   - Current status with timeline
   - Actions available based on role and status
3. User can:
   - Confirm receipt (buyer)
   - Mark shipped (seller)
   - Complete trade (both)
   - Dispute trade (both)
```

#### Required Implementation

**New Routes:**

```
src/routes/trades/[id]/+page.server.ts
src/routes/trades/[id]/+page.svelte
```

**Server Load Function:**

```typescript
export const load: PageServerLoad = async ({ locals, params }) => {
  // Fetch trade with expanded listing, buyer, seller
  // Verify user is participant
  // Return trade data
};
```

**Server Actions:**

```typescript
export const actions: Actions = {
  confirm_receipt: async ({ locals, params }) => {
    // Update trade status
    // Notify other party
  },

  mark_shipped: async ({ locals, params }) => {
    // Update trade status
    // Notify buyer
  },

  complete_trade: async ({ locals, params }) => {
    // Set status to 'completed'
    // Increment both users' trade_count
    // Update listing status to 'completed'
    // Update all games in listing to 'sold'
    // Trigger vouch prompts
    // Send completion notifications
  },

  dispute_trade: async ({ locals, params, request }) => {
    // Set status to 'disputed'
    // Capture dispute reason
    // Notify both parties
    // Alert moderators
  },
};
```

**UI Components:**

```svelte
<!-- Trade Timeline -->
<ol>
  <li>✓ Trade initiated - Oct 20</li>
  <li>✓ Seller confirmed - Oct 21</li>
  <li>→ Awaiting shipment</li>
</ol>

<!-- Action Buttons (conditional based on status & role) -->
{#if isBuyer && status === 'confirmed'}
  <form method="POST" action="?/confirm_receipt">
    <button>Confirm Receipt</button>
  </form>
{/if}

{#if isSeller && status === 'initiated'}
  <form method="POST" action="?/mark_shipped">
    <button>Mark as Shipped</button>
  </form>
{/if}

{#if status === 'confirmed'}
  <form method="POST" action="?/complete_trade">
    <button>Complete Trade</button>
  </form>
{/if}
```

**Acceptance Criteria:**

- [x] Trade detail page shows all trade information
- [x] Status-specific actions visible to correct party
- [x] Status transitions update database correctly
- [x] Completing trade increments trade_count for both users
- [x] Notifications sent on status changes
- [x] Listing and games updated when trade completes
- [x] Only trade participants can view page

---

### Gap 3: Trade History Dashboard

**Impact:** MEDIUM - Users can't review past trades
**Effort:** 2 days

#### What's Missing

No page showing user's trade history (active, completed, disputed).

#### Expected Flow

```
1. User navigates to /trades (or "My Trades" nav link)
2. View shows tabs:
   - Active (initiated, confirmed)
   - Completed
   - Disputed
3. Each trade card shows:
   - Other party name
   - Listing title/photo
   - Status
   - Date
   - Link to detail page
```

#### Required Implementation

**New Routes:**

```
src/routes/trades/+page.server.ts
src/routes/trades/+page.svelte
```

**Server Load:**

```typescript
export const load: PageServerLoad = async ({ locals, url }) => {
  const user = locals.user;
  const filter = url.searchParams.get('filter') ?? 'active';

  let statusFilter = '';
  if (filter === 'active') {
    statusFilter = 'status = "initiated" || status = "confirmed"';
  } else if (filter === 'completed') {
    statusFilter = 'status = "completed"';
  } else if (filter === 'disputed') {
    statusFilter = 'status = "disputed"';
  }

  const trades = await locals.pb.collection('trades').getFullList({
    filter: `(buyer = "${user.id}" || seller = "${user.id}") && (${statusFilter})`,
    expand: 'listing,buyer,seller',
    sort: '-created',
  });

  return { trades, filter };
};
```

**UI Layout:**

```svelte
<nav>
  <a href="/trades?filter=active">Active (3)</a>
  <a href="/trades?filter=completed">Completed (12)</a>
  <a href="/trades?filter=disputed">Disputed (0)</a>
</nav>

{#each trades as trade}
  <article>
    <img src={trade.expand.listing.photos[0]} />
    <div>
      <h3>{trade.expand.listing.title}</h3>
      <p>With: {otherParty.display_name}</p>
      <span>{statusLabel}</span>
    </div>
    <a href="/trades/{trade.id}">View</a>
  </article>
{/each}
```

**Navigation Addition:**

```svelte
<!-- src/routes/+layout.svelte -->
<a href="/trades">My Trades</a>
```

**Acceptance Criteria:**

- [x] Lists all trades where user is buyer or seller
- [x] Filter by status (active/completed/disputed)
- [x] Shows trade count per filter
- [x] Links to trade detail pages
- [x] Displays other party info and listing preview
- [x] Sorted by most recent first
- [x] "My Trades" link added to main navigation

---

### Gap 4: Feedback & Rating System

**Impact:** MEDIUM - No way to leave post-trade reviews
**Effort:** 2 days

#### What's Missing

After completing a trade, users cannot leave ratings or reviews for their trading partner.

#### Expected Flow

```
1. Trade status = 'completed'
2. User prompted to leave feedback
3. User selects rating (1-5 stars OR thumbs up/down per PRD)
4. User writes optional review text
5. Rating saved to trade.rating
6. Review saved to trade.review
7. Displayed on user profiles
```

#### Required Implementation

**Update Trade Detail Page:**

```typescript
// src/routes/trades/[id]/+page.server.ts
export const actions: Actions = {
  // ... existing actions

  leave_feedback: async ({ locals, params, request }) => {
    const data = await request.formData();
    const rating = parseInt(data.get('rating'));
    const review = data.get('review')?.toString();

    // Verify trade is completed
    // Verify user hasn't already left feedback
    // Update trade record
    // Notify other party (optional)

    await locals.pb.collection('trades').update(params.id, {
      rating,
      review,
    });
  },
};
```

**UI Component:**

```svelte
<!-- Show after trade completed, if no rating yet -->
{#if status === 'completed' && !trade.rating}
  <section>
    <h3>How was your experience?</h3>
    <form method="POST" action="?/leave_feedback">
      <div>
        <label>Rating</label>
        <select name="rating" required>
          <option value="1">1 - Poor</option>
          <option value="2">2 - Fair</option>
          <option value="3">3 - Good</option>
          <option value="4">4 - Very Good</option>
          <option value="5">5 - Excellent</option>
        </select>
      </div>

      <div>
        <label>Review (optional)</label>
        <textarea name="review" maxlength="2000"></textarea>
      </div>

      <button>Submit Feedback</button>
    </form>
  </section>
{/if}
```

**Profile Display:**

```typescript
// src/routes/users/[id]/+page.server.ts
// Fetch recent trades with reviews
const reviewsReceived = await pb.collection('trades').getList({
  filter: `seller = "${userId}" && review != ""`,
  sort: '-completed_date',
  limit: 10,
});

return { user, reviewsReceived };
```

```svelte
<!-- src/routes/users/[id]/+page.svelte -->
<section>
  <h2>Recent Reviews</h2>
  {#each reviewsReceived as trade}
    <blockquote>
      <p>{trade.review}</p>
      <footer>
        <span>⭐ {trade.rating}/5</span>
        <span>- {trade.expand.buyer.display_name}</span>
        <time>{formatDate(trade.completed_date)}</time>
      </footer>
    </blockquote>
  {/each}
</section>
```

**Acceptance Criteria:**

- [x] Feedback form appears after trade completion
- [x] Rating (1-5) and review text captured
- [x] Saved to trades.rating and trades.review
- [x] Reviews displayed on user public profiles
- [x] Cannot leave feedback twice for same trade
- [x] Only trade participants can leave feedback

---

### Gap 5: Vouch System UI

**Impact:** MEDIUM - Trust system incomplete
**Effort:** 3 days

#### What's Missing

Database schema exists, documentation complete, but no UI to create or display vouches.

Per `docs/trust-and-vouches.md`: Vouches should be prompted after completed trades and displayed on profiles.

#### Expected Flow

```
1. Trade status = 'completed'
2. User prompted: "Vouch for [partner]?"
3. User writes short testimonial (optional)
4. Vouch record created
5. Partner's vouch_count incremented
6. Vouch appears on partner's profile
```

#### Required Implementation

**Vouch Creation UI:**

Option A: Inline on trade detail page

```svelte
<!-- src/routes/trades/[id]/+page.svelte -->
{#if status === 'completed' && !hasVouched}
  <section>
    <h3>Vouch for {otherParty.display_name}?</h3>
    <p>Vouching builds community trust and helps others trade confidently.</p>
    <form method="POST" action="?/create_vouch">
      <textarea
        name="message"
        placeholder="Optional: Share what made this a great trade..."
        maxlength="1000"
      />
      <button>✓ Vouch</button>
      <button type="button" on:click={dismissPrompt}>Skip</button>
    </form>
  </section>
{/if}
```

Option B: Dedicated vouch page

```
src/routes/users/[id]/vouch/+page.server.ts
src/routes/users/[id]/vouch/+page.svelte
```

**Server Action:**

```typescript
// Option A: On trade detail page
export const actions: Actions = {
  create_vouch: async ({ locals, params, request }) => {
    const trade = await locals.pb.collection('trades').getOne(params.id);
    const data = await request.formData();
    const message = data.get('message')?.toString();

    // Determine vouchee (other party)
    const vouchee = trade.buyer === locals.user.id ? trade.seller : trade.buyer;

    // Check not already vouched
    const existing = await locals.pb.collection('vouches').getList({
      filter: `voucher = "${locals.user.id}" && vouchee = "${vouchee}"`,
    });

    if (existing.items.length > 0) {
      return fail(400, { error: 'Already vouched this user' });
    }

    // Create vouch
    await locals.pb.collection('vouches').create({
      voucher: locals.user.id,
      vouchee,
      message: message || '',
      created: new Date().toISOString(),
    });

    // Increment vouch_count
    const voucheeUser = await locals.pb.collection('users').getOne(vouchee);
    await locals.pb.collection('users').update(vouchee, {
      vouch_count: voucheeUser.vouch_count + 1,
    });

    // Send notification
    await locals.pb.collection('notifications').create({
      user: vouchee,
      type: 'vouch_received',
      title: `${locals.user.display_name} vouched for you!`,
      message: message || 'New vouch from a trading partner',
      link: `/users/${locals.user.id}`,
      read: false,
    });

    return { success: true };
  },
};
```

**Profile Display:**

```svelte
<!-- src/routes/users/[id]/+page.svelte -->
<section>
  <h2>Vouches ({user.vouch_count})</h2>

  {#if vouches.length > 0}
    <ul>
      {#each vouches as vouch}
        <li>
          <a href="/users/{vouch.expand.voucher.id}">
            {vouch.expand.voucher.display_name}
          </a>
          {#if vouch.message}
            <p>"{vouch.message}"</p>
          {/if}
          <time>{formatDate(vouch.created)}</time>
        </li>
      {/each}
    </ul>
  {:else}
    <p>No vouches yet</p>
  {/if}
</section>
```

**Load Vouches on Profile:**

```typescript
// src/routes/users/[id]/+page.server.ts
const vouches = await pb.collection('vouches').getList({
  filter: `vouchee = "${userId}"`,
  expand: 'voucher',
  sort: '-created',
  perPage: 10,
});

return { user, listings, vouches };
```

**Acceptance Criteria:**

- [x] Vouch prompt appears after completed trade
- [x] Creates vouch record in database
- [x] Increments vouchee's vouch_count
- [x] Sends notification to vouchee
- [x] Vouches displayed on user profiles (recent 10)
- [x] Cannot vouch same user multiple times
- [x] Vouch includes optional message
- [x] Links to voucher's profile

---

### Gap 6: Listing Status Transitions

**Impact:** MEDIUM - Manual process, prone to errors
**Effort:** 2 days

#### What's Missing

Listing status must be manually updated. No automatic transitions when trades are created/completed. No audit trail of status changes.

#### Expected Behavior

**Automatic Transitions:**

- Listing status → `pending` when trade initiated
- Listing status → `completed` when trade completes
- All games in listing → `sold` when listing completes

**Manual Controls:**

- Owner can revert `pending` → `active` if trade cancelled
- Owner can mark listing `cancelled` anytime

**Audit Trail:**

- Log every status change with timestamp and actor
- Display history to owner

#### Required Implementation

**Automatic Updates on Trade Actions:**

```typescript
// src/routes/listings/[id]/+page.server.ts
export const actions: Actions = {
  initiate_trade: async ({ locals, params, request }) => {
    // ... create trade record

    // Auto-update listing status
    await locals.pb.collection('listings').update(params.id, {
      status: 'pending',
    });

    // Log status change
    await logStatusChange(params.id, 'active', 'pending', 'Trade initiated', locals.user.id);
  },
};

// src/routes/trades/[id]/+page.server.ts
export const actions: Actions = {
  complete_trade: async ({ locals, params }) => {
    const trade = await locals.pb.collection('trades').getOne(params.id, {
      expand: 'listing',
    });

    // Update trade status
    await locals.pb.collection('trades').update(params.id, {
      status: 'completed',
      completed_date: new Date().toISOString(),
    });

    // Update listing status
    await locals.pb.collection('listings').update(trade.listing, {
      status: 'completed',
    });

    // Update all games in listing to sold
    const games = await locals.pb.collection('games').getFullList({
      filter: `listing = "${trade.listing}"`,
    });

    for (const game of games) {
      await locals.pb.collection('games').update(game.id, {
        status: 'sold',
      });
    }

    // Increment trade counts
    await incrementTradeCount(trade.buyer);
    await incrementTradeCount(trade.seller);

    // Log status changes
    await logStatusChange(trade.listing, 'pending', 'completed', 'Trade completed', locals.user.id);
  },
};
```

**Manual Status Controls:**

```svelte
<!-- src/routes/listings/[id]/+page.svelte or edit page -->
{#if isOwner}
  <form method="POST" action="?/update_listing_status">
    <label>Listing Status</label>
    <select name="status" value={listing.status}>
      <option value="active">Active</option>
      <option value="pending">Pending</option>
      <option value="completed">Completed</option>
      <option value="cancelled">Cancelled</option>
    </select>
    <button>Update Status</button>
  </form>
{/if}
```

**Status Audit Trail:**

Add new collection or JSON field:

```javascript
// Option 1: JSON field on listing
listings {
  // ... existing fields
  status_history: json // [{ from, to, reason, actor, timestamp }]
}

// Option 2: New collection
listing_status_logs {
  listing: relation,
  from_status: select,
  to_status: select,
  reason: text,
  actor: relation(users),
  timestamp: date
}
```

**Helper Function:**

```typescript
async function logStatusChange(
  listingId: string,
  fromStatus: string,
  toStatus: string,
  reason: string,
  actorId: string
) {
  const listing = await pb.collection('listings').getOne(listingId);
  const history = listing.status_history || [];

  history.push({
    from: fromStatus,
    to: toStatus,
    reason,
    actor: actorId,
    timestamp: new Date().toISOString(),
  });

  await pb.collection('listings').update(listingId, {
    status_history: history,
  });
}
```

**Acceptance Criteria:**

- [x] Listing status auto-updates when trade initiated
- [x] Listing status auto-updates when trade completed
- [x] All games marked 'sold' when listing completed
- [x] Owner can manually change listing status
- [x] Status changes logged with timestamp and reason
- [x] Status history displayed to owner
- [x] trade_count incremented on completion

---

## Implementation Roadmap

### Week 1: Core Trade Flow

**Days 1-2: Trade Initiation**

- [ ] Add "Initiate Trade" button to listing detail page
- [ ] Create API endpoint for trade creation
- [ ] Send notifications on trade creation
- [ ] Add basic trade confirmation UI

**Days 3-5: Trade Detail Page**

- [ ] Create `/trades/[id]` routes
- [ ] Build trade detail UI
- [ ] Implement status update actions
- [ ] Add automatic listing status transitions

### Week 2: Completion & Feedback

**Days 1-2: Trade Completion Flow**

- [ ] Complete trade action with all side effects
- [ ] Increment trade_count for both users
- [ ] Update listing and games to sold
- [ ] Send completion notifications

**Days 3-4: Rating System**

- [ ] Add feedback form to trade detail page
- [ ] Store ratings and reviews
- [ ] Display reviews on user profiles
- [ ] Prevent duplicate feedback

**Day 5: Testing & Polish**

- [ ] End-to-end trade flow testing
- [ ] Edge case handling
- [ ] Error messages and validation
- [ ] Mobile responsiveness

### Week 3: Trust System & History

**Days 1-3: Vouch System**

- [ ] Add vouch prompt after trade completion
- [ ] Create vouch action and validation
- [ ] Update vouch_count on creation
- [ ] Display vouches on profiles
- [ ] Send vouch notifications

**Days 4-5: Trade History**

- [ ] Create `/trades` page with filters
- [ ] Add "My Trades" to navigation
- [ ] Display trade history on profiles
- [ ] Status audit trail implementation

---

## Testing Checklist

### Trade Initiation

- [ ] Buyer can initiate trade from listing
- [ ] Seller receives notification
- [ ] Listing status becomes 'pending'
- [ ] Cannot initiate duplicate trades
- [ ] Cannot trade with self

### Trade Progression

- [ ] Both parties can view trade details
- [ ] Status updates correctly (initiated → confirmed → completed)
- [ ] Notifications sent on each status change
- [ ] Third parties cannot access trade details

### Trade Completion

- [ ] trade_count increments for buyer
- [ ] trade_count increments for seller
- [ ] Listing status becomes 'completed'
- [ ] All games marked 'sold'
- [ ] Completion notifications sent

### Feedback System

- [ ] Feedback form appears after completion
- [ ] Rating and review saved correctly
- [ ] Reviews appear on profiles
- [ ] Cannot leave feedback twice
- [ ] Only participants can leave feedback

### Vouch System

- [ ] Vouch prompt appears after completion
- [ ] Vouch creates database record
- [ ] vouch_count increments
- [ ] Vouches display on profiles
- [ ] Cannot vouch same user multiple times
- [ ] Notifications sent

### Trade History

- [ ] "My Trades" shows all user trades
- [ ] Filters work (active/completed/disputed)
- [ ] Correct trade counts per filter
- [ ] Links to trade details work

---

## Migration & Backward Compatibility

### Existing Listings

- Add status_history field to existing listings (default empty array)
- No action needed for existing listings - they continue to work

### Demo Data

- Update `scripts/seed-demo-data.ts` to create sample trades
- Include trades in various states (initiated, completed, disputed)
- Add sample vouches between demo users

### Database Migrations

- Add status_history JSON field to listings collection
- No breaking changes to existing schema

---

## Success Criteria

The trade flow is complete when:

1. ✅ Users can initiate trades from listings
2. ✅ Trade status progresses through defined states
3. ✅ Completing a trade increments trade_count
4. ✅ Users can leave ratings/reviews post-trade
5. ✅ Vouches can be created and displayed
6. ✅ Trade history is viewable per user
7. ✅ Listing statuses update automatically
8. ✅ All state changes are logged and auditable

---

## Risk Assessment

| Risk                           | Probability | Impact | Mitigation                                                                      |
| ------------------------------ | ----------- | ------ | ------------------------------------------------------------------------------- |
| Users bypass formal trade flow | Medium      | Medium | Make trade flow rewarding (vouches, ratings); track informal trades don't count |
| Trade disputes                 | Medium      | High   | Build dispute workflow; clear escalation path to moderators                     |
| Fake reviews/vouches           | Low         | High   | Require completed trades; rate limiting; moderation tools                       |
| Status sync issues             | Low         | Medium | Use database transactions; comprehensive testing                                |
| Performance (many trades)      | Low         | Low    | Index on buyer/seller fields; pagination on history                             |

---

## Future Enhancements (Post-MVP)

- Multi-party trades (3+ users)
- Trade chains (A→B→C)
- Escrow/payment integration
- Automated trade matching
- Trade templates for common exchanges
- Bulk trade operations
- Export trade history (CSV)
- Advanced dispute resolution tools
- Moderation dashboard for vouches
- Trust score algorithm refinement

---

## Questions & Decisions Needed

1. **Rating System:** 1-5 stars or thumbs up/down? (PRD says "Basic feedback (thumbs up/down)")
2. **Vouch Eligibility:** Require N completed trades before can give vouches? (Docs say phone verified OR 1 vouch received)
3. **Dispute Workflow:** Should disputes block completion or just flag for review?
4. **Status History:** JSON field or separate collection?
5. **Trade Cancellation:** Who can cancel? What happens to listing status?

---

## References

- [Product Requirements Document](./prd.md) - Phase 1 MVP requirements
- [Trust & Vouches](../docs/trust-and-vouches.md) - Vouch system documentation
- [Trade Chains](../docs/trade-chains.md) - Multi-party trade specification
- [Database Schema](../services/pocketbase/schema/pb_schema.json) - Current collections

---

**Document Owner:** Development Team
**Next Review:** After Week 1 implementation
**Feedback:** Create issue or update this doc directly
