# Group Kickstarter Buys - Feature Specification v1.0

## Executive Summary

Group Kickstarter Buys enables Meeple Cart members to collaborate on bulk pledges for Kickstarter and crowdfunding campaigns. The feature supports one or more coordinators running a buy, regional hub logistics for redistributing rewards, registration of interest, ongoing discussion threads, and manual payment tracking using participant-specific codes. No direct payment processing occurs through Meeple Cart; coordinators record payments received outside the platform.

**Feature Type:** Community Trading Extension  
**Priority:** P1 (post-core trading, high community demand)  
**Delivery Target:** MVP in 6 weeks; expanded logistics tooling in 10 weeks

---

## Goals & Objectives

- Simplify organization of group pledges so community members can access Kickstarter exclusives and lower shipping costs.
- Provide transparent state tracking for interest, commitments, payments, and fulfillment without integrating payments.
- Support decentralized logistics with regional hubs that manage local pickups or reshipping after bulk orders arrive.
- Encourage community discussion and knowledge sharing around campaigns while maintaining a clear audit trail for coordinators.

---

## Primary Usage Modes

### 1. Local Cohort Group Buy (Regional Mode)

- Typically one region or store group coordinating an occasional campaign.
- Single hub (or simple direct delivery) with tight-knit participants.
- Emphasis on lightweight tracking, quick setup, and minimal administrative overhead.
- Managers are usually participants; discussion and updates happen in real time.

### 2. Ongoing Network Group (Federated Mode)

- Large, recurring community (mirrors existing Facebook groups) coordinating multiple concurrent buys.
- Multiple hubs nationwide with designated hub managers, shared templates, and governance rules.
- Requires richer reporting, templated workflows, and ability to duplicate past campaigns.
- Central admins oversee compliance while hub leads handle localized logistics.

**Design Approach:** Group buys can be flagged as `regional` or `federated` during creation, unlocking appropriate defaults (single hub vs. hub network, template suggestions, admin dashboards) while sharing a common data model.

---

## Roles & Permissions

| Role          | Description                                                                                         |
| ------------- | --------------------------------------------------------------------------------------------------- |
| Group Manager | Creates group buy, configures pledge tiers, manages participation, tracks payments, updates status. |
| Hub Manager   | Coordinates distribution for a specific regional hub (can be same as Group Manager or delegated).   |
| Participant   | Registers interest, confirms commitment, receives unique payment code, provides shipping details.   |
| Observer      | Browses campaign info and discussion without registering (default community members).               |

Notes:

- A group buy may have multiple managers for redundancy.
- Participants can volunteer as hub managers; approval remains with group managers.

---

## Key User Flows

### Flow 1: Create Group Buy

1. Group Manager selects `Start Group Buy`.
2. Manager enters campaign details (Kickstarter URL, pledge deadline, target pledge tier(s), estimated shipping, regions served) and selects usage mode (`regional` or `federated`).
3. Manager defines required minimum participants and optional maximum capacity per tier; default hub/direct delivery settings pre-populate based on usage mode.
4. System generates overview page with `Register Interest` CTA and discussion thread.

### Flow 2: Register Interest & Discussion

1. Participant hits `Register Interest`.
2. Participant selects desired pledge tier(s), quantity, preferred delivery method (regional hub pickup or direct delivery if enabled), associated hub, and notes.
3. Participant is added to `Interested` list; auto-joins discussion thread with notification preferences.
4. Participants and managers converse in threaded discussion (similar to listing comments) about add-ons, shipping, etc.

### Flow 3: Commitment & Payment Code

1. Once minimum threshold reached (or manually triggered), manager requests confirmations.
2. Participant confirms commitment, providing shipping information (hub pickup confirmation or direct delivery address) and agreeing to terms.
3. System issues unique payment code (e.g., `MC-GB-AB12`) tied to participant entry.
4. Manager shares payment instructions (bank account, reference format) and expected deadline.

### Flow 4: Manual Payment Tracking

1. Participant transfers funds externally using provided code in transaction reference.
2. Manager reviews bank statement/off-platform confirmation.
3. Manager updates participant status to `Paid` and can attach note (e.g., date, amount).
4. System logs change with manager name and timestamp; participants see updated state.

### Flow 5: Regional Hub Allocation & Fulfillment

