# Launch trim: fix rot, cut bloat, land the Board look

**Spec:** the gap analysis delivered in-session on 2026-09-12 (mockups vs live), PRODUCT.md, and `design-explorations/board.html` (direction contract + tokens). Mockups are reference, not a 1:1 target.

## Global Constraints

- SvelteKit 2 + Svelte 5 runes mode. `$state/$derived/$effect`, `onclick=` syntax. No `$:`.
- Client-side only. **No `+page.server.ts`, no `+server.ts`, no form `method="POST"` actions.** All data via `pb` from `$lib/pocketbase`.
- Theme values live as CSS custom properties in `src/app.css` and are consumed through the existing utility classes (`bg-surface-card`, `text-muted`, `border-subtle`, `btn-primary`, …). Components must not hardcode colours.
- Terminology: Listing (container) / Offer (the tradeable unit with terms) / Item (a physical game). Never "product".
- Free, no fees, community-run. No copy implying otherwise.
- Trust green is reserved for earned trust (TrustBadge). Rust/accent means action and navigation.
- Both dark and light themes must remain complete and pass WCAG AA contrast for body text.
- `npm run test`, `npm run check`, and `npm run lint` must pass in the worktree before a task is reported DONE.
- Each task edits ONLY the files listed under its "Files" heading (plus new test files beside them). Anything else needed is reported as a concern, not edited.
- Commit messages: conventional prefix (`feat:`/`fix:`/`refactor:`/`chore:`), and end the body with the line `Claude-Session: https://claude.ai/code/session_01Y6urmkRhnW8qVASeqptDgg`.
- Do not run `just dev` or start dev servers on the default ports. PocketBase for Task 5 must use a temp data dir and a non-default port.

---

## Task 1: Make listing creation work in one flow

**Why:** `src/routes/listings/new/+page.svelte` posts a form with `method="POST"` and there is no handler anywhere. Creating a listing is broken. The manage page has the same dead form actions. The detail page links to a route that does not exist.

**Files:** `src/routes/listings/new/+page.svelte`, `src/routes/listings/new/+page.ts`, `src/routes/listings/[id]/manage/+page.svelte`, `src/routes/listings/[id]/manage/+page.ts`, `src/routes/listings/[id]/+page.svelte`, `src/routes/listings/[id]/listing-detail.test.ts`, `src/routes/listings/[id]/templates/new/+page.svelte` (only if needed to share a helper), new helper `src/lib/utils/listing-create.ts` + test.

**Requirements:**
1. The new-listing form submits via the PocketBase SDK, no form actions. On submit, in order: create the `listings` record (owner = current user, title, summary, location, regions, status `active`, photos via FormData), create one `items` record per item (listing, title, bgg_id, year, condition, notes, status `available`), then create ONE `offer_templates` record covering all items with the offer terms. Mirror the field names used today in `src/routes/listings/[id]/templates/new/+page.svelte` and the types in `src/lib/types/pocketbase.ts`; if that route writes a field the type lacks, check `pocketbase/pb_migrations/` for the truth and use what the migrations define.
2. Add an "Offer terms" section to the new form: asking price in NZ$ (optional; blank = trade only), "or near offer" checkbox (`open_to_lower_offers`), "open to trade offers" checkbox (`open_to_trade_offers`) revealing a free-text "what you'd take" field (stored in `trade_for_items` as `[text]` or the shape the type declares), "can be posted" at offer level (`can_post`), and offer notes. Remove the per-item can-post checkbox from the new form.
3. Add an item `year` field (number, optional) next to title/condition; BGG search should populate it when it returns a year.
4. Put the pure payload-building logic (form state → three record payloads) in `src/lib/utils/listing-create.ts` and unit-test it with Vitest.
5. On success `goto('/listings/{id}')`. On failure show the error inline with the pattern in CLAUDE.md (status 400/403/other).
6. Manage page: replace every `?/action` form with direct `pb` calls (add game, edit game, remove game, change status, template withdraw). Keep the existing UI.
7. Listing detail page: the "Edit prices" link to `/listings/{id}/edit` must point at `/listings/{id}/manage`; add an owner-only link to `manage` and to `photos` in the owner bar if not present. Remove the share-modal state if it is never rendered.
8. Update `listing-detail.test.ts` if it asserts on any changed markup.

---

## Task 2: Port the Board theme into the live app

**Why:** The chosen direction is `design-explorations/board.html` ("Club Night After Hours"). Its tokens replace the stock-Tailwind slate/emerald values recorded in DESIGN.md.

**Files:** `src/app.css`, `src/app.html`, `src/routes/+layout.svelte`, `src/routes/layout.test.ts`, `src/lib/components/Footer.svelte`, `src/lib/components/ThemeToggle.svelte` (only if needed), `DESIGN.md`.

