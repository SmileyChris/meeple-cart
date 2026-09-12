---
name: Meeple Cart
description: Club Night After Hours — a warm charcoal noticeboard with cream notices, rust action and a green trust stamp
colors:
  accent: '#c55236'
  accent-strong: '#a93f29'
  accent-soft: 'rgba(197, 82, 54, 0.15)'
  accent-contrast: '#fff9ee'
  accent-fill: '#b8462b'
  accent-text: '#e5876d'
  trust: '#2f7654'
  trust-text: '#6fbf8f'
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
  badge-rose: '#f0759e'
  badge-amber: '#f07f47'
  badge-lime: '#d9e830'
  badge-emerald: '#3cdd71'
  badge-sky: '#59b7c0'
  badge-blue: '#82a0c9'
  badge-purple: '#a394d1'
  badge-violet: '#ce81d5'
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
    textColor: '{colors.trust-text}'
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

A warm charcoal ground with a single rust accent and a single green trust stamp, doubled into a complete light theme. Every token below is a CSS custom property defined twice in `src/app.css` — once on `:root` (dark) and once on `[data-theme='light']` — with the frontmatter carrying the dark values as canonical. Three listing-type colors additionally use CSS `light-dark()` in the `@theme` block, making them the only tokens that switch without the attribute.

### Primary

- **Accent** (`--accent`, `#c55236` dark / `#8f3525` light): The action and navigation color. Carries borders, focus outlines, rings-as-fills, link/heading underlines, and the "sell" listing type. Reserved for action — never for trust.
- **Accent Strong** (`--accent-strong`, `#a93f29` dark / `#702719` light): The hover/pressed state for accent borders and text (`.btn-secondary:hover`, `.btn-ghost:hover`, prose link hover).
- **Accent Soft** (`--accent-soft`, `rgba(197, 82, 54, 0.15)` dark / `rgba(143, 53, 37, 0.12)` light): A translucent tint used as the hover fill on secondary buttons and active filter chips.
- **Accent Fill** (`--accent-fill`, `#b8462b` dark / `#8f3525` light): The filled-button background for `.btn-primary` — darker than `--accent` in dark mode so `--accent-contrast` text clears 4.5:1 on it (5.07:1 measured); identical to `--accent` in light mode, where it already clears 7.41:1.
- **Accent Contrast** (`--accent-contrast`, `#fff9ee` both themes): Text color on filled accent buttons — a warm off-white, not inverted per theme.
- **Accent Text** (`--accent-text`, `#e5876d` dark / `#8f3525` light): A lighter rust for _text_ use only. `--accent` itself is 3.06:1 on dark `--surface-card` (fails AA); `--accent-text` clears 5.30:1 on `--surface-card` and 4.70:1 on `--surface-card-alt`. Feeds the `text-accent`/`hover:text-accent`/`group-hover:text-accent` utilities; borders, rings-as-fills and underlines keep using `--accent`.
- **Ring Accent** (`--ring-accent`, `rgba(197, 82, 54, 0.35)` dark / `rgba(143, 53, 37, 0.3)` light): The translucent focus-ring tint, via the `focus:ring-accent` utility.
- **Trust** (`--trust`, `#2f7654` dark / `#245c41` light): The single green in the system, reserved for earned trust — the TrustBadge fill/border and nothing else.
- **Trust Text** (`--trust-text`, `#6fbf8f` dark / `#245c41` light): A lighter green for trust _text_ — `--trust` itself is only 2.25:1 on dark `--surface-card-alt` (fails AA); `--trust-text` clears 6.29:1 on `--surface-card` and 5.58:1 on `--surface-card-alt`. Identical to `--trust` in light mode, which already clears 7.20:1.
- **Pin** (`--pin`, `#d1a33b` both themes): The drawing-pin ochre — the "trade" listing type and bump/pinned indicators.

### Neutral

Surfaces form a four-step tonal ladder. Depth is communicated by stepping up this ladder, not by shadow.

