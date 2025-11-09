#!/bin/bash

# Clean migration script - wipes database and rebuilds with new schema
# Use this since we're not live yet

set -e  # Exit on error

echo "🗑️  Clean Database Migration"
echo "================================"
echo ""
echo "⚠️  WARNING: This will DELETE all existing data!"
echo ""
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Migration cancelled"
    exit 0
fi

echo ""
echo "📦 Step 1: Backup existing data..."
if [ -f "pocketbase/pb_data/data.db" ]; then
    BACKUP_DIR="backups/clean-migration-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    cp -r pocketbase/pb_data "$BACKUP_DIR/"
    echo "✓ Backup created at $BACKUP_DIR"
else
    echo "✓ No existing database to backup"
fi

echo ""
echo "🗑️  Step 2: Delete existing database..."
if [ -f "pocketbase/pb_data/data.db" ]; then
    rm pocketbase/pb_data/data.db
    rm -f pocketbase/pb_data/data.db-shm
    rm -f pocketbase/pb_data/data.db-wal
    echo "✓ Database deleted"
else
    echo "✓ No database to delete"
fi

echo ""
echo "🗑️  Step 3: Clean old migrations..."
if [ -f "pocketbase/pb_migrations/0001_initial.js" ]; then
    mkdir -p "pocketbase/pb_migrations/old"
    mv pocketbase/pb_migrations/0001_initial.js pocketbase/pb_migrations/old/ 2>/dev/null || true
    mv pocketbase/pb_migrations/0002_multi_offer_support.js pocketbase/pb_migrations/old/ 2>/dev/null || true
    echo "✓ Old migrations archived"
else
    echo "✓ No old migrations to clean"
fi

echo ""
echo "🔧 Step 4: Verify new migrations exist..."
MIGRATIONS=(
    "0003_create_offer_templates.js"
    "0004_add_template_to_trades.js"
    "0005_add_wanted_to_discussions.js"
    "0006_remove_deprecated_fields.js"
)

for migration in "${MIGRATIONS[@]}"; do
    if [ -f "pocketbase/pb_migrations/$migration" ]; then
        echo "✓ Found $migration"
    else
        echo "❌ Missing $migration"
        exit 1
    fi
done

echo ""
echo "✅ Pre-checks passed!"
echo ""
echo "📋 Next steps:"
echo "1. Run: just dev"
echo "2. Open http://127.0.0.1:8090/_/"
echo "3. Create admin account"
echo "4. Run: npm run seed:demo (optional)"
echo "5. Verify: npx tsx scripts/verify-migration.ts (optional)"
echo ""
echo "🎉 Clean migration setup complete!"
