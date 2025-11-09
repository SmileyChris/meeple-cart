# Fresh PocketBase Migration Rebuild - Summary

## Overview

Created fresh PocketBase migrations for a clean database installation (PocketBase 0.32.0). These migrations replace all previous migration history and create the complete schema from scratch.

## Created Migrations

### 0001_initial_schema.js
**Purpose:** Create all core collections for the base application

**Collections Created:**
- `users` (auth collection) - User accounts with cascade fields
  - Profile fields: display_name, location, phone, bio
  - Trade stats: trade_count, vouch_count
  - Cascade stats: cascades_seeded, cascades_received, cascades_passed, cascades_broken, cascade_reputation, cascade_restricted_until, can_enter_cascades

- `listings` - Marketplace listings (simplified, no listing_type)
  - Fields: owner, title, status, summary, location, shipping_available, views, bump_date, photos, photo_region_map, status_history
  - **Removed:** listing_type, prefer_bundle, bundle_discount (replaced by offer templates)

- `games` (items) - Individual games/items within listings
  - Fields: listing, bgg_id, title, year, condition, notes, status, photo_regions
  - **Removed:** price, trade_value, price_history (replaced by offer templates)

- `messages` - Messaging system
  - Fields: listing, thread_id, sender, recipient, content, is_public, read

- `trades` - Trade records with offer system
  - Fields: listing, buyer, seller, status, offer_status, cash_offer_amount, requested_items, shipping_method, offer_message, declined_reason, rating, review, completed_date
  - Note: offer_template relation added in migration 0005

- `vouches` - Trust endorsements
  - Fields: voucher, vouchee, message, created

- `watchlist` - User watchlist
  - Fields: user, listing, bgg_id, max_price, max_distance

- `notifications` - Notification system
  - Fields: user, type, title, message, link, listing, read
  - Types include: new_listing, new_message, price_drop, listing_update, trade_initiated, trade_update, trade_completed, cascade_* types

### 0002_cascade_system.js
**Purpose:** Create cascade gift system collections

**Collections Created:**
- `cascades` - Main cascade records
  - Fields: name, description, status, current_game, current_holder, entry_deadline, region, shipping_requirement, special_rules, winner, shipped_at, shipping_tracking, received_at, received_confirmed_by, pass_deadline, generation, origin_cascade, previous_cascade, entry_count, view_count

- `cascade_entries` - User entries in cascades
  - Fields: cascade, user, message, withdrew

- `cascade_history` - Event history for cascades
  - Fields: cascade, generation, event_type, event_date, actor, related_user, game, notes, shipped_to_location, shipping_days

### 0003_discussion_threads.js
**Purpose:** Create discussion/forum system with wanted post support

**Collections Created:**
- `discussion_threads` - Discussion posts and wanted posts
  - Fields: title, content, author, listing, thread_type, wanted_items, wanted_offer_type, pinned, locked, view_count, reply_count, last_reply_at
  - **New:** thread_type ('discussion' | 'wanted')
  - **New:** wanted_items (JSON array of {title, bgg_id, max_price})
  - **New:** wanted_offer_type ('buying' | 'trading' | 'either')

### 0004_offer_templates.js
**Purpose:** Create offer template system for flexible pricing/trading

**Collections Created:**
- `offer_templates` - Seller-defined pricing and trading packages
  - Fields:
    - listing, owner, items (relation to games - supports bundles!)
    - template_type ('cash_only' | 'trade_only' | 'cash_or_trade')
    - cash_amount (NZD cents)
    - trade_for_items (JSON array of {title, bgg_id})
    - open_to_lower_offers (boolean - "Or Nearest Offer")
    - open_to_shipping_negotiation (boolean)
    - open_to_trade_offers (boolean)
    - status ('active' | 'accepted' | 'invalidated' | 'withdrawn')
    - accepted_by_trade (relation to trade that accepted this template)
    - display_name (e.g., "Wingspan Bundle")
    - notes
  - **Indexes:** listing, owner, status, listing+status composite
  - **Rules:** Only owner can create/update/delete active templates

### 0005_add_template_to_trades.js
**Purpose:** Link trades to offer templates

**Schema Changes:**
- Added `offer_template` relation field to `trades` collection
- Allows tracking which template (if any) a trade was based on

## Key Design Decisions

