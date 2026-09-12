---
name: Meeple Cart
description: Club Night After Hours — a warm charcoal noticeboard with cream notices, rust action and a green trust stamp
colors:
  accent: '#c55236'
  accent-strong: '#a93f29'
  accent-soft: 'rgba(197, 82, 54, 0.15)'
  accent-contrast: '#fff9ee'
  accent-fill: '#b8462b'
  trust: '#2f7654'
  pin: '#d1a33b'
  surface-body: '#221e18'
  surface-panel: '#302c26'
  surface-card: '#302c26'
  surface-card-alt: '#3a342c'
  surface-ghost: 'rgba(246, 236, 216, 0.08)'
  surface-nav: 'rgba(34, 30, 24, 0.55)'
  surface-header: 'rgba(34, 30, 24, 0.92)'
  text-primary: '#f5eddd'
  text-secondary: '#d8cdb8'
  text-muted: '#b9aa91'
  border-subtle: 'rgba(232, 217, 188, 0.26)'
  border-strong: 'rgba(232, 217, 188, 0.46)'
  border-nav: 'rgba(232, 217, 188, 0.46)'
  listing-trade: '#d1a33b'
  listing-sell: '#c55236'
  listing-want: '#6e8e95'
  badge-emerald: '#a7f3b4'
  badge-amber: '#fcc24d'
  badge-rose: '#fda4b3'
  badge-sky: '#fc9d7d'
  badge-blue: '#fdbf93'
  badge-purple: '#feb4ba'
  badge-lime: '#f2f264'
  badge-violet: '#febab4'
typography:
  display:
    fontFamily: 'Bitter, Georgia, serif'
    fontSize: '2.25rem'
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: '-0.025em'
  headline:
    fontFamily: 'Bitter, Georgia, serif'
    fontSize: '1.5rem'
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: '0.025em'
  title:
    fontFamily: 'Bitter, Georgia, serif'
    fontSize: '1.125rem'
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 'normal'
  brand:
    fontFamily: 'Momo Trust Display, Bitter, Georgia, serif'
    fontSize: '1.5rem'
    fontWeight: 400
    lineHeight: 1
    letterSpacing: '0.01em'
  body:
    fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif'
    fontSize: '0.875rem'
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 'normal'
  label:
    fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif'
    fontSize: '0.75rem'
    fontWeight: 600
    lineHeight: 1.33
    letterSpacing: '0.025em'
rounded:
  md: '6px'
  lg: '8px'
  xl: '12px'
  2xl: '16px'
  full: '9999px'
spacing:
  xs: '4px'
  sm: '8px'
  md: '12px'
  lg: '16px'
  xl: '24px'
  2xl: '32px'
components:
  button-primary:
    backgroundColor: '{colors.accent-fill}'
    textColor: '{colors.accent-contrast}'
    rounded: '{rounded.full}'
    padding: '8px 16px'
    typography: '{typography.label}'
  button-primary-hover:
    backgroundColor: '{colors.accent-strong}'
    textColor: '{colors.accent-contrast}'
  button-secondary:
    backgroundColor: 'transparent'
    textColor: '{colors.accent}'
    rounded: '{rounded.full}'
    padding: '8px 16px'
  button-secondary-hover:
    backgroundColor: '{colors.accent-soft}'
    textColor: '{colors.accent-strong}'
  button-ghost:
    backgroundColor: 'transparent'
    textColor: '{colors.text-secondary}'
    rounded: '{rounded.full}'
    padding: '6px 12px'
  button-ghost-hover:
    backgroundColor: '{colors.surface-ghost}'
    textColor: '{colors.accent-strong}'
  card:
    backgroundColor: '{colors.surface-card}'
    textColor: '{colors.text-primary}'
    rounded: '{rounded.xl}'
    padding: '20px'
  input:
    backgroundColor: '{colors.surface-card}'
    textColor: '{colors.text-primary}'
    rounded: '{rounded.lg}'
    padding: '8px 12px'
  chip-trust:
    backgroundColor: '{colors.surface-ghost}'
    textColor: '{colors.badge-emerald}'
    rounded: '{rounded.full}'
    padding: '4px 12px'
    typography: '{typography.label}'
  nav-item:
    backgroundColor: 'transparent'
    textColor: '{colors.text-muted}'
    rounded: '{rounded.lg}'
    padding: '8px 12px'