1. Manager assigns or confirms hub managers per region (Auckland, Wellington, etc.) and enables direct-delivery options where available.
2. Hub manager receives list of participants assigned to their hub with quantities, shipping fees, and payment states; managers see separate queue for direct deliveries.
3. After shipment arrival, manager records package receipt, splits quantities by hub, and updates status (e.g., `Arrived @ Main Hub`, `Sent to Wellington Hub`, `Ready for Pickup`) or creates direct-delivery batches with courier info.
4. Hub manager marks participant pickups as completed, while direct-delivery coordinators record courier tracking and delivery confirmations with optional notes.

---

## Functional Requirements

### FR1: Group Buy Setup

- **FR1.1** Collect campaign metadata (title, URL, pledge deadline, currency, estimated delivery).
- **FR1.2** Support multiple pledge tiers with quantity caps, per-unit price, shipping surcharge, and notes.
- **FR1.3** Allow invitation of co-managers via username/email.
- **FR1.4** Expose public summary with status indicators (interest, commitments, paid, fulfillment).
- **FR1.5** Configure delivery policy per group buy (`Hub pickup only` or `Hub pickup + direct delivery`) and define default shipping cost rules (per hub, per unit/order, direct delivery rates).
- **FR1.6** Select usage mode (`regional` or `federated`) to tailor UI defaults (single hub auto-creation, template suggestions, reporting depth, permission prompts).

### FR2: Interest & Discussion

- **FR2.1** Participants can register interest per tier, specifying quantity and preferred hub.
- **FR2.2** Provide editable `Interest` status until confirmation request is sent.
- **FR2.3** Embed discussion thread scoped to the group buy with notifications and moderation tools (pin, delete, report).
- **FR2.4** Allow attachments/links for campaign updates (e.g., Kickstarter posts).
- **FR2.5** Display estimated shipping costs based on chosen delivery method and hub/direct option before participants submit interest.

### FR3: Commitment Management

- **FR3.1** Managers trigger confirmation window with deadlines per tier.
- **FR3.2** Participants confirm commitment and lock-in quantity; system transitions them to `Committed`.
- **FR3.3** Generate unique payment codes per participant per group buy (stable identifier until completion).
- **FR3.4** Provide participant view of payment instructions, amount owed (including shipping based on delivery method), countdown to payment deadline.
- **FR3.5** Allow managers to override shipping method (e.g., enforce hub change) with participant notification and audit entry.

### FR4: Payment Tracking (Manual)

- **FR4.1** Managers manually mark payments as `Pending Verification`, `Paid`, `Partial`, or `Refunded`.
- **FR4.2** Every status change stores audit trail (manager, timestamp, note, optional attachment screenshot).
- **FR4.3** Participants can upload optional proof of payment for managers to review.
- **FR4.4** Dashboard totals show pledged amount, outstanding balance, and per-tier completion rates.

### FR5: Regional Hub Logistics

- **FR5.1** Define hubs with name, city, pickup instructions, and manager(s).
- **FR5.2** Store per-hub shipping costs (flat or per-unit) and indicate whether pickup fees apply.
- **FR5.3** Auto-aggregate participant counts per hub and pledge tier.
- **FR5.4** Track shipment lifecycle: `Awaiting Campaign`, `In Transit`, `Arrived Main Hub`, `Distributed to Hubs`, `Ready`, `Completed`.
- **FR5.5** Hub managers can mark individual participants as `Picked Up`, `Shipped`, `Delivered`, with notes and optional tracking codes.
- **FR5.6** Support direct-delivery workflow: assign shipping cost, capture tracking, and mark delivery states parallel to hub pickups.
- **FR5.7** Support exporting distribution lists (CSV) filtered by hub, direct delivery, and status.

### FR6: Notifications & Reminders

- **FR6.1** Email/in-app notifications for key events (confirmation requested, payment overdue, hub arrival, pickup reminders).
- **FR6.2** Managers can send bulk messages to all participants or per hub.
- **FR6.3** Participants can mute non-critical updates while still receiving mandatory reminders.

### FR7: Security & Permissions

- **FR7.1** Only managers/co-managers can edit pledge tiers, payments, or hubs.
- **FR7.2** Hub managers have limited rights scoped to their hub (update distribution states, send hub-specific announcements).
- **FR7.3** Participants can withdraw before confirmation deadline; post-confirmation withdrawal requires manager approval.
- **FR7.4** Discussion moderation aligns with existing community guidelines (reporting, manager removal of posts).

---

## Administrative System for Group Managers

