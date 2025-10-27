# Moderation Playbook

## Overview

This document provides step-by-step procedures for responding to trust flags, community reports, and suspicious activity on Meeple Cart. The system uses graduated responses based on confidence levels and evidence strength.

## Core Principles

1. **Assume good faith first** - Most users are legitimate; false positives damage community trust
2. **Transparency** - All actions logged publicly (anonymized), clear reasoning provided
3. **Right to appeal** - Every user can dispute actions with evidence
4. **Graduated response** - Start soft, escalate only with evidence
5. **Speed matters** - Quick action protects community, but accuracy trumps speed

## Response Levels

### Level 1: Soft Warning (Confidence < 50%)

**When to use:**

- Single automated flag with low confidence
- Minor pattern irregularity
- First-time suspicious behavior
- Community report without corroboration

**Actions:**

1. **Add temporary notice to profile:**

   ```
   ⚠️ Account under review
   This account is being reviewed for unusual activity.
   This is a routine safety check.
   ```

2. **Require tracked shipping:**
   - All trades must use tracked shipping method
   - System enforces requirement at trade initiation
   - Duration: Until review completed (max 7 days)

3. **Limit trading velocity:**
   - Max 1 active trade at a time
   - 24-hour cooling period between trades
   - Prevents rapid-fire scamming

4. **Notify user via email/platform message:**

   ```
   Subject: Account Security Review

   Hi [Name],

   We've detected some unusual activity on your account and are conducting
   a routine security review to protect both you and the community.

   Temporary measures in place:
   • Tracked shipping required for all trades
   • One trade at a time limit
   • Review notice visible on your profile

   This is likely a false positive and will be resolved quickly. No action
   is needed from you unless you'd like to provide additional context.

   Review details:
   • Flag type: [type]
   • Evidence: [brief description]
   • Expected resolution: Within 3 business days

   If you believe this is a mistake, please reply with any relevant information.

   Thanks for your patience,
   Meeple Cart Trust & Safety
   ```

5. **Internal review:**
   - Moderator manually reviews evidence within 72 hours
   - Check for:
     - False positive indicators (legitimate edge cases)
     - Additional corroborating evidence
     - User's historical behavior
   - Decision: Clear, escalate to Level 2, or maintain monitoring

**Duration:** 3-7 days or until manually cleared

**De-escalation:**

- If cleared: Remove all restrictions immediately, apologize for inconvenience
- If confirmed: Escalate to Level 2

### Level 2: Restriction (Confidence 50-80%)

**When to use:**

- Multiple flags from different sources
- Pattern confirmed but not definitive proof
- Previous Level 1 warning with continued suspicious activity
- Community reports with some corroboration

**Actions:**

1. **Temporarily demote trust tier by one level:**
   - Established → Growing
   - Growing → New
   - Trusted → Established
   - New → Can't demote further; skip to Level 3 if needed

2. **Require re-verification:**
   - Email re-confirmation (send verification link)
   - Phone verification if previously completed
   - Profile completeness check (bio, location, etc.)

3. **Impose trade restrictions:**
   - Max trade value: $100 (regardless of tier)
   - Max 2 active trades simultaneously
   - No new vouch giving (can still receive)
   - Tracked shipping mandatory

4. **30-day probation period:**
   - Restrictions remain for 30 days minimum
   - Successful trades during probation count toward rehabilitation
   - Any new flags during probation → automatic Level 3

5. **Update profile with notice:**

   ```
   ⚠️ Account Restricted (Probation)
   This account is on probation due to suspicious activity detected on [date].
   Trading is limited while under review. Restrictions lift on [date].
   ```

