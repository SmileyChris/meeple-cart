# Trust Tiers & Account Age Visibility

## Problem Statement

New accounts pose higher risk in peer-to-peer trading platforms. Users need clear, immediate visibility into:

- How long an account has existed
- Whether the trader has a proven track record
- What precautions to take when trading with new members

Currently, Meeple Cart shows trade counts and vouch counts, but doesn't prominently display **account age** or synthesize these signals into an easy-to-understand trust indicator.

## Goals

1. **Transparency**: Make account age immediately visible wherever users appear
2. **Risk awareness**: Help users make informed decisions about trading partners
3. **Progressive trust**: Encourage new members to build reputation over time
4. **Community safety**: Reduce scams and disputes through better information

## Trust Tier System

### Tier Definitions

Users are automatically assigned to one of five trust levels based on account age and activity:

| Level           | Icon | Criteria                           | Description                                     |
| --------------- | ---- | ---------------------------------- | ----------------------------------------------- |
| **New** (flag)  | 🆕   | 0 vouched trades                   | Brand new member, highest caution advised       |
| **Seedling**    | 🌱   | 1 vouched trade                    | First vouched trade completed                   |
| **Growing**     | 🪴   | 30+ days old AND 2 vouched trades  | Building reputation with community feedback     |
| **Established** | 🌳   | 90+ days old AND 5 vouched trades  | Experienced trader with proven positive history |
| **Trusted**     | ⭐   | 1+ year old AND 8 vouched trades   | Highly trusted, long-term community member      |

### Tier Calculation Logic

```
vouched_trades = count of unique trades where user received a vouch

IF age >= 365 days AND vouched_trades >= 8
  → Trusted

ELSE IF age >= 90 days AND vouched_trades >= 5
  → Established

ELSE IF age >= 30 days AND vouched_trades >= 2
  → Growing

ELSE IF vouched_trades >= 1
  → Seedling

ELSE
  → New (flag/warning state)
```

### What is a "Vouched Trade"?

**Definition:** A **vouched trade** is a completed trade where you received a vouch from your trading partner.

**Important clarifications:**

- **Counts trades, not vouches:** If you complete a trade and your partner vouches for you, that counts as **1 vouched trade** (regardless of whether you also vouched them back)
- **Both vouch = still 1 trade:** If both partners vouch each other after a trade, each person gets credit for **1 vouched trade** (not 2)
- **Multiple vouches from one partner = multiple trades:** If you trade with the same person 3 times and get vouched each time, that's **3 vouched trades**
- **Unvouched trades don't count:** Completing a trade without receiving a vouch does not contribute to tier progression

**Example:**

```
User A trades with User B → Trade completes → User B vouches User A
Result: User A has 1 vouched trade, User B has 0 vouched trades (unless User A also vouches back)

User A trades with User B → Trade completes → Both vouch each other
Result: User A has 1 vouched trade, User B has 1 vouched trade (each counts the one trade where they received a vouch)
```

**Why this matters:** Tier progression requires vouched trades, not just total trades. This ensures members are incentivized to provide good trading experiences that result in vouches.

**Key principles:**

- **Vouches are mandatory**: Only vouched trades count toward tier progression
- **New is a warning state**: Zero vouched trades = needs to prove trustworthiness
- **Quality over quantity**: Can complete 100 trades but won't progress without vouches
- **Incentivizes good behavior**: Must satisfy trading partners to advance
- **Anti-gaming**: Can't fake vouches from real trades with real people
- **Time-gated for Trusted**: Must have 1+ year for top tier (prevents fast-flip scams)
- **Reasonable thresholds**: 8 vouched trades over a year is achievable for active members
- See [Anti-Gaming](./anti-gaming.md) for diversity requirements preventing collusion

## Visual Design

### Badge Appearance

Trust badges appear as small, rounded pills next to user names throughout the platform.

**New Member Flag:**

```
🆕 New member (5 days old, no trades yet)
Border: Amber (#f59e0b)
Background: Amber/10 opacity
Text: Amber-200
CSS: border-amber-500/80 bg-amber-500/10 text-amber-200
Warning: Most prominent styling
```

**Seedling Badge:**

```
🌱 Seedling
Border: Lime (#84cc16)
Background: Lime/10 opacity
Text: Lime-200
CSS: border-lime-500/80 bg-lime-500/10 text-lime-200
```

