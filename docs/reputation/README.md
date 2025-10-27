# Reputation & Trust System

Meeple Cart's reputation system enables safe peer-to-peer trading through transparent trust signals, progressive reputation building, and community-powered moderation.

## Philosophy

**Self-moderation through transparency**: Make trust visible, reward good actors, and make gaming the system harder than building legitimate reputation.

**Progressive trust**: New members start with appropriate restrictions and earn privileges through consistent positive behavior.

**Community ownership**: Empower the community to identify and respond to bad actors with moderator oversight.

## System Components

### 1. [Trust Tiers](./trust-tiers.md)

Five-level system based on vouched trades (trades where partner left a vouch).

- 🆕 **New** (0 vouched trades) - Warning flag for unproven accounts
- 🌱 **Seedling** (1 vouched trade) - First successful vouched trade
- 🪴 **Growing** (30+ days AND 2 vouched trades) - Building reputation
- 🌳 **Established** (5 vouched trades) - Experienced trader
- ⭐ **Trusted** (1+ year AND 8 vouched trades) - Highly trusted member

**Key:** Only trades that result in vouches count toward progression. This ensures quality over quantity and incentivizes good trading behavior.

Badges appear everywhere users interact, providing instant context about trading partner reliability.

### 2. [Trust & Vouches](../trust-and-vouches.md)

Post-trade testimonials that build verifiable reputation.

- Short testimonials tied to completed trades
- Moderation queue for suspicious vouches
- Aggregate vouch_count visible on profiles
- Eligibility: Can vouch if you've received ≥1 vouch OR have phone verification

### 3. [Trust Buddy](../../spec/trust.md) (Phone Verification)

Community-powered phone verification system.

- Verified members volunteer to send verification links
- Phone-locked links prevent gaming
- Karma rewards for verifiers
- Zero operational cost (no SMS fees)
- **Unlocks vouching privileges**: Phone-verified users can vouch for others immediately, even if New tier

### 4. [Anti-Gaming Measures](./anti-gaming.md)

Comprehensive fraud prevention and detection.

- Collusion ring detection
- Sockpuppet account identification
- Fast-flip scam prevention
- Automated pattern flags
- Community reporting mechanisms

### 5. [Moderation Playbook](./moderation.md)

Graduated response system for handling flagged accounts.

- Level 1: Soft warnings and restrictions
- Level 2: Tier demotion and probation
- Level 3: Suspension pending investigation
- Level 4: Permanent bans with fingerprint blocking

## Key Principles

### Transparency

Every trust signal is explainable and visible:

- "Why does this user have this tier?" → Clear criteria shown
- "Why was this vouch removed?" → Public moderation log
- "How do I improve my tier?" → Progress indicators on profile

### Multi-Signal Trust

No single point of failure - trust is calculated from:

- Account age (time)
- Trade count (volume)
- Vouch count (social proof)
- Trade completion rate (reliability)
- Diversity of trading partners (anti-gaming)
- Verification status (identity)

### Graduated Access

Privileges unlock progressively:

| Feature                | New  | Seedling  | Growing   | Established | Trusted       |
| ---------------------- | ---- | --------- | --------- | ----------- | ------------- |
| Daily messages         | 5    | Unlimited | Unlimited | Unlimited   | Unlimited     |
| Can vouch others       | ✅\* | ✅        | ✅        | ✅          | ✅            |
| Can flag content       | ❌   | ✅        | ✅        | ✅          | ✅            |
| Request to join chains | ✅   | ✅        | ✅        | ✅          | ✅ (priority) |
| Jury duty              | ❌   | ❌        | ❌        | ❌          | ✅            |

**\*Vouching eligibility:** Can vouch if you have received ≥1 vouch OR have phone verification.

**Notes:**

- No trade value limits - tier badges provide transparency for users to make informed decisions
- Gift chain creators can optionally set minimum tier requirements when selecting recipients
- Phone verification (Trust Buddy) unlocks vouching privileges immediately, even for New members
- Message limit (5/day) only for New members to prevent spam; unlocks immediately with first vouched trade
- See [Listings & Marketplace](../listings.md) for listing visibility and bumping mechanics

### Community-Powered

The community helps maintain trust:

- Report suspicious vouches/profiles
- Community jury for disputes (Trusted members)
- Top verifiers get recognition
- "Community Guardian" badges for accurate reporting

## Data Architecture

### Existing Schema (PocketBase)

```javascript
users {
  joined_date: timestamp        // Foundation for account age
  trade_count: integer          // Trading activity
  vouch_count: integer          // Social proof
  // ... other fields
}

vouches {
  voucher: relation → users     // Who gave vouch
  vouchee: relation → users     // Who received
  message: text                 // Testimonial
  trade: relation → trades      // Optional context
  created: timestamp
}

trades {
  sender: relation → users
  recipient: relation → users
  status: enum
  completed_date: timestamp
}
```