6. **Notify user (more serious tone):**

   ```
   Subject: Account Restricted - Action Required

   Hi [Name],

   Your account has been placed on probation due to suspicious activity.

   What happened:
   • [Specific behavior/pattern detected]
   • Confidence level: Medium
   • Flag source: [Automated system / Community reports / Manual review]

   Restrictions in effect for 30 days:
   • Trust tier temporarily lowered to [tier]
   • Max trade value: $100
   • Tracked shipping required
   • Re-verification required

   What you need to do:
   1. Verify your email: [link]
   2. [If applicable] Verify your phone: [link]
   3. Review our community guidelines: [link]

   If you believe this is a mistake:
   • Reply to this email with explanation and evidence
   • Appeals reviewed within 48 hours by different moderator

   Your account will be automatically reviewed on [date +30 days].
   Successful trades during probation will help demonstrate good faith.

   Meeple Cart Trust & Safety
   ```

7. **Moderator monitoring:**
   - Flag account for enhanced monitoring
   - Review all trades during probation period
   - Check for improvement or continued issues

**Duration:** 30 days minimum

**De-escalation:**

- After 30 days + 2 successful trades: Restore original tier, remove restrictions
- If new flags occur: Escalate to Level 3
- User can appeal for early review after 15 days with strong evidence

### Level 3: Suspension (Confidence > 80%)

**When to use:**

- Strong evidence of fraud or gaming
- Multiple confirmed flags
- User violated probation terms
- Imminent risk to other users

**Actions:**

1. **Suspend account immediately:**
   - Login blocked (can still access read-only to gather evidence for appeal)
   - All active trades frozen in place
   - All listings unpublished (not deleted)
   - Messages disabled except for appeal communications

2. **Freeze all transactions:**
   - Contact recent trading partners (last 30 days)
   - Email: "The user you recently traded with is under investigation. Please report any issues immediately."
   - Provide support contact for victims

3. **Deep investigation:**
   - Manual moderator review (senior moderator or team lead)
   - Check all historical activity:
     - Full trade history and patterns
     - Message transcripts (if relevant to investigation)
     - IP/fingerprint data
     - Related accounts (sockpuppets)
   - Contact recent partners for welfare check
   - Cross-reference with other flags/reports

4. **Update profile:**

   ```
   🚫 Account Suspended
   This account has been suspended pending investigation.
   Listings and trading are unavailable.
   Investigation typically completed within 7 business days.
   ```

5. **Notify user (formal tone):**

   ```
   Subject: Account Suspended - Investigation Required

   Hi [Name],

   Your Meeple Cart account has been suspended pending investigation.

   Reason for suspension:
   • [Specific violations/patterns]
   • Confidence level: High
   • Evidence: [summary]

   Your account status:
   • Login: Read-only access
   • Trading: Disabled
   • Listings: Unpublished
   • Messages: Appeal communications only

   What happens next:
   • Senior moderator will conduct full review within 7 business days
   • We may contact you for additional information
   • We will contact recent trading partners as part of the investigation

   Your options:
   1. Wait for investigation to complete
   2. Appeal this decision:
      • Submit appeal at [link]
      • Include all relevant evidence
      • Response within 48-72 hours

   Possible outcomes:
   • Suspension lifted (false positive)
   • Probation (Level 2 restrictions)
   • Permanent ban (confirmed fraud)

   This is a serious matter. If you believe this is an error, please
   submit a detailed appeal with supporting evidence.

   Meeple Cart Trust & Safety Team
   ```

6. **Investigation timeline:**
   - Initial review: 24 hours
   - Contact partners: 48 hours
   - Evidence gathering: 5 days
   - Final decision: 7 days maximum
   - Notify user of decision + reasoning

**Duration:** Until investigation completes (max 7 days)

**Outcomes:**

- **Cleared (false positive)**: Full restoration, public apology, possible compensation
- **Downgrade to Level 2**: Evidence insufficient for ban, but concerns remain
- **Confirm ban**: Escalate to Level 4

### Level 4: Permanent Ban (Confirmed Fraud)

**When to use:**

- Fraud confirmed through investigation
- Multiple victims with evidence
- Confession or overwhelming proof
- Criminal activity

**Actions:**