**Growing Member Badge:**

```
🪴 Growing member
Border: Sky blue (#0ea5e9)
Background: Sky/10 opacity
Text: Sky-200
CSS: border-sky-500/80 bg-sky-500/10 text-sky-200
```

**Established Member Badge:**

```
🌳 Established member
Border: Emerald (#10b981)
Background: Emerald/10 opacity
Text: Emerald-200
CSS: border-emerald-500/80 bg-emerald-500/10 text-emerald-200
```

**Trusted Member Badge:**

```
⭐ Trusted member
Border: Violet (#8b5cf6)
Background: Violet/10 opacity
Text: Violet-200
CSS: border-violet-500/80 bg-violet-500/10 text-violet-200
```

### Placement

#### 1. User Profile Pages

**Primary location:** Directly under display name, above stats

```
[Display Name]
🆕 New member (5 days old)

Trades: 0    Vouches: 0
Member since: Oct 15, 2025 (joined 5 days ago)
```

**Hover/tooltip:** Shows full tier description

- "New member - use caution and prefer tracked shipping"

#### 2. Listing Detail Pages

**"Trader details" sidebar:**

```
Trader details
───────────────
[Display Name] 🆕
New member (5 days old)

Based in Wellington

Trades: 0
Vouches: 0

Preferred contact: [method]
```

**Warning banner (New tier only):**

When viewing a listing from a New member, show an info banner above the listing details:

```
ℹ️ Trading with a new member

[Display Name] joined 5 days ago and has no completed trades yet.

To protect yourself:
• Use tracked shipping with signature required
• Meet in person if possible
• Start with smaller value trades
• Trust your instincts

[Learn about safe trading →]
```

#### 3. Search Results & Browse

**Listing cards:** Show owner's badge next to their name

```
[Game Image]
─────────────
[Game Title]
By [Display Name] 🆕
Trade · Wellington · 2 days ago
```

Optional filter: "Show only Established or Trusted members"

#### 4. Messages & Communication

**Message threads:** Badge appears next to sender name in header

```
Conversation with [Display Name] 🌱
Growing member

[Messages...]
```

#### 5. Vouches Display

**On profile when showing vouches:**

```
⭐ [Display Name]     3 days ago
Trusted member

"Great trader, shipped quickly and games were exactly as
described. Would trade again!"
```

## Contextual Warnings

### High-Risk Trade Warning

When initiating a trade with a **New** member who has < 2 completed trades, show a confirmation modal:

```
⚠️ Trading with a new member

[Display Name] is a brand new member with no completed
trades yet.

To protect yourself:

✓ Request tracked shipping with signature required
✓ Use payment methods with buyer protection (PayPal, credit card)
✓ Meet in person if possible for local trades
✓ Start with a smaller value trade to build trust
✓ Verify their identity (phone, social media)

Trading always carries risk. Be cautious and trust your instincts.

[Cancel] [I understand, continue →]
```

### Account Age Context

Everywhere we show "Member since [date]", also show relative time for context:

**Established/Trusted members:**

```
Member since Oct 15, 2023 (2 years)
```

**New members specifically:**

```
Member since Oct 15, 2025 (joined 5 days ago, no trades yet)
```

**Growing members:**

```
Member since Sep 1, 2025 (7 weeks, 4 trades)
```

### Badge Text Edge Cases

**Account with age but no vouched trades:**

```
🆕 New member (45 days old, 0 vouched trades)
```

- Shows "New member" tier since vouched trades = 0
- Age displayed to show account isn't brand new
- Clarifies they have completed time requirement but need vouches

**Account with vouched trades but waiting on age:**

```
🌱 Seedling (15 days, 2 vouched trades)
```

- Shows Seedling tier (has 1+ vouched trades)
- Cannot reach Growing yet (needs 30 days AND 2 vouched trades)
- Badge text shows progress: "15 days / 30 needed"

**Account exactly at threshold:**

```
🪴 Growing member (30 days, 2 vouched trades)
```

- Just met requirements (30+ days AND 2+ vouched trades)
- Badge text simply shows tier name

**Phone verified New member:**

```
🆕 New member (5 days, 0 vouched trades) ✓ Phone verified
```

