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

Users are automatically assigned to one of four trust tiers based on account age and activity:

| Tier            | Icon | Criteria                                    | Description                               |
| --------------- | ---- | ------------------------------------------- | ----------------------------------------- |
| **New**         | 🆕   | < 30 days old AND < 3 trades                | Brand new member, highest caution advised |
| **Growing**     | 🌱   | 30-90 days old OR 3-9 trades                | Building reputation, moderate trust       |
| **Established** | ✅   | 90+ days old AND 10+ trades                 | Experienced trader with proven history    |
| **Trusted**     | ⭐   | 1+ year old AND (50+ trades OR 20+ vouches) | Highly trusted community pillar           |

### Tier Calculation Logic

```
IF age >= 365 days AND (trades >= 50 OR vouches >= 20)
  → Trusted

ELSE IF age >= 90 days AND trades >= 10
  → Established

ELSE IF age >= 30 days OR trades >= 3
  → Growing

ELSE
  → New
```

**Key principles:**

- Time alone isn't enough (except to exit "New" tier)
- Activity accelerates trust building (3 trades moves you to "Growing" even if < 30 days)
- Higher tiers require BOTH time AND activity
- Vouches can substitute for trades at Trusted tier (quality over quantity)

## Visual Design

### Badge Appearance

Trust badges appear as small, rounded pills next to user names throughout the platform.

**New Member Badge:**

```
🆕 New member (5 days old)
Border: Amber (#f59e0b)
Background: Amber/10 opacity
Text: Amber-200
```

**Growing Member Badge:**

```
🌱 Growing member
Border: Sky blue (#0ea5e9)
Background: Sky/10 opacity
Text: Sky-200
```

**Established Member Badge:**

```
✅ Established member
Border: Emerald (#10b981)
Background: Emerald/10 opacity
Text: Emerald-200
```

**Trusted Member Badge:**

```
⭐ Trusted member
Border: Violet (#8b5cf6)
Background: Violet/10 opacity
Text: Violet-200
```

### Placement

#### 1. User Profile Pages

**Primary location:** Directly under display name, above stats

```
[Display Name]
🆕 New member (5 days old)

Trades: 0    Vouches: 0
Member since: [date]
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
```

**Warning banner (New tier only):**

When viewing a listing from a New member, show an info banner:

```
ℹ️ Trading with a new member
[Display Name] joined 5 days ago and has no completed trades yet.
Consider using tracked shipping and payment protection.
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

#### 4. Messages & Communication

**Message threads:** Badge appears next to sender name

```
[Display Name] 🌱
Growing member
─────────────
Hey, I'm interested in...
```

#### 5. Vouches Display

**On profile when showing vouches:**

```
⭐ [Display Name]     3 days ago
Trusted member

"Great trader, shipped quickly!"
```

## Contextual Warnings

### High-Risk Trade Warning

When initiating a trade with a **New** member who has < 2 completed trades, show a confirmation dialog:

```
⚠️ Trading with a new member

[Display Name] is a brand new member with no completed
trades. To protect yourself:

✓ Request tracked shipping with signature
✓ Use payment methods with buyer protection
✓ Meet in person if possible
✓ Start with a smaller value trade

[Cancel] [I understand, continue →]
```

### Account Age Context

Everywhere we show "Member since [date]", also show relative time:

```
Member since Oct 15, 2025 (5 days ago)
```

For new members specifically:

```
Member since Oct 15, 2025 (joined 5 days ago, no trades yet)
```

## User Experience Considerations

### For New Members

**Onboarding messaging:**
After registration, show:

```
Welcome to Meeple Cart! 🎲

You're currently a 🆕 New Member. Build trust by:
• Completing your first few trades successfully
• Getting vouches from trading partners
• Being responsive and professional

After 30 days and 3 trades, you'll become a 🌱 Growing Member!
```

**Profile view (own profile):**
Show progress towards next tier:

```
🆕 New Member

