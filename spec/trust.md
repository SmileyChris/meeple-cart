# Product Requirements Document: Trust Buddy Verification System

## Meeple Cart - Feature Specification v1.0

---

## Executive Summary

Trust Buddy is an asynchronous, community-driven phone verification system that enables Meeple Cart members to verify each other's phone numbers without platform SMS costs. Verified members volunteer to send verification links to new users, creating a scalable trust network while building community connections.

**Feature Type:** Core Platform Feature  
**Priority:** P0 - Critical for trust establishment  
**Timeline:** MVP in 4 weeks, full rollout in 8 weeks  
**Cost:** $0 operational (community-powered)

---

## Problem Statement

### Current Challenges

**1. Trust Deficit in Trading**

- Users hesitant to trade with unverified accounts
- No way to confirm legitimate phone numbers
- Facebook verification doesn't transfer to our platform
- Email-only verification insufficient for high-value trades

**2. Cost Constraints**

- SMS verification costs $0.08-0.10 per message
- 3,000 target users = $300+/month in verification costs
- Bootstrapped project cannot sustain this expense
- Traditional verification creates ongoing operational burden

**3. Community Disconnection**

- Cold, automated verification lacks human touch
- Missed opportunity for community building
- New users have no initial connection to existing members
- No incentive for existing users to help grow platform

### Opportunity

Transform necessary verification into community-building moment while eliminating operational costs through volunteer-powered system.

---

## Solution Overview

### Core Concept

Existing verified members volunteer to verify new members by sending unique, phone-locked verification links via personal SMS. This creates an asynchronous, scalable verification network.

### Key Innovation

Verification links (format: `cart.nz/trust-[CODE]`) only activate for the specific phone number they were sent to, ensuring security without real-time coordination.

---

## User Personas & Jobs

### Persona 1: New Member (Seeker)

**Who:** Jane, joining Meeple Cart for first time  
**Need:** Quick, simple verification to start trading  
**Friction:** Doesn't want complex process or long waits

**Job:** When I join a trading platform, I want to quickly verify my trustworthiness so I can start trading with confidence.

### Persona 2: Established Member (Verifier)

**Who:** Mike, 20+ trades, active community member  
**Need:** Ways to contribute and earn platform benefits  
**Friction:** Limited time, wants flexible commitment

**Job:** When I have spare moments, I want to help grow the community so the platform thrives and I get recognition.

### Persona 3: Trading Partner (Beneficiary)

**Who:** Sarah, considering trade with new member  
**Need:** Confidence in trading partner's legitimacy  
**Friction:** Risk assessment with strangers

**Job:** When evaluating trade partners, I want to see verification status so I can trade with confidence.

---

## Detailed User Flows

### Flow 1: New Member Verification Request

```
1. START: User clicks "Get Trust Verified"
2. INPUT: Enters phone number (021-555-1234)
3. CONFIRM: Reviews process explanation
4. SUBMIT: Creates verification request
5. WAIT: Enters queue (see position, estimated time)
6. NOTIFY: Receives SMS with link from verifier
7. CLICK: Opens link (cart.nz/trust-ABC123)
8. VERIFY: Enters phone number on landing page
9. SUCCESS: Phone verified, trust badge awarded
```

**Edge Cases:**

- Wrong number entered → Allow 3 correction attempts
- Link doesn't arrive → Show "Request new link" after 1 hour
- Link expired → Clear message with re-request option
- Already verified → Redirect to profile

### Flow 2: Volunteer Verifier Process

```
1. OPT-IN: Toggle "Become a Verifier" in settings
2. CONFIGURE: Set weekly limit (1-20 or unlimited)
3. DISCOVER: View pending requests on dashboard
   - See wait time, location, profile basics
   - Filter by city, wait time
4. SELECT: Choose someone to verify
5. GENERATE: System creates unique link
6. SEND: Copy message template, send via personal SMS
7. CONFIRM: Mark as sent in system
8. COMPLETE: Receive karma when user verifies
9. TRACK: View verification history and stats
```

**Edge Cases:**

- Verifier doesn't send → Release request after 30 mins
- False confirmation → Track completion rates, warn/suspend
- Exceeds weekly limit → Hide from available requests

### Flow 3: Trust Badge Display

```
1. UNVERIFIED: No badge, "Unverified" label
2. PENDING: "Verification pending" with spinner
3. VERIFIED: ✓ Trust Verified badge (green)
4. VOLUNTEER: ✓+ Community Verifier badge (gold)
5. EXPIRED: Badge removed after 12 months inactivity
```

---

## Feature Requirements

### Functional Requirements

#### FR1: Request System

- **FR1.1:** Queue management with position tracking
- **FR1.2:** One active request per user
- **FR1.3:** 24-hour request expiry
- **FR1.4:** Maximum 3 requests per 7 days
- **FR1.5:** Email verification required before phone