- Shows phone verification badge alongside tier
- Indicates they can vouch for others despite being New tier
- See [Trust Buddy spec](../../spec/trust.md) for phone verification details

## User Experience Considerations

### For New Members

**Onboarding messaging:**

After registration, show welcome modal:

```
Welcome to Meeple Cart! 🎲

You're currently a 🆕 New Member.

Build trust in the community by:
• Completing your profile (bio, location, contact preferences)
• Being responsive and professional in messages
• Completing trades successfully
• Getting vouches from satisfied trading partners
• Using tracked shipping to protect both parties

Quick start: Verify your phone number to unlock vouching privileges!
Even as a New member, phone verification lets you vouch for others.

Important: Vouches are required to progress through trust tiers!
After your first vouched trade, you'll become 🌱 Seedling.
After 30 days and 2 vouched trades, you'll unlock 🪴 Growing tier.

[Verify phone] [Get started →]
```

**Profile view (own profile):**

Show progress towards next tier in a card:

```
Your Trust Tier

🌱 Seedling

Progress to 🪴 Growing Member:

✓ Vouched trades: 1 / 2 needed
⏳ Account age: 15 days / 30 days needed

Get 1 more vouch AND reach 30 days to unlock Growing tier!

Tip: Complete trades successfully and ask partners to vouch for you.

Next milestone: 🌳 Established at 5 vouched trades

[View all tier benefits →]
```

### For Established Members

**No intrusive warnings** - badges are informational only for Growing/Established/Trusted tiers.

**Optional filtering:**

- Filter search results by minimum tier: "Show only Established or Trusted"
- Sort by: "Most trusted first" (sorts by tier, then vouch count)

**Tier benefits display:**

```
Your Trust Tier

🌳 Established Member

Unlocked benefits:
✓ No daily message limits
✓ Can vouch for others
✓ Can flag suspicious content
✓ Participate in gift chains
✓ Priority customer support

Keep building trust to reach ⭐ Trusted tier!
```

## Progressive Access by Tier

| Feature                             | New  | Seedling  | Growing   | Established | Trusted       |
| ----------------------------------- | ---- | --------- | --------- | ----------- | ------------- |
| **Daily messages**                  | 5    | Unlimited | Unlimited | Unlimited   | Unlimited     |
| **Can vouch others**                | ✅\* | ✅        | ✅        | ✅          | ✅            |
| **Can request to join gift chains** | ✅   | ✅        | ✅        | ✅          | ✅ (priority) |
| **Can flag content**                | ❌   | ✅        | ✅        | ✅          | ✅            |
| **Community jury duty**             | ❌   | ❌        | ❌        | ❌          | ✅            |

**\*Vouching eligibility:**

- Can vouch if you have **received at least 1 vouch** (any tier), OR
- Can vouch if you have **phone verification** (even if New tier)
- Otherwise, cannot vouch until you meet one of these criteria

**Rationale:**

- **No trade value limits** - Let community decide what they're comfortable with; tier badges provide transparency
- **Message limit for New only** - Prevent spam from unproven accounts; unlocks immediately after first vouched trade
- **Gift chains open to all** - Chain creators can optionally exclude New members (see below)
- **Vouching requires trust** - Must be vouched yourself OR verify your phone to endorse others
- **Phone verification unlocks vouching** - Encourages identity verification while allowing participation
- **Trusted = premium features** - Time-tested members get jury duty privileges

### Gift Chain Trust Settings

When creating or continuing a gift chain, the giver can choose minimum tier requirements:

```
🎁 Select recipient for this gift

Minimum tier requirement:
○ Anyone can request (including 🆕 New members)
● 🌱 Seedling or higher (1+ vouched trade)
○ 🪴 Growing or higher (2+ vouched trades, 30+ days)
○ 🌳 Established or higher (5+ vouched trades)

This helps you control who can receive valuable gifts.
Current requests: 12 total (3 New, 4 Seedling, 5 Growing+)
```

This gives chain creators control without blanket banning new members from participating.

## Data Requirements

### Existing Fields (Already in PocketBase)

```javascript
users {
  joined_date: timestamp,     // Foundation for account age
  trade_count: integer,       // Total completed trades
  vouch_count: integer,       // Total vouches received (for display)
  phone_verified: boolean,    // Phone verification status (from Trust Buddy)
}

vouches {
  vouchee: relation → users,  // Who received the vouch
  trade: relation → trades,   // Optional: which trade this vouch relates to
  // ... other fields
}
```