Progress to Growing Member:
✓ Account age: 15 days (50%)
⏳ Trades: 1 / 3 needed
```

### For Established Members

**No intrusive warnings** - badges are informational only for Growing/Established/Trusted tiers

**Optional:** Filter/sort search results by trust tier

- "Show only Established or Trusted members"
- Sort by: "Most trusted first"

## Data Requirements

### Existing Fields (already in schema)

- `joined_date` - timestamp
- `trade_count` - integer
- `vouch_count` - integer

### Computed Fields (calculated on-the-fly)

- `account_age_days` - days since joined_date
- `trust_tier` - enum based on calculation
- `is_high_risk` - boolean (new tier + < 2 trades)

**No database changes required** - all trust tier logic can be computed from existing fields.

## Implementation Phases

### Phase 1: Core Visibility (Week 1)

- [ ] Create trust tier utility functions
- [ ] Add badges to user profile pages
- [ ] Add badges to listing detail pages
- [ ] Add "New member" warning banner on listings
- [ ] Update "Member since" displays to include relative time

### Phase 2: Universal Badges (Week 1-2)

- [ ] Add badges to search results
- [ ] Add badges to message threads
- [ ] Add badges to vouch displays
- [ ] Add badges to user mentions anywhere

### Phase 3: Warnings & Guidance (Week 2)

- [ ] Implement high-risk trade confirmation dialog
- [ ] Add onboarding messaging for new members
- [ ] Add "progress to next tier" on own profile
- [ ] Create "Safe Trading Guide" help page

### Phase 4: Search & Filtering (Week 3)

- [ ] Add trust tier filter to search
- [ ] Add "sort by trust" option
- [ ] Show tier distribution in search results ("5 Trusted, 12 Established, 3 New")

## Anti-Gaming & Bad Actor Prevention

The trust tier system must be resilient against manipulation by individuals or coordinated groups. This section outlines attack vectors and countermeasures.

### Attack Vectors

#### 1. Collusion Rings

**Attack:** Group of 5-10 people trade only with each other to rapidly build trust scores.

**Detection signals:**

- Closed trading network (users only trade within small group)
- Symmetric trade patterns (A↔B, B↔C, C↔A in loops)
- Rapid succession trades (10 trades in 2 weeks all within same group)
- New accounts all created around same time
- Similar IP addresses or device fingerprints

**Automated flags:**

```
IF user_trades_count >= 10 AND
   unique_trading_partners < 3 AND
   account_age < 60 days
   → FLAG: "Possible collusion ring"
```

**Countermeasures:**

- **Trust diversity requirement**: To reach Established tier, must have traded with at least 5 different users
- **Network analysis**: Flag clusters of new accounts with only internal trades
- **Vouch weight discount**: If 80%+ of vouches come from same 3 people, reduce weight by 50%
- **Manual review trigger**: Automatic moderator review when patterns detected

#### 2. Sockpuppet Accounts

**Attack:** One person creates multiple accounts to vouch for their primary account.

**Detection signals:**

- Multiple accounts from same IP address
- Similar writing style/patterns in messages (NLP analysis)
- Vouches from accounts with no other trading activity
- Device fingerprint matches
- Payment method reuse across accounts

**Automated flags:**

```
IF new_vouch_received FROM voucher WHERE
   voucher.created_from_ip IN user.known_ips OR
   voucher.trade_count == 1 (only traded with target) OR
   voucher.joined_date within 7 days
   → FLAG: "Suspicious vouch source"
```

**Countermeasures:**

- **Voucher minimum requirements**: Can't vouch others until Growing tier (30+ days OR 3+ trades with different people)
- **Cross-account fingerprinting**: Track device IDs, IPs, browser fingerprints
- **Vouch weighting**: Vouches from accounts with diverse trading history worth more
- **New account restrictions**: Accounts < 14 days can't vouch anyone

#### 3. Fast-Flip Scam

**Attack:** Build trust over 90 days with small trades, then execute one large scam and disappear.

**Detection signals:**

- Sudden shift to high-value trades (pattern break)
- User requests prepayment for first time
- Rapid listing of many expensive items after period of small trades
- Trading partner reports "user pressuring for quick payment"

**Automated flags:**

```
IF average_trade_value < $50 for last 10 trades AND
   new_listing_value > $500
   → FLAG: "Unusual value spike"
