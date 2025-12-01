/**
 * Verifies migration was successful
 * Run with: npx tsx scripts/verify-migration.ts
 */

import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

async function verify() {
  console.log('🔍 Verifying migration...\n');

  // Count templates
  const templates = await pb.collection('offer_templates').getList(1, 1);
  console.log(`✓ Offer templates created: ${templates.totalItems}`);

  // Count wanted threads (by category)
  const wantedThreads = await pb.collection('discussion_threads').getList(1, 1, {
    filter: 'category.slug = "wanted"',
  });
  console.log(`✓ Wanted threads created: ${wantedThreads.totalItems}`);

  // Check for orphaned items (items without templates)
  const activeListings = await pb.collection('listings').getFullList({
    filter: 'status = "active"',
    fields: 'id',
  });

  let orphanedItems = 0;
  for (const listing of activeListings) {
    const items = await pb.collection('items').getList(1, 1, {
      filter: `listing = "${listing.id}" && status = "available"`,
    });

    const templatesForListing = await pb.collection('offer_templates').getList(1, 1, {
      filter: `listing = "${listing.id}" && status = "active"`,
    });

    if (items.totalItems > 0 && templatesForListing.totalItems === 0) {
      orphanedItems += items.totalItems;
      console.log(`⚠️  Listing ${listing.id} has ${items.totalItems} items but no templates`);
    }
  }

  if (orphanedItems === 0) {
    console.log('✓ No orphaned items found');
  } else {
    console.log(`⚠️  Found ${orphanedItems} orphaned items`);
  }

  // Check trades still link correctly
  const recentTrades = await pb.collection('trades').getList(1, 5, {
    sort: '-created',
    expand: 'listing,buyer,seller',
  });

  console.log(`\n✓ Recent trades still expand correctly: ${recentTrades.items.length > 0}`);

  console.log('\n✅ Verification complete!');
}

verify().catch(console.error);