### Computed Fields (Calculated on-the-fly or via query)

```typescript
// Utility functions in src/lib/utils/trust.ts

type TrustTier = 'new' | 'seedling' | 'growing' | 'established' | 'trusted';

function getAccountAgeDays(joinedDate: string): number {
  return Math.floor((Date.now() - new Date(joinedDate).getTime()) / 86400000);
}

// Count unique trades that resulted in vouches
// Query vouches table: SELECT COUNT(DISTINCT trade) WHERE vouchee = userId AND trade IS NOT NULL
async function getVouchedTradeCount(userId: string): Promise<number> {
  const vouches = await pb.collection('vouches').getFullList({
    filter: `vouchee = "${userId}" && trade != null`,
  });
  // Count unique trade IDs
  const uniqueTrades = new Set(vouches.map((v) => v.trade));
  return uniqueTrades.size;
}

async function getTrustTier(user: UserRecord, vouchedTrades: number): Promise<TrustTier> {
  const age = getAccountAgeDays(user.joined_date);

  // Trusted: 1+ year AND 8 vouched trades
  if (age >= 365 && vouchedTrades >= 8) return 'trusted';

  // Established: 90+ days AND 5 vouched trades
  if (age >= 90 && vouchedTrades >= 5) return 'established';

  // Growing: 30+ days AND 2 vouched trades
  if (age >= 30 && vouchedTrades >= 2) return 'growing';

  // Seedling: 1 vouched trade
  if (vouchedTrades >= 1) return 'seedling';

  // New: 0 vouched trades (warning state)
  return 'new';
}

function isHighRisk(user: UserRecord): boolean {
  // High risk = New flag (no vouched trades yet) AND no phone verification
  return user.trade_count === 0 && !user.phone_verified;
}

function canVouch(user: UserRecord, vouchedTrades: number): boolean {
  // Can vouch if you've been vouched at least once
  if (vouchedTrades >= 1) return true;

  // OR if you have phone verification
  if (user.phone_verified) return true;

  return false;
}

// No trade value limits - trust tier badges provide transparency
// Users can make their own decisions about trading values
```

### Optional Database Addition

For performance, consider adding a cached field to `users`:

```javascript
users {
  // ... existing fields
  vouched_trade_count: integer DEFAULT 0  // Cached count, updated when vouches added
}
```

This avoids querying the vouches table on every tier calculation. Update via:

- PocketBase hook when vouch created
- Scheduled job to recalculate periodically
- Lazy update on profile view

## Implementation Checklist

### Phase 1: Core Visibility (Week 1)

- [ ] Create `src/lib/utils/trust.ts` with tier calculation functions
- [ ] Create `TrustBadge.svelte` component
- [ ] Add badges to user profile pages (`/users/[id]`)
- [ ] Add badges to listing detail "Trader details" sidebar
- [ ] Add "New member" warning banner on listings from New tier
- [ ] Update all "Member since" displays to include relative time
- [ ] Write unit tests for tier calculation logic

### Phase 2: Universal Badges (Week 1-2)

- [ ] Add badges to search result listing cards
- [ ] Add badges to message thread headers
- [ ] Add badges to vouch displays on profiles
- [ ] Add badges to any other user mentions (comments, etc.)
- [ ] Ensure badges are accessible (proper ARIA labels, screen reader support)

### Phase 3: Warnings & Guidance (Week 2)

- [ ] Implement high-risk trade confirmation modal (trigger on message send to New member)
- [ ] Create onboarding welcome modal for new registrations
- [ ] Add "Progress to next tier" card on own profile view
- [ ] Create "Safe Trading Guide" help page (`/help/safe-trading`)
- [ ] Add tooltips/popovers explaining each tier

### Phase 4: Restrictions & Filters (Week 2-3)

- [ ] Implement trade value limits (enforce in offer/trade creation)
- [ ] Implement message rate limits by tier
- [ ] Add vouch eligibility check (Growing+ tier only)
- [ ] Add trust tier filter to search/browse UI
- [ ] Add "sort by trust" option to search
- [ ] Display tier distribution in search ("15 Trusted, 42 Established, 8 Growing, 2 New")

### Phase 5: Analytics & Monitoring (Week 3)

