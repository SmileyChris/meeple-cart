# Anti-Gaming & Fraud Prevention

## Overview

The trust tier system must be resilient against manipulation by individuals or coordinated groups. This document outlines attack vectors, detection mechanisms, and countermeasures to maintain system integrity.

## Design Philosophy

**Make gaming harder than building legitimate reputation**: The time and effort required to game the system should exceed the effort of simply being a good trader.

**Multi-layered defense**: No single detection mechanism - use overlapping signals to catch different attack patterns.

**Graduated response**: Start with soft signals, escalate to restrictions, only ban when confirmed.

**Transparency with teeth**: Public accountability for moderation actions, but zero tolerance for confirmed fraud.

## Attack Vectors

### 1. Collusion Rings

**Attack:** Group of 5-10 people trade only with each other to rapidly build trust scores.

**Example scenario:**

- 8 friends create accounts on same day
- Trade only within the group in round-robin pattern
- Each person hits 10 trades in 3 weeks
- All vouch for each other
- After 90 days, all appear as "Established" members
- Execute coordinated scam wave

**Detection signals:**

- Closed trading network (users only trade within small group)
- Symmetric trade patterns (A↔B, B↔C, C↔A in loops)
- Rapid succession trades (10 trades in 2 weeks all within same group)
- New accounts all created around same time (batch creation)
- Similar IP addresses or device fingerprints
- Geographic clustering (all same city) without broader network

**Automated flags:**

```javascript
IF user.trade_count >= 10 AND
   unique_trading_partners.length < 3 AND
   account_age_days < 60
   → FLAG: "Possible collusion ring" (confidence: 0.7)

IF user.trading_partners.all(p => p.account_age_days < 90) AND
   user.trading_partners.avg_mutual_connections > 80%
   → FLAG: "Closed trading network" (confidence: 0.8)
```

**Countermeasures:**

- **Trust diversity requirement**: To reach Established tier, must have traded with at least 5 different unique users
- **Network analysis**: Flag clusters of new accounts with only internal trades
- **Vouch weight discount**: If 80%+ of vouches come from same 3 people, reduce effective weight by 50%
- **Temporal patterns**: Flag accounts created in batches (5+ accounts from same IP range in 7 days)
- **Manual review trigger**: Automatic moderator review when confidence > 0.7

### 2. Sockpuppet Accounts

**Attack:** One person creates multiple accounts to vouch for their primary account.

**Example scenario:**

- User creates main account "TrustedTrader123"
- Creates 5 alt accounts over 2 months
- Uses VPN to mask IP
- Makes small trades between alts and main account
- All alts vouch for main account
- Main account appears to have social proof

**Detection signals:**

- Multiple accounts from same IP address (even if sporadic)
- Similar writing style/patterns in messages (NLP analysis)
- Vouches from accounts with no other trading activity (1-trick vouchers)
- Device fingerprint matches (browser, screen resolution, fonts)
- Payment method reuse across accounts
- Behavioral patterns (login times, click patterns, typing speed)

**Automated flags:**

```javascript
IF new_vouch_received FROM voucher WHERE
   voucher.ip_addresses.overlap(user.ip_addresses) OR
   voucher.device_fingerprints.overlap(user.device_fingerprints) OR
   (voucher.trade_count == 1 AND voucher.trades.all(t => t.partner == user)) OR
   voucher.joined_date within 7 days
   → FLAG: "Suspicious vouch source" (confidence: 0.6-0.9)

IF user.vouches.count(v => v.voucher.total_trades == 1) > 3
   → FLAG: "Multiple single-trade vouchers" (confidence: 0.7)
```

**Countermeasures:**

- **Voucher eligibility requirements**: Can vouch if you've received ≥1 vouch OR have phone verification (Trust Buddy)
- **Cross-account fingerprinting**: Track device IDs, IPs, browser fingerprints, payment hashes
- **Vouch weighting**: Vouches from accounts with diverse trading history worth significantly more
- **Vouch cap from new sources**: Max 2 vouches from accounts < 60 days old count toward tier progression
- **NLP analysis**: Flag similar writing patterns across accounts

### 3. Fast-Flip Scam

**Attack:** Build trust over 90 days with small trades, then execute one large scam and disappear.