---

# Design System: Meeple Cart

## Overview

**Creative North Star: "Club Night After Hours"**

The same community noticeboard Meeple Cart has always been — every offer an individual pinned notice, trust a rubber stamp, the tone "someone near you has this" — now lit after the hall lights dim: a warm charcoal noticeboard, cream paper notices, rust-red drawing pins and action, and a single green trust stamp reserved for what members have actually earned. It is a real club's working surface, not a marketplace dashboard borrowing board-game language. Bitter carries the editorial, printed-notice voice for headings; Inter runs the controls, notes and dense trading data underneath it; and the wordmark keeps the site's own brand face, Momo Trust Display, beside the kiwi meeple mark.

Two rules hold the world together. First, colour carries meaning and nothing else: rust means navigation and action — every button, link, focus ring and active tab — while the green trust stamp appears nowhere except where trust has actually been earned, so it can never be mistaken for a generic "success" state. Second, the board is a real object: cards read as paper notices rather than nested app panels, hierarchy comes from rules, type and spacing rather than more roundedness, and the wall itself — a flat warm charcoal with one lamp-light spill from above, a faint pinboard dot grid, and a fine paper grain — stays quiet enough that it never competes with what's pinned to it.

**Key Characteristics:**

- Dark-first with a genuine, complete light counterpart; both themes are first-class and switch via a `data-theme` attribute on `<html>`.
- Every color is an unmodified Tailwind default swatch. Zero custom hues.
- A single emerald accent carries every affordance: buttons, links, focus rings, active states, borders.
- Four-step tonal surface ladder (`body` → `panel` → `card` → `card-alt`) instead of shadows.
- No coherent shape language: five radii in active use with no rule governing them.
- Type hierarchy is intended but only half-loaded — the body typeface never reaches the browser.
- Trust, the product's differentiator, is expressed almost entirely through emoji.

## Colors

A dark slate ground with a single emerald accent, doubled into a complete light theme. Every token below is defined twice — once on `:root` (dark) and once on `[data-theme='light']` — with the frontmatter carrying the dark values as canonical. Three listing-type colors additionally use CSS `light-dark()` in the `@theme` block, making them the only tokens that switch without the attribute.

### Primary

- **Meeple Emerald** (`#34d399` dark / `#059669` light): The only accent in the system. Carries primary buttons, all link hover states, focus rings, active navigation, blockquote rules, and the "trade" listing type. Its overuse is the reason the interface reads as monotone-with-green rather than as having a palette.
- **Emerald Deep** (`#10b981` dark / `#047857` light): The hover and pressed state for every emerald surface, and the border color for trade/sell listings.
- **Emerald Wash** (`rgba(52, 211, 153, 0.12)`): A 12% tint used as the hover fill on secondary buttons, active filter chips, and the open state of filter dropdowns.
- **Emerald Contrast** (`#022c22` dark / `#f1fff7` light): Text color on filled emerald buttons. Near-black green in dark mode, near-white green in light.

### Neutral

Surfaces form a four-step tonal ladder. Depth is communicated by stepping up this ladder, not by shadow.

- **Void** (`#050b1a` dark / `#f2f6fb` light): The page ground. Darker and bluer than Tailwind's `slate-950`; one of the few hand-tuned values.
- **Panel** (`#0f172a` dark / `#ffffff` light): `slate-900`. Forms, login card, elevated containers.
- **Card** (`#111c2f` dark / `#f1f5f9` light): The default card and input fill; one step above the ground.
- **Card Alt** (`#19263b` dark / `#e2e8f0` light): Nested surfaces — code blocks, table headers, image placeholders, avatar circles.
- **Ghost** (`rgba(148, 163, 184, 0.08)`): A near-invisible slate tint for ghost-button hover fills.
- **Paper White** (`#f8fafc` dark / `#0f172a` light): Primary text. `slate-50` inverted to `slate-900`.
- **Muted Steel** (`#8ea0c0` dark / `#64748b` light): Metadata, timestamps, inactive navigation, placeholder copy. Carries a large share of the interface.
- **Hairline** (`rgba(148, 163, 184, 0.28)`): The default border. Nearly every card, input, and divider in the application uses this one value.

