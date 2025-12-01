# Product Requirements Document: Meeple Cart

## Board Game Trading Platform for New Zealand

### Executive Summary

Meeple Cart is a dedicated web platform enabling New Zealand's board gaming community to trade, sell, and acquire board games without relying on Facebook. The platform addresses the fragmentation and limitations of existing solutions while building on established community behaviors and trust patterns.

---

## Problem Statement

### Current State

10,000+ New Zealand board gamers currently coordinate trades through a Facebook group ("Buy, Sell and Trade Boardgames NZ"), facing significant friction:

**Platform Limitations:**

- Facebook Marketplace not optimized for collectibles/hobbies
- No game-specific features (condition grading, BGG integration)
- Poor search and filtering capabilities
- Clunky bulk listing process
- Lost listings in social media feeds
- Facebook account requirement excludes some community members

**Trust & Safety Challenges:**

- No specialized reputation system for traders
- Difficult to verify trading history
- No structured way to build community trust
- Limited visibility into mutual connections

**Process Inefficiencies:**

- Manual cross-referencing with BoardGameGeek
- Repetitive data entry for collections
- No automated matching for wants/trades
- Coordination happens across multiple channels (comments, DMs, texts)

### Opportunity

Create a purpose-built platform that reduces friction in the game trading process while strengthening community bonds and trust mechanisms specific to the NZ board gaming community's needs.

---

## Goals & Objectives

### Primary Goals

1. **Reduce Trading Friction**: Make listing, discovering, and completing trades 10x easier than current Facebook process
2. **Build Community Trust**: Establish transparent reputation system that encourages good behavior
3. **Preserve NZ Gaming Culture**: Support the uniquely Kiwi ethos of trading over buying new
4. **Achieve Critical Mass**: Migrate 30% of Facebook group (3,000 users) within first year

### Secondary Goals

- Foster local gaming connections and meetups
- Reduce duplicate purchases in the community
- Support environmental sustainability through reuse
- Create data insights about NZ gaming trends

---

## Success Metrics

### Year 1 Targets

**Adoption Metrics:**

- 3,000+ registered users
- 500+ monthly active traders
- 50% of users complete at least one trade
- 25% of users complete 5+ trades

**Engagement Metrics:**

- Average session duration: 8+ minutes
- Listings per active user: 5+
- Messages per trade: <10 (efficiency indicator)
- Return rate: 60% weekly, 80% monthly

**Quality Metrics:**

- Successful trade rate: >95%
- Trust incident rate: <0.5%
- Time to first trade: <14 days
- User satisfaction (NPS): >50

**Platform Health:**

- Listing-to-trade conversion: >20%
- Geographic coverage: All major NZ cities
- Average trade completion time: <7 days
- Search success rate: >80%

---

## User Personas

### 1. The Collector (Core User)

**Demographics:** 25-45, urban/suburban, household income $60k+  
**Behaviors:**

- Owns 50+ games
- Actively curates collection
- Trades to try new games without growing collection
- Values game condition highly

**Needs:**

- Efficient bulk listing tools
- Detailed condition tracking
- Collection management features
- Trade value optimization

**Quote:** _"I want to try new games without my kallax shelves exploding"_

---

### 2. The Casual Trader

**Demographics:** 20-50, broad range  
**Behaviors:**

- Owns 10-30 games
- Occasional trades (2-4 per year)
- Motivated by specific wants
- Prefers simple processes

**Needs:**

- Easy onboarding
- Clear trust signals
- Simple listing process
- Local trade options

**Quote:** _"I just want to swap this game I'm done with for something new"_

---

### 3. The Deal Hunter

**Demographics:** 20-40, price-conscious  
**Behaviors:**

- Monitors multiple platforms
- Quick to spot arbitrage
- High volume trader
- Bundles for value

**Needs:**

- Price tracking and alerts
- Bulk deal tools
- Efficient communication
- Historical pricing data

**Quote:** _"I know what these games are worth and love finding win-win trades"_

---

### 4. The Community Builder

**Demographics:** 30-50, established gamer  
**Behaviors:**