**Requirements:**
1. Read the `:root`, `.card`, `body`, `body::before`, `body::after`, `.logo*`, `.site-nav`, `.btn-pin` rules and the direction-contract comment at the top of `design-explorations/board.html`. That file is the source of truth for values.
2. Dark theme (default `:root`) token values in `src/app.css` become the board's: `--surface-body` #221e18, `--surface-panel` #302c26, `--surface-card` #302c26, `--surface-card-alt` #3a342c, ghost/borders from the board's `--ghost/--line/--line-strong`, text from `--ink/--ink-2/--ink-soft`, `--accent` #c55236, `--accent-strong` #a93f29, `--accent-soft` rgba(197,82,54,.15), `--accent-contrast` #fff9ee, plus a new `--trust` #2f7654 and `--pin` #d1a33b. Header/nav surfaces derive from the body colour. Alert and badge colours get warm-shifted equivalents at the same lightness (keep them readable; do not leave stock slate values behind).
3. Light theme (`[data-theme='light']`) derives from the board's `.card` override (the cream notice palette): body #f2ead8, panel #f5eddd, card #ffffff-ish cream (#faf5ea), card-alt #e5d8bd, ink #29251f / #50483c / #6c604e, accent #8f3525 / #702719, trust #245c41. Check body-text contrast ≥ 4.5:1 for primary and secondary text on card and body in both themes and note the ratios in the report.
4. Fonts: `src/app.html` loads Bitter 500/700 + Inter 400/600/700 + Momo Trust Display from Google Fonts (one `<link>`). In `app.css` `@theme`: `--font-heading` becomes Bitter (Georgia fallback), add `--font-brand` = Momo Trust Display, keep `--font-sans` Inter. Headings (`h1`–`h3` in the base layer or the existing heading utility) use `--font-heading`. Only the header wordmark uses `--font-brand`.
5. The wall: add the board's `body::before` (light spill + faint dot grid) and `body::after` (SVG grain, opacity .07, soft-light) for the dark theme, position fixed, z-index -1, body `isolation:isolate`. In the light theme keep only the grain at a lower opacity and no light spill.
6. Header in `+layout.svelte`: keep the kiwi `logo.png` at 32px and the wordmark in `--font-brand`. Nav labels become Board (`/`), Browse (`/games`), Chat (`/chat`), Hubs (`/hubs`). Remove the Trade Parties link from the primary nav (it is reachable from Hubs). The primary button reads "Pin a listing" → `/listings/new`. Active-nav underline uses the accent. Apply the same renames in any nav tests in `layout.test.ts`.
7. `btn-primary` is rust with the board's 2px hard-offset shadow `0 3px 0 rgba(2,44,34,.65)` replaced by a warm equivalent; `btn-secondary`/`btn-ghost` keep their structure with new colours. Focus rings use the accent.
8. Rewrite the token tables in `DESIGN.md` to the new values and replace the "Competent Default" overview paragraph with a two-paragraph description of the Club Night After Hours world (charcoal board, cream notices, rust action, green trust, Bitter/Inter, Momo wordmark). Do not touch the sidecar or any other file.

---

## Task 3: Browse page fixes, hubs staleness, dead components

**Why:** `/games` captures a can-post filter that is never applied, counts only the current page, has no sort or price display, and renders a dead type badge. `/hubs` says Group Buys is "coming soon" but the feature is live. Two components are imported nowhere.

**Files:** `src/routes/games/+page.svelte`, `src/routes/games/+page.ts`, `src/lib/components/GameCard.svelte`, `src/routes/hubs/+page.svelte`, delete `src/lib/components/LandingHero.svelte` and `src/lib/components/WatchlistButton.svelte` (and their tests if any), plus any test files beside the edited routes.

