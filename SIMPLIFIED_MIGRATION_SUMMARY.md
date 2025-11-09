# ✅ Simplified Offer Template Migration - Final Summary

## 🎯 Executive Summary

Since Meeple Cart is **not live yet**, we're taking the **clean slate approach**:
- Wipe existing database
- Rebuild with new offer template schema
- No complex data migration needed
- Fresh start with better design

---

## 📊 What Changed

### **Removed Concepts**
- ❌ `listing_type` (sell/trade/want)
- ❌ Individual game pricing (`price`, `trade_value`)
- ❌ Bundle preferences on listings

### **Added Concepts**
- ✅ **Offer Templates** - Flexible pricing/trading packages
- ✅ **Wanted Posts** - Now discussion threads
- ✅ **Template-based offers** - Buyers accept or counter templates

---

## 🗂️ New Schema

### **`offer_templates` Collection** (NEW)

Sellers create templates defining what they'll accept:

```typescript
{
  listing: relation(listings),
  owner: relation(users),
  items: relation(items)[], // 1+ games (bundles!)
  template_type: 'cash_only' | 'trade_only' | 'cash_or_trade',
  cash_amount: number, // NZD cents
  trade_for_items: { title, bgg_id }[], // What seller wants
  open_to_lower_offers: boolean, // Default: false (firm pricing)
  open_to_shipping_negotiation: boolean,
  open_to_trade_offers: boolean,
  status: 'active' | 'accepted' | 'invalidated' | 'withdrawn',
  display_name: string, // "Wingspan Bundle"
  notes: string
}
```

### **`listings` Collection** (SIMPLIFIED)

Just "I have these games":

```typescript
{
  owner: relation(users),
  title: string,
  status: 'active' | 'pending' | 'completed' | 'cancelled',
  summary: string,
  location: string,
  shipping_available: boolean,
  photos: file[],
  // REMOVED: listing_type, prefer_bundle, bundle_discount
}
```

### **`items` Collection** (SIMPLIFIED)

Games without pricing:

```typescript
{
  listing: relation(listings),
  bgg_id: number,
  title: string,
  condition: 'mint' | 'excellent' | 'good' | 'fair' | 'poor',
  notes: string,
  status: 'available' | 'pending' | 'sold',
  // REMOVED: price, trade_value, price_history
}
```

### **`discussion_threads` Collection** (ENHANCED)

Now supports wanted posts:

```typescript
{
  title: string,
  content: string,
  author: relation(users),
  thread_type: 'discussion' | 'wanted', // NEW
  wanted_items: { title, bgg_id, max_price }[], // NEW
  wanted_offer_type: 'buying' | 'trading' | 'either', // NEW
  // ... existing fields
}
```

### **`trades` Collection** (ENHANCED)

Links to accepted template:

```typescript
{
  // ... all existing fields ...
  offer_template: relation(offer_templates), // NEW - which template
}
```

---

## 🚀 Migration Steps (SIMPLE!)

### 1. Run Clean Migration Script

```bash
./scripts/clean-migration.sh
```

**What it does:**
- Backs up existing data (just in case)
- Deletes old database
- Archives old migrations
- Verifies new migrations exist

### 2. Start PocketBase

```bash
just dev
```

**What happens:**
- Creates fresh database
- Runs migrations 0003-0006
- Creates new schema with offer templates

### 3. Create Admin Account

1. Open http://127.0.0.1:8090/_/
2. Click "Create Admin"
3. Set email + password

### 4. Seed Demo Data (Optional)

```bash
npm run seed:demo
```

**Creates:**
- Sample users
- Sample listings
- Sample offer templates (cash, trade, bundles)
- Sample wanted posts (discussions)

---

## 📝 Design Decisions (Based on Your Requirements)

### ✅ Firm Pricing by Default
- `open_to_lower_offers: false`
- Sellers must explicitly enable "Or Nearest Offer"

### ✅ All Games Need Templates
- Can't publish listing without at least one template
- Validation in UI: "Create at least one offer template"

### ✅ Flexible Bundle Creation
- **Seller bundles**: Create template with multiple items
- **Buyer bundles**: Select multiple items in custom offer

### ✅ Template Invalidation
- When template accepted → status: 'accepted'
- If game appears in multiple templates → others become 'invalidated'
- Pending offers on invalidated templates → auto-declined

---

## 🎨 Example User Flows

### **Seller Creates Listing**