1. **Permanent account ban:**
   - Account deleted from active use
   - Login completely disabled
   - Historical data retained for legal/investigative purposes
   - All listings permanently removed

2. **Fingerprint blacklist:**
   - IP addresses logged → banned from registration
   - Device fingerprints → blocked
   - Email domain → flagged
   - Phone number → blacklisted
   - Payment method hashes → flagged for review

3. **Notify victims:**

   ```
   Subject: Update on Investigation - Account Banned

   Hi [Recent Trading Partner],

   Following our investigation into [Banned User], we have confirmed
   fraudulent activity and permanently banned their account.

   If you were affected:
   • File a report at [link] with transaction details
   • We can provide evidence for legal proceedings if needed
   • Consider reporting to local authorities if financial loss occurred
   • Review our trading safety guidelines: [link]

   We take these incidents seriously and have improved our detection
   systems to prevent similar issues in the future.

   If you need support or have questions, please contact us at [email].

   Meeple Cart Trust & Safety
   ```

4. **Public transparency log entry:**

   ```
   2025-10-20: User #48291 permanently banned

   Violation: Confirmed fraud (fast-flip scam)
   Evidence: 3 victims reported non-delivery after payment,
            sudden account value spike, prepayment pressure tactics
   Investigation: 5-day review, contacted all recent partners
   Appeal: User appealed, appeal denied after review
   Outcome: Permanent ban, victims notified, fingerprints blacklisted

   This action upholds our community standards and protects traders.
   ```

5. **Law enforcement coordination (if applicable):**
   - If fraud value > $1000 NZD or multiple victims: Report to police
   - Provide evidence package:
     - User details (email, phone, IP addresses)
     - Transaction records
     - Victim statements
     - Communication logs
   - Cooperate with any investigation

6. **Notify banned user (final):**

   ```
   Subject: Account Permanently Banned

   Your Meeple Cart account has been permanently banned following
   investigation into fraudulent activity.

   Violation: [Specific fraud type]
   Evidence: [Summary]
   Decision date: [Date]

   This decision is final.

   Your account access has been revoked and you are prohibited from
   creating new accounts on Meeple Cart. Attempts to circumvent this
   ban will result in immediate re-banning.

   If you believe this is an error, you may submit a final appeal to
   [senior admin email] within 30 days. Appeals are rarely overturned
   and require substantial new evidence.

   Note: If your actions constitute criminal fraud, we have provided
   information to law enforcement and victims for potential prosecution.

   Meeple Cart Trust & Safety
   ```

**Duration:** Permanent

**Appeal process:**

- Final appeal to senior admin/owner
- Must provide substantial new evidence
- Reviewed within 30 days
- <5% of Level 4 appeals result in overturn

## Special Procedures

### Community Jury System (Future Phase)

For borderline Level 2/3 decisions, involve community:

1. **Select 5 jurors:**
   - Must be Trusted tier
   - No trading relationship with accused
   - Good reporting history
   - Diverse geographic locations

2. **Present evidence (anonymized):**
   - Show pattern/behavior without revealing identity
   - Provide context and guidelines
   - Ask: "Would you trade with this user?"

3. **Jury votes:**
   - Clear / Probation / Suspend / Ban
   - Majority decision is binding
   - Moderator can override only with strong justification

4. **Juror incentives:**
   - Karma points for participation
   - "Community Jury" badge
   - Recognition for service

### Legitimate Edge Case Handling

**Family/household accounts:**

```
IF flag_type == 'sockpuppet' AND
   user_response == "My spouse and I both trade" AND
   accounts_from_same_household
   → ALLOW account linking instead of ban
   → Mark as "Linked to [Partner]"
   → Reduce vouch weight between linked accounts to zero
```

**Game store owners:**

```
IF flag_type == 'unusual_volume' AND
   user_provides_business_verification
   → Convert to "Verified Retailer" account type
   → Different trust rules apply
   → Require business license, physical address, phone
```

**Regional club members:**