**Example scenario:**

- User conducts 12 legitimate trades of $20-50 over 90 days
- Builds Established tier status
- Suddenly lists 20 expensive games ($500+ total value)
- Requests prepayment via bank transfer
- Never ships items, deletes account

**Detection signals:**

- Sudden shift to high-value trades (pattern break)
- User requests prepayment for first time
- Rapid listing of many expensive items after period of small trades
- Trading partner reports "user pressuring for quick payment"
- Listing value spike (10x average)
- Change in payment method preference

**Automated flags:**

```javascript
average_trade_value = user.last_10_trades.avg(t => t.value)
new_listing_total = user.recent_listings.sum(l => l.total_value)

IF average_trade_value < $50 AND
   new_listing_total > $500 AND
   user.trust_tier in ['growing', 'established']
   → FLAG: "Unusual value spike" (confidence: 0.5)

IF user.messages.contains("bank transfer only") AND
   user.previous_trades.all(t => t.payment_method != "bank_transfer")
   → FLAG: "Payment method change" (confidence: 0.6)
```

**Countermeasures:**

- **Velocity checks**: Flag sudden increases in listing values
- **Escrow suggestions**: Auto-suggest escrow/tracked shipping for trades > $200 with New/Seedling tier
- **Trade value history**: Show average trade value on profile ("Typical trades: $20-60")
- **Prepayment warnings**: When user requests prepayment, show warning to trading partner
- **Transparency**: Trust tier badges make new accounts obvious to potential partners

### 4. Account Purchase/Takeover

**Attack:** Buy or hack an Established account to bypass trust building.

**Example scenario:**

- Legitimate user builds Established account over 2 years
- Goes inactive for 9 months
- Account credentials sold on dark web or phished
- New owner changes email, reactivates
- Uses established reputation for large scam
- Original user unaware until victims contact them

**Detection signals:**

- Sudden change in behavior patterns (listing style, communication tone, location)
- Password reset from new IP/device after long inactivity
- Change in preferred contact method
- Different payment methods than historical
- Old trading partners report "this doesn't seem like the same person"
- Email/phone number changed after inactivity
- New location significantly different from historical

**Automated flags:**

```javascript
IF user.inactive_days > 180 AND
   user.suddenly_active WITH (
     location_change > 500km OR
     new_payment_method_hash OR
     device_fingerprint.no_overlap_with_history OR
     password_reset_from_new_ip
   )
   → FLAG: "Possible account takeover" (confidence: 0.7)

IF user.historical_message_sentiment != user.recent_message_sentiment AND
   user.inactive_days > 90
   → FLAG: "Behavioral pattern shift" (confidence: 0.5)
```

**Countermeasures:**

- **Re-verification on reactivation**: Require phone/email re-verification after 6+ months inactive
- **Location change warnings**: If location changes >200km, show notice to trading partners: "This user recently changed their location from Auckland to Christchurch"
- **Behavioral analysis**: Flag dramatic shifts in communication style or trading patterns
- **Cooling-off period**: After long inactivity, require 2-3 small trades (<$100) before full access restored
- **Old partner verification**: Optionally contact 2-3 previous trading partners for identity confirmation
- **Tier demotion**: After 12+ months inactivity, automatically demote one tier until reactivation proven

### 5. Vouch/Trade Buying

**Attack:** Pay people (off-platform) to trade and vouch.

**Example scenario:**

- User posts in forums/Discord: "Will pay $5 per vouch on Meeple Cart"
- 10 people create accounts or use existing ones
- Conduct fake trades (send empty packages or very low-value items)
- All vouch with generic positive messages
- User appears trustworthy with 10 vouches
- Uses fake reputation for scams

**Detection signals:**

- Vouches from users with no apparent connection (different cities, no mutual contacts)
- Generic vouch messages ("good trader" × 10 with identical or highly similar text)
- Vouches clustered in time (5 vouches in one day)
- Vouchers never trade with each other, only with target
- Vouchers have pattern of vouching many unrelated people (vouch mills)
- Trades marked complete unusually quickly (< 24 hours)

**Automated flags:**