```
1. Add games
   - Wingspan (Excellent)
   - Wingspan: European Expansion (Good)
   - Wingspan: Oceania Expansion (Excellent)

2. Create templates

   Template A: "Wingspan Base Game"
   - Items: [Wingspan]
   - Type: cash_only
   - Amount: $60
   - Firm pricing

   Template B: "Wingspan Complete Bundle" 🎁
   - Items: [Wingspan, European Exp, Oceania Exp]
   - Type: cash_only
   - Amount: $150
   - Firm pricing

   Template C: "Wingspan - Trade"
   - Items: [Wingspan]
   - Type: trade_only
   - Trade for: ["Ark Nova"]
   - Open to other trades: Yes

3. Publish
```

### **Buyer Makes Offer**

```
View listing → See 3 templates

Option A: Accept template directly
  "Accept $60 for Wingspan" → Creates trade with template reference

Option B: Make custom offer
  "I'll give you $50 + can pick up locally" → Creates custom trade

Option C: Counter with bundle
  "I'll take Template A + European Exp for $75" → Custom offer
```

### **Seller Reviews Offers**

```
Goes to /listings/[id]/offers

Sees 3 pending offers:
1. Alice: Template B ($150) - ACCEPT
2. Bob: Custom ($50 pickup) - DECLINE ("Too low")
3. Carol: Custom ($75 for base + exp) - DECLINE

Accepts Alice's offer:
  ✓ Template B → status: 'accepted'
  ✓ All 3 games → status: 'pending'
  ✓ Template A & C → status: 'invalidated'
  ✓ Bob & Carol → auto-declined
  ✓ Listing → status: 'pending'
```

---

## 📁 Files Delivered

### **Migrations**
- `pocketbase/pb_migrations/0003_create_offer_templates.js`
- `pocketbase/pb_migrations/0004_add_template_to_trades.js`
- `pocketbase/pb_migrations/0005_add_wanted_to_discussions.js`
- `pocketbase/pb_migrations/0006_remove_deprecated_fields.js`

### **Scripts**
- `scripts/clean-migration.sh` - Automated clean migration
- `scripts/verify-migration.ts` - Verify new schema (optional)

### **TypeScript Types**
- `src/lib/types/offer-template.ts` - New type definitions

### **Documentation**
- `SIMPLIFIED_MIGRATION_SUMMARY.md` (this file - complete guide)

---

## ✅ Next Steps

### Immediate (Migration)
1. Run `./scripts/clean-migration.sh`
2. Run `just dev`
3. Create admin account
4. Verify schema in admin UI

### Short Term (UI Updates)
1. Update listing creation flow (add template creation)
2. Update listing detail page (display templates)
3. Update offer management page (already built!)
4. Remove listing_type conditionals from code

### Medium Term (Polish)
1. Update browse/search to use templates
2. Build template editing UI
3. Add bundle discount calculator
4. Wanted posts in discussions section

---

## 🎉 Benefits of This Approach

**vs. Complex Data Migration:**
- ✅ **10x simpler** - No data conversion needed
- ✅ **Faster** - 5 minutes vs 2-4 hours
- ✅ **Cleaner** - No legacy code paths
- ✅ **Safer** - Can't corrupt existing data (there isn't any!)

**vs. Old System:**
- ✅ **More flexible** - Cash AND trade options
- ✅ **Better UX** - Clear pricing, bundles visible
- ✅ **Simpler code** - No listing_type conditionals
- ✅ **More powerful** - ONO, shipping negotiation, etc.

---

## 🤔 FAQs

**Q: What about existing test data?**
A: Gone. Fresh start. Use `npm run seed:demo` to recreate.

**Q: Can we rollback?**
A: Yes - the script creates backups. Restore from `backups/` dir.

**Q: Do we lose the multi-offer system we just built?**
A: No! That still works. Templates are an enhancement on top.

**Q: What about the trade flow (initiated → confirmed → completed)?**
A: Unchanged. Templates only affect the offer stage.

**Q: Can sellers edit templates after publishing?**
A: Yes - update template (if status: 'active')

**Q: What if buyer wants to negotiate?**
A: They make a custom offer (ignore template)

---

## 🏁 Status

- ✅ Schema designed
- ✅ Migrations written
- ✅ Clean migration script created
- ✅ Types defined
- ✅ Documentation complete

**Ready to execute migration!** 🚀

Run `./scripts/clean-migration.sh` when ready.