```
IF flag_type == 'collusion' AND
   users_are_verified_club_members
   → Clear flag
   → Add "Club Member: [Club Name]" badge
   → Allow internal trading (expected behavior)
```

### Appeal Process

**User submits appeal:**

1. Required information:
   - Explanation of why decision is wrong
   - Supporting evidence (screenshots, receipts, character references)
   - Proposed resolution

2. Different moderator reviews (not original decision-maker)

3. Check for:
   - New evidence not previously considered
   - Misinterpretation of legitimate behavior
   - Technical errors in flag system
   - User demonstrates understanding and remorse (for probation)

4. Response within 48 hours:
   - Uphold original decision (explain why)
   - Reduce severity (Level 3 → Level 2)
   - Clear completely (apologize, restore)

**Appeal success rates (expected):**

- Level 1: ~30% overturned (low confidence flags, often false positives)
- Level 2: ~20% overturned (some legitimate edge cases)
- Level 3: ~10% overturned (high confidence, rarely wrong)
- Level 4: <5% overturned (confirmed fraud, new evidence rare)

## Moderator Tools & Dashboards

### Trust Flags Dashboard

**View:**

- List of all pending flags
- Sorted by confidence score (high → low)
- Filter by flag type, age, status
- Quick actions: Review, Clear, Escalate, Assign to me

**Flag detail view:**

- User profile summary
- Flag type and confidence
- Evidence/data that triggered flag
- Related flags (same user or pattern)
- User's historical behavior (trades, vouches, messages)
- Quick decision buttons: Clear / Level 1 / Level 2 / Level 3 / Ban

### User Investigation View

**Consolidated data:**

- Trust tier history (timeline of changes)
- All flags (current and historical)
- Trade history with partners
- Vouch analysis (who vouched, patterns)
- Message snippets (if relevant to investigation)
- IP/device fingerprint data
- Related accounts (sockpuppet detection)

### Action Templates

**Pre-written messages for common scenarios:**

- Level 1 notification (soft warning)
- Level 2 notification (probation)
- Level 3 notification (suspension)
- Level 4 notification (ban)
- False positive apology
- Appeal response (uphold)
- Appeal response (overturn)

### Public Moderation Log

**Transparency view:**

- All moderation actions (anonymized user IDs)
- Date, action type, reason summary
- Moderator initials (or "System" for automated)
- Appeal status
- Filterable/searchable by community

## Moderation Metrics & KPIs

### Response Time

- Level 1 flags: < 72 hours
- Level 2 flags: < 48 hours
- Level 3 flags: < 24 hours initial, 7 days full investigation
- Appeals: < 48 hours

### Accuracy

- False positive rate: < 5%
- Appeal overturn rate: 10-30% (indicates healthy skepticism)
- Repeat offender rate: < 5% (banned users successfully circumventing)

### Workload

- Moderator hours per week: Track for capacity planning
- Automated vs manual flags: Target >80% automated
- Flags per 1000 users: Benchmark for system health

### Community Impact

- User satisfaction with moderation: >4.0/5
- "Moderation is fair" rating: >4.2/5
- Support ticket reduction: Effective moderation reduces complaints

## Escalation to Admin/Owner

**When to involve senior leadership:**

- Legal threats from banned users
- Media inquiries about moderation
- Potential criminal activity (fraud >$5k, threats)
- System-wide vulnerabilities discovered
- Moderator disagreement on Level 4 decision
- Major false positive affecting many users

## Training & Onboarding

**New moderator checklist:**

- [ ] Read all reputation system docs
- [ ] Shadow experienced moderator for 5 cases
- [ ] Practice on test cases (predetermined flags)
- [ ] Handle 10 Level 1 flags under supervision
- [ ] Certified for independent Level 1/2 decisions
- [ ] After 3 months: Certified for Level 3/4 decisions

---

**Status:** Operational procedures ready
**Owner:** Trust & Safety Team
**Last updated:** 2025-10-20
**Review cycle:** Quarterly or after major incidents