- **Body** (`--surface-body`, `#221e18` dark / `#f2ead8` light): The page ground — warm charcoal in dark mode, cream in light.
- **Panel** (`--surface-panel`, `#302c26` dark / `#f5eddd` light): Forms, login card, elevated containers.
- **Card** (`--surface-card`, `#302c26` dark / `#faf5ea` light): The default card and input fill — the same value as Panel in dark mode, one step lighter in light mode.
- **Card Alt** (`--surface-card-alt`, `#3a342c` dark / `#e5d8bd` light): Nested surfaces — code blocks, table headers, badge pills, image placeholders.
- **Ghost** (`--surface-ghost`, `rgba(246, 236, 216, 0.08)` dark / `rgba(41, 37, 31, 0.06)` light): A near-invisible tint for ghost-button and nav-link hover fills.
- **Text Primary** (`--text-primary`, `#f5eddd` dark / `#29251f` light): Body and heading text.
- **Text Secondary** (`--text-secondary`, `#d8cdb8` dark / `#50483c` light): Sub-headings, labels, secondary copy.
- **Text Muted** (`--text-muted`, `#b9aa91` dark / `#6c604e` light): Metadata, timestamps, placeholder copy.
- **Border Subtle** (`--border-subtle`, `rgba(232, 217, 188, 0.26)` dark / `rgba(72, 60, 43, 0.22)` light): The default hairline border on nearly every card, input, and divider.
- **Border Strong** (`--border-strong`, `rgba(232, 217, 188, 0.46)` dark / `rgba(72, 60, 43, 0.42)` light): Emphasis borders and the header/nav underline.

### Tertiary

An eight-color badge set exists purely for categorical tinting (trust tiers, status pills, category chips), redefined per theme. Each hue is rotated roughly 40-45° from its neighbors — rose 340°, amber 20°, lime 65°, emerald 140°, sky 185°, blue 215°, purple 255°, violet 295° — specifically so no two are confusable at a glance; every value clears 4.5:1 as text on both `--surface-card` and `--surface-card-alt`, in both themes (measured).

- **Amber** (`#f07f47` dark / `#a03e0d` light), **Lime** (`#d9e830` / `#59600b`), **Sky** (`#59b7c0` / `#29666b`), **Emerald** (`#3cdd71` / `#136c31`), **Violet** (`#ce81d5` / `#94349d`): the five trust tiers, in ascending order.
- **Rose** (`#f0759e` / `#b8144b`), **Blue** (`#82a0c9` / `#3d5f8f`), **Purple** (`#a394d1` / `#6249ab`): status and category tinting elsewhere.

### Named Rules

**The Two-Color Rule.** Rust (`--accent`) means action and navigation — every button, link, focus ring and active tab. Green (`--trust`) appears nowhere except where trust has actually been earned (the TrustBadge), so it can never be mistaken for a generic "success" state. Badge colors are a separate, purely categorical set and carry no action/trust meaning of their own.

**The Tonal Ladder Rule.** Elevation is expressed by moving up the surface ramp (`body` → `panel` → `card` → `card-alt`), not by shadow. Panel and Card share a value in dark mode; they diverge by one step in light mode.

**The Text-vs-Fill Split.** Several accent/trust tokens exist twice: once tuned as an opaque fill/border color, once tuned lighter (or, in light mode, left unchanged) so the same hue also clears AA contrast as text. Reach for the `-text` token whenever the color is being used for readable text; reach for the base token for borders, rings-as-fills, and filled-button backgrounds.

## Typography

**Heading Font:** Bitter (Google Fonts, weights 500/600/700, `display=swap`), falling back to Georgia, then serif.
**Body Font:** Inter (Google Fonts, weights 400/600/700, `display=swap`), falling back to the system UI sans stack.
**Brand Font:** Momo Trust Display (Google Fonts, single 400 weight), used only for the wordmark logotype, falling back to Bitter.
**Label/Mono Font:** None defined. Inline code and `<pre>` fall through to the browser's default monospace.

**Character:** Bitter carries the editorial, printed-notice voice for headings (`h1`–`h6` receive `--font-heading` globally from the base layer); Inter runs the controls, notes and dense trading data underneath it; Momo Trust Display keeps the wordmark distinct from both. Because Bitter ships weights 500/600/700, headings requesting `font-semibold`/`font-bold` render as real weights rather than a synthesized faux-bold.

### Hierarchy

- **Display** (700, 2.25rem, tight tracking): Page-level headings.
- **Headline** (700, 1.5rem, `tracking-wide`): Activity-feed section headers.
- **Title** (500, 1.125rem): Card titles, listing names, panel headings — the most common heading in practice.
- **Body** (400, 0.875rem, 1.5 line-height): Effectively the entire interface. `text-sm` is the default; `text-base` reads as emphasised.
- **Label** (600, 0.75rem, `tracking-wide`): Badges, metadata, timestamps, listing-type chips.
- **Prose** (1rem, 1.75 line-height): A separate, more generous scale used only inside user-authored markdown via `.prose` — the only place in the application set at a comfortable reading size.

### Named Rules

**The Small Text Rule.** The interface default is `text-sm` (14px), not `text-base`. Anything set at 16px reads as emphasised.

**The Heading Face Rule.** All `h1`–`h6` receive `--font-heading` (Bitter) globally from the base layer. Any element that should carry the display voice without being a heading must set `font-family: var(--font-heading)` inline — which the header logotype does.

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
