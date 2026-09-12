# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary: New Zealand board gamers who already trade games, currently inside a Facebook group.** They are hobbyists with shelves that fill faster than they empty, coordinating swaps and sales with strangers in the same country, mostly on a phone, in short bursts between other things. The job is: move a game I'm done with, get a game I want, and not get burned by someone I've never met.

Confirmed sub-audiences (from `spec/prd.md`, unvalidated personas — treat as directional, not researched):

- **The Collector** — 50+ games, curates actively, trades to try new titles without growing the shelf. Condition accuracy matters most.
- **The Casual Trader** — 10–30 games, 2–4 trades a year, motivated by one specific want. Needs easy onboarding and legible trust signals.
- **The Deal Hunter** — high volume, price-aware, bundles for value.
- **The Community Builder** — helps newcomers, vouches, organizes local meetups.

## Product Purpose

Meeple Cart gives Aotearoa's board gaming community a dedicated home for trading, selling, and acquiring games — replacing a Facebook group that was never built for the job.

The friction it removes: listings buried in a social feed, no condition grading, no BoardGameGeek data, no search or filtering worth the name, no way to check whether a trader has a history, no structure to a trade once two people agree, and a hard Facebook-account requirement that shuts some of the community out.

Success is a trade that completes cleanly between two strangers, and both of them coming back.

## Positioning

A platform built for the *specific* mechanics of hobby game trading in one country: three-tier listings (listing → offer → item) that handle bundles as first-class, BGG-backed item data, condition grading, region-aware discovery for a long thin country, and a formal trade record with status tracking — all resting on a community reputation system where trust is earned through vouched trades, not stars from anonymous accounts.

A general marketplace can copy the listing form. It cannot copy the community reputation graph or the hobby-specific vocabulary that graph is built from.

## Operating Context

- **Where:** predominantly mobile web, in New Zealand, on connections and devices that are not uniformly new (PRD targets "2+ year old devices", <2s page load on 4G).
- **Geography shapes everything:** NZ is long, thin, and sparsely populated. Region is a primary filter, not a nice-to-have; "can this be posted?" is a core term of every offer; meetups and pickups are common.
- **Trades finish off-platform.** No payment processing, no escrow. Money and games change hands via bank transfer, courier, and in-person handoff. The platform coordinates and records; it does not transact.
- **The incumbent is a Facebook group,** and much of the community still lives there. Behaviors carry over: casual tone, photo-heavy posts, comment-then-DM negotiation.
- **Language:** English only at launch. Currency NZ$.

## Capabilities and Constraints

### The core product (primary — everything design serves)

The end-to-end trading loop:

1. **List** — create a listing containing one or more items, with BGG-backed titles, condition grading (mint/excellent/good/fair/poor), photos, and region.
2. **Offer** — define terms on one or more items together: cash amount, open to lower offers, open to trade offers, what you'd trade for, whether it can be posted. The offer is the unit that appears in discovery.
3. **Discover** — browse and search active offers; filter by region, shippability, openness to trade, condition; watchlist for saved interest.
4. **Communicate** — private message threads per listing, with notifications.
5. **Trade** — a formal trade record with item selection on both sides, granular status (initiated → accepted → shipped → received → completed), and listing/item statuses that follow along.
6. **Feedback** — 1–5 star rating and review on completion.

**Trust and verification sit inside this core, not beside it.** The user identified verification/trust as potentially critical to making core trading work: trust tiers (New / Seedling / Growing / Established / Trusted, from account age + vouched trades), vouches tied to completed trades, and Trust Buddy phone verification as an alternate route to vouching eligibility. Design the trading loop with these signals present, not bolted on.

### Secondary capabilities (built or specced, explicitly not the priority)

The user confirmed all of the following are **secondary**. They exist in the codebase or in specs, and design should not lead with them, expand them, or let them shape the core surfaces:

- Gift cascades (`src/routes/cascades/*`) — community game giveaways
- Group Kickstarter buys (`src/routes/group-buys/*`)
- Trade parties / math trades (`src/routes/trade-parties/*`) — spec marked planning-phase, pages are placeholders
- Hubs (`src/routes/hubs`) — regional community pages
- Chat (`src/routes/chat/*`) as distinct from per-listing messaging

**Undecided:** the exact functional depth of each secondary route (some are live, some are placeholders). Verify against the code before designing any of them; do not assume the spec describes what ships.

### Terminology (use exactly)

