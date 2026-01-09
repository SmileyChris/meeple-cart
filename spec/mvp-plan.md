# Meeple Cart MVP Implementation Plan

**Version:** 2.0
**Date:** 2025-10-28
**Target Launch:** 3 weeks from now
**Status:** Ready to implement

---

## 🎯 Executive Summary

**Current State:** 70% complete - All infrastructure, database schema, and supporting features done
**Blocking Issue:** Core trade workflow incomplete - users can't formalize trades
**Time to MVP:** 3 weeks of focused development
**Risk Level:** Low - all hard problems solved, just need UI/workflow implementation

---

## 📋 What We Have vs What We Need

### ✅ Working Now (No Touch Needed)

- Authentication & user profiles
- Multi-game listing creation/management
- Private messaging system
- Gift cascade system (fully functional)
- Watchlist functionality
- Notifications infrastructure
- Database schema (100% complete)
- Dark/light theme system

### ❌ Critical Missing Pieces (MVP Blockers)

1. **Trade initiation flow** - No button/form to start a trade
2. **Trade detail page** - Exists but incomplete, needs status management
3. **Trade completion workflow** - No way to mark trades complete
4. **Feedback system** - Can't leave ratings/reviews
5. **Vouch granting** - Can't vouch for trading partners
6. **Browse/search pages** - Removed during merge, need client-side rebuild

---

## 🗓️ 3-Week Implementation Plan

### **Week 1: Core Trade Flow** (Days 1-5)

#### Goals

Complete the trade initiation → confirmation → completion lifecycle.

#### Tasks

**Day 1: Trade Initiation**

- [ ] Add "Propose Trade" button to listing detail page (`src/routes/listings/[id]/+page.svelte`)
  - Only visible to logged-in users (not listing owner)
  - Shows appropriate copy based on listing type (trade/sell/want)
- [ ] Create client-side trade initiation handler
  - Validate user is authenticated
  - Create trade record via PocketBase
  - Handle errors gracefully
- [ ] Send notification to other party
- [ ] Redirect to trade detail page after creation

**Day 2: Trade Detail Page Foundation**

- [ ] Fix existing `/trades/[id]/+page.svelte` to display full trade info:
  - Both party profiles (avatars, names, reputation)
  - Listing details (games involved, photos, condition)
  - Current status with visual timeline
  - Message thread specific to this trade
- [ ] Add access control (only trade participants can view)
- [ ] Style for mobile responsiveness

**Day 3: Trade Status Management**

- [ ] Add status update buttons based on user role:
  - **Buyer/Seller:** "Confirm Trade" (initiated → confirmed)
  - **Seller:** "Mark as Shipped" (confirmed → shipped)
  - **Buyer:** "Confirm Receipt" (shipped → completed)
  - **Either:** "Report Issue" (any → disputed)
- [ ] Implement client-side handlers for each action
- [ ] Update trade status in database
- [ ] Send notifications on status changes

**Day 4: Listing Status Automation**

- [ ] Auto-update listing status when trade initiated (active → pending)
- [ ] Auto-update listing status when trade completed (pending → completed)
- [ ] Auto-mark all games as 'sold' when trade completes
- [ ] Increment trade_count for both users on completion
- [ ] Add status change audit log (JSON field on listing)

**Day 5: Trade Dashboard**

- [ ] Update `/trades/+page.svelte` to show user's trades:
  - Active trades (initiated, confirmed, shipped)
  - Completed trades
  - Filter/tab interface
  - Summary stats (N active, N completed)
- [ ] Add "My Trades" link to main navigation
- [ ] Mobile optimization

**End of Week 1 Deliverable:**
✅ Users can initiate, confirm, and complete trades end-to-end

---

### **Week 2: Feedback & Trust System** (Days 6-10)

#### Goals

Enable post-trade feedback and vouch system to build community trust.

#### Tasks

**Day 6: Feedback Form**

