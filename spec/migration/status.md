# Schema Migration Progress Status

**Last Updated:** 2025-01-09
**Migration:** Simplified Offer Template Schema (games → items, removed listing_type/price fields)

## ✅ Completed

### Code Updates

1. **TypeScript Types**
   - ✅ Updated `src/lib/types/listing.ts` - removed price/trade_value fields
   - ✅ Updated `src/lib/types/pocketbase.ts` - has ItemRecord, OfferTemplateRecord, DiscussionThreadRecord
   - ✅ Stubbed deprecated `src/lib/utils/price-history.ts`
   - ✅ Stubbed deprecated `src/lib/server/price-tracking.ts`

2. **Test Files**
   - ✅ Updated 8+ test files to use 'items' instead of 'games'
   - ✅ Removed listing_type from test mocks
   - ✅ Removed price/tradeValue from test data
   - ✅ Fixed notification message format tests
   - ✅ 284/297 tests passing

3. **Critical UI Fixes (Phase 1 Complete)**
   - ✅ **Listing Creation** (`src/routes/listings/new/+page.svelte`) - removed price, trade_value, listing_type, prefer_bundle, bundle_discount from interface, forms, and defaults
   - ✅ **Edit Prices Page** - deleted entire obsolete `/listings/[id]/edit/` directory
   - ✅ **Games Browse** (`src/routes/games/+page.svelte` & `+page.ts`) - removed listing type filter UI (lines 61-178), price filter UI (lines 99-103 and 641-766), cleaned up imports, removed selectedTypes from backend
   - ✅ **Listing Manage** (`src/routes/listings/[id]/manage/+page.svelte`) - removed price/trade_value from addFormValues (lines 13-14), reset function (lines 26-27), add form inputs (lines 145-171), and game display (lines 351-356)
   - ✅ **Notifications** - removed listing_type from notification messages
   - ✅ **Collection References** - all backend code uses 'items' collection correctly

### Database

- ✅ 9 PocketBase migrations applied successfully
- ✅ Collections created: offer_templates, discussion_threads (with thread_type)
- ✅ Fields removed: listing_type, prefer_bundle, bundle_discount, price, trade_value, price_history
- ✅ Collection renamed: games → items

### Build

- ✅ Production build succeeds
- ✅ Type checking passes
- ✅ Application runs without crashes

---

## 🔴 Critical Issues Remaining

### 3. **Offers Page** (`src/routes/listings/[id]/offers/+page.svelte`)

**Status:** Shows wrong data
**Issues:**

- Lines 197-198, 310-311: `getGameDetails()` tries to display game.price/trade_value
- Missing offer_template integration

**Fix Required:**

- Load offer templates for the listing
- Display template pricing instead of item pricing
- Update UI to show "This offer template: $X for items A, B, C"

### 4. **Trade Detail Page** (`src/routes/trades/[id]/+page.svelte`)

**Status:** References dead fields
**Issues:**

- Lines 441-444: Shows game.price and game.trade_value

**Fix Required:**

- Display accepted offer_template information instead
- Show "Accepted offer: $X for these items"

---

## 🟢 Completed: Offer Template System

### 5. **Offer Templates - FULLY IMPLEMENTED**

**Status:** ✅ Complete end-to-end workflow
**Created Pages:**

- ✅ `/listings/[id]/templates/new` - Comprehensive template creation form with validation
- ✅ Template list in `/listings/[id]/manage` - View, withdraw, delete templates

**Features Implemented:**

- Multi-item selection with select all/deselect all
- Three template types: cash_only, trade_only, cash_or_trade
- Cash amount input with "Or Nearest Offer" option
- Dynamic trade items wish list (add/remove)
- Additional options: shipping negotiation, open to trade offers
- Auto-generated display names
- Full CRUD operations: create, view, withdraw, delete

### 6. **Listing Detail** (`src/routes/listings/[id]/+page.svelte`)

**Status:** ✅ Templates fully integrated
**Implemented:**

- ✅ "Available Offers" section showing all active templates
- ✅ Each template displays: type, price, items included, trade wish list, options, notes
- ✅ Grid layout for easy comparison (2 columns on desktop)
- ✅ Helpful tip box directing buyers to contact seller
- ✅ Responsive design with hover effects

### 7. **Wanted Posts** (`src/routes/discussions/new/+page.svelte`)

**Status:** Partially implemented
**Issues:**

- No UI for thread_type selection ('discussion' vs 'wanted')
- Missing wanted_items and wanted_offer_type fields
- No dedicated `/wanted` browse page

**Fix Required:**

- Add radio button for discussion vs wanted post
- Show wanted-specific fields when 'wanted' selected
- Create browse page for wanted posts

---

## 🟢 Medium Priority

### 8. **Price/Trade Display Throughout**

**Files:** GameCard, activity feeds, search results, etc.
**Issue:** Components expect price/tradeValue on items
**Fix:** Update all to fetch from offer_templates or show null

### 9. **Filters State Cleanup**

**Files:** Multiple loaders (games/+page.ts, +page.ts)
**Issue:** Return minPrice/maxPrice in filters but can't use them
**Fix:** Either remove or implement via offer_templates join

### 10. **User Profile**

**File:** `src/routes/users/[id]/+page.ts`
**Issue:** Reviews might display trade price/value
**Fix:** Verify and update if needed

---

## 📝 Recommended Next Steps

### **Phase 1: Immediate (Prevent Confusion)**

1. ✅ DONE: Fix listing creation - removed price, trade_value, listing_type, prefer_bundle, bundle_discount
2. ✅ DONE: Delete broken edit page - deleted entire `/listings/[id]/edit/` directory
3. ✅ DONE: Fix games browse - removed listing type & price filter UI, cleaned up backend
4. ✅ DONE: Fix listing manage - removed price/trade_value from add form and display

### **Phase 2: Core Features (Enable Full Workflow)**

5. ✅ DONE: Build offer template CRUD pages - created `/templates/new` with comprehensive form
6. ✅ DONE: Integrate offer templates into listing detail view - added "Available Offers" section
7. ✅ DONE: Add template management to listing manage page - view, withdraw, delete templates
8. Update trade initiation to reference templates (optional enhancement)
9. Update trade detail to show template info (optional enhancement)

### **Phase 3: Polish**

9. Add wanted post support
10. Update all price displays
11. Clean up filter UI

---

## 🛠️ Quick Reference

### What's Safe to Use

- ✅ items collection (not games)
- ✅ ListingRecord (no listing_type field)
- ✅ ItemRecord (no price/trade_value)
- ✅ OfferTemplateRecord (fully defined)
- ✅ DiscussionThreadRecord (has thread_type)

### What's Broken/Deprecated

- ❌ listing_type field
- ❌ prefer_bundle, bundle_discount
- ❌ price, trade_value on items
- ❌ price_history field
- ❌ Price tracking notifications
- ❌ `/listings/[id]/edit/` route (deleted)

### What Needs Building

- ⚠️ Offer template management UI
- ⚠️ Offer template display in listing detail
- ⚠️ Trade flow using templates
- ⚠️ Wanted post creation/browsing
