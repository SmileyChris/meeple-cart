# PocketBase Migrations - Simplified Offer Template Schema

This directory contains the PocketBase migrations for Meeple Cart, implementing the **simplified offer template schema** as documented in `SIMPLIFIED_MIGRATION_SUMMARY.md`.

## Migration Order

The migrations execute in this specific order to handle collection dependencies:

1. **1731200000_extend_users.js** - Extends the auto-created `users` collection with custom fields
2. **1731200100_core_collections.js** - Creates `listings` and `items` collections (simplified schema)
3. **1731200200_engagement_collections.js** - Creates `vouches`, `watchlist`, `notifications`, and `messages` collections
4. **1731200300_trades_collection.js** - Creates `trades` collection
5. **1731200350_offer_templates_and_discussions.js** - Creates `offer_templates` and `discussion_threads` collections
6. **1731200360_add_offer_template_to_trades.js** - Adds `offer_template` relation to `trades`
7. **1731200400_cascade_collections.js** - Creates `cascades`, `cascade_entries`, and `cascade_history` collections
8. **1731200500_cascade_self_references.js** - Adds self-referencing fields to `cascades` collection
9. **1731200600_add_collection_rules.js** - Adds access control rules to all collections

## Collections Created

### Auth Collection
- **users** (extended) - User accounts with profile data, trade stats, and cascade reputation

### Core Collections
- **listings** - Marketplace listings (simplified - no `listing_type`, `prefer_bundle`, `bundle_discount`)
- **items** - Individual items within listings (renamed from `games`, no `price`, `trade_value`, `price_history`)

### Offer Templates System (NEW)
- **offer_templates** - Seller-created pricing/trading packages for their items
- **discussion_threads** - Discussion threads with wanted post support

### Engagement Collections
- **vouches** - Trust endorsements between users
- **watchlist** - User watchlists for specific items or listings
- **notifications** - User notifications
- **messages** - Public and private messages on listings

### Trading System
- **trades** - Trade records with offers, status tracking, reviews, and optional offer_template reference

### Cascade System
- **cascades** - Gift cascade instances
- **cascade_entries** - User entries for cascades
- **cascade_history** - Event history for cascades

## Key Schema Changes

### Simplified Listings
**Removed fields:**
- `listing_type` (sell/trade/want) - No longer needed with offer templates
- `prefer_bundle` - Bundle preferences now in offer templates
- `bundle_discount` - Pricing now in offer templates

**Result:** Listings are now just "I have these items" with no pricing assumptions.

### Items Collection (renamed from games)
**Removed fields:**
- `price` - Pricing now in offer_templates
- `trade_value` - Trading info now in offer_templates
- `price_history` - No longer tracked individually

**Result:** Items describe physical condition and details without pricing.

### Offer Templates (NEW)
Sellers create templates defining what they'll accept:
- Multiple items per template (bundles!)
- Cash, trade, or both
- Firm pricing by default (`open_to_lower_offers: false`)
- Template status tracking (active, accepted, invalidated, withdrawn)
- Trade-for wish list for trade templates

### Discussion Threads (NEW)
Supports both general discussions and wanted posts:
- `thread_type`: 'discussion' or 'wanted'
- `wanted_items`: Array of {title, bgg_id, max_price} for wanted posts
- `wanted_offer_type`: 'buying', 'trading', or 'either'

### Trades Enhanced
Added `offer_template` relation - links accepted template to the trade record.

## Design Decisions

### Dependency Ordering
Collections are created in dependency order:
1. Users (auto-created by PocketBase)
2. Listings (depends on users)
3. Items (depends on listings)
4. Engagement collections (depend on users and listings)
5. Trades (depends on users, listings, and items)
6. Offer templates & discussions (depend on users, listings, items)
7. Add offer_template to trades (depends on offer_templates existing)
8. Cascades (depends on users and items)
9. Cascade self-references (added after cascades collection exists)

### Two-Phase Rules Application
Rules are applied in a separate final migration to avoid validation errors.

### Self-Reference Handling
The `cascades` collection has self-referencing fields (`origin_cascade`, `previous_cascade`). These are added in a separate migration after the collection is created.

## PocketBase 0.32 API

These migrations use the modern PocketBase 0.32+ JavaScript migration API:

### Creating Collections
```javascript
const collection = new Collection({
  name: 'collection_name',
  type: 'base'  // or 'auth'
});
```