### Tertiary

An eight-color badge set exists purely for categorical tinting, redefined per theme so that light mode uses saturated dark values where dark mode uses pale tints. These are Tailwind's `-300`/`-700` steps, unmodified.

- **Amber** (`#fcd34d` / `#b45309`), **Lime** (`#bef264` / `#4d7c0f`), **Sky** (`#7dd3fc` / `#0369a1`), **Emerald** (`#a7f3d0` / `#047857`), **Violet** (`#d8b4fe` / `#6b21a8`): the five trust tiers, in ascending order.
- **Rose** (`#fda4af` / `#be123c`), **Blue** (`#93c5fd` / `#1d4ed8`), **Purple** (`#d8b4fe` / `#7e22ce`): status and category tinting elsewhere.

Note that **Violet and Purple are the identical value** (`#d8b4fe`) in dark mode — a duplicate token that should collapse.

### Named Rules

**The Single Accent Rule.** One emerald does every job in the interface: primary action, link, focus, active state, selection, and the "trade" category. There is no second voice. Anything that needs to feel different from a button currently cannot.

**The Tonal Ladder Rule.** Elevation is expressed by moving up the surface ramp (`body` → `panel` → `card` → `card-alt`), not by shadow. A nested surface is one step lighter in dark mode and one step darker in light mode.

**The Semantic Border Rule.** Listing type is signalled by border color on cards: trade and sell both resolve to emerald, want to blue (`#3b82f6` / `#2563eb`). Because two of three types share a color, the signal only distinguishes "want" from "everything else."

## Typography

**Display Font:** Momo Trust Display (Google Fonts, single 400 weight, `display=swap`), falling back to Inter, then `system-ui`.
**Body Font:** Inter — **declared but never loaded.** `--font-sans` names Inter first, but `src/app.html` links only `Momo Trust Display`. There is no `@font-face`, no self-hosted file, and no Inter stylesheet. Unless a visitor happens to have Inter installed locally, **all body text renders as `system-ui`** — Segoe UI on Windows, Roboto on Android, San Francisco on Apple. The specified pairing does not exist in the browser.
**Label/Mono Font:** None defined. Inline code and `<pre>` fall through to the browser's default monospace.

**Character:** Momo Trust Display is applied globally to `h1`–`h6` and gives headings a distinct display voice — the one deliberate typographic gesture in the system. Because it ships in a single 400 weight, every heading that requests `font-semibold` or `font-bold` renders as a synthesized faux-bold. Body copy has no intentional character at all; it is whatever the operating system supplies.

### Hierarchy

- **Display** (600, 2.25–3rem / `text-4xl`–`text-5xl`, tight tracking): Page-level headings. Rare — 40 total uses across the application.
- **Headline** (700, 1.5–1.875rem, uppercase, `tracking-wide`): Activity-feed section headers. The uppercase treatment on the display face is the strongest typographic moment in the app.
- **Title** (600, 1.125rem): Card titles, listing names, panel headings. The most common heading in practice.
- **Body** (400, 0.875rem, 1.5 line-height): Effectively the entire interface. `text-sm` appears 668 times against 26 uses of `text-base` — the application is set almost entirely one step below its own nominal body size.
- **Label** (600, 0.75rem, `tracking-wide`, frequently uppercase): Badges, metadata, timestamps, listing-type chips. 215 uses.
- **Prose** (1rem, 1.75 line-height): A separate, more generous scale used only inside user-authored markdown via `.prose`. It is the only place in the application set at a comfortable reading size.

### Named Rules

**The Small Text Rule.** The interface default is `text-sm` (14px), not `text-base`. Anything set at 16px reads as emphasised. This is the single most consequential typographic decision in the system, and it is undeclared — it emerged from repetition rather than from a rule.

**The Heading Face Rule.** All `h1`–`h6` receive `--font-heading` globally from the base layer. Any element that should carry the display voice without being a heading must set `font-family: var(--font-heading)` inline — which the header logotype does, in three separate places.

