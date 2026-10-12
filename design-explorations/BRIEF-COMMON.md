# Meeple Cart — redesign exploration, common brief

You are building ONE static, self-contained HTML mockup of the same surface: the **browse / activity feed** — the page where a visitor scans live offers and picks one to pursue. Mode: **Operate** (the visitor completes a task: find a game worth trading for). This is a direction exploration, not production code.

## Product truth (binding — read /home/chris/dev/cart/meeple-cart/PRODUCT.md for the full record)

- Meeple Cart: a **free, no-fees, community-run, open-source** board game trading platform for **New Zealand**. Nothing in the design may imply paywalls, premium tiers, sponsored placement, or a cut of trades.
- Core loop: list → offer → discover → message → trade → complete → vouch. **Trust is inside the core**, not decoration.
- Terminology is locked: **Listing** (container) ≠ **Offer** (the sellable/tradeable unit shown in the feed) ≠ **Item** (a physical game). Never "product", never "SKU".
- Trust tiers (must appear on offers, designed — not OS emoji): New, Seedling, Growing, Established, Trusted. Derived from account age + vouched trades. Design a real visual system for these (drawn SVG marks, typographic marks, whatever your world dictates).
- An offer has: one or more items (games), an asking price in NZD and/or trade terms ("open to trade offers", "or near offer"), a location + region, a "can post" (shippable) flag, condition per item (mint/excellent/good/fair/poor), and free-text notes of wildly varying length.
- **Never fabricate**: testimonials, user counts, trade counts ("12,000 trades completed"), press, partner logos. Plausible individual listings are fine; aggregate social proof is not.

## Content realism (binding)

Real photos on this platform are messy community phone shots — games on carpet, bad lighting, odd crops. Your mockup must be honest about that:
- Represent photos as **varied inline-SVG placeholder art**: different aspect ratios, different muted color casts, slight rotation/framing irregularity where your world allows. A layout that only works with uniform tidy images is a failure.
- Use real game titles (Wingspan, Brass: Birmingham, Everdell + expansions bundle, Root, Gloomhaven, Ark Nova, Cascadia, Spirit Island, Terraforming Mars, Azul, Heat: Pedal to the Metal, Dune: Imperium, Carcassonne + 3 expansions, Twilight Imperium 4th ed, Patchwork…), NZ locations (Auckland, Wellington, Christchurch, Dunedin, Hamilton, Tauranga, Palmerston North, Nelson), plausible NZD prices ($15–$250), and **varying copy lengths** — one-line notes next to three-sentence notes.
- Include at least 8 offers, a page header/nav (Browse, Wanted, Messages, Trades, profile), a filter row (region, sell/trade/both, can-post), and one offer that is a multi-item bundle.

## Structure of your deliverable

- ONE file at the exact path given in your task. Self-contained: inline CSS + inline SVG. Google Fonts `<link>` allowed (pick faces that genuinely carry your world; system display faces are a failure).
- Start the file with an HTML comment **direction contract**: name, one-paragraph world statement, palette tokens, type pairing, and the 3–5 system rules your world enforces.
- Desktop-first but must reflow respectably at 400px wide (use real media queries).
- Interactive states in CSS: hover, `:focus-visible` on every interactive element, one authored motion moment (not scattered effects, no identical fade-in on everything).
- Theme the browser surfaces: `::selection`, scrollbar, focus ring color, `font-variant-numeric: tabular-nums` on prices.

## Craft floor (binding)

- Body/placeholder text contrast ≥4.5:1; large text ≥3:1. Secondary text on colored surfaces is tinted from the hue, never flat gray.
- Shadows carry offset + soft blur (unless your world is genuinely flat or genuinely neobrutalist by contract).
- No kicker/eyebrow labels above headings. No same-size icon+heading+text card grids as page structure. No gradient text. No emoji as icons — draw SVG in one consistent stroke weight. No monospace as a "technical" costume (monospace for data/prices is fine if your world earns it).
- Tight groups, generous separation; more space above headings than below.
- Commit fully to your world. A watered-down average of "modern web app" is the failure mode this exploration exists to escape. The incumbent design (DESIGN.md) is an anti-reference: dark navy + emerald Tailwind defaults, five radii, everything text-sm. Do not reproduce it.

## What NOT to do

- Do not build multiple pages. One feed page.
- Do not add JS beyond (optionally) trivial theme/no-op interactions; CSS-only preferred.
- Do not run screenshot tools, dev servers, or install anything. Write the file, verify it is well-formed, and return a 3-line summary: direction name, the one idea the world is built on, and any risk you see.