```javascript
recent_vouches = user.vouches.where(created_at > 7.days.ago)

IF recent_vouches.length >= 5 AND
   recent_vouches.map(v => v.voucher.location).uniq.length == recent_vouches.length AND
   recent_vouches.map(v => v.message).text_similarity > 0.7
   → FLAG: "Possible purchased vouches" (confidence: 0.8)

IF voucher.total_vouches_given > 20 AND
   voucher.vouches_given_to_strangers > 80%
   → FLAG voucher: "Vouch mill account" (confidence: 0.9)
```

**Countermeasures:**

- **Vouch rate limiting**: Max 5 vouches received per week per user
- **Relationship signals required**: Weight vouches higher if users have mutual connections, geographic proximity
- **Generic message detection**: Flag repetitive vouch text, require minimum 10 words
- **Community reporting**: Easy "Report suspicious vouch" button on each vouch
- **Vouch source diversity**: Require vouches from at least 5 different cities for Trusted tier
- **Trade completion time minimum**: Vouch can't be given until 24 hours after trade marked complete
- **Vouch mill detection**: Flag accounts that vouch >20 people with no reciprocal relationship

## Group Coordination Attacks

### Organized Fraud Rings

**Attack:** Criminal group creates 20+ accounts, builds collective trust over months, then executes coordinated scam wave.

**Example scenario:**

- Professional fraud ring creates 25 accounts over 2 months
- Uses rotating IPs and devices to avoid fingerprinting
- Conducts legitimate small trades within ring for 90 days
- All accounts reach Established tier simultaneously
- Launch coordinated scam: 25 high-value listings go live same day
- Collect prepayments, never ship, delete all accounts
- Total fraud value: $10,000+

**Detection patterns:**

- Graph analysis reveals tight cluster with minimal external connections
- Accounts created in batches (10 accounts in one week)
- Similar naming patterns or profile structures ("GameTrader01", "GameTrader02")
- Trade activity starts simultaneously across group (coordinated launch)
- IP address overlaps or sequential ranges
- All list similar games simultaneously
- Mass account deletions after fraud executed

**Advanced countermeasures:**

- **Network graph analysis**: Visualize trading relationships, flag isolated dense clusters
- **Velocity limits**: Cap new account registrations from same IP/subnet (max 3 per week)
- **CAPTCHA strengthening**: Require phone verification before first trade
- **Probationary period**: New accounts can't vouch or trade high-value for 30 days minimum
- **Community watch**: Highlight accounts with unusual network centrality (many internal connections, few external)
- **Batch creation detection**: Flag when 5+ accounts created from similar IPs within 7 days
- **Simultaneous activity alerts**: Flag when clustered accounts all go active at once
- **Cross-reference with fraud databases**: Check against known scammer phone/email hashes

## Data Schema for Anti-Gaming

### Account Fingerprints (Phase 2)

```javascript
account_fingerprints {
  id: uuid PRIMARY KEY,
  user_id: uuid REFERENCES users,
  ip_addresses: jsonb,          // Array of {ip, timestamp, city}
  device_fingerprints: jsonb,   // Array of {hash, user_agent, timestamp}
  payment_methods_hash: text[], // SHA-256 hashed payment identifiers
  created_at: timestamp,
  updated_at: timestamp
}

// Example data:
{
  user_id: "abc123",
  ip_addresses: [
    {ip: "203.123.45.67", timestamp: "2025-10-01", city: "Wellington"},
    {ip: "203.123.45.68", timestamp: "2025-10-15", city: "Wellington"}
  ],
  device_fingerprints: [
    {
      hash: "d4f3a5b...",
      user_agent: "Mozilla/5.0...",
      screen: "1920x1080",
      timezone: "Pacific/Auckland",
      fonts: ["Arial", "Times New Roman",...],
      timestamp: "2025-10-01"
    }
  ]
}
```

### Trading Relationships (Phase 2)

```javascript
trading_relationships {
  id: uuid PRIMARY KEY,
  user_a: uuid REFERENCES users,
  user_b: uuid REFERENCES users,
  trade_count: integer DEFAULT 1,
  total_value: decimal(10,2),
  first_trade_date: timestamp,
  last_trade_date: timestamp,
  mutual_connections: integer,  // Count of shared trading partners
  relationship_strength: decimal(3,2), // 0.0-1.0 score
  created_at: timestamp,
  UNIQUE(user_a, user_b)
}

// Example query:
SELECT * FROM trading_relationships
WHERE user_a = 'abc123'
  AND trade_count > 1
  AND mutual_connections < 2
  AND total_value > 500
// → Flags repeated high-value trades with no network overlap
```