### Computed Fields (No DB changes needed)

All trust tier logic calculated on-the-fly:

- `account_age_days` = now - joined_date
- `trust_tier` = getTrustTier(age, trades, vouches)
- `is_high_risk` = tier === 'new' AND trades < 2

### Future Additions for Anti-Gaming

```javascript
// Phase 2: Advanced fraud detection
account_fingerprints {
  user_id: uuid
  ip_addresses: text[]
  device_ids: text[]
  created_at: timestamp
}

trading_relationships {
  user_a: uuid
  user_b: uuid
  trade_count: integer
  total_value: number
}

trust_flags {
  user_id: uuid
  flag_type: enum
  confidence: decimal
  evidence: json
  status: enum
}
```

## Implementation Roadmap

### Phase 1: Visibility (Weeks 1-2)

**Goal:** Make new accounts obvious

- [x] Trust tier utility functions
- [ ] Badges on all user touchpoints
- [ ] "New member" warnings on listings
- [ ] Account age in relative time format
- [ ] High-risk trade confirmation dialogs

**Success:** Users can instantly identify new vs. established traders

### Phase 2: Progressive Restrictions (Weeks 2-3)

**Goal:** Limit new account capabilities

- [ ] Vouch eligibility gating
- [ ] Daily message limits for New tier
- [ ] Progress indicators ("2/3 trades to Growing")
- [ ] Onboarding education for new members

**Success:** New members understand the path to building trust

### Phase 3: Anti-Gaming (Weeks 4-6)

**Goal:** Detect and prevent fraud

- [ ] Trust diversity requirement (5+ unique partners for Established)
- [ ] Vouch rate limiting
- [ ] Basic pattern detection (IP overlap, etc.)
- [ ] Community flagging interface
- [ ] Moderator dashboard for reviews

**Success:** Collusion rings and sockpuppets flagged automatically

### Phase 4: Advanced Detection (Weeks 7-10)

**Goal:** Sophisticated fraud prevention

- [ ] Trading network graph analysis
- [ ] Account fingerprinting
- [ ] Behavioral anomaly detection
- [ ] Trade value history tracking
- [ ] Automated restriction escalation

**Success:** Fast-flip scams and account takeovers prevented

### Phase 5: Community Moderation (Weeks 11-12)

**Goal:** Empower community self-regulation

- [ ] Community jury system for disputes
- [ ] Public moderation log
- [ ] Appeal process workflow
- [ ] "Community Guardian" badges
- [ ] Transparent decision-making

**Success:** Community actively participates in maintaining trust

## Success Metrics

### Safety Metrics

- **Dispute rate**: < 0.5% of all trades
- **Scam attempts**: < 0.1% of trades involving New members
- **False flag rate**: < 5% of automated flags
- **Time to fraud detection**: < 3 trades on average

### User Experience Metrics

- **Trust awareness**: >80% of users understand tier system (survey)
- **New member completion**: >70% of New members reach Growing tier
- **Established member retention**: >90% remain active monthly
- **Safety perception**: >4.5/5 rating for "I feel safe trading"

### Community Health Metrics

- **Vouch authenticity**: >95% of vouches remain un-flagged
- **Report quality**: >70% of community reports confirmed valid
- **Moderator efficiency**: <5% of users ever require manual review
- **Appeal resolution**: <48 hours average

## Quick Reference

### Trust Tier Requirements

| Tier            | Icon | Vouched Trades | Account Age | Unlocks                         |
| --------------- | ---- | -------------- | ----------- | ------------------------------- |
| **New**         | 🆕   | 0              | Any         | Can trade, 5 msg/day limit      |
| **Seedling**    | 🌱   | 1+             | Any         | Unlimited messages, can vouch\* |
| **Growing**     | 🪴   | 2+             | 30+ days    | Can flag content                |
| **Established** | 🌳   | 5+             | Any         | Community respect               |
| **Trusted**     | ⭐   | 8+             | 1+ year     | Jury duty, priority             |

**\*Vouching:** Can vouch if received ≥1 vouch OR have phone verification (Trust Buddy)

### Key Concepts at a Glance

| Concept            | Definition                                                         | Where Used                       |
| ------------------ | ------------------------------------------------------------------ | -------------------------------- |
| **Vouched Trade**  | A trade where you received a vouch from your partner               | Tier progression                 |
| **Trust Tier**     | One of 5 levels (New → Seedling → Growing → Established → Trusted) | All user interactions            |
| **Trust Buddy**    | Community-powered phone verification system                        | Unlocks vouching for New members |
| **Collusion Ring** | Group trading only with each other to build fake reputation        | Anti-gaming detection            |
| **Sockpuppet**     | Multiple accounts controlled by one person                         | Anti-gaming detection            |

## Glossary

**Account Age** - Time since user registration (joined_date). Required for Growing (30+ days) and Trusted (365+ days) tiers.

