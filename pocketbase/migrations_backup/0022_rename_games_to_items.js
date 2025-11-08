/// <reference path="../pb_data/types.d.ts" />

/**
 * Migration: Rename 'games' collection to 'items'
 *
 * This migration renames the 'games' collection to 'items' to better reflect
 * that the collection can contain non-game items (furniture, accessories, boxes, etc.)
 * as well as board games.
 *
 * Changes:
 * - Rename collection from 'games' to 'items'
 * - Preserve all fields, indexes, and rules
 * - Foreign key references are maintained automatically
 */
migrate(
  (db) => {
    const dao = new Dao(db);

    // Get the games collection by its ID
    const gamesCollection = dao.findCollectionByNameOrId('u0l5t5dn4gwl0sb');

    // Rename the collection
    gamesCollection.name = 'items';

    // Save the collection with new name
    return dao.saveCollection(gamesCollection);
  },
  (db) => {
    // Rollback: Rename back to 'games'
    const dao = new Dao(db);

    // Get the items collection by its ID
    const itemsCollection = dao.findCollectionByNameOrId('u0l5t5dn4gwl0sb');

    // Rename back to original name
    itemsCollection.name = 'games';

    // Save the collection
    return dao.saveCollection(itemsCollection);
  }
);