**Requirements:**
1. In `games/+page.ts`, the `canPost` filter is added to the PocketBase filter string whenever it is on, independent of the region filter. The "Can post" toggle in `+page.svelte` is always visible.
2. The results count uses `pagination.totalItems` ("N games match"), not the current page length.
3. Add a sort control with three options: Newest (default, `-created`), Price low→high, Title A–Z. Map to PocketBase `sort` strings. Persist it in the URL like the other filters.
4. `+page.ts` maps `items.year` and `items.price` into the game preview; `GameCard.svelte` shows "Title (Year)" when year is present and the price (NZ$, from `price` or the offer's `cash_amount` if that is what the loader has) when present. Remove the dead type badge that reads `game.type` (never populated on this route).
5. Empty state gets two actions: "Clear all filters" and a link to `/chat`.
6. `/hubs`: Group Buys card links to `/group-buys`, drop the "Coming Soon" pill and the opacity. Do not add narrative.
7. Delete `LandingHero.svelte` and `WatchlistButton.svelte`. `npm run check` must prove nothing imports them.

---

## Task 4: Surface trust and facts already in the data

**Why:** Vouch counts, joined dates, and item conditions are loaded but not shown. The trust tier renders as an emoji on cards. The profile page hides the public view and never shows the member's own tier.

**Files:** `src/lib/components/OfferCard.svelte`, `src/lib/components/TrustBadge.svelte`, `src/routes/chat/+page.svelte`, `src/routes/chat/+page.ts`, `src/routes/profile/+page.svelte`, `src/routes/profile/+page.ts`, `src/routes/home-page.test.ts`, plus any tests beside those files.

**Requirements:**
1. `TrustBadge.svelte` gains an optional `compact` prop (boolean, default false) rendering just the tier label in a small pill sized for card metadata. Colour comes from the `--trust` token via a utility (use `style="color: var(--trust)"` or a class that resolves to it; do not hardcode hex). Existing usages keep working.
2. `OfferCard.svelte`: replace the emoji tier next to the lister with `<TrustBadge compact …/>` fed by the `ownerVouchedTrades`/`ownerJoinedDate` values the loader already provides. Add a lister facts line: "{N} vouched trades · joined {YYYY}". Add a condition line under the title: for a single item "Condition: **{condition}**"; for a bundle list each item as "{title} · {condition}" up to 4 then "+N more". Keep the rest of the card as is.
3. `chat/+page.ts` expands enough of the author to compute a tier (`vouch_count` as the vouched-trades proxy and `created`/`joined_date`); `chat/+page.svelte` shows `<TrustBadge compact …/>` after the author name on each thread card.
4. `profile/+page.svelte`: show `<TrustBadge …/>` next to the display name; add a "View public profile" link to `/users/{id}`; put the existing edit form behind an "Edit profile" toggle button (collapsed by default, `$state`). No new fields.
5. Update `home-page.test.ts` and any chat/profile tests to match.

---

## Task 5: Bring the checked-in schema and types back in sync

**Why:** `pocketbase/schema/pb_schema.json` has no `offer_templates` collection and `listings` lacks `regions`; the migrations do define them. `templates/new` writes `template_type`, which `OfferTemplateRecord` does not declare.

**Files:** `pocketbase/schema/pb_schema.json`, `src/lib/types/pocketbase.ts`, `src/lib/utils/schema-coverage.test.ts` (only if its expectations need to follow the regenerated schema), `pocketbase/schema/README.md` (create if absent, documenting the regeneration command).

**Requirements:**
1. Start a throwaway PocketBase (use `scripts/download-pocketbase.sh` if the binary is absent; look at `scripts/dev.sh` for how it is launched) with `--dir` in a temp directory and `--http 127.0.0.1:8099`, so all migrations in `pocketbase/pb_migrations/` apply. Create a superuser non-interactively, then fetch `/api/collections?perPage=200` and write the `items` array to `pocketbase/schema/pb_schema.json` in the same top-level shape the file has now, pretty-printed. Stop the server and delete the temp dir.
2. Diff the regenerated collections against `src/lib/types/pocketbase.ts`. Add missing fields to the record types (e.g. `template_type` on `OfferTemplateRecord` if the migrations define it; `regions`, `bump_date` on listings if absent). Do not remove fields that exist in the schema. Do not touch any route file.
3. `schema-coverage.test.ts` must pass against the new file.
4. Write the regeneration steps into `pocketbase/schema/README.md` as a short runnable snippet.

---

## Task 6: Repair the silently no-op trade-flow migration

**Why:** `pocketbase/pb_migrations/1736414700_enhanced_trade_flow.js` updates `trades.status` values through `statusField.options.values`. PocketBase 0.32 (the pinned version in `scripts/download-pocketbase.sh`) has no `.options` on fields, so the `if (statusField && statusField.options)` guard is false and the update is skipped. The regenerated schema (Task 5) proves it: `trades.status` still only allows initiated/confirmed/completed/disputed/cancelled, while `src/routes/trades/**` sets accepted/shipped/received. Likewise `trades.delivery_method` allows `shipped` but the listing page writes `post`.

**Files:** new migration `pocketbase/pb_migrations/1757700000_fix_trade_status_values.js`, `pocketbase/schema/pb_schema.json` (regenerate per Task 5's README), `src/lib/types/pocketbase.ts` (only `TradeStatus` and `DeliveryMethod` unions if they need to change), `src/lib/utils/schema-coverage.test.ts` only if needed.

**Requirements:**
1. Audit every block of `1736414700_enhanced_trade_flow.js` (status values, tracking fields, notification types) and any other migration that reads or writes `field.options` — list which ones actually took effect on 0.32 by comparing with the regenerated schema.
2. Write ONE new migration, using the 0.23+ field API (fields are typed objects; select values live at `field.values`; use `collection.fields.addAt/getByName` etc. as PocketBase 0.32's JS migrations documentation shows), that makes the live schema match what the app code expects: `trades.status` values = initiated, accepted, shipped, received, completed, disputed, cancelled (keep `confirmed` so no existing row becomes invalid); `trades.delivery_method` values = in_person, post, either (keep `shipped` too, for the same reason); any tracking field or notification type from the old migration that did not land. Include a `down` that reverts the values.
3. Do NOT edit the old migration file (it has already been recorded as applied in existing databases).
4. Regenerate `pocketbase/schema/pb_schema.json` with the README procedure so the new values are visible, and make `TradeStatus`/`DeliveryMethod` in `src/lib/types/pocketbase.ts` include exactly the union now in the schema.
5. Prove it: after regeneration, grep the JSON for the trades status values and paste that in the report. `npm run test` and `npm run check` pass.

---

## Task 7: Proxy BoardGameGeek through PocketBase with the new API token

**Why:** As of 2026-09-12 BGG's XML API returns 401 without authentication and 200 with `Authorization: Bearer <token>` (verified with curl). `src/lib/bgg/client.ts` and `BggSearch.svelte` call `https://boardgamegeek.com/xmlapi2` directly from the browser with no auth, so game search and BGG enrichment are broken in the live app. The app is a client-side SPA, so the token cannot ship in `src/`; the only server we run is PocketBase, whose JS hooks can add routes and make outbound HTTP calls.

**Files:** new `pocketbase/pb_hooks/bgg.pb.js`, `src/lib/bgg/client.ts`, `src/lib/bgg/index.ts` (only if exports change), `scripts/dev.sh`, `justfile` (only the pocketbase launch line, if that is where it lives), `.env.example` (create if absent), `README.md` (one short section on BGG_TOKEN), plus tests beside `src/lib/bgg/` for any pure logic you add.

**Requirements:**
1. `bgg.pb.js` registers two GET routes with `routerAdd`: `/api/bgg/search` and `/api/bgg/thing`. Each reads `BGG_TOKEN` via `$os.getenv`, forwards ONLY an allow-listed set of query params (`search`: `query`, `type`, `exact`; `thing`: `id`, `stats`, `type`) to the matching `https://boardgamegeek.com/xmlapi2/...` endpoint using `$http.send` with `Authorization: Bearer <token>`, and returns BGG's body with the upstream status and `Content-Type: text/xml`. Cap `query` at 100 characters and `id` at 20 comma-separated integers; reject anything else with 400. If the token is missing return 503 with a JSON body `{ "error": "BGG_TOKEN not configured" }` and log once at startup. Upstream 202 (BGG "queued") must pass through as 202 so the existing client retry logic still works.
2. Apply a simple per-process rate limit in the hook (one upstream call per ~1s; BGG's guidance) using a module-level timestamp and `$http` sleep-free logic (return 429 with `Retry-After: 1` if called too fast) — do not busy-wait inside the hook.
3. `src/lib/bgg/client.ts`: point `BGG_API_BASE` at the PocketBase origin (`${pb.baseURL}/api/bgg` — import `pb` from `$lib/pocketbase`, do not hardcode a URL) so `fetchGameById`, `searchGames`, and any other callers go through the proxy. Keep the existing client-side rate limiter and retry-on-202 behaviour. No token, no `VITE_`/`PUBLIC_` BGG variable, anywhere under `src/`.
4. `scripts/dev.sh` (and the `justfile` recipe if it launches PocketBase itself) must export `BGG_TOKEN` from `.env` into the PocketBase process environment before `pocketbase serve`. Use `set -a; . ./.env; set +a` or equivalent; the token must never be echoed.
5. Add `.env.example` with `PUBLIC_POCKETBASE_URL=http://127.0.0.1:8090` and `BGG_TOKEN=` plus a comment. Do not commit `.env`.
6. Prove it end-to-end: start a throwaway PocketBase on `127.0.0.1:8099` with `--dir` in a temp directory, `BGG_TOKEN` exported from `.env`, and `--hooksDir pocketbase/pb_hooks`; curl `/api/bgg/search?query=wingspan&type=boardgame` and paste the HTTP status and the first 200 bytes of XML into the report (no token in the report); also show the 400 for a disallowed param and the 503 when the token is unset. Stop the server and delete the temp dir.
7. `npm run test`, `npm run check`, `npm run build` pass; lint clean on touched files.