**Vouched Trade** - A completed trade where you received a vouch from your trading partner. This is the primary metric for tier progression. See [Trust Tiers](./trust-tiers.md#what-is-a-vouched-trade) for detailed definition.

**Vouch** - A short testimonial given by one trader to another after a successful trade. Increases the recipient's vouch_count and contributes to trust tier advancement.

**Trust Tier** - One of five progressive levels (New, Seedling, Growing, Established, Trusted) that indicate user trustworthiness based on vouched trades and account age.

**Trust Buddy** - Community-powered phone verification system where verified members send verification links to new members. See [spec/trust.md](../../spec/trust.md) for full details.

**Voucher Eligibility** - Requirements to give vouches: must have received ≥1 vouch OR completed phone verification (Trust Buddy).

**Collusion Ring** - A group of users who trade primarily or exclusively with each other to artificially inflate trust scores. Detected via network analysis.

**Sockpuppet** - Multiple accounts controlled by a single person, often used to vouch for their primary account. Detected via IP/device fingerprinting.

**Fast-Flip Scam** - Building trust with small legitimate trades, then executing one large scam and disappearing. Prevented through velocity monitoring and community transparency.

**Community Guardian** - Badge awarded to users who accurately report suspicious activity. Earned after 5+ confirmed valid reports.

**Graduated Response** - Four-level moderation system (Soft Warning → Restriction → Suspension → Ban) that escalates based on confidence and evidence.

## Phone Verification Flow (Trust Buddy)

**Overview:** Trust Buddy is a community-powered phone verification system that allows new members to unlock vouching privileges without completing a trade first.

**How it works:**

1. **New member requests verification**
   - User navigates to Profile → Verify Phone
   - Enters their phone number
   - System creates verification request

2. **Verified member volunteers to help**
   - Trusted/Established members see verification requests in "Help Verify" queue
   - Volunteer selects a request
   - System generates phone-locked verification link

3. **Link sent and verified**
   - Volunteer sends link via SMS/WhatsApp to new member's phone
   - New member clicks link on their phone
   - System verifies the link was opened on the phone number provided
   - Phone verification complete ✓

4. **Vouching unlocked**
   - New member can now vouch for others (even at New tier)
   - Profile shows "✓ Phone verified" badge
   - Volunteer earns karma points

**Benefits:**

- Zero operational cost (no SMS gateway fees)
- Community-powered trust building
- Prevents sockpuppet accounts (phone numbers are unique)
- New members can participate fully in vouching system
- Verified members earn recognition for helping

**See [Trust Buddy Spec](../../spec/trust.md) for complete implementation details.**

## Cross-Reference: Where to Find What

| Topic                          | Primary Document                                             | Related Docs                 |
| ------------------------------ | ------------------------------------------------------------ | ---------------------------- |
| **Trust tier requirements**    | [trust-tiers.md](./trust-tiers.md)                           | README (overview)            |
| **How vouching works**         | [trust-and-vouches.md](../trust-and-vouches.md)              | trust-tiers.md (eligibility) |
| **Phone verification**         | [spec/trust.md](../../spec/trust.md)                         | README (flow overview)       |
| **Listing bumping/visibility** | [listings.md](../listings.md)                                | N/A                          |
| **Anti-gaming detection**      | [anti-gaming.md](./anti-gaming.md)                           | moderation.md (responses)    |
| **Moderation procedures**      | [moderation.md](./moderation.md)                             | anti-gaming.md (detection)   |
| **Gift chain restrictions**    | [CASCADE_IMPLEMENTATION.md](../../CASCADE_IMPLEMENTATION.md) | README (tier access table)   |
| **Database schema**            | [development/data-models.md](../development/data-models.md)  | All docs (references)        |
| **Vouched trade definition**   | [trust-tiers.md](./trust-tiers.md#what-is-a-vouched-trade)   | trust-and-vouches.md         |
| **Badge visual design**        | [trust-tiers.md](./trust-tiers.md#visual-design)             | N/A                          |

## Documentation Index

1. **[Trust Tiers](./trust-tiers.md)** - Badge system and tier definitions
2. **[Trust & Vouches](../trust-and-vouches.md)** - Testimonial system
3. **[Anti-Gaming](./anti-gaming.md)** - Fraud prevention and detection
4. **[Moderation Playbook](./moderation.md)** - Response procedures
5. **[Trust Buddy Spec](../../spec/trust.md)** - Phone verification PRD

## Related Systems

- **[Data Models](../development/data-models.md)** - PocketBase schema
- **[Trade Chains](../trade-chains.md)** - Gift chain coordination
- **[Cascade Implementation](../../CASCADE_IMPLEMENTATION.md)** - Chain restrictions

---

**Status:** In active development
**Owner:** Trust & Safety Team
**Last updated:** 2025-10-20
