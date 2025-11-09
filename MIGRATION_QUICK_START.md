# Fresh PocketBase Migration - Quick Start

## What Was Done

Created 5 fresh migrations that build the complete Meeple Cart database schema from scratch:

1. **0001_initial_schema.js** - Core collections (users, listings, games, messages, trades, vouches, watchlist, notifications)
2. **0002_cascade_system.js** - Cascade gift system (cascades, cascade_entries, cascade_history)
3. **0003_discussion_threads.js** - Discussions with wanted post support
4. **0004_offer_templates.js** - Flexible pricing/trading packages
5. **0005_add_template_to_trades.js** - Link templates to trades

## Key Changes from Previous Schema

### Listings Collection
**Removed:**
- `listing_type` field (was 'sell'/'trade'/'want')
- `prefer_bundle` field
- `bundle_discount` field

**Why:** Replaced by flexible offer template system

### Games (Items) Collection
**Removed:**
- `price` field
- `trade_value` field
- `price_history` field

**Why:** Pricing moved to offer templates for flexibility

### New Collections
- `discussion_threads` - Forums + wanted posts
- `offer_templates` - Seller-defined pricing packages

### Enhanced Collections
- `trades` - Added `offer_template` relation
- `notifications` - Added trade notification types

## Running the Migration

### Option 1: Clean Slate (Recommended)

```bash
# 1. Backup current database (if any)
cp -r pocketbase/pb_data pocketbase/pb_data.backup

# 2. Remove old database
rm -f pocketbase/pb_data/data.db

# 3. Start PocketBase (migrations run automatically)
just dev

# 4. Create admin account at http://127.0.0.1:8090/_/
```

### Option 2: Test in Isolation

```bash
# Run PocketBase in test mode
cd pocketbase
./pocketbase serve --dir=pb_data_test

# Migrations will create fresh schema in pb_data_test/
```

## Verification Steps

After migration completes:

1. **Check Collections** - Should see 14 collections:
   - users, listings, games, messages, trades, vouches, watchlist, notifications
   - cascades, cascade_entries, cascade_history
   - discussion_threads, offer_templates

2. **Verify Relations** - In admin UI:
   - trades → offer_templates (optional relation)
   - offer_templates → listings, users, games
   - discussion_threads has wanted post fields

3. **Test Creation** - Try creating:
   - A user account
   - A listing with games
   - An offer template

## What Needs Updating

### TypeScript Types

Already exists, no changes needed:
- `/home/chris/dev/cart/meeple/src/lib/types/offer-template.ts`

May need updates:
- `/home/chris/dev/cart/meeple/src/lib/types/listing.ts` - Remove listing_type
- `/home/chris/dev/cart/meeple/src/lib/types/pocketbase.ts` - May auto-regenerate

### UI Code

Search for these and update:
```bash
# Find listing_type usage
grep -r "listing_type" src/

# Find price/trade_value usage in games
grep -r "game.price" src/
grep -r "game.trade_value" src/
```

Replace with offer template logic.

### Seed Script

Update `/home/chris/dev/cart/meeple/scripts/seed-demo-data.ts`:
- Don't set listing_type
- Don't set price/trade_value on games
- Create offer_templates for each listing

Example:
```typescript
// OLD
await pb.collection('listings').create({
  owner: userId,
  title: 'Wingspan',
  listing_type: 'sell', // REMOVE
  // ...
});

await pb.collection('games').create({
  listing: listingId,
  title: 'Wingspan',
  price: 6000, // REMOVE
  // ...
});

// NEW
const listing = await pb.collection('listings').create({
  owner: userId,
  title: 'Wingspan',
  // No listing_type!
  // ...
});

const game = await pb.collection('games').create({
  listing: listing.id,
  title: 'Wingspan',
  // No price!
  // ...
});

// Create offer template
await pb.collection('offer_templates').create({
  listing: listing.id,
  owner: userId,
  items: [game.id],
  template_type: 'cash_only',
  cash_amount: 6000, // Price here
  open_to_lower_offers: false,
  open_to_shipping_negotiation: true,
  open_to_trade_offers: false,
  status: 'active',
  display_name: 'Wingspan - Excellent Condition',
});
```

## Troubleshooting

### Migration Fails

```bash
# Check PocketBase logs
tail -f pocketbase/pb_data/logs/*.log

# Common issues:
# - Collection ID conflicts (shouldn't happen with fresh DB)
# - Field ID conflicts (shouldn't happen with fresh DB)
# - Syntax errors (run: node -c pocketbase/pb_migrations/*.js)
```

### Schema Mismatch

If you see unexpected fields:
```bash
# Export current schema
cd pocketbase
./pocketbase export-collections

# Compare with expected schema in MIGRATION_REBUILD_SUMMARY.md
```

### PocketBase Won't Start

```bash
# Check if port 8090 is in use
lsof -i :8090

# Check if pb_data is corrupted
rm -rf pocketbase/pb_data
# Then restart PocketBase
```

## Rollback

If something goes wrong:

```bash
# Restore from backup
rm -rf pocketbase/pb_data
cp -r pocketbase/pb_data.backup pocketbase/pb_data

# Or start completely fresh
rm -rf pocketbase/pb_data
just dev
```

## Success Criteria

Migration is successful when:

1. PocketBase starts without errors
2. All 14 collections exist
3. Can create test records in each collection
4. Relations expand correctly (test with `?expand=`)
5. Collection rules work (test auth boundaries)

## Next Actions

After successful migration:

1. Update seed script to create offer templates
2. Update UI components to use offer templates
3. Remove listing_type conditionals from code
4. Test create/edit flows end-to-end
5. Update documentation

## Reference

- Full details: `/home/chris/dev/cart/meeple/MIGRATION_REBUILD_SUMMARY.md`
- Migration spec: `/home/chris/dev/cart/meeple/SIMPLIFIED_MIGRATION_SUMMARY.md`
- Type definitions: `/home/chris/dev/cart/meeple/src/lib/types/offer-template.ts`