- Helps newcomers
- Organizes local meetups
- Vouches for others
- Posts helpful content

**Needs:**

- Reputation recognition
- Community features
- Event coordination tools
- Ability to mentor/guide

**Quote:** _"Growing the hobby and helping others find games brings me joy"_

---

## User Jobs to Be Done

### Core Jobs

1. **When I** acquire a new game, **I want to** list my unplayed games for trade **so I can** maintain my collection size

2. **When I** see a game I want, **I want to** quickly assess if the trader is trustworthy **so I can** trade with confidence

3. **When I** have multiple games to move, **I want to** list them all efficiently **so I can** spend more time gaming

4. **When I** am looking for a specific game, **I want to** be notified when it becomes available **so I can** act quickly

5. **When I** arrange a trade, **I want to** coordinate logistics easily **so I can** complete trades smoothly

### Supporting Jobs

6. **When I** browse listings, **I want to** filter by location and trade preferences **so I can** find relevant options

7. **When I** complete trades, **I want to** build visible reputation **so I can** trade more easily in future

8. **When I** list games, **I want to** show accurate conditions **so I can** set proper expectations

9. **When I** research games, **I want to** see BGG ratings and info **so I can** make informed decisions

10. **When I** travel domestically, **I want to** find trade opportunities along my route **so I can** maximize efficiency

11. **When I** can't find a listing for a game I want, **I want to** post a clear want-to-buy request **so I can** attract sellers proactively

---

## Data Model

The platform uses a three-tier model for listings:

### listing → offer → game(s)

**listings** (container/grouping)
A listing is simply a container owned by a user that groups their games and offers together.
- Owner, title, summary, location, regions
- Photos (listing-level images)
- Status: active | pending | completed | cancelled

**offers** (the "for sale/trade" unit)
An offer defines the terms for selling or trading one or more games. This is what appears in the activity feed and what buyers interact with.
- Links to a listing and specifies which game(s) are included
- `cash_amount`: asking price (if selling)
- `open_to_lower_offers`: accepts "or nearest offer"
- `open_to_trade_offers`: accepts trades
- `trade_for_items`: what they'd accept in trade (BGG IDs or descriptions)
- `can_post`: whether this offer can be posted/shipped
- Status: active | accepted | invalidated | withdrawn