- [ ] Add feedback section to trade detail page (only after status = 'completed')
  - Rating selector (1-5 stars or thumbs up/down - **DECISION NEEDED**)
  - Review textarea (optional, 500 char limit)
  - "Submit Feedback" button
- [ ] Create client-side handler:
  - Validate user is trade participant
  - Save feedback to trades collection
  - Mark feedback as given (prevent duplicates)
- [ ] Send notification to reviewed party

**Day 7: Review Display**

- [ ] Add reviews section to user profile page (`src/routes/users/[id]/+page.svelte`)
  - Show recent reviews received (last 10)
  - Display rating, review text, reviewer name, date
  - Calculate average rating
- [ ] Update profile header to show:
  - Trade count
  - Average rating (if > 0 reviews)
  - Vouch count
  - Trust tier badge (calculate based on vouches/trades)

**Day 8: Vouch System**

- [ ] Add vouch prompt after trade completed AND feedback given
  - Explain what vouching means
  - Optional message field (1000 chars)
  - "Vouch" and "Skip" buttons
- [ ] Create vouch handler:
  - Validate user is trade participant
  - Check not already vouched this user
  - Create vouch record
  - Increment vouchee's vouch_count
  - Send notification
- [ ] Display vouches on user profiles
  - List recent vouchers with names + messages
  - Link to voucher profiles

**Day 9: Trust Tier Calculation**

- [ ] Implement trust tier logic (from `docs/trust-and-vouches.md`):
  - **Newcomer:** 0-2 vouches
  - **Trusted Member:** 3-9 vouches OR 10+ trades
  - **Power User:** 10+ vouches AND 25+ trades
  - **Core Contributor:** 25+ vouches AND 100+ trades
- [ ] Add trust tier badge to profiles
- [ ] Add trust tier indicator on listing detail page (seller info)
- [ ] Create visual badge components (SVG or emoji-based)

**Day 10: Polish & Edge Cases**

- [ ] Handle edge cases:
  - User deletes account (preserve trade history)
  - Duplicate feedback attempts
  - Vouch spam prevention
  - Trade cancellation flow (who can cancel, when)
- [ ] Add loading states and error handling
- [ ] Write unit tests for trust tier calculations
- [ ] Mobile responsiveness check

**End of Week 2 Deliverable:**
✅ Complete trust system: ratings, reviews, vouches, and trust tiers

---

### **Week 3: Browse/Search & Polish** (Days 11-15)

#### Goals

Rebuild marketplace browse/search and polish for launch.

#### Tasks

**Day 11: Browse Games Page**

- [ ] Create `/browse/+page.svelte` + `/browse/+page.ts` (client-side)
  - Fetch listings via PocketBase (type = 'sell' OR 'trade')
  - Grid layout with ListingCard components
  - Pagination (24 per page)
- [ ] Add filters:
  - Listing type (sell/trade)
  - Condition (mint/excellent/good/fair/poor)
  - Price range (min/max sliders)
  - Location (text search)
- [ ] Add sorting:
  - Newest first (default)
  - Price: Low to High
  - Price: High to Low
  - Most Games
- [ ] Link from main navigation

**Day 12: Wanted Posts Page**

- [ ] Create `/wanted/+page.svelte` + `/wanted/+page.ts` (client-side)
  - Fetch listings via PocketBase (type = 'want')
  - Similar layout to browse page
  - Show wanted games, budget, location
- [ ] Add filters:
  - Budget range
  - Location
  - Recently posted
- [ ] Link from main navigation

**Day 13: Search Enhancement**

- [ ] Improve homepage search (`src/routes/+page.svelte`):
  - Search by game title (BGG integration)
  - Search by seller name
  - Debounced search input
  - Clear visual feedback (loading, no results)
- [ ] Add "Quick Filters" chips:
  - Near me (if location set)
  - Newly listed (last 24h)
  - Price drops
  - Wants matches (if user has wants listed)