### Manager Home Dashboard

- **Snapshot Cards:** Display campaign status, funds committed vs. collected, outstanding payments, and fulfillment progress per hub.
- **Attention Queue:** Prioritized list of actions (new commitments to approve, payment proofs awaiting review, overdue reminders).
- **Timeline Feed:** Chronological log of recent manager actions, participant updates, and hub status changes.
- **Mode-Aware Views:** Regional mode collapses hub metrics into a single summary; federated mode surfaces cross-hub comparisons and allows switching between concurrent group buys run by the same network.

### Participant Management Console

- **Smart Filters:** Search by payment status, pledge tier, hub, or alerted states (e.g., unpaid > 48h deadline).
- **Bulk Actions:** Trigger reminder emails, export filtered lists, switch participants between hubs (with confirmation prompts).
- **Detail Drawer:** Side panel showing participant history, audit trail, notes, proof attachments, and quick status update controls.

### Payment Verification Tools

- **Reference Checklist:** Inline list of pending payment codes with expected amounts; managers can tick off as they reconcile bank statements.
- **Proof Review:** Image/document viewer for uploaded receipts; ability to approve, request re-upload, or flag discrepancies.
- **Dispute Handling:** Start a dispute workflow that notifies participant, allows comments, and tracks resolution state.

### Hub Coordination Workspace

- **Hub Overview:** Map/list view showing hub capacity, packages in transit, items ready, and outstanding pickups.
- **Assignment Board:** Drag-and-drop interface to reassign participants or quantities between hubs when logistics change.
- **Hub Communications:** Templates for hub-specific announcements, pickup schedules, and meetup notes, with delivery tracking.
- **Direct Delivery Queue:** Separate view for courier shipments showing address validation, shipping cost applied, tracking numbers, and delivery confirmations.

### Templates & Resources

- **Message Templates:** Editable library for confirmation requests, payment instructions, reminders, and hub updates.
- **Document Storage:** Attach shared files (e.g., pledge manager spreadsheets) with version notes visible to co-managers.
- **Checklist Builder:** Create custom milestone checklists (e.g., pledge manager lock dates, shipment phases) with completion tracking.
- **Mode Starter Packs:** Provide starter templates—regional (single hub, direct pickup instructions) vs. federated (multi-hub structure, code of conduct, escalation paths).

### Reporting & Audit

- **Export Center:** Generate CSV/PDF summaries for payments, commitments, or fulfillment statuses with timestamped signatures.
- **Audit Trail Viewer:** Filterable log showing who changed what and when, with diff view for critical fields (amounts, statuses).
- **Manager Metrics:** Stats on response times, payment processing lag, hub turnaround times to identify bottlenecks.

### Administrative Safeguards

- **Role Escalation Requests:** Allow managers to invite or demote co-managers/hub managers with confirmation workflows.
- **Session Alerts:** Warn managers of concurrent edits on the same participant to prevent conflicting updates.
- **Archive & Duplicate:** Archive completed group buys with immutable records; duplicate past campaigns as templates for new runs.

### Mode-Specific Adjustments

- **Regional Simplification:** Option to hide unused hub features, condense dashboard to essential stats, and provide direct-delivery default prompts.
- **Federated Governance:** Enable shared manager pools, standardized reporting exports across campaigns, and configurable permissions per hub manager cohort.

---

## Non-Functional Requirements

- **Reliability:** Maintain history of all status changes; provide nightly backups to prevent data loss mid-campaign.
- **Performance:** Group buy overview page loads in <2 seconds with up to 500 participants and 5 hubs.
- **Usability:** Mobile-first forms, clear stepper showing `Interest → Commitment → Payment → Fulfillment`.
- **Compliance:** No storage of banking data beyond notes/manually entered references; align with privacy policy.
- **Scalability:** Support 100 concurrent group buys without cross-campaign confusion; unique payment codes must remain unique per buy.

---

## Data Model (PocketBase Collections)

