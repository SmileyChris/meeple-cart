# Launch trim — follow-ups (carried out of the SDD ledger, 2026-09-13)

Deferred from the launch-trim branch (merged to main at f360309). None block the trading loop.

## Should do before launch
- Emerald sweep: ~345 `*-emerald-*` utilities remain across 47 files (worst: listings/[id]/+page.svelte, trades/[id]/+page.svelte, settings/+page.svelte). Focus rings and the listing create/manage/detail primary buttons are already converted.
- `src/routes/listings/new/+page.svelte`: `GameEntry.year` and `cashAmount` state are typed `string` but bound to number inputs (runtime-safe; builders coerce and are tested). Widen to `string | number | null`.
- Repo-wide `npm run lint` fails on ~70 pre-existing errors in untouched files (settings, trade-parties, verification, tests-e2e).
- DESIGN.md "Key Characteristics" bullets in the Overview still describe the old slate/emerald system.
- Manual two-browser QA of: listing creation with price + year, manage page, /games Can-post + sort, BGG search while logged in.

## Product questions (deliberately not decided)
- Message-first vs "Propose Trade" builder on the listing page.
- Pin management actions (bump / mark sold / withdraw / relist) — none exist yet.
- Whether /profile absorbs /trades and /watchlist as the mockup does.
- Whether chat and cascade items stay mixed into the home feed.
- The alert-success green sits close to the reserved trust green.

## Type/schema drift
- Phantom TS fields with no migration: UserRecord.phone_verified/phone_hash/preferred_regions (preferred_regions is read in games/+page.ts — dead branch), ListingRecord.listing_type/last_activity/expires_at/auto_extend, TradePartyRecord.matching_preview_at/matching_finalized_at + 'matching_preview' status, TradePartySubmissionRecord.bgg_id (string vs number) / will_ship_to (array vs text).
- `template_type` is written by listings/[id]/templates/new and read by listings/[id]/+page.ts and manage, but the column was removed by migration 1733100000; every listing infers type 'trade'.
- schema-coverage.test.ts never reads pb_schema.json; a test asserting the fields written by listing-create.ts exist in the export would have caught items.can_post.

## Small code nits
- trade-status.ts: legacy 'confirmed' now handled; formatDeliveryMethod handles legacy 'shipped'. Consider a data migration mapping confirmed→accepted and shipped→post, then narrowing the enums.
- Empty-title guard copy mentions "Other Item" for every item type.
- games/+page.svelte imports runtime values from ./+page; move sort options to a sibling module.
- BGG proxy rate limiter get/set is not atomic; duplicate query keys behaviour unverified. `$apis.requireAuth()` accepts any auth collection.
- OfferCard lister-facts line gated on ownerJoinedDate only.
- fb-demo transform.ts `--bgg` can be re-enabled now that BGG_TOKEN exists (Node reads process.env); add the Bearer header there.