**Day 14: End-to-End Testing**

- [ ] Test complete user journey:
  1. User registers
  2. Creates listing
  3. Another user messages
  4. First user initiates trade
  5. Other user confirms
  6. First user ships + marks shipped
  7. Other user receives + marks complete
  8. Both leave feedback
  9. Both vouch each other
  10. Trust tiers update
- [ ] Test edge cases:
  - Cancellations
  - Disputes
  - Multiple simultaneous trades
  - Mobile experience
- [ ] Fix bugs discovered

**Day 15: Launch Prep**

- [ ] Final UI polish:
  - Consistent error messages
  - Loading states everywhere
  - Empty states with helpful CTAs
  - Mobile responsiveness final check
- [ ] Performance optimization:
  - Image lazy loading
  - Query optimization
  - Pagination everywhere
- [ ] Create demo data:
  - 10 demo users
  - 30 demo listings
  - 15 completed trades
  - Sample vouches and reviews
- [ ] Write deployment checklist
- [ ] Create user guide (screenshots + steps)

**End of Week 3 Deliverable:**
✅ Fully functional MVP ready for beta launch

---

## 🎬 Post-Launch (Week 4+)

### Immediate Priorities

1. Monitor for bugs and user feedback
2. Add analytics (user signups, listings created, trades completed)
3. Implement basic moderation tools
4. Set up automated backups

### Next Features (Based on User Demand)

- Multi-party trades (trade chains)
- Advanced search (BGG collection import)
- Email digest improvements
- Mobile app (PWA or native)
- Payment integration (Stripe for sales)

---

## 🚧 Critical Decisions Needed Before Week 2

### Decision 1: Rating System Type

**Options:**

- A) Thumbs up/down (simpler, less gameable)
- B) 1-5 stars (more granular, standard)

**Recommendation:** Thumbs up/down for MVP (matches PRD), add stars later if needed

### Decision 2: Vouch Eligibility

**Options:**

- A) Anyone can vouch anyone (trust community)
- B) Require 1 completed trade to vouch (prevent spam)
- C) Require phone verification OR 1 vouch received (matches docs)

**Recommendation:** Option B for MVP (simplest), add Option C when phone verification ready

### Decision 3: Trade Cancellation

**Options:**

- A) Either party can cancel anytime before 'shipped'
- B) Only initiator can cancel in first 24h
- C) Both must agree to cancel

**Recommendation:** Option A for MVP (keeps listings moving), add cancellation reason field

### Decision 4: Dispute Handling

**Options:**

- A) Dispute = flag for manual review, trade stays in limbo
- B) Dispute = auto-rollback, listing goes back to active
- C) Dispute = mediator assigned (future feature)

**Recommendation:** Option A for MVP, build proper dispute system post-launch

---

## 📦 Implementation Notes

### Architecture Choices (Already Decided)

- ✅ Client-side SPA (no SSR) - confirmed in recent merge
- ✅ PocketBase for all data operations - working well
- ✅ Svelte 5 runes everywhere - migration complete
- ✅ All routes use `+page.ts` loaders (no `+page.server.ts`)

### Code Organization

```
src/routes/
├── trades/
│   ├── +page.svelte          # Trade dashboard (update)
│   ├── +page.ts              # Load user's trades
│   └── [id]/
│       ├── +page.svelte      # Trade detail (major updates)
│       └── +page.ts          # Load single trade
├── listings/[id]/
│   └── +page.svelte          # Add trade button (minor update)
├── browse/
│   ├── +page.svelte          # NEW - Browse marketplace
│   └── +page.ts              # NEW - Load filtered listings
├── wanted/
│   ├── +page.svelte          # NEW - Browse want ads
│   └── +page.ts              # NEW - Load wants
└── users/[id]/
    └── +page.svelte          # Add reviews/vouches display

src/lib/components/
├── TradeStatusTimeline.svelte  # NEW - Visual status indicator
├── FeedbackForm.svelte         # NEW - Rating + review form
├── VouchPrompt.svelte          # NEW - Vouch after trade
├── TrustBadge.svelte          # NEW - Trust tier badge
└── (existing components work as-is)
```