```javascript
group_buys {
  title: string
  campaign_url: string
  description: text
  pledge_deadline: date
  estimated_delivery: date
  status: select('collecting_interest','collecting_payments','ordered','fulfillment','completed','cancelled')
  managers: relation(users, multiple)
  usage_mode: select('regional','federated')
  delivery_policy: select('hub_only','hub_or_direct')
  created: date
  updated: date
}

group_buy_tiers {
  group_buy: relation(group_buys)
  name: string
  price_per_unit: number
  shipping_per_unit: number
  min_quantity: number
  max_quantity: number
  notes: text
}

group_buy_hubs {
  group_buy: relation(group_buys)
  name: string
  city: string
  instructions: text
  managers: relation(users, multiple)
  shipping_type: select('flat_per_order','flat_per_unit','no_fee')
  shipping_amount: number
}

group_buy_participants {
  group_buy: relation(group_buys)
  user: relation(users)
  tier: relation(group_buy_tiers)
  quantity: number
  hub: relation(group_buy_hubs) // optional when direct delivery
  shipping_method: select('hub_pickup','direct_delivery')
  shipping_cost: number
  shipping_address: json // collected when direct delivery selected
  interest_status: select('interested','withdrawn','committed')
  payment_code: string
  payment_status: select('awaiting','pending_verification','paid','partial','refunded')
  payment_notes: text
  fulfillment_status: select('pending','at_main_hub','at_regional_hub','ready','picked_up','shipped','delivered')
  fulfillment_notes: text
  audit_log: json // list of timestamped actions
}

group_buy_discussions {
  group_buy: relation(group_buys)
  parent: relation(group_buy_discussions, optional) // for threaded replies
  author: relation(users)
  body: text
  attachments: file(multiple)
}
```

Unique Constraints & Indices:

- `payment_code` unique per `group_buy_participants` (format `GB-{groupBuyId}-{shortId}`).
- Composite index on `(group_buy, hub)` for quick aggregation.
- Audit log stored as JSON array of { action, actorId, timestamp, payload } for easy rendering.

---

## API Endpoints (PocketBase Custom Endpoints / SvelteKit Server Routes)

```http
POST /api/group-buys
  -> creates group buy (manager only)

POST /api/group-buys/{id}/tiers
POST /api/group-buys/{id}/hubs

POST /api/group-buys/{id}/register
  Body: { tierId, quantity, hubId, notes }

POST /api/group-buys/{id}/confirm
  Body: { participantId }

POST /api/group-buys/{id}/payments/{participantId}
  Body: { status, note, attachment? }

POST /api/group-buys/{id}/fulfillment/{participantId}
  Body: { status, note, trackingCode? }

GET /api/group-buys/{id}/export?hubs=hubId
  -> CSV export for logistics
```

Audit endpoints should enforce role checks and emit realtime updates for participant dashboards.

---

## Notifications

- **Interest Confirmation:** When participant registers.
- **Confirmation Request:** Sent when managers open commitments.
- **Payment Reminder:** T-3 days and T-1 day before deadline if status not `Paid`.
- **Hub Update:** When shipment moves to participant’s hub or ready for pickup.
- **Direct Delivery Update:** When courier info is assigned, in transit, or delivered for direct shipping participants.
- **Pickup Reminder:** Auto reminder after 7 days if fulfillment status still `Ready`.

Notifications leverage existing PocketBase email templates and in-app alerts.

---

## Risk & Mitigation

| Risk                                     | Impact | Mitigation                                                                                           |
| ---------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------- |
| Insufficient coordinators per hub        | Medium | Allow recruitment posts, highlight hubs lacking managers, enable co-managers.                        |
| Payment disputes due to manual tracking  | Medium | Maintain detailed audit logs, allow participant-uploaded proof, provide dispute escalation workflow. |
| Campaign cancellation or delays          | Medium | Enable status switch to `Cancelled` with bulk refund tracking notes.                                 |
| Overlapping group buys causing confusion | Low    | Filter and tag group buys by status; highlight active commitments first.                             |

---

## Success Metrics

- 80% of participants mark payments as `Paid` before deadline.
- Average of <48 hours between payment received and manager status update.
- At least 2 hubs per active group buy, covering >70% of participant regions.
- Participant satisfaction ≥4/5 post-fulfillment survey regarding clarity and communication.

---

## Future Enhancements

- Automated reminder scheduling with configurable cadence per group buy.
- Integration with shipping label templates for hub managers.
- Cross-campaign wishlists to signal interest before campaigns launch.
- Reputation scores for managers/hub managers based on timely updates.
- Support for multiple waves/add-on orders after initial pledge.

---

## Success Statement

Group Kickstarter Buys succeeds when community members can pool pledges effortlessly, coordinators stay on top of manual payments and logistics without spreadsheets, and regional hubs deliver games quickly while keeping every participant informed from registration through pickup.