### Adding Fields
Use specific field type constructors:
```javascript
collection.fields.add(new TextField({
  name: 'field_name',
  required: true,
  min: 0,
  max: 200
}));

collection.fields.add(new SelectField({
  name: 'status',
  required: true,
  maxSelect: 1,
  values: ['active', 'inactive']
}));

collection.fields.add(new RelationField({
  name: 'owner',
  required: true,
  collectionId: usersId,
  cascadeDelete: false,
  minSelect: 1,
  maxSelect: 1
}));
```

Available field types:
- `TextField` - Text fields
- `SelectField` - Dropdown/select fields (values as direct property)
- `NumberField` - Numeric fields
- `DateField` - Date/datetime fields
- `BoolField` - Boolean fields
- `JSONField` - JSON data
- `FileField` - File uploads
- `RelationField` - Relations to other collections (collectionId as direct property)

### Multi-Select Relations
For relations that can have multiple items (e.g., items in an offer template):
```javascript
collection.fields.add(new RelationField({
  name: 'items',
  required: true,
  collectionId: itemsId,
  cascadeDelete: false,
  minSelect: 1,
  maxSelect: 999  // Use a high number for "unlimited"
}));
```

**Note:** Cannot use `null` for `minSelect` or `maxSelect` - must use actual numbers.

### Adding Indexes
```javascript
collection.indexes = [
  'CREATE INDEX idx_name ON collection_name (field_name)',
  'CREATE UNIQUE INDEX idx_unique ON collection_name (field1, field2)'
];
```

### Adding Rules
```javascript
collection.listRule = '@request.auth.id != \'\'';
collection.viewRule = '';
collection.createRule = '@request.auth.id = owner';
collection.updateRule = '@request.auth.id = owner';
collection.deleteRule = '@request.auth.id = owner';
```

### Saving Collections
```javascript
app.save(collection);
```

## Running Migrations

### Apply All Migrations
```bash
./pocketbase/pocketbase migrate up --dir pocketbase/pb_data
```

### Apply Specific Migration
```bash
./pocketbase/pocketbase migrate up --dir pocketbase/pb_data 1731200000
```

### Rollback Migrations
```bash
./pocketbase/pocketbase migrate down --dir pocketbase/pb_data
```

### Check Migration Status
```bash
./pocketbase/pocketbase migrate collections --dir pocketbase/pb_data
```

## Testing

All migrations have been tested successfully on PocketBase 0.32.0:

```
✅ Applied 1731200000_extend_users.js
✅ Applied 1731200100_core_collections.js
✅ Applied 1731200200_engagement_collections.js
✅ Applied 1731200300_trades_collection.js
✅ Applied 1731200350_offer_templates_and_discussions.js
✅ Applied 1731200360_add_offer_template_to_trades.js
✅ Applied 1731200400_cascade_collections.js
✅ Applied 1731200500_cascade_self_references.js
✅ Applied 1731200600_add_collection_rules.js
```

Server starts successfully with all 13 collections created and rules applied.

## Schema Source

The complete schema is documented in:
- `/SIMPLIFIED_MIGRATION_SUMMARY.md` - Migration rationale and user flows
- This README - Technical migration details and collection structure

## Troubleshooting

### "relation collection doesn't exist" Error
Check migration order - ensure the target collection is created before any collection that references it.

### "values: cannot be blank" Error
Ensure SelectField uses `values` as a direct property:
```javascript
// ✅ Correct
new SelectField({ values: ['a', 'b'] })

// ❌ Wrong
new SelectField({ options: { values: ['a', 'b'] } })
```

### "collectionId: cannot be blank" Error
Ensure RelationField uses `collectionId` as a direct property:
```javascript
// ✅ Correct
new RelationField({ collectionId: id })

// ❌ Wrong
new RelationField({ options: { collectionId: id } })
```

### "maxSelect: cannot be blank" Error
Multi-select relations need actual numbers, not `null`:
```javascript
// ✅ Correct
new RelationField({ minSelect: 0, maxSelect: 999 })

// ❌ Wrong
new RelationField({ minSelect: null, maxSelect: null })
```

## Next Steps

After running migrations:
1. Create superuser: `./pocketbase/pocketbase superuser upsert admin@example.com password123`
2. Access admin UI: http://127.0.0.1:8090/_/
3. Verify all 13 collections exist
4. Update TypeScript types: Generate new types from schema
5. Update UI code:
   - Remove `listing_type` conditionals
   - Change `games` references to `items`
   - Add offer template creation/display
   - Add wanted post support to discussions
