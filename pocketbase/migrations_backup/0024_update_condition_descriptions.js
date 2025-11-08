/// <reference path="../pb_data/types.d.ts" />

/**
 * Migration: Update condition field descriptions to be generic
 *
 * Changes the condition field descriptions from game-specific
 * (mentioning "unplayed", "components", etc.) to generic descriptions
 * that work for any item type (games, furniture, accessories, boxes, etc.)
 *
 * Note: PocketBase stores enum values, not descriptions. The descriptions
 * are only used in the admin UI. Frontend apps should define their own
 * user-facing labels. This migration documents the intended semantic meaning.
 *
 * New generic meanings:
 * - mint: Like new, unused or unopened
 * - excellent: Like new with minimal wear
 * - good: Light wear, fully functional
 * - fair: Noticeable wear but usable
 * - poor: Heavy wear or damage
 */
migrate(
  (db) => {
    // Note: This migration is primarily documentational
    // PocketBase condition select field only stores the enum values (mint, excellent, etc.)
    // not their descriptions. The descriptions exist in admin UI labels only.
    //
    // Frontend applications should define their own user-facing condition labels
    // that work for both games and non-game items.
    //
    // The actual enum values don't need to change - they're already generic enough.

    const dao = new Dao(db);

    // Get the items collection (formerly games)
    const itemsCollection = dao.findCollectionByNameOrId('u0l5t5dn4gwl0sb');

    // The condition field values remain the same: mint, excellent, good, fair, poor
    // Only the semantic meaning/description changes to be more generic
    // No database changes needed - this is just documentation

    // Return the collection unchanged
    return dao.saveCollection(itemsCollection);
  },
  (db) => {
    // Rollback: No changes needed
    const dao = new Dao(db);
    const itemsCollection = dao.findCollectionByNameOrId('u0l5t5dn4gwl0sb');
    return dao.saveCollection(itemsCollection);
  }
);