### Trust Flags (Phase 2)

```javascript
trust_flags {
  id: uuid PRIMARY KEY,
  user_id: uuid REFERENCES users,
  flag_type: enum(
    'collusion',
    'sockpuppet',
    'vouch_buying',
    'fast_flip',
    'account_takeover',
    'vouch_mill',
    'value_spike',
    'batch_creation'
  ),
  confidence: decimal(3,2),     // 0.00-1.00
  evidence: jsonb,              // Structured data supporting flag
  status: enum('pending', 'reviewed', 'confirmed', 'false_positive'),
  flagged_at: timestamp,
  reviewed_at: timestamp,
  reviewed_by: uuid REFERENCES users, // Moderator
  resolution: text,
  automated: boolean DEFAULT true,
  created_at: timestamp
}

// Example evidence JSON:
{
  "flag_type": "collusion",
  "details": {
    "unique_partners": 2,
    "trades_with_partners": [
      {"user": "xyz789", "count": 6, "total_value": 240},
      {"user": "def456", "count": 4, "total_value": 160}
    ],
    "account_ages": [45, 42],  // All accounts ~6 weeks old
    "ip_overlap": ["203.123.45.0/24"]
  },
  "triggered_rules": [
    "unique_partners < 3",
    "account_age < 60",
    "trade_count >= 10"
  ]
}
```

## Community-Powered Detection

Enable the community to help identify bad actors:

### Report Mechanisms

**"Report suspicious activity" on any profile:**

- **Where**: Profile page, listing detail, message thread
- **Required fields**:
  - Pattern observed (dropdown: Suspicious vouches, Fake trades, Pressure tactics, Account takeover, Other)
  - Evidence/details (textarea, 50 chars minimum)
  - Your relationship (dropdown: Traded with them, No interaction, Considering trade)
- **Optional**: Upload screenshots
- **Escalation threshold**: 3 independent reports from Growing+ tier users trigger auto-review

**Vouch reporting:**

- "Report this vouch" button on each vouch
- Quick report reasons: Generic/copied, Never traded, Suspicious timing, Fake trade
- 2+ reports on same vouch → automatic moderation queue

### Transparency

**Public moderation log** (anonymized):

```
2025-10-15: User #47291 - Vouch removed (sockpuppet detection)
   Reason: 3 vouches from accounts sharing IP addresses
   Action: Vouches removed, user demoted to Growing tier
   Appeal: None filed

2025-10-12: User #38472 - Flag cleared (false positive)
   Flag: Collusion ring
   Review: Regional club members, legitimate trading group
   Action: Flag removed, no penalty
```

**During investigation notice:**

- Profile shows: "⚠️ This account is under review for unusual activity (as of Oct 15)"
- Listings paused: "Listings temporarily unavailable pending review"
- Clear status: "Review typically completed within 48 hours"

**Appeal process:**

- "Dispute this action" link on any restriction
- Required: Explanation, supporting evidence
- Reviewed by different moderator than original
- Community jury option for borderline cases
- Response within 48 hours guaranteed

### Incentives

**"Community Guardian 🛡️" badge:**

- Awarded after 5 confirmed accurate reports
- Visible on profile and listings
- Reports from Guardians weighted higher
- Progression: Guardian → Senior Guardian (15 reports) → Elite Guardian (50 reports)

**Meta-reputation:**

- Track reporting accuracy: confirmed / total reports
- High accuracy (>80%) = reports fast-tracked
- Low accuracy (<40%) = reports deprioritized, eventually blocked from reporting

**Public recognition:**

- Monthly "Top Guardian" leaderboard
- Annual community safety awards
- Special flair in messages/forums

## Response Playbook

Detailed procedures in [Moderation Playbook](./moderation.md). Summary:

**Level 1: Soft Warning** (confidence < 50%)

- Temporary "Under review" notice
- Require tracked shipping
- Limit to 1 trade per week
- Notify user with evidence

