# Meeple Cart Launch Readiness Audit

**Original audit date:** 2026-08-18
**Last re-verified:** 2026-08-18 against branch `security-hardening`
**Assessment:** Advanced pre-alpha; not ready for public launch

> **Revision note.** The original audit was committed in `bb6a7d7`, the same commit that
> fixed many of the defects it reported. Its "Evidence" table therefore described the
> pre-commit state. This revision re-ran every check, marks the resolved findings, and adds
> findings the original pass missed. Every claim carries the command or file reference it
> was verified from.
>
> **Findings 4, 9, 10 and 11 have since been remediated on the `security-hardening`
> branch**, verified against a real PocketBase 0.32 instance rather than by reading the
> migrations. See "Remediation log" at the end of this document.

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

Checks re-run against `bb6a7d7` with a clean `npm ci`:

| Check           | Original audit                       | Verified at `bb6a7d7`                 |
| --------------- | ------------------------------------ | ------------------------------------- |
| `npm run build` | Fails                                | **Passes** — static build written     |
| `npm run check` | Fails with 43 errors and 77 warnings | **0 errors**, 76 warnings             |
| `npm run test`  | 326 passing, 1 failing, 1 skipped    | **327 passing, 0 failing**, 1 skipped |
| `npm run lint`  | Fails                                | Still fails                           |

The syntax errors named in the original audit (`TradeChainDiagram.svelte`,
`TradeMatchViewer.svelte`) and the failing `src/routes/chat/chat-page.test.ts` were all
fixed in `bb6a7d7` itself.

Lint is the only gate still red. Its composition matters:

- 2,614 total ESLint errors, but ~1,800 are in generated or archived files that are not
  ignored: `pocketbase/types.d.ts`, `pocketbase/types_debug.d.ts`, `backups/`.
- **711 errors in `src/` and `tests/`** — the real debt. Dominated by `no-explicit-any`
  (203), `svelte/no-navigation-without-resolve` (183), `prefer-const` (167, almost all in
  the vendored `src/lib/trade-optimizer/algorithm/trademax.ts`), `no-unused-vars` (88).
- `prettier --check` reports style issues in 95 files, which short-circuits the script
  before ESLint runs.

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
**Status:** ✅ **Mostly resolved at `bb6a7d7`** — lint only

Build, type-check, and unit tests now pass. Only `npm run lint` remains red, and most of
its volume is generated files that should be ignored rather than fixed.

**Remaining action:** Add `pocketbase/*.d.ts` and `backups/` to the lint ignore set, run
`prettier --write`, and burn down the ~711 real `src/`+`tests/` errors.

**Root cause is unaddressed:** the gates broke and were repaired by hand with nothing to
stop it happening again. See Finding 11.

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

### 4. Backend authorization is concretely broken in specific, known ways

**Risk:** Critical
**Status:** Partially addressed

The original audit said the rules "appear broad" and asked for a review. The rules are
knowable by reading `pocketbase/pb_migrations/`, so this finding is now stated concretely.

**Already fixed** by `1739700000_fix_collection_rules.js` — the original audit did not
credit this:

- `users.deleteRule` was `""` (any unauthenticated caller could delete any account)
- `messages` list/view were `""` (every private message world-readable)
- `trades` list/view were `""` (every trade record world-readable)
- `items` create/update/delete were any authenticated user

**Still open:**

- `notifications.createRule = null` (superuser only) while the client makes **18
  `pb.collection('notifications').create()` calls** and there is no `pb_hooks/` directory.
  Every one of those calls will 403 in a correctly migrated database.
- `users.updateRule = 'id = @request.auth.id'` permits a user to PATCH their own
  `trade_count`, `vouch_count`, and `cascade_reputation`. Reputation is self-assignable.
- `trades.createRule = '@request.auth.id != ""'` — any authenticated user can create a
  trade naming an arbitrary counterparty.
- `vouches` has no self-vouch guard and no completed-trade precondition.

**Consequence in the running app** (`src/routes/trades/[id]/+page.svelte:193-199` and
`:346-349`): trade completion increments `trade_count` on _both_ buyer and seller from one
client, and vouching increments the _vouchee's_ counter. Under `id = @request.auth.id` one
of those writes always 403s, uncaught, aborting the handler before the notifications —
which would 403 anyway. **The completion and vouch paths cannot succeed against the
current rules.** This is the concrete mechanism behind Finding 2.

**Required action:** Deny counter fields at the rule level, and move counter maintenance
and notification creation into server-side PocketBase hooks.

### 5. Existing tests do not yet prove launch readiness

**Risk:** High
**Status:** Open

The unit suite is genuinely useful (327 passing). The E2E suite is not yet load-bearing:

- **29 of 56 E2E tests are `test.skip`** — 52% of the suite. The original audit's "some
  tests are explicitly skipped" understates this.
- The suite runs against `tests/e2e/mock-pocketbase-server.ts`. It therefore **cannot
  validate collection rules, authorization, or any server-side behaviour by
  construction** — replacing fixtures will not fix that.