## Layout

A single centered column, `max-w-5xl` (64rem), used 24 times — more than twice as often as any other width. Secondary widths appear without a governing rule: `max-w-4xl` (10), `max-w-3xl` (8), `max-w-2xl` (8), `max-w-md` (6, forms and login), `max-w-6xl` (5), `max-w-7xl` (2). Horizontal padding is `px-4` inside the container, `px-6` on page bodies.

The application shell stacks **two full-width bars** before any content: a header (logo, logotype, primary actions) and beneath it a horizontally scrolling icon navigation, each with its own background and its own vertical padding. On mobile this consumes significant space before the first card.

**Spacing rhythm** follows Tailwind's 4px base. Actual usage clusters hard: `gap-2` (225) and `gap-3` (109) for inline element spacing, `gap-4` (75) for card internals, `gap-6` (23) for grid gutters; `p-6` (143) and `p-4` (97) for container padding, `p-8` (25) for forms. Vertical rhythm between page sections is `space-y-8`; between feed groups, `space-y-16`.

**Grids** are consistent: `grid gap-6 sm:grid-cols-2 lg:grid-cols-3` for card collections.

**Responsive behavior is effectively single-breakpoint.** `sm:` accounts for 137 of 163 responsive utilities; `lg:` appears 20 times and `md:` only 6. The application is designed as mobile and desktop with almost nothing deliberate in between, and the tablet range inherits whichever side it falls on.

### Named Rules

**The Five-XL Rule.** The canonical content column is `max-w-5xl`. Narrower widths are used for forms (`max-w-md`) and reading (`max-w-3xl`); everything else defaults to `5xl`.

## Elevation & Depth

The system is **predominantly flat and tonal**. Depth comes from the four-step surface ladder and from the `border-subtle` hairline, not from shadow. Only two shadow tokens are defined, and one of them is the same value in both themes' spirit but retuned per theme.

Where shadows do appear, they are used inconsistently: `shadow-elevated` (the defined token) and Tailwind's raw `shadow-lg` are used about equally (13 each), with stray `shadow-xl`, `shadow-md`, and `shadow-sm` alongside. Cards ship with `shadow-elevated` at rest and swap to `shadow-lg` on hover, mixing the token system with the framework default in a single interaction.

Translucency does real work: the header (`rgba(5, 11, 26, 0.88)`) and navigation (`rgba(15, 23, 42, 0.5)`) are semi-transparent with `backdrop-blur`, so content shows through as it scrolls beneath.

### Shadow Vocabulary

- **Elevated** (`box-shadow: 0 12px 30px rgba(15, 23, 42, 0.25)` dark / `0 10px 24px rgba(15, 23, 42, 0.12)` light): The system's only defined shadow. Applied to cards and form panels at rest.
- **Accent Glow** (`box-shadow: 0 10px 25px rgba(16, 185, 129, 0.25)`): Hardcoded inside `.btn-primary`. Every primary button in the application floats on a green haze. This value is not a token and is not theme-aware.

### Named Rules

**The Tonal-First Rule.** Reach for the next surface step before reaching for a shadow. Shadows in this system are decoration on cards and buttons, not the mechanism of hierarchy.

## Shapes

**There is no shape rule, and this is the system's clearest incoherence.** Five radii are in simultaneous active use with no governing logic:

- `rounded-lg` (8px) — 376 uses. Inputs, nav items, alerts, panels, code blocks, images.
- `rounded-xl` (12px) — 157 uses. Cards, form panels, the login container.
- `rounded-full` — 121 uses. All buttons, all badges, all chips, avatars.
- `rounded-md` (6px) — 40 uses. Appears interchangeably with `rounded-lg` on similar elements.
- `rounded-2xl` (16px) — 9 uses. Empty states and a handful of one-off containers.

The one consistent decision: **every button and every badge is a pill** (`rounded-full`), which is the system's most identifiable form gesture. Everything rectangular is negotiable.

Borders are near-universal: a 1px `border-subtle` hairline defines nearly every card, input, and divider. Dashed borders (`border-dashed`) mark drop zones and empty states. Emphasis borders use `border-b-2` for the activity-feed filter tabs.