### 1. Simplified Listings
**Removed listing_type field** - Instead of rigid "sell/trade/want" categories:
- Listings are just "I have these games"
- Offer templates define what seller will accept (cash/trade/both)
- Wanted posts moved to discussion_threads

### 2. Offer Template System
**Flexible pricing model:**
- Sellers create multiple templates per listing
- Templates can be for single items or bundles
- Support for firm pricing or "Or Nearest Offer"
- Support for cash-only, trade-only, or flexible deals
- Templates can be invalidated when accepted

### 3. Wanted Posts
**Integrated into discussions:**
- thread_type distinguishes discussions from wanted posts
- wanted_items stores structured data (title, bgg_id, max_price)
- wanted_offer_type clarifies buyer intent

### 4. No Price History
**Simplified approach:**
- No individual game pricing
- Pricing moved to offer templates
- Reduces complexity and data redundancy

## Migration API Compatibility

All migrations use the modern PocketBase 0.32.0 API:
- `migrate((app) => { ... })` - Uses `app` parameter
- `app.save(collection)` - Correct save method
- `app.delete(collection)` - Correct delete method
- `app.findCollectionByNameOrId(id)` - Correct lookup method
- `new Collection({...})` - Correct collection constructor
- `new SchemaField({...})` - Correct field constructor

## Collection ID Reference

For use in relations and migrations:

```javascript
const COLLECTION_IDS = {
  users: 'fhggsowykv3hz86',
  listings: 'w3c43ufqz9ejshk',
  games: 'u0l5t5dn4gwl0sb',
  messages: '7c3dxyfrf49yx0l',
  trades: '50iprjgx7p8chq7',
  vouches: 'nyni5fcgmibsfly',
  watchlist: 't4djrv5xct2ymfk',
  notifications: 'notifications_collection',
  cascades: 'm5n6p7q8r9s0t1u',
  cascade_entries: 'v2w3x4y5z6a7b8c',
  cascade_history: 'd9e0f1g2h3i4j5k',
  discussion_threads: 'discussion_threads_col',
  offer_templates: 'offer_templates_col',
};
```

## Usage Instructions

### Fresh Installation

1. **Backup existing data** (if any):
   ```bash
   cp -r pocketbase/pb_data pocketbase/pb_data.backup
   ```

2. **Remove old database**:
   ```bash
   rm -f pocketbase/pb_data/data.db
   ```

3. **Start PocketBase**:
   ```bash
   just dev
   ```

   Migrations will run automatically on first startup.

4. **Create admin account**:
   - Open http://127.0.0.1:8090/_/
   - Click "Create Admin"
   - Set email and password

5. **Verify schema**:
   - In PocketBase admin, check Collections tab
   - Should see 14 collections total

### Testing

After migration:
1. Create a test user account
2. Create a test listing with games
3. Create an offer template for the listing
4. Verify all relations work correctly

## TypeScript Type Updates

The following TypeScript files should be updated to match the new schema:

- `/home/chris/dev/cart/meeple/src/lib/types/offer-template.ts` - Already exists, defines OfferTemplateRecord
- `/home/chris/dev/cart/meeple/src/lib/types/pocketbase.ts` - May need updates for new fields
- `/home/chris/dev/cart/meeple/src/lib/types/listing.ts` - Remove listing_type references

## Next Steps

1. **Run migrations** - Start PocketBase to apply migrations
2. **Update UI code** - Remove listing_type conditionals
3. **Implement template UI** - Create/edit/display offer templates
4. **Update seed script** - Create demo templates instead of setting prices
5. **Test thoroughly** - Verify all relations and rules work

## Schema Comparison

### Before (Old System)
- Listings had listing_type field
- Games had individual price/trade_value fields
- Wanted posts were a special listing type
- Bundle discounts on listings

### After (New System)
- Listings are neutral containers
- Offer templates define pricing
- Wanted posts in discussion_threads
- Templates support bundles natively

## Benefits

1. **More Flexible** - Sellers can offer multiple options (cash AND trade)
2. **Better UX** - Clear pricing presentation, bundle options visible
3. **Simpler Code** - No listing_type conditionals throughout codebase
4. **Scalable** - Easy to add new template types in future
5. **Clean Database** - No migration history baggage

## Notes

- All field IDs are preserved from original schema where applicable
- All indexes are recreated for optimal query performance
- Collection rules follow principle of least privilege
- Relations use appropriate cascade delete settings
- PocketBase will auto-generate pb_data/types.d.ts on first run
