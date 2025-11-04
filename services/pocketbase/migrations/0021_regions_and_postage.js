/// <reference path="../pb_data/types.d.ts" />

/**
 * Migration: Add structured regions and postage support
 * - Add regions multi-select field to listings (replaces free-text location for structured data)
 * - Remove shipping_available from listings (moved to game level)
 * - Add can_post boolean to games (per-game postage availability)
 */
migrate(
  (db) => {
    const dao = new Dao(db);

    // Update listings collection
    const listingsCollection = dao.findCollectionByNameOrId('w3c43ufqz9ejshk');

    // Add regions multi-select field
    listingsCollection.schema.addField(
      new SchemaField({
        system: false,
        id: 'listing_regions',
        name: 'regions',
        type: 'select',
        required: false,
        presentable: false,
        unique: false,
        options: {
          maxSelect: 16, // Allow all regions to be selected
          values: [
            'northland',
            'auckland',
            'waikato',
            'bay_of_plenty',
            'gisborne',
            'hawkes_bay',
            'taranaki',
            'manawatu_whanganui',
            'wellington',
            'tasman',
            'nelson',
            'marlborough',
            'west_coast',
            'canterbury',
            'otago',
            'southland',
          ],
        },
      })
    );

    // Remove shipping_available field (ID from schema: 5hhzvlaqpt6jjtm)
    listingsCollection.schema.removeField('5hhzvlaqpt6jjtm');

    dao.saveCollection(listingsCollection);

    // Update games collection
    const gamesCollection = dao.findCollectionByNameOrId('u0l5t5dn4gwl0sb');

    // Add can_post boolean field
    gamesCollection.schema.addField(
      new SchemaField({
        system: false,
        id: 'game_can_post',
        name: 'can_post',
        type: 'bool',
        required: false,
        presentable: false,
        unique: false,
        options: {},
      })
    );

    return dao.saveCollection(gamesCollection);
  },
  (db) => {
    // Rollback: Revert changes
    const dao = new Dao(db);

    // Revert listings collection
    const listingsCollection = dao.findCollectionByNameOrId('w3c43ufqz9ejshk');

    // Remove regions field
    listingsCollection.schema.removeField('listing_regions');

    // Re-add shipping_available field
    listingsCollection.schema.addField(
      new SchemaField({
        system: false,
        id: '5hhzvlaqpt6jjtm',
        name: 'shipping_available',
        type: 'bool',
        required: false,
        presentable: false,
        unique: false,
        options: {},
      })
    );

    dao.saveCollection(listingsCollection);

    // Revert games collection
    const gamesCollection = dao.findCollectionByNameOrId('u0l5t5dn4gwl0sb');

    // Remove can_post field
    gamesCollection.schema.removeField('game_can_post');

    return dao.saveCollection(gamesCollection);
  }
);