### Named Rules

**The Pill Rule.** Interactive controls and status indicators are fully round (`rounded-full`). Containers are not. This is the only shape convention the codebase actually holds to.

## Components

### Buttons

Four variants defined as `@layer components` classes in `app.css`, all sharing `inline-flex items-center justify-center rounded-full` and a transition on `background-color, color, border-color, box-shadow`.

- **Shape:** Fully round pill (`rounded-full`), 1px border on every variant including the filled one (transparent on primary).
- **Primary:** Emerald fill (`--accent`), dark-green text (`--accent-contrast`), `px-4 py-2`, `text-sm font-semibold`, plus a hardcoded green glow (`0 10px 25px rgba(16, 185, 129, 0.25)`). Hover deepens the fill to `--accent-strong`.
- **Secondary:** Transparent fill, emerald border and text. Hover fills with the 12% emerald wash and deepens border and text together.
- **Ghost:** Transparent fill, `border-subtle` border, secondary text, tighter padding (`px-3 py-1.5`, `font-medium`). Hover swaps the border to emerald and fills with `--surface-ghost`.
- **Filter:** Identical to ghost at rest, with `.active` (emerald border and text) and `.open` (emerald wash fill) modifier states for the activity feed's filter row.
- **Focus:** No `:focus-visible` treatment is defined on any button variant. Keyboard focus falls back to the browser default.

### Cards / Containers

The `BaseCard` component is the workhorse of the application — the activity feed, listings, cascades, and chat all render through it.

- **Corner Style:** `rounded-xl` (12px), `overflow-hidden`.
- **Background:** `--surface-card`, one step above the page ground.
- **Border:** 1px `border-subtle`, swapping to `--accent` on group hover.
- **Shadow Strategy:** `shadow-elevated` at rest, `shadow-lg` on hover.
- **Internal Padding:** `p-5` (20px) on the content region, with a `gap-4` column.
- **Image:** Fixed `h-48` cover image with `loading="lazy"`; on hover it scales to 1.05 over 300ms inside the clipped corner. Missing images fall back to the logo at 20% opacity on `--surface-card-alt`.
- **Hover:** The whole card scales to 1.02 while the image scales independently to 1.05 — a compound zoom.
- **Structure:** Three optional snippets — `header` (badges, date), `content` (title, owner, games), `footer` (location), pinned to the bottom with `mt-auto`.
- **Accessibility note:** The card is a `<div role="link" tabindex="0">` navigating via `window.location.href` rather than an anchor. It has a `focus-visible` ring (`ring-2` accent with a body-colored offset) but forfeits middle-click, open-in-new-tab, and link context menus, and triggers a full page load rather than a client-side transition.

### Inputs / Fields

Not defined as component classes; the pattern is repeated inline across forms and is highly consistent.

- **Style:** `w-full rounded-lg border border-subtle`, filled with `--surface-card` or `--surface-body` depending on the surrounding surface, `px-3 py-2`, `text-primary`.
- **Focus:** Border shifts to `--accent` and a 2px ring appears at `rgba(52, 211, 153, 0.35)` — **hardcoded**, not `--accent-soft`, so it does not retune in light mode.
- **File/drop zones:** Same pattern with `border-dashed` and `py-8`.
- **Error / Disabled:** No systematic treatment. Errors surface through the separate `.alert-error` block above the field rather than on the field itself.

### Alerts

Four semantic variants (`error`, `success`, `warning`, `info`) built as `.alert` + modifier, each with a matched background/border/text triple defined per theme — the most complete and disciplined part of the token system. `rounded-lg`, `border`, `p-3`, `text-sm`. Backgrounds sit at 8–10% opacity, borders at 25–30%.

### Navigation

- **Style:** A horizontally scrolling row of `rounded-lg` items at `px-3 py-2`, `text-sm font-medium`, each pairing a 16px stroked SVG icon with a label, on a `--surface-nav` translucent bar.
- **States:** Inactive is `text-muted`; hover lifts to `text-secondary`; active is matched against `currentPath` with `startsWith`.
- **Mobile:** Items grow to `px-4 py-2.5 text-base` with 20px icons and scroll horizontally with no scroll affordance, edge fade, or overflow indicator.
- **Header:** Three separate header variants exist in `+layout.svelte` for different route groups, each repeating the logo and logotype markup with an inline `font-family: var(--font-heading)`.