```

**Countermeasures:**

- **Graduated value limits**:
  - New tier: Max $100 per trade
  - Growing tier: Max $500 per trade
  - Must reach Established for unlimited
- **Velocity checks**: Flag sudden increases in listing values
- **Escrow suggestions**: Auto-suggest escrow/tracked shipping for trades > $200 with Growing tier
- **Trade value history**: Show average trade value on profile ("Typical trades: $20-60")

#### 4. Account Purchase/Takeover

**Attack:** Buy or hack an Established account to bypass trust building.

**Detection signals:**

- Sudden change in behavior patterns (listing style, communication tone, location)
- Password reset from new IP/device
- Change in preferred contact method
- Different payment methods than historical
- Old trading partners report "this doesn't seem like the same person"

**Automated flags:**

```
IF account_inactive > 180 days AND
   suddenly_active WITH (
     new_location OR
     new_payment_method OR
     different_device_fingerprint
   )
   → FLAG: "Possible account takeover"
```

**Countermeasures:**

- **Re-verification on reactivation**: Require phone/email re-verification after 6+ months inactive
- **Location change warnings**: If location changes, show notice to trading partners
- **Behavioral analysis**: Flag dramatic shifts in communication style or trading patterns
- **Cooling-off period**: After long inactivity, require 2-3 small trades before unlimited access

#### 5. Vouch/Trade Buying

**Attack:** Pay people (off-platform) to trade and vouch.

**Detection signals:**

- Vouches from users with no apparent connection (different cities, no mutual contacts)
- Generic vouch messages ("good trader" × 10 with identical text)
- Vouches clustered in time (5 vouches in one day)
- Vouchers never trade with each other, only with target
- Vouchers have pattern of vouching many unrelated people

**Automated flags:**

```
IF user receives 5+ vouches within 48 hours FROM
   vouchers with no geographic/network proximity AND
   vouch_messages have high_text_similarity
   → FLAG: "Possible purchased vouches"
```

**Countermeasures:**

- **Vouch rate limiting**: Max 5 vouches received per week
- **Relationship signals required**: Weight vouches higher if users have mutual connections
- **Generic message detection**: Flag repetitive vouch text
- **Community reporting**: Easy "Report suspicious vouch" button
- **Vouch source diversity**: Require vouches from at least 5 different cities for Trusted tier

### Group Coordination Attacks

#### Organized Fraud Rings

**Attack:** Criminal group creates 20+ accounts, builds collective trust over months, then executes coordinated scam wave.

**Detection patterns:**

- Graph analysis reveals tight cluster
- Accounts created in batches (10 accounts in one week)
- Similar naming patterns or profile structures
- Trade activity starts simultaneously across group
- IP address overlaps or sequential ranges

**Advanced countermeasures:**

- **Network graph analysis**: Visualize trading relationships, flag isolated dense clusters
- **Velocity limits**: Cap new account registrations from same IP/subnet
- **CAPTCHA strengthening**: Require phone verification before first trade
- **Probationary period**: New accounts can't vouch or trade high-value for 30 days minimum
- **Community watch**: Highlight accounts with unusual network centrality

### Data Schema Additions for Anti-Gaming

```javascript
// Track cross-account patterns
account_fingerprints {
  user_id: uuid
  ip_addresses: text[] // last 20 IPs
  device_ids: text[] // browser fingerprints
  payment_methods_hash: text[] // hashed payment info
  created_at: timestamp
}

// Trading network analysis
trading_relationships {
  user_a: uuid
  user_b: uuid
  trade_count: integer
  total_value: number
  first_trade: timestamp
  last_trade: timestamp
}

