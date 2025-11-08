/// <reference path="../pb_data/types.d.ts" />

/**
 * Migration: ensure trades collection supports granular status tracking
 * - Adds games relation to capture specific items in a trade
 * - Adds shipping_method select for delivery coordination
 * - Expands status options to include shipped and cancelled
 */
migrate(
  (db) => {
    const dao = new Dao(db);
    const trades = dao.findCollectionByNameOrId('50iprjgx7p8chq7');

    trades.schema.addField(
      new SchemaField({
        system: false,
        id: 'trade_games_rel',
        name: 'games',
        type: 'relation',
        required: false,
        presentable: false,
        unique: false,
        options: {
          collectionId: 'u0l5t5dn4gwl0sb',
          cascadeDelete: false,
          minSelect: null,
          maxSelect: null,
          displayFields: null,
        },
      })
    );

    trades.schema.addField(
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

    trades.schema.addField(
      new SchemaField({
        system: false,
        id: 'in1eyf6xtxsoevc',
        name: 'status',
        type: 'select',
        required: true,
        presentable: false,
        unique: false,
        options: {
          maxSelect: 1,
          values: ['initiated', 'confirmed', 'shipped', 'completed', 'disputed', 'cancelled'],
        },
      })
    );

    return dao.saveCollection(trades);
  },
  (db) => {
    const dao = new Dao(db);
    const trades = dao.findCollectionByNameOrId('50iprjgx7p8chq7');

    trades.schema.removeField('trade_games_rel');
    trades.schema.removeField('trade_ship_meth');

    trades.schema.addField(
      new SchemaField({
        system: false,
        id: 'in1eyf6xtxsoevc',
        name: 'status',
        type: 'select',
        required: true,
        presentable: false,
        unique: false,
        options: {
          maxSelect: 1,
          values: ['initiated', 'confirmed', 'completed', 'disputed'],
        },
      })
    );

    return dao.saveCollection(trades);
  }
);