**Level 2: Restriction** (confidence 50-80%)

- Demote trust tier temporarily
- Require re-verification
- Tracked shipping mandatory
- 30-day probation

**Level 3: Suspension** (confidence > 80%)

- Account suspended pending investigation
- All listings frozen
- Moderator deep-dive required
- Contact recent trading partners

**Level 4: Ban** (confirmed fraud)

- Permanent ban + public log
- Fingerprint blacklist
- Notify recent partners
- Law enforcement coordination if needed

## Legitimate Edge Cases

**Important**: These systems must not punish legitimate behavior.

### Family/Household Traders

- **Scenario**: Couple shares collection, both have accounts
- **Detection**: Same IP, device fingerprints, address
- **Solution**: Allow account linking with "Linked to [Partner Name]" badge
- **Benefit**: Vouches from linked accounts don't count (prevent gaming), but trades are allowed

### Game Store Owners

- **Scenario**: High volume, concentrated trades, "unnatural" patterns
- **Detection**: 100+ trades in 90 days, many one-off partners
- **Solution**: "Verified Retailer 🏪" designation with different trust rules
- **Requirements**: Business verification, phone, physical address

### Regional Gaming Clubs

- **Scenario**: 20 members trade mostly within club
- **Detection**: Closed network, high mutual connections
- **Solution**: "Club Member" badge option, group vouching allowed
- **Requirements**: Club registration, public meetup verification

### Collection Liquidation

- **Scenario**: Inactive user returns to sell entire 200-game collection
- **Detection**: Dormancy → sudden high-value listings
- **Solution**: Reactivation verification flow, graduated re-onboarding
- **Process**: Verify identity → small test trade → 7-day cooldown → full access

### Traveling Traders

- **Scenario**: User travels NZ for work, trades in multiple cities
- **Detection**: Frequent location changes, diverse partners (positive!)
- **Solution**: "Road Warrior 🚗" badge, IP variance expected
- **Benefit**: Actually increases trust (proves real person, diverse network)

## Success Metrics

### Detection Effectiveness

- **False positive rate**: < 5% (legitimate users incorrectly flagged)
- **False negative rate**: < 10% (bad actors slip through)
- **Time to detection**: < 3 trades for collusion rings
- **Coverage**: > 90% of fraud attempts flagged before damage
- **Community report accuracy**: > 70%

### Deterrence

- **Attempted gaming reduction**: -50% year-over-year
- **Bad actor tier cap**: <1% of bad actors reach Established
- **Scam value prevented**: Track total $ value of prevented fraud
- **Repeat offenders**: < 5% of banned users successfully re-register

### Fairness

- **Appeal rate**: < 1% of users appeal trust tier calculation
- **Appeal success**: 20-30% of appeals result in reversal (healthy skepticism)
- **Resolution time**: < 48 hours for 95% of appeals
- **User satisfaction**: > 4.5/5 for "Safety measures are fair"

### System Health

- **Automation rate**: > 80% of flags auto-detected (not manual reports)
- **Moderator efficiency**: < 5% of users require manual review
- **Investigation time**: < 4 hours median for flag review
- **Community participation**: > 10% of Growing+ users file at least one report

## Future Enhancements

### Machine Learning (Phase 3+)

- **Anomaly detection**: Learn normal trading patterns, flag deviations
- **NLP for fraud language**: Detect pressure tactics, scam phrasing
- **Network clustering**: Automated graph analysis for ring detection
- **Behavioral biometrics**: Typing patterns, mouse movements

### Cross-Platform Intelligence

- **BGG integration**: Check trading reputation from BoardGameGeek
- **Facebook history**: Optional FB profile link for social proof
- **TradeMe/eBay**: Import seller ratings (if NZ resident)
- **Shared blocklists**: Coordinate with other NZ trading platforms

### Predictive Scoring

- **Fraud risk score**: 0-100 likelihood of future scam
- **Dynamic limits**: Adjust trade caps based on real-time behavior
- **Early warning**: Notify mods before pattern reaches flag threshold
- **Intervention**: Proactive outreach to at-risk accounts

---

**Status:** Design complete, Phase 1 implementation pending
**Owner:** Trust & Safety Team
**Last updated:** 2025-10-20