- Fixtures in `mock-pocketbase-server.ts`, `trade-flow.spec.ts`, and `photo-gallery.spec.ts`
  still use `listing_type` and item-level prices.

**Required action:** Keep the mock suite for UI behaviour, and add a separate integration
suite that runs against a real migrated PocketBase binary so that rules are exercised.

### 6. Frontend correctness and accessibility debt is visible

**Risk:** Medium
**Status:** Partially resolved

The error-level half of this finding is gone — `npm run check` reports 0 errors. What
remains is **76 warnings across 24 files**: missing form-label associations, missing
accessible names, click handlers on non-interactive elements, and
`state_referenced_locally` reactivity warnings.

These still matter for keyboard and screen-reader users before a community launch, but
they are no longer a build blocker.

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

### 9. Stored XSS in user-authored content

**Risk:** Critical
**Status:** Open

Three call sites render user-controlled content as raw HTML:

- `src/routes/chat/[id]/+page.svelte:361,438` — `{@html marked.parse(thread.content)}`
- `src/routes/trade-parties/[id]/+page.svelte:430,525` — `{@html party.description}` and
  `{@html party.shipping_rules}`, raw user input that is not even parsed as Markdown

`marked` v16 performs **no sanitisation** — its `sanitize` option was removed in v5 — and
there is no DOMPurify or equivalent in `package.json`. Both chat call sites are preceded by
a comment reading "Configure marked for safe rendering" followed by `breaks` and `gfm`,
neither of which has anything to do with safety. That comment is actively misleading.

PocketBase's default auth store keeps the session token in `localStorage`
(`src/lib/pocketbase.ts`), so a stored payload in a chat thread yields token exfiltration
and account takeover on a platform where users arrange payment for physical goods.

**Required action:** Sanitise all HTML before it reaches `{@html}`, via a single shared
helper, and add a regression test that fails if any component calls `{@html}` directly.

### 10. Five collections used by the app have no migration

**Risk:** High
**Status:** Open

The client queries 26 collections. `pocketbase/schema/pb_schema.json` describes 11 and is
badly stale. More seriously, five collections referenced in `src/` have **no migration
anywhere** in `pocketbase/pb_migrations/`:

- `verification_requests`, `verification_links`, `verification_pairs`, `verifier_settings`
- `bgg_info`

`src/routes/settings/+page.ts` — a core, navigation-linked route — loads one of them. On a
freshly migrated database these pages fail outright. This is separate from, and worse
than, the `games` → `items` migration debt in Finding 3.

**Required action:** Either add migrations for these collections or remove the routes that
depend on them. Add a test that fails when `src/` references a collection with no
migration.

### 11. There is no CI

**Risk:** High
**Status:** Open

There is no `.github/` directory and no pipeline of any kind. The quality gates regressed,
were repaired by hand in `bb6a7d7`, and nothing prevents the same regression tomorrow. The
public-beta acceptance criteria in this document assume gates that stay green; without
automation that is a hope, not a control.

This is the cheapest high-leverage item in the audit and the original pass omitted it
entirely.

**Required action:** Add a CI workflow running `check`, `test`, `lint`, and `build` on
every push and pull request.

### 12. A green build hides a dead API route

**Risk:** Medium
**Status:** Open

`svelte.config.js` uses `adapter-static` with `strict: false`. The only server endpoint,
`src/routes/api/trade-parties/[id]/finalize/+server.ts`, is consequently **absent from
`build/`** — verified. `strict: false` is precisely what suppresses the error that would
have caught it.

`src/lib/components/TradeParty/TradeMatchViewer.svelte:100` fetches that path. The SPA
fallback returns `index.html` with status 200, so `response.ok` is `true` and the UI
reports success for an operation that never happened.

**Required action:** Remove the endpoint and call `finalizeTradeMatching` from
`src/lib/trade-optimizer/runner.ts` directly, or set `strict: true` and adopt an adapter
that can serve endpoints.

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

- ~~Fix the Trade Party Svelte syntax errors.~~ Done in `bb6a7d7`.
- ~~Resolve all type-check errors.~~ Done in `bb6a7d7`; 76 warnings remain.
- ~~Resolve the failing unit test.~~ Done in `bb6a7d7`.
- Make lint and formatting checks pass.
- Add CI so the gates cannot silently regress again.
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

- Sanitise every `{@html}` sink and forbid direct use of the tag.
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

- CI enforces the gates on every push.
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

## Remediation log

Everything below was implemented on the `security-hardening` branch and verified against a
real PocketBase 0.32 server with the migrations applied and hooks loaded — not by reading
the migration source.

### Finding 9 — stored XSS: fixed

- `src/lib/utils/sanitize.ts` is now the single sanitisation boundary. It renders Markdown
  with `marked` and passes the result through DOMPurify with a tag and attribute allowlist.
- All five `{@html}` sinks route through it, including the two trade-party fields that
  previously rendered raw user input unparsed.