#### FR2: Volunteer System

- **FR2.1:** Opt-in/out toggle in user settings
- **FR2.2:** Configurable weekly limits (1-unlimited)
- **FR2.3:** Verification history tracking
- **FR2.4:** Karma points award system
- **FR2.5:** Cannot verify same user twice

#### FR3: Link Generation

- **FR3.1:** Unique code per verification attempt
- **FR3.2:** Phone number hash validation
- **FR3.3:** 24-hour link expiry
- **FR3.4:** Single-use links
- **FR3.5:** Mobile-optimized landing page

#### FR4: Security

- **FR4.1:** Rate limiting (3 attempts per link)
- **FR4.2:** IP tracking for abuse detection
- **FR4.3:** Phone number hashing (never store plain)
- **FR4.4:** Verification pair tracking
- **FR4.5:** Automated fraud detection patterns

#### FR5: Gamification

- **FR5.1:** 2 karma points per verification
- **FR5.2:** Progressive badge system
- **FR5.3:** Weekly/monthly leaderboards
- **FR5.4:** Milestone achievements
- **FR5.5:** Public recognition options

### Non-Functional Requirements

#### Performance

- Link generation: <100ms
- Landing page load: <2 seconds on 3G
- Queue position update: Real-time
- Support 100 concurrent verifications

#### Reliability

- 99.9% uptime for verification service
- Graceful degradation if volunteer shortage
- Automatic request redistribution on timeout

#### Usability

- 3-click maximum to request verification
- Mobile-first interface design
- Clear progress indicators throughout
- Accessible to screen readers (WCAG 2.1 AA)

#### Security & Privacy

- No plain text phone storage
- HTTPS only for verification pages
- Phone numbers masked in UI (XXX-XXX-1234)
- GDPR-compliant data handling

---

## Technical Specifications

### Database Schema

```sql
-- Verification requests
verification_requests {
  id: uuid PRIMARY KEY,
  user_id: uuid REFERENCES users,
  phone_hash: varchar(64) NOT NULL,
  phone_last_four: varchar(4),
  status: enum('pending', 'assigned', 'sent', 'completed', 'expired'),
  queue_position: integer,
  created_at: timestamp,
  assigned_at: timestamp,
  completed_at: timestamp,
  expires_at: timestamp
}

-- Verification links
verification_links {
  id: uuid PRIMARY KEY,
  code: varchar(8) UNIQUE NOT NULL,
  request_id: uuid REFERENCES verification_requests,
  verifier_id: uuid REFERENCES users,
  target_phone_hash: varchar(64) NOT NULL,
  attempt_count: integer DEFAULT 0,
  used: boolean DEFAULT false,
  created_at: timestamp,
  expires_at: timestamp,
  used_at: timestamp
}

-- Verifier settings
verifier_settings {
  user_id: uuid PRIMARY KEY REFERENCES users,
  is_active: boolean DEFAULT false,
  weekly_limit: integer DEFAULT 5,
  total_verifications: integer DEFAULT 0,
  success_rate: decimal(3,2),
  last_verification: timestamp,
  karma_earned: integer DEFAULT 0
}

-- Verification pairs (prevent re-verification)
verification_pairs {
  verifier_id: uuid REFERENCES users,
  verified_id: uuid REFERENCES users,
  verified_at: timestamp,
  PRIMARY KEY (verifier_id, verified_id)
}
```

### API Endpoints

```javascript
// Request verification
POST /api/verification/request
Body: { phone_number: string }
Response: { request_id, queue_position, estimated_wait }

// Get pending requests (verifiers)
GET /api/verification/pending
Response: { requests: [...], total_waiting: number }

// Accept verification request
POST /api/verification/accept
Body: { request_id: string }
Response: { link_code, phone_masked, message_template }

// Confirm link sent
POST /api/verification/sent
Body: { request_id: string }
Response: { karma_pending: number }

// Validate verification link
POST /api/verification/validate
Body: { code: string, phone_number: string }
Response: { valid: boolean, user_id?: string }

// Get verifier stats
GET /api/verification/stats
Response: { total_verified, karma_earned, badges, leaderboard_position }
```

### Security Measures

```javascript
const securityConfig = {
  rateLimiting: {
    requestsPerUser: '3 per 7 days',
    verificationsPerVerifier: '20 per day',
    linkAttemptsPerIP: '10 per hour',
    validationAttemptsPerLink: '3 total',
  },

  fraudDetection: {
    patterns: [
      'Multiple requests from same IP',
      'Verification completed <30 seconds',
      'Same device ID multiple accounts',
      'Verifier success rate <50%',
    ],
    actions: ['Flag for review', 'Temporary suspension', 'Permanent ban'],
  },

  privacy: {
    phoneStorage: 'SHA-256 hash only',
    displayFormat: 'XXX-XXX-1234',
    dataRetention: '90 days for inactive',
    gdprCompliant: true,
  },
};
```