- [ ] Track tier distribution across user base
- [ ] Monitor tier progression rates (time to Growing, Established, Trusted)
- [ ] Track warning dismissal rates (are users heeding warnings?)
- [ ] A/B test warning messaging for effectiveness
- [ ] Survey users on tier system understanding and perception

## Edge Cases

### Account Reactivation

**Scenario:** User joined 2 years ago, hasn't traded in 18 months, returns to platform.

**Current approach:** Still Trusted tier if criteria met (1 year + 50 trades).

**Future consideration:** Implement reputation decay - vouches/trades > 1 year count at reduced weight. See [Anti-Gaming](./anti-gaming.md) for reactivation security measures.

### Bulk Trading

**Scenario:** User completes 10 trades in first week.

**Mitigation:** Account age still gates "Established" tier (90 days minimum required). Fast trading is flagged for review in [Anti-Gaming](./anti-gaming.md) system.

### Privacy Concerns

**Concern:** Some users may feel stigmatized by "New" label.

**Approach:**

- Frame positively: "Building trust", "Growing member"
- Show as protective measure, not punishment
- Emphasize progress: "You're 50% to Growing tier!"
- Highlight that everyone starts here, including site founders

### Display Clutter

**Concern:** Badges everywhere could be visual noise.

**Approach:**

- Use subtle, consistent styling (small pills, muted colors)
- Only New tier gets prominent yellow/amber treatment
- Higher tiers are understated (green/violet, less urgent)
- Badges are always secondary to user name (smaller, lighter font weight)

## Encouraging Vouches

Since vouches are mandatory for tier progression, the platform should make it easy and natural:

### Post-Trade Vouch Prompts

After a trade is marked complete, show both parties:

```
Trade completed! 🎉

How was your experience with [Partner Name]?

[Leave a vouch] [Maybe later]

Vouches help build trust in the community and unlock
higher tiers for your trading partner.
```

### Vouch Request Feature

Allow users to politely request vouches:

```
From: [User]
Trade: [Game Name] - Completed 3 days ago

"Hi [Partner], thanks again for the smooth trade!
If you were happy with our trade, I'd really appreciate
a vouch to help build my reputation on the platform.

No pressure if you'd rather not!"

[View trade] [Leave vouch]
```

**Limits:** Max 1 request per trade, only after trade marked complete

### Profile Display

Show vouched trades prominently:

```
[Display Name] 🪴

Vouched trades: 3 (Total trades: 5)
```

This makes it visible when someone has un-vouched trades and encourages partners to add vouches.

## Success Metrics

### Awareness & Understanding

- **User surveys:** >80% of users can explain tier system
- **Badge visibility:** 100% of user touchpoints show badges within 2 weeks of launch
- **Onboarding completion:** >90% of new users view welcome modal
- **Vouch rate:** >70% of completed trades result in at least one vouch

### Safety Impact

- **Dispute reduction:** -30% disputes with New tier members (compared to pre-badge baseline)
- **Tracked shipping adoption:** +50% use of tracked shipping when trading with New tier
- **Scam prevention:** < 0.1% of trades involving New members result in scams
- **User confidence:** "I feel safe trading on Meeple Cart" rating >4.5/5

### Engagement & Progression

- **Tier progression:** >70% of New members reach Growing within 60 days
- **Trade velocity:** New members complete first trade within 14 days (median)
- **Retention:** >85% of users who reach Established tier remain active monthly
- **Motivation:** "Tier system motivates me to build reputation" rating >4.0/5

### Fairness & Appeals

- **Appeal rate:** < 1% of users appeal their tier calculation
- **Accuracy:** > 99% of tier calculations are correct (no bugs/edge cases)
- **Support tickets:** < 5% of support tickets relate to tier confusion
- **Satisfaction:** "Tier system is fair" rating >4.2/5

## Related Documentation

- [Anti-Gaming & Fraud Prevention](./anti-gaming.md) - Preventing manipulation of tier system
- [Moderation Playbook](./moderation.md) - Responding to flagged accounts
- [Trust & Vouches](../trust-and-vouches.md) - Testimonial system details
- [Trust Buddy](../../spec/trust.md) - Phone verification PRD

---

**Status:** Ready for implementation
**Owner:** Trust & Safety Team
**Last updated:** 2025-10-20