// Automated flags
trust_flags {
  user_id: uuid
  flag_type: enum('collusion', 'sockpuppet', 'vouch_buying', 'fast_flip', 'account_takeover')
  confidence: decimal (0.0-1.0)
  evidence: json
  status: enum('pending', 'reviewed', 'confirmed', 'false_positive')
  flagged_at: timestamp
  reviewed_by: uuid (moderator)
  resolution: text
}
```

### Community-Powered Detection

Enable the community to help identify bad actors:

**Report mechanisms:**

- "Report suspicious activity" on any profile
- Required fields: Pattern observed, evidence/examples
- Escalation threshold: 3 independent reports trigger moderator review

**Transparency:**

- Public log of moderation actions (anonymized)
- "This account was flagged for review on [date]" visible on profile during investigation
- Clear appeal process for false positives

**Incentives:**

- Users who report confirmed fraud get "Community Guardian 🛡️" badge
- Reporters build meta-reputation for accurate flags

### Response Playbook

When bad actor patterns detected:

**Level 1: Soft warning** (confidence < 50%)

- Add temporary "Under review" notice to profile
- Require tracked shipping for all trades
- Limit to 1 trade per week
- Notify user of concern and evidence

**Level 2: Restriction** (confidence 50-80%)

- Temporarily demote trust tier by one level
- Require re-verification (phone, email)
- Prohibit trades > $100
- 30-day probation period

**Level 3: Suspension** (confidence > 80%)

- Account suspended pending investigation
- All active trades/listings frozen
- Moderator deep-dive review required
- Contact recent trading partners for welfare check

**Level 4: Ban** (confirmed fraud)

- Permanent ban with public log entry
- Fingerprint blacklist (prevent re-registration)
- Notify recent trading partners
- Coordinate with authorities if criminal activity

### Legitimate Edge Cases

Important: These systems must not punish legitimate behavior:

**Family/household traders:**

- Couple shares collection, both have accounts
- **Solution:** Allow account linking, show "Linked to [Partner]" on profile

**Game store owners:**

- High volume, concentrated trades
- **Solution:** "Verified Retailer" designation with different rules

**Regional clubs:**

- Members trade mostly within club
- **Solution:** "Club Member" badge, group vouching allowed

**Collection liquidation:**

- Inactive user returns to sell entire collection
- **Solution:** Reactivation verification flow, graduated re-onboarding

### Success Metrics

**Detection effectiveness:**

- False positive rate < 5% (legitimate users incorrectly flagged)
- False negative rate < 10% (bad actors slip through)
- Time to detection: < 3 trades for collusion rings
- Community report accuracy: > 70%

**Deterrence:**

- Reduction in fraud attempts over time
- Bad actors don't reach Established tier
- Attempted gaming visible in analytics

**Fairness:**

- < 1% of users appeal trust tier calculation
- Appeals resolved within 48 hours
- User satisfaction with safety measures > 4.5/5

## Edge Cases & Considerations

### Reactivated Accounts

- User joined 2 years ago but hasn't traded in 18 months
- **Approach:** Still counts as "Trusted" if criteria met, but consider future reputation decay

### Bulk Trades

- User completes 10 trades in first week (possible gaming)
- **Approach:** Account age still gates "Established" tier (90 days required)

### Vouch Bombing

- User gets 25 vouches in one day from friends
- **Mitigation:** Addressed by existing vouch moderation system

### Privacy Concerns

- Some users may feel labeled/stigmatized as "New"
- **Approach:** Frame positively ("Growing", "Building trust"), show as protective not punitive

### Display Clutter

- Badges everywhere could be visual noise
- **Approach:** Use subtle styling, only New tier gets prominent treatment

## Future Enhancements

### Reputation Decay (Phase 2+)

- Vouches > 1 year old count at reduced weight
- Inactivity > 6 months triggers re-verification
- Account dormancy affects tier calculation

### Multi-Dimensional Trust

- Separate scores for communication, shipping, grading accuracy
- Category-specific badges ("Shipping Star ⭐", "Honest Grader ✓")

### Progressive Limits

- New tier: Can't trade items > $100 value
- Growing tier: Can't trade items > $500 value
- Established/Trusted: No limits

### Network Trust

- "You have 3 mutual trading partners with this user"
- "Connected through [Friend Name]"
- Trust path visualization

## Success Metrics

**Adoption:**

- 100% of user touchpoints show trust badges within 2 weeks
- User awareness survey: >80% understand tier system

**Safety:**

- Reduction in disputes with New members (target: -30%)
- Increased use of tracked shipping with New members (target: +50%)

**Engagement:**

- New members motivated to reach Growing tier faster
- Forum feedback on "feeling safer" when trading

## Related Documentation

- [Trust & Vouches](./trust-and-vouches.md) - Vouching system details
- [Trust Buddy Spec](../spec/trust.md) - Phone verification system
- [Data Models](./development/data-models.md) - User schema

---

**Status:** Draft for review
**Last updated:** 2025-10-20
**Owner:** Platform Trust & Safety