---

## Success Metrics

### Primary KPIs

| Metric                       | Target  | Measurement                             |
| ---------------------------- | ------- | --------------------------------------- |
| Verification completion rate | >80%    | Completed / Requested                   |
| Average time to verification | <30 min | Median wait time                        |
| Volunteer participation      | >10%    | Active verifiers / Total verified users |
| Cost per verification        | $0      | Platform SMS costs                      |

### Secondary KPIs

| Metric                   | Target        | Measurement                           |
| ------------------------ | ------------- | ------------------------------------- |
| Verifier retention       | >60% monthly  | Active this month / Active last month |
| Karma points distributed | 1000+ monthly | Sum of karma awarded                  |
| Fraud detection rate     | <1%           | Fraudulent / Total verifications      |
| User satisfaction        | >4.5/5        | Post-verification survey              |

### Health Metrics

- Queue length (warning if >20)
- Volunteer availability (warning if <5)
- Link expiry rate (<10%)
- Support tickets related to verification (<5% of attempts)

---

## Risk Analysis

### Risk Matrix

| Risk               | Probability | Impact    | Mitigation                            |
| ------------------ | ----------- | --------- | ------------------------------------- |
| Volunteer shortage | Medium      | High      | Incentive program, automated fallback |
| Fraud/gaming       | Low         | High      | Pattern detection, verification pairs |
| Technical failure  | Low         | Medium    | Graceful degradation, manual backup   |
| Privacy breach     | Very Low    | Very High | Hashed storage, minimal data          |
| User confusion     | Medium      | Low       | Clear UX, help documentation          |

### Detailed Mitigations

**Volunteer Shortage:**

- Automated reminder notifications
- Increased karma rewards during shortages
- "Verification drives" with special badges
- Fallback to paid SMS if queue >1 hour

**Fraud Prevention:**

- One-time links locked to phone numbers
- Verification pair tracking
- Success rate monitoring
- Community reporting mechanism

---

## Implementation Phases

### Phase 1: MVP (Weeks 1-2)

**Goal:** Basic functional system

Features:

- Simple request/verify flow
- Basic volunteer dashboard
- Manual queue management
- Phone-locked links
- Success confirmation

Success Criteria:

- 10 successful verifications
- Zero security breaches
- <1 hour average wait

### Phase 2: Automation (Weeks 3-4)

**Goal:** Scalable system

Features:

- Queue position tracking
- Auto-matching algorithm
- Karma points system
- Basic fraud detection
- Mobile-optimized landing

Success Criteria:

- 100 successful verifications
- <30 min average wait
- 20+ active volunteers

### Phase 3: Gamification (Weeks 5-6)

**Goal:** Engagement and retention

Features:

- Badge system
- Leaderboards
- Volunteer preferences
- Achievement tracking
- Public recognition

Success Criteria:

- 15% volunteer participation
- 80% completion rate
- 4.5+ satisfaction score

### Phase 4: Optimization (Weeks 7-8)

**Goal:** Polish and scale

Features:

- Advanced fraud detection
- A/B testing framework
- Analytics dashboard
- API rate limiting
- Performance optimization

Success Criteria:

- Support 1000+ users
- <0.5% fraud rate
- 90% automation rate

---

## UI/UX Specifications

### Design Principles

1. **Simplicity First** - Minimize steps and decisions
2. **Trust Through Transparency** - Show how it works
3. **Community Focus** - Emphasize human element
4. **Mobile Priority** - Touch-friendly, thumb-reachable

### Key Screens

**Request Verification:**

- Single input field (phone)
- Visual process explanation
- Queue position display
- Clear next steps

**Verifier Dashboard:**

- Card-based request list
- One-tap verify action
- Stats prominently displayed
- Achievement progress

**Landing Page:**

- Meeple Cart branding
- Single phone input
- Success celebration
- Auto-redirect to app

---

## Success Statement

Trust Buddy succeeds when new members consistently get verified within 30 minutes by enthusiastic volunteers who feel recognized for their contribution, creating a self-reinforcing community trust network that costs nothing to operate and strengthens platform bonds with every verification.

---

## Appendices

### A. Message Templates

```
Initial SMS: "Hi! I'm [NAME] from Meeple Cart. Click this link to verify your account: cart.nz/trust-[CODE]"

Reminder: "Your Meeple Cart verification link expires soon: cart.nz/trust-[CODE]"
```

### B. Error Messages

- "This link has expired. Please request a new verification."
- "This link was sent to a different phone number."
- "Verification already complete for this number."

### C. Future Enhancements

- WhatsApp integration option
- Verification strength levels
- Group verification events
- International expansion considerations