### Testing Strategy

- Manual testing during development (use two browser sessions)
- Write unit tests for trust tier calculations
- E2E test for complete trade flow (Playwright)
- Beta test with 10-20 real users before public launch

### Performance Considerations

- All queries must be indexed (already done in schema)
- Use pagination everywhere (max 50 items per page)
- Optimize images (already using PocketBase thumbs)
- Lazy load trade history (infinite scroll)

---

## ⚠️ Known Risks & Mitigations

| Risk                         | Probability | Impact | Mitigation                                                                         |
| ---------------------------- | ----------- | ------ | ---------------------------------------------------------------------------------- |
| Users bypass trade system    | Medium      | Medium | Make trade flow rewarding (vouches); informal trades don't count toward reputation |
| Spam vouches/reviews         | Low         | High   | Require completed trades; rate limiting (max 1 vouch per user)                     |
| Trade disputes escalate      | Medium      | Medium | Clear dispute button; build proper resolution system in Week 4                     |
| Performance with many trades | Low         | Medium | Indexed queries; pagination; tested with 1000+ records                             |
| Mobile UX issues             | Low         | Medium | Test on real devices; responsive design from day 1                                 |

---

## 📊 Success Metrics (Track Post-Launch)

**Week 1 Targets:**

- 50+ user signups
- 30+ listings created
- 10+ trades initiated

**Month 1 Targets:**

- 200+ users
- 100+ listings
- 30+ completed trades
- 50+ vouches granted
- 80%+ trade completion rate (initiated → completed)

**Quality Metrics:**

- < 5% dispute rate
- > 4.0 average feedback rating
- > 50% users return within 7 days
- < 2 seconds average page load

---

## 📚 Reference Documents

- [Trade Flow Gaps (Detailed Specs)](./spec/trade-flow-gaps.md) - 984 lines of implementation details
- [Product Requirements (PRD)](./spec/prd.md) - Original vision & MVP requirements
- [Trust & Vouches](./docs/trust-and-vouches.md) - Trust system documentation
- [Database Schema](./pocketbase/schema/pb_schema.json) - Complete schema
- [CLAUDE.md](./CLAUDE.md) - Development setup & commands

---

## ✅ Daily Checklist Template

Use this for each day of implementation:

```markdown
### Day N: [Feature Name]

**Morning:**

- [ ] Review specs for today's feature
- [ ] Create branch: `feat/[feature-name]`
- [ ] Write down acceptance criteria

**Implementation:**

- [ ] Task 1
- [ ] Task 2
- [ ] Task 3

**Testing:**

- [ ] Manual test happy path
- [ ] Test error cases
- [ ] Mobile responsiveness
- [ ] Commit with clear message

**Evening:**

- [ ] Demo feature (screenshot/video)
- [ ] Update this plan if scope changed
- [ ] Note any blockers for tomorrow
```

---

## 🎯 Definition of Done (MVP Launch Criteria)

The MVP is ready for beta launch when:

- [x] User can create account and profile
- [x] User can create/edit/manage listings
- [x] User can message about listings
- [ ] User can initiate formal trade
- [ ] User can complete trade workflow
- [ ] User can leave feedback after trade
- [ ] User can vouch for trading partners
- [ ] User can browse marketplace
- [ ] User can search by game title
- [ ] Trust tiers display correctly
- [ ] All pages mobile-responsive
- [ ] No critical bugs in trade flow
- [ ] Demo data seeded for testing
- [ ] Deployment to production working

**Current Progress: 11/15 criteria met (73%)**

---

**Next Action:** Review this plan → Make decisions on Week 2 questions → Start Day 1 implementation

**Questions?** Create an issue or update this doc directly.