- `src/lib/utils/html-sinks.test.ts` fails the build if any component passes an unsanitised
  value to `{@html}`, so a new sink cannot be added without going through the helper.
- `src/lib/utils/sanitize.test.ts` covers script tags, inline handlers, `javascript:` URLs,
  iframes and SVG payloads.

### Finding 4 — authorization: fixed

`pocketbase/pb_migrations/1739800100_harden_collection_rules.js`:

- Reputation counters (`trade_count`, `vouch_count`, `cascade_reputation`, the four cascade
  counters and `phone_verified`) are denied to clients on both create and update using
  `@request.body.<field>:isset = false`. Registration can no longer mint an account with a
  chosen reputation.
- `trades.createRule` requires the creator to be the buyer and forbids naming yourself as
  both parties.
- `vouches.createRule` requires the creator to be the voucher and forbids self-vouching.
- `notifications.createRule` moved from superuser-only to authenticated, which is what all
  18 client call sites needed; the fields that make a forged notification dangerous are
  constrained in a hook instead.

`pocketbase/pb_hooks/` now owns every trust-bearing write:

- `reputation.pb.js` sets new-account defaults, increments `vouch_count` on vouch creation
  and decrements it on deletion, increments both `trade_count`s exactly once on the
  transition into `completed`, increments `cascades_seeded`, sets `phone_verified` only
  when a verification link is actually redeemed, and enforces one vouch per direction per
  pair.
- `notifications.pb.js` forces `read` to false and rejects any link that is not a relative
  path, so a forged notification cannot carry an off-site phishing target.

The client no longer writes any of these fields; `src/lib/security/client-writes.test.ts`
fails if that regresses.

Verified against a live server: forged registration rejected (400); self-PATCH of
`trade_count` denied; self-vouch rejected; forged vouch from another user rejected; vouch
succeeds and increments the recipient once; duplicate vouch rejected; forged trade rejected;
legitimate trade completes and increments both parties exactly once, with no double-count on
re-save; an uninvolved user gets 404 on the trade and sees zero rows when listing trades;
anonymous callers see zero messages; a notification with an external link is rejected.

### Finding 10 — missing collections: fixed

`1739800000_verification_and_bgg_collections.js` creates the five collections the client
queried but no migration defined: `verification_requests`, `verification_links`,
`verification_pairs`, `verifier_settings` and `bgg_info`. Phone hashes are readable only by
the requester and the assigned verifier; `verification_pairs` is superuser-write only.

`src/lib/utils/schema-coverage.test.ts` fails if `src/` references a collection that no
migration creates.

### Finding 11 — no CI: fixed

`.github/workflows/ci.yml` runs type check, unit tests, formatting and production build on
every push and pull request. A second job regenerates the collection-rules snapshot from the
real PocketBase binary and fails if the committed file has drifted from the migrations. The
ESLint job runs but is not yet a merge blocker.

### Finding 12 — dead API route: fixed

`src/routes/api/` is gone. `TradeMatchViewer.svelte` calls `finalizeTradeMatching` directly;
authorization comes from the `trade_party_context` collection rules, which restrict writes
to the party organiser.

### Additional defects found while verifying

None of these were in the original audit. Each broke a core flow outright and each is now
covered by a test.

1. **Every vouch creation failed.** `vouches.created` was a required plain date field rather
   than an autodate, so PocketBase rejected the write with "Cannot be blank" before any rule
   was evaluated.
2. **Listing creation, notifications, threads and messages all failed.** PocketBase treats
   `0` and `false` as blank, so a _required_ number or bool field rejects its own initial
   value. `listings.views`, `notifications.read`, `messages.is_public`,
   `discussion_threads.view_count`/`reply_count` and eight others were required.
   `1739800200_unrequire_counter_fields.js` clears the flag on all of them.
3. **No trade notification could ever be stored.** `notifications.type` is a select field
   whose value list contained no trade or offer types at all — `trade_completed`,
   `offer_received`, `vouch_received` and the rest were missing.
   `src/lib/security/notification-types.test.ts` now ties the schema to the types the code
   actually sends.
4. **`reactions` and `trade_party_context` were empty shells.** Both existed with _no fields
   whatsoever_ and superuser-only reads, while the UI read, created, updated and deleted
   them. Both now have the shape the client assumes and rules that match their use.
5. **40 unkeyed `{#each}` blocks** were producing identity-based re-render bugs; all are now
   keyed.

### Still outstanding

- ESLint: 70 errors and 390 warnings, mostly `no-explicit-any` and unresolved navigation
  links left from the games → items migration. Not yet a merge blocker.
- 76 accessibility and reactivity warnings from `npm run check`.
- Rate limiting for registration, messages, notifications and reports.
- The E2E suite still runs against a mock PocketBase and cannot exercise these rules; the
  integration coverage added here is a snapshot test plus manual verification, not an
  automated two-user journey.
- Everything in "Required work before public beta" — hosting, backups, monitoring,
  moderation procedures, and the CORS default of `*`.
