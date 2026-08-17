# Meeple Cart Launch Readiness Audit

**Audit date:** 2026-08-18
**Assessment:** Advanced pre-alpha; not ready for public launch

## Executive summary

Meeple Cart is a substantial prototype rather than an early concept. It includes a SvelteKit frontend, PocketBase schema and migrations, listings, messaging, notifications, profiles, watchlists, offer templates, trade flows, feedback, vouches, trust tiers, gift cascades, group buys, and trade-party functionality.

The central issue is not a lack of product ideas or code. It is that the repository currently contains too many partially connected systems, conflicting data-model assumptions, and unresolved production concerns. The core marketplace journey is not yet sufficiently reliable or secure for real users trading valuable items.

**Overall conclusion:**

- Private alpha: approximately **2–4 weeks** of focused work.
- Public NZ beta: more realistically **6–10 weeks**.
- Broad feature launch: defer until the core marketplace has been proven with real users.

## Audit scope

This audit reviewed:

- Repository structure and current implementation surface
- Product and technical specifications in `spec/` and `docs/`
- SvelteKit and PocketBase configuration
- Current data model and collection rules
- Build, type-check, lint, and unit-test status
- End-to-end test coverage and alignment with the current model
- Launch, security, moderation, and operational requirements

This is a high-level launch-readiness audit, not a penetration test, accessibility audit, performance audit, or legal review.

## Evidence

The following checks were run:

```text
npm run check
npm run test
npm run build
npm run lint
```

The repository was not otherwise modified during the audit.

| Check           | Result                               | Significance                                        |
| --------------- | ------------------------------------ | --------------------------------------------------- |
| `npm run build` | Fails                                | The production bundle cannot currently be produced. |
| `npm run check` | Fails with 43 errors and 77 warnings | The type/model boundary is not stable.              |
| `npm run test`  | 326 passing, 1 failing, 1 skipped    | The suite is close, but not green.                  |
| `npm run lint`  | Fails                                | Formatting and Svelte syntax issues remain.         |

The build failure includes syntax errors in:

- `src/lib/components/TradeParty/TradeChainDiagram.svelte`
- `src/lib/components/TradeParty/TradeMatchViewer.svelte`

The type-check failures include stale trade statuses, missing public environment typing, outdated item price fields, invalid activity types, and errors in the trade-party components.

The failing unit test is in `src/routes/chat/chat-page.test.ts`, where the expected error message still refers to “discussions” while the implementation refers to “chats”.

## Current strengths

- Meaningful application structure under `src/`
- PocketBase migrations and schema snapshot
- Reusable UI components and shared TypeScript utilities
- Authentication, listings, profiles, messaging, notifications, watchlists, photos, offer templates, feedback, vouches, and trust features represented in code
- A useful unit-test suite covering utilities, components, loaders, trade validation, notifications, and trust logic
- Extensive product documentation covering trust, moderation, trade chains, and future expansion

## Principal findings

### 1. Release gates are currently failing

**Risk:** Critical
**Status:** Open

The application cannot currently produce a clean production build, pass type checking, or pass linting. This prevents confidence that the deployed artifact will match the development environment.

**Required action:** Make build, type-check, lint, and unit tests green before treating feature work as launch preparation.

### 2. The core product flow is not yet one coherent workflow

**Risk:** Critical
**Status:** Open

The intended journey is:

```text
Register → create listing → browse → contact → make offer → accept → complete trade → feedback → reputation
```

Most of these steps exist somewhere in the codebase, but the integration is not yet dependable. Offer templates, trade records, listing status changes, item status changes, feedback, and vouches have evolved across multiple models and implementation stages.

The application should not be considered launch-ready until a real user can complete this journey without manual database repair.

### 3. Data-model migration is incomplete

**Risk:** High
**Status:** Open

The current migration direction moves from individual `games` and item-level prices to `items` plus `offer_templates`. Multiple source files and documents still assume the older model, including references to `games`, `price`, `trade_value`, and `games_via_listing`.

Known affected areas include the offers page, trade detail page, `GameCard.svelte`, old progress reports, migration documentation, and some E2E fixtures.

**Required action:** Choose one authoritative model, update all active code and tests to it, and archive or label superseded documentation.

### 4. Backend authorization requires a security review

**Risk:** Critical
**Status:** Open

The frontend performs important mutations directly against PocketBase. The schema rules appear broad for several sensitive collections, especially:

- Item creation, update, and deletion
- Trade creation and state changes
- Notification creation
- Reputation and vouch counters
- Visibility of messages, trades, profiles, and listings

Client-side validation is not a security boundary. A user who can call PocketBase directly may be able to bypass UI restrictions or manipulate records unless collection rules and server-side hooks prevent it.

**Required action:** Review every collection rule from an attacker’s perspective and move sensitive transitions and counter updates behind validated server-side operations where necessary.

### 5. Existing tests do not yet prove launch readiness

**Risk:** High
**Status:** Open

The unit suite is valuable, but the E2E suite has important limitations:

- Some tests are explicitly skipped because the mock PocketBase URL is not aligned with compile-time environment configuration.
- Some fixtures still use the older `listing_type` and item-price model.
- At least one photo test describes the listing form as broken and creates records directly through the API.
- The main trade-flow test assumes older form fields and workflow behavior.

