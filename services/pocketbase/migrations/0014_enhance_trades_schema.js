/// <reference path="../pb_data/types.d.ts" />

/**
 * Migration: Enhance trades schema
 * - Add games relation field for selecting specific games in a trade
 * - Add shipping_method field (in_person/shipped)
 * - Add 'cancelled' status option
 */
migrate(
  (db) => {
    const dao = new Dao(db);
    const tradesCollection = dao.findCollectionByNameOrId('50iprjgx7p8chq7');

    // Add games relation field (many-to-many with games collection)
    tradesCollection.schema.addField(
      new SchemaField({
        system: false,
        id: 'trade_games_rel',
        name: 'games',
        type: 'relation',
        required: false,
        presentable: false,
        unique: false,
        options: {
          collectionId: 'u0l5t5dn4gwl0sb', // games collection
          cascadeDelete: false,
          minSelect: null,
          maxSelect: null, // Allow multiple games
          displayFields: null,
        },
      })
    );

    // Add shipping_method select field
    tradesCollection.schema.addField(
      new SchemaField({
        system: false,
        id: 'trade_ship_meth',
        name: 'shipping_method',
        type: 'select',
        required: false,
        presentable: false,
        unique: false,
        options: {
          maxSelect: 1,
          values: ['in_person', 'shipped'],
        },
      })
    );

    // Update status field to include 'cancelled'
    const statusField = tradesCollection.schema.getFieldById('in1eyf6xtxsoevc');
    statusField.options.values = ['initiated', 'confirmed', 'completed', 'disputed', 'cancelled'];

    return dao.saveCollection(tradesCollection);
  },
  (db) => {
    // Rollback: Remove added fields and revert status values
    const dao = new Dao(db);
    const tradesCollection = dao.findCollectionByNameOrId('50iprjgx7p8chq7');

    // Remove games field
    tradesCollection.schema.removeField('trade_games_rel');

    // Remove shipping_method field
    tradesCollection.schema.removeField('trade_ship_meth');

    // Revert status field values
    const statusField = tradesCollection.schema.getFieldById('in1eyf6xtxsoevc');
    statusField.options.values = ['initiated', 'confirmed', 'completed', 'disputed'];

    return dao.saveCollection(tradesCollection);
  }
);
