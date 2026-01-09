# PocketBase Migration Guide

This guide covers how to execute the fresh PocketBase migrations and get started with the new Offer Template system.

## 🎯 Quick Start

```bash
# 1. Run clean migration
./scripts/clean-migration.sh

# 2. Start PocketBase
just dev

# 3. Create admin account
# Open http://127.0.0.1:8090/_/

# 4. Seed demo data (optional)
npm run seed:demo
```

---

## 🚀 Running the Migration

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

---

## ✅ Verification Steps

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

---

## 🚀 Next Steps After Migration

1. ✅ Verify schema in PocketBase admin
2. ⏭️ Update listing creation UI (add template builder)
3. ⏭️ Update listing detail UI (show templates)
4. ⏭️ Remove `listing_type` from code
5. ⏭️ Test end-to-end flow

---

## 🛠️ Troubleshooting

### Migration Fails

```bash
# Check PocketBase logs
tail -f pocketbase/pb_data/logs/*.log

# Common issues:
# - Collection ID conflicts (shouldn't happen with fresh DB)
# - Field ID conflicts (shouldn't happen with fresh DB)
# - Syntax errors (run: node -c pocketbase/pb_migrations/*.js)
```

### PocketBase Won't Start

```bash
# Check if port 8090 is in use
lsof -i :8090

# Check if pb_data is corrupted
rm -rf pocketbase/pb_data
# Then restart PocketBase
```