**Required action:** Replace stale fixtures and skipped tests with authoritative E2E journeys using the current schema.

### 6. Frontend correctness and accessibility debt is visible

**Risk:** Medium–High
**Status:** Open

The build emits warnings involving self-closing non-void HTML elements, missing form-label associations, missing accessible labels, click handlers on non-interactive elements, invalid nested anchors, Svelte 5 reactivity warnings, and hydration-mismatch risks.

Several of these affect keyboard navigation, screen-reader use, or runtime correctness and should be addressed before a broad community launch.

### 7. Production operations are not yet defined

**Risk:** Critical
**Status:** Open

The repository is primarily organized for local development. A launch still requires concrete decisions and runbooks for:

- Production PocketBase hosting and persistent storage
- Automated backups and restoration testing
- HTTPS, domain, CORS, and secrets
- Email delivery and account recovery
- Error tracking and uptime monitoring
- Migration and rollback procedures
- Rate limiting and abuse prevention
- Admin access, moderation, and dispute handling

The static adapter plus browser-side PocketBase architecture can work for a small product, but it increases the importance of strict PocketBase rules and operational monitoring.

### 8. The feature scope is too broad for a first public launch

**Risk:** High
**Status:** Open

Gift cascades, group buys, trade parties, automated trade-chain matching, Trust Buddy verification, advanced moderation, discussion expansion, and price tracking each add data-model complexity, support burden, abuse cases, and testing requirements.

They should not delay the first validated marketplace loop.

## Recommended first-launch scope

Focus the first launch on:

1. Registration and login
2. User profiles
3. Listing creation and management
4. One or more items per listing
5. Browse and search
6. Messaging the listing owner
7. Defined offers and offer acceptance
8. Trade status tracking
9. Completion and dispute handling
10. Feedback and vouches
11. Basic reputation signals
12. Reporting a listing, user, or trade issue

Defer group buys, trade parties, advanced moderation privileges, Trust Buddy verification, advanced price history, and non-essential community features until the core flow is proven.

## Required work before private alpha

### Codebase stabilisation

- Fix the Trade Party Svelte syntax errors.
- Resolve all type-check errors.
- Resolve the failing unit test.
- Make lint and formatting checks pass.
- Remove stale model references from active code.
- Update terminology consistently across routes, tests, and documentation.

### Core workflow completion

- Verify listing creation with the current item model.
- Verify offer-template creation and display.
- Verify offer selection and trade creation.
- Define and enforce the complete trade state machine.
- Ensure listing and item statuses update consistently.
- Ensure completion, feedback, and vouching cannot be duplicated.
- Add an explicit dispute path and admin resolution process.

### Security hardening

- Review all PocketBase collection rules.
- Test unauthorized reads and writes directly against the API.
- Prevent client-side manipulation of counters and derived trust data.
- Enforce ownership and participant checks server-side.
- Add rate limiting or abuse controls for registration, messages, offers, and reports.
- Review file-upload limits and image handling.

### Testing

- Build one current-schema E2E test for the complete two-user trade journey.
- Add negative E2E tests for unauthorized trade access and invalid state transitions.
- Replace stale fixtures and remove unjustified skips.
- Test mobile behavior for listing, messaging, offer, and trade screens.

## Required work before public beta

- Deploy PocketBase with persistent storage and tested backups.
- Configure production environment variables, HTTPS, domain, CORS, and email.
- Add monitoring for application errors, PocketBase availability, disk usage, and backups.
- Write moderation and dispute procedures.
- Publish terms, privacy information, community rules, and reporting instructions.
- Seed the marketplace with enough real listings to avoid an empty launch.
- Recruit trusted early traders.
- Manually support the first completed trades and record failure modes.
- Define success metrics and a rollback plan.

## Suggested delivery sequence

### Phase 1: Stabilise

Make the repository pass its quality gates and settle the data model.

### Phase 2: Complete the core loop

Make listing, offer, trade, completion, feedback, and reputation work together using one authoritative model.

### Phase 3: Secure and test

Harden PocketBase rules, add negative tests, and establish a trustworthy end-to-end journey.

### Phase 4: Private alpha

Invite trusted community members, seed listings, and manually support the first trades.

### Phase 5: Public beta

Launch with a deliberately limited feature set, monitoring, moderation, backups, and a clear support process.

## Public-beta acceptance criteria

Meeple Cart should not move to public beta until:

- `npm run build` passes.
- `npm run check` passes without errors.
- `npm run lint` passes.
- `npm run test` passes.
- The authoritative two-user E2E trade journey passes against the current schema.
- Unauthorized users cannot read or mutate protected records through the API.
- A trade can be completed, disputed, and resolved without direct database intervention.
- Feedback and vouches are protected against duplication and impersonation.
- Production backups have been restored successfully in a test.
- The team has a documented response for reports, disputes, scams, and account recovery.
- The initial marketplace has enough real inventory and active traders to support a useful experience.

## Final assessment

Meeple Cart has strong foundations and more implementation depth than a typical early prototype. Its primary risk is not lack of ambition; it is unfinished integration between several ambitious systems.

The immediate goal should be a small number of real users completing safe, successful trades from listing to feedback. Once that loop is reliable, cascades, group buys, trust systems, and trade-party work can become valuable differentiators. Before then, they are mostly additional launch risk.