### Trust Badge (signature component)

The product's differentiating component, and the clearest gap between its importance and its visual treatment.

- **Structure:** A `rounded-full` pill combining an emoji glyph with a label, in three sizes (`px-2 py-0.5 text-xs` / `px-3 py-1 text-sm` / `px-4 py-2 text-base`).
- **Tiers:** Five levels, each a Tailwind color family at fixed opacities — `border-{color}-500/80`, `bg-{color}-500/10`, and a `--badge-{color}` text token: New 🆕 amber, Seedling 🌱 lime, Growing 🪴 sky, Established 🌳 emerald, Trusted ⭐ violet.
- **Behavior:** Optionally clickable through to `/trust-levels`; carries `role="status"` and an `aria-label` naming the tier; hover drops to 80% opacity.
- **The problem:** The tier signal is carried by an emoji, rendered by the operating system's font. It cannot be weighted, colored, aligned, or scaled with the rest of the system, and it looks materially different on Windows, Android, and Apple devices. In `ListingCard` the badge is reduced further to a bare emoji with a `title` tooltip and no visible label at all.

### Waddling Meeple

A logo-derived animated motif (`WaddlingMeeple.svelte`, backed by `walking.png`). Along with the pill buttons, it is one of only two places the system shows any personality — and it is not connected to anything else in the visual language.

## Do's and Don'ts

These record the conventions the implemented system actually holds to. They describe the incumbent; they are not endorsements for the redesign.

### Do:

- **Do** define every color as a CSS custom property on both `:root` and `[data-theme='light']`. The dual-theme discipline here is complete and genuinely well done — no color is defined in only one theme.
- **Do** reference colors through `var(--token)` or the `bg-surface-*` / `text-*` / `border-*` utility classes in `app.css`, never as raw hex in markup.
- **Do** use the four-step surface ladder for depth: `--surface-body` → `--surface-panel` → `--surface-card` → `--surface-card-alt`.
- **Do** make every button and status indicator a full pill (`rounded-full`). This is the one shape convention the codebase keeps.
- **Do** use `.btn-primary` / `.btn-secondary` / `.btn-ghost` / `.btn-filter` rather than restyling buttons inline.
- **Do** use the `.alert-*` variants for all messaging; they are fully themed.
- **Do** set the content column to `max-w-5xl` for feeds and listings, `max-w-md` for forms, `max-w-3xl` for reading.
- **Do** give images `loading="lazy"` and a logo-at-20%-opacity fallback on `--surface-card-alt`.

### Don't:

- **Don't** assume Inter is available. It is declared in `--font-sans` but never loaded; body text currently renders as `system-ui`. Either load it or stop declaring it.
- **Don't** request `font-semibold` or `font-bold` on a heading and expect a real weight. Momo Trust Display ships in 400 only; heavier weights are browser-synthesized.
- **Don't** mix `shadow-elevated` with Tailwind's raw `shadow-lg` on the same element. Cards currently do exactly this across their rest and hover states.
- **Don't** hardcode accent-derived values. `.btn-primary`'s glow (`rgba(16, 185, 129, 0.25)`) and every input's focus ring (`rgba(52, 211, 153, 0.35)`) are literals that don't retune in light mode.
- **Don't** add a sixth radius. Five (`md`, `lg`, `xl`, `2xl`, `full`) are already in use with no rule separating them.
- **Don't** rely on `--border-listing-trade` and `--border-listing-sell` to distinguish anything; they resolve to the same emerald.
- **Don't** treat `badge-violet` and `badge-purple` as distinct; they are the identical hex in dark mode.
- **Don't** build new clickable cards as `<div role="link">` with `window.location.href`. The existing `BaseCard` pattern breaks middle-click, open-in-new-tab, and client-side routing.
- **Don't** carry meaning in an emoji alone, as the trust tiers do in `ListingCard`. OS font substitution makes the system's most important signal unstable across devices.