**items** (individual tradeable items)
An item describes a single physical item with its condition and details. Items can be board games (with BGG integration) or other tradeable items like accessories, 3D printed components, or gaming furniture.
- BGG integration (optional): bgg_id, title, year - auto-populated when selecting a board game from BGG search
- Title: game name (from BGG) or custom item name for non-game items
- Condition: mint | excellent | good | fair | poor
- Notes (what's included, condition details)
- Status: available | pending | sold

### Common Flows

**Single item (most common):** User adds an item with price/terms → system creates both an item record and an offer record linking them.

**Bundle:** User adds multiple items, then groups them into a single offer with combined terms.

**Activity feed:** Shows offers (not listings or items directly). Each offer card displays its item(s), price, and terms. Filters apply to offer fields (can_post, open_to_trades, region).

---

## Feature Requirements

### Phase 1: Core Trading (MVP)

**User Management**

- Email registration with verification
- Profile with display name, location, bio
- Public trade counter
- Basic notification preferences

**Listing Management**

- Add games with offer terms (price, shipping, trade preferences)
- Option to bundle multiple games into a single offer
- Upload multiple photos
- Condition grading (BGG standard)
- Support "Want to Buy" requests via discussion system (Wanted category)
- Offer state management (active, accepted, invalidated, withdrawn)
- Location and region settings

**Discovery**

- Browse active offers (activity feed)
- Search by game title
- Filter by region, can ship, open to trades, condition
- Sort by date, price
- Dedicated view for Wanted posts (discussion system)
- Basic pagination

**Communication**

- Public comments on listings
- Private messages per listing
- Email notifications for messages
- Mark messages as read

**Trade Flow**

- Initiate trade discussion
- Mark listing as pending
- Confirm trade completion
- Basic feedback (thumbs up/down)
- Transition listings between private, listed, pending, and sold states with clear state history for the owner

### Phase 2: Trust & Efficiency

**Enhanced Trust**

- Phone verification
- Trade history display
- Mutual connections visibility
- Vouch system (after 5 trades)
- Verification badges
- Report problematic behavior

**Bulk Operations**

- Multi-game listings
- CSV upload for collections
- BGG collection import
- Batch status updates
- Template listings
- Quick relist feature

**Smart Matching**

- Saved searches/wants list
- Push notifications for matches
- Trade compatibility scoring
- Bundle suggestions
- Distance-based alerts

**Improved Discovery**

- Map view of listings
- Advanced filters (year, player count, etc.)
- Trade route planning
- Collection browsing
- Similar game suggestions

### Phase 3: Community & Intelligence

**Community Features**

- User reviews and ratings
- Trading groups/circles
- Event coordination
- New member mentorship
- Discussion forums
- Local group pages

**Analytics & Insights**

- Personal trade statistics
- Collection value estimates
- Price trend analysis
- Optimal trade suggestions
- Market demand indicators
- Achievement badges

**Advanced Trading**

- Multi-party trade chains
- Auction-style listings
- Make offer system
- Trade credits/banking
- Wishlist matching matrix
- Automated fair trade suggestions

---

## UX Flow Sketches

### Flow: Create Want-to-Buy Listing

1. User selects `Create Listing` from dashboard and chooses the `Want to Buy` tab.
2. User searches BoardGameGeek catalog or enters manual game details.
3. User sets desired condition range, offer price or trade preference, and optional notes.
4. Flow defaults to the `Private` state so the user can review before publishing.
5. User previews the request, toggles notifications for seller responses, then publishes to move the listing into the `Listed` state.
6. Confirmation screen reinforces where the want-to-buy post appears and how sellers can respond.

### Flow: Manage Listing State Lifecycle

1. From the `My Listings` dashboard, user sees grouped cards by state (`Private`, `Listed`, `Pending`, `Sold`).
2. User can edit a `Private` listing and choose `Publish`, triggering validation before transitioning to `Listed`.
3. When a trade conversation reaches agreement, user taps `Mark as Pending`; the system logs timestamp and surfaces fulfillment checklist.
4. After completion, user selects `Mark as Sold`, adds optional buyer feedback, and the listing archives to the `Sold` bucket while remaining visible in trade history.
5. At any stage, user can revert to `Private` (draft) or back to `Listed`, with a visible state history timeline for context.

### Flow: Respond to a Want-to-Buy Request

1. Seller browses the `Want to Buy` view or receives a saved-search alert about a matching request.
2. Seller opens the request, reviews desired price/condition, and taps `Offer Game`.
3. Seller selects an existing `Private` or `Listed` game from their library or creates a quick listing inline.
4. Seller sends an offer message; system links the offer to both the seller's listing and the buyer's request.
5. Buyer reviews the offer within the request thread, can accept to create a `Pending` trade, counter with adjustments, or decline.

### Flow: Highlight External Deals (Future)

1. System ingests daily feeds from partner NZ retailers and Amazon, normalizes titles, and flags matches to tracked games.
2. Deals landing page groups offers by retailer and popularity, with filters for price drop percentage and location.
3. Users subscribe to deal alerts per game; when a new deal surfaces, they receive notifications with direct links and community commentary prompts.
4. Users can bookmark deals to compare against trade offers or convert them into want-to-buy posts when the sale matches their criteria.

---

## Non-Functional Requirements

### Performance

- Page load time: <2 seconds on 4G
- Search results: <500ms
- Image upload: <5 seconds per image
- Support 1000 concurrent users

### Reliability

- 99.5% uptime
- Daily automated backups
- Graceful degradation without JavaScript
- Offline browsing of cached content

### Usability

- Mobile-responsive design
- Accessible (WCAG 2.1 AA)
- Works on 2+ year old devices
- Progressive enhancement approach
- Clear error messages

### Security & Privacy

- HTTPS everywhere
- Email/phone privacy options
- GDPR-compliant data handling
- Rate limiting on all endpoints
- Secure password requirements

### Scalability

- Support 10,000 users
- Handle 50,000 listings
- 1M+ messages/month
- Horizontal scaling capability

---

## Constraints & Assumptions

### Constraints

- No payment processing initially (no escrow)
- NZ-focused only (no international)
- English language only at launch
- Limited development resources (small team)
- Zero marketing budget initially

### Assumptions

- Users have BoardGameGeek familiarity
- Smartphone adoption is universal
- Users willing to leave Facebook for better tool
- Community will self-moderate initially
- Trust system will discourage bad actors

---

## Risks & Mitigation

### Critical Risks

**Risk:** Insufficient user migration from Facebook  
**Impact:** Platform fails to reach critical mass  
**Mitigation:**

- Soft launch with influential community members
- Allow cross-posting to Facebook initially
- Import tools for Facebook listings
- Focus on unique value props

**Risk:** Trust system abuse  
**Impact:** Erosion of community confidence  
**Mitigation:**

- Start with invite-only beta
- Require first trade with verified member
- Quick response to reports
- Transparent moderation

**Risk:** Technical scaling issues  
**Impact:** Poor user experience drives users away  
**Mitigation:**

- Conservative growth targets
- Performance monitoring from day 1
- Caching strategy
- Cloud infrastructure ready

### Moderate Risks

**Risk:** Feature creep delays launch  
**Impact:** Lost momentum and opportunity  
**Mitigation:**

- Strict MVP scope
- Time-boxed phases
- User feedback drives priorities

**Risk:** BGG API limitations  
**Impact:** Missing key integration features  
**Mitigation:**

- Cache BGG data locally
- Build scraping fallback
- Manual entry options

---

## Launch Strategy

### Phase 0: Pre-Launch (Month 1)

- Recruit 10 beta testers from FB group mods/influencers
- Gather feedback on core flows
- Refine based on testing
- Build initial content

### Phase 1: Soft Launch (Month 2-3)

- Invite-only for 100 active FB group members
- Focus on single-city pilot (Auckland)
- Daily iteration based on feedback
- Success: 50 completed trades

### Phase 2: Regional Expansion (Month 4-6)

- Open registration for all NZ
- Facebook group announcement
- Ambassador program launch
- Success: 500 users, 200 trades/month

### Phase 3: Growth (Month 7-12)

- Feature expansion based on usage
- SEO and content marketing
- Partnership with game stores
- Success: 3000 users, 1000 trades/month

---

## Competitive Analysis

**Facebook Marketplace**

- Pros: Existing user base, free, familiar
- Cons: Not game-specific, poor discovery, requires FB account

**Trade Me**

- Pros: Trusted NZ platform, payment processing
- Cons: Fees, auction-focused, no game features

**BGG Marketplace**

- Pros: Game-specific, global reach
- Cons: US-centric, overwhelming interface, no local focus

**Meeple Cart Advantages:**

- Purpose-built for board game trading
- NZ-specific (local pickup, NZ$ pricing)
- Community trust features
- Modern, mobile-first interface
- Bulk listing tools

---

## Future Vision (Year 2+)

**Potential Expansions:**

- Game store integration (check local inventory)
- Gaming cafe partnerships (try before trade)
- Convention/event integration
- Aus market expansion
- Retailer price matching
- Deal aggregation highlighting sales from NZ retailers and Amazon
- Digital game key trading
- Gaming group scheduler
- Rule book library
- Component replacement matching

**Revenue Opportunities (if needed):**

- Premium features (advanced analytics, priority listing)
- Store referral commissions
- Sponsored game store listings
- Convention vendor tools
- White-label for other communities

---

## Success Statement

Meeple Cart succeeds when a Wellington gamer can list their entire collection in minutes, get matched with an Auckland trader heading south for vacation, arrange a highway meetup, and both walk away with games they're excited to play - all while building reputation that makes their next trade even easier. The platform becomes the default verb: "Just meeple-cart it!"