- **Listing** — a container owned by a user, grouping items and offers. Not the thing you buy.
- **Offer** — the sellable/tradeable unit with terms. This is what appears in the activity feed.
- **Item** — one physical thing: a game (BGG-linked) or an accessory, insert, 3D-printed part, or piece of gaming furniture.
- **Vouch** — a short testimonial from one member to another, tied to a completed trade.
- **Cascade** — a gift giveaway event.
- Never call an offer a "product" or an item a "SKU". This is a hobby community, not a store.

### Technical constraints

- SvelteKit 2 + Svelte 5 (runes), Tailwind CSS 4, TypeScript.
- **Client-side SPA, no SSR.** Static export via `adapter-static`; all data via the PocketBase client SDK. This constrains anything depending on server rendering, server-side SEO, or per-request personalization at the HTML level.
- PocketBase (embedded SQLite) backend with real-time subscriptions, built-in auth, and file storage. Images are served with PocketBase thumbnails (`?thumb=200x200`).
- No payment processing. No escrow.
- Dark and light themes both exist and both ship (`ThemeToggle.svelte`). Neither is an afterthought.

## Brand Commitments

- **Name:** Meeple Cart. Assets in `static/`: `logo.png`, `favicon.png`, plus `walking.png` and `poop.png` (a waddling-meeple motif exists as `WaddlingMeeple.svelte` — the product already has a streak of humour and does not take itself too seriously).
- **Free, no fees, community-run.** Confirmed by the user as a durable commitment. No listing fees, no transaction fees, no ads. Design must never imply a paywall, a premium tier, a sponsored placement, or a cut of a trade. The PRD lists possible future revenue ideas — those are explicitly **not committed** and must not appear in any surface.
- **Open source and privacy-respecting** — already stated publicly on `/about`.
- **New Zealand, specifically.** Not "Australasia", not "global". Aotearoa/NZ framing, NZ$ pricing, NZ regions.

## Evidence on Hand

Confirmed real, safe to reference:

- **The Facebook group "Buy, Sell and Trade Boardgames NZ", 10,000+ members** — a real, citable community and the honest statement of the problem.
- **BoardGameGeek data** — genuine game titles, years, and metadata via BGG integration.

Confirmed absent — **never fabricate**:

- No user testimonials, quotes, or reviews. The persona quotes in `spec/prd.md` are illustrative writing, not real users.
- No trade counts, user counts, GMV, or activity statistics. The numbers in README/PRD are *targets*, not results.
- No press, case studies, partners, or endorsements.
- Local data comes from `scripts/seed-demo-data.ts` — demo seed, not real activity. Never screenshot it as if it were.

**Test fixture content (private, not public):** to evaluate real-world look and feel, the owner plans to pull listings and photos from the Facebook group via a real browser session they log into (the group is members-only, so anonymous fetching will not reach it). This is **local/alpha test data only** — it is not published content and carries no attribution or consent obligation at this stage. Its value to design is realism:

- Real listing photos are community-authored and messy — phone shots on carpet, inconsistent framing and lighting, mixed aspect ratios, casual titles, wildly variable copy length. Design listing and offer surfaces for *that*, not for studio product shots or uniform crops.
- Treat it as the honest fidelity target for judging any listing/browse design. A layout that only looks good with tidy images is not finished.
- If any of it were ever to become public content, consent and attribution would need settling first — but that is out of scope today.

**Undecided:** whether any real members are using the platform today. Assume pre-launch and design empty states as the honest default state, not the edge case.

## Product Principles

1. **The trading loop is the product.** List → discover → message → trade → complete → vouch. Every surface either advances that loop or gets out of its way. Cascades, group buys, trade parties, and hubs are secondary and never crowd it.
2. **Trust is legible at the moment of decision.** A trader's history, tier, and account age belong where someone is deciding whether to trade — on offers, in messages, on profiles — not filed away on a page nobody visits.
3. **Say the real condition.** Condition grading, what's included, whether it can be posted, whether they'll take a trade. Accuracy about physical goods is what keeps strangers trading; never soften or hide it for visual tidiness.
4. **Built for a phone in a hallway, on a two-year-old device.** Mobile-first is literal here, and performance is a trust signal.
5. **Community, not commerce.** Free, no fees, a little bit of humour, and the tone of the Facebook group at its best — warm, direct, Kiwi. Nothing that reads as a storefront extracting a margin.

## Accessibility & Inclusion

- **WCAG 2.1 AA** is the stated standard (`spec/prd.md`, Non-Functional Requirements). Treat it as binding.
- Must work on devices 2+ years old and on 4G.
- Both dark and light themes are first-class and must both meet contrast requirements.
- **Inclusion is part of why the product exists:** the Facebook account requirement excludes community members. Nothing in Meeple Cart should reintroduce a gate like that.
