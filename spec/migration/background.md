# PocketBase Migration Background & Rebuild Summary

## Overview

Since Meeple Cart is not live yet, we took a clean slate approach to transition from the old listing-type based system to the new flexible Offer Template system.

### 📊 Key Changes

#### Removed Concepts

- ❌ `listing_type` (sell/trade/want)
- ❌ Individual game pricing (`price`, `trade_value`)
- ❌ Bundle preferences on listings

#### Added Concepts

- ✅ **Offer Templates** - Flexible pricing/trading packages
- ✅ **Wanted Posts** - Now discussion threads
- ✅ **Template-based offers** - Buyers accept or counter templates

---

## 🗂️ Created Migrations (PocketBase 0.32.0)

1. **0001_initial_schema.js** - Core collections (users, listings, games, messages, trades, vouches, watchlist, notifications)
2. **0002_cascade_system.js** - Cascade gift system (cascades, cascade_entries, cascade_history)
3. **0003_discussion_threads.js** - Discussions with wanted post support
4. **0004_offer_templates.js** - Flexible pricing/trading packages
5. **0005_add_template_to_trades.js** - Link templates to trades

---

## 📝 Design Decisions

### 1. Simplified Listings

Listings are now neutral containers ("I have these games"). Pricing and trade terms are defined via Offer Templates.

### 2. Offer Template System

Sellers can define multiple templates per listing (e.g., individual item price vs. bundle price). Supports 'cash_only', 'trade_only', or 'cash_or_trade'.

### 3. Wanted Posts

Integrated into discussions with `thread_type: 'wanted'`. Supports structured data for wanted items (title, bgg_id, max_price).

### 4. Template Invalidation

When a template is accepted, others containing the same items are automatically invalidated to prevent over-selling.

---

## 🎨 Example User Flows

### Seller Creates Listing

1. Add games: Wingspan, Wingspan: European Expansion.
2. Create Template A: Wingspan only ($60).
3. Create Template B: Both combined ($70).
4. Publish.

### Buyer Makes Offer

1. View listing → See 2 templates.
2. Accept Template B directly OR propose a custom counter-offer.

---

## 🏁 Benefits

- **Flexibility**: Sellers can offer multiple options (cash AND trade).
- **Better UX**: Clear pricing presentation, bundles visible.
- **Simpler Code**: Removed `listing_type` conditionals throughout the codebase.
