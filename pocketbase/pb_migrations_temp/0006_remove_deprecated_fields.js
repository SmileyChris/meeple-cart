/// <reference path="../pb_data/types.d.ts" />
migrate(
  (db) => {
    const dao = new Dao(db);

    // ========================================
    // Update listings collection
    // ========================================
    const listings = dao.findCollectionByNameOrId('w3c43ufqz9ejshk'); // listings

    // Remove listing_type field
    const listingTypeField = listings.schema.getFieldById('6z7kue9hxfx36d9');
    if (listingTypeField) {
      listings.schema.removeField('6z7kue9hxfx36d9');
    }

    // Remove prefer_bundle field
    const preferBundleField = listings.schema.getFieldById('5ntcnt4banfiwbk');
    if (preferBundleField) {
      listings.schema.removeField('5ntcnt4banfiwbk');
    }

    // Remove bundle_discount field
    const bundleDiscountField = listings.schema.getFieldById('bundle_discount');
    if (bundleDiscountField) {
      listings.schema.removeField('bundle_discount');
    }

    dao.saveCollection(listings);

    // ========================================
    // Update items (games) collection
    // ========================================
    const items = dao.findCollectionByNameOrId('u0l5t5dn4gwl0sb'); // items/games

    // Remove price field
    const priceField = items.schema.getFieldById('ll62ygj1a67n7hg');
    if (priceField) {
      items.schema.removeField('ll62ygj1a67n7hg');
    }

    // Remove trade_value field
    const tradeValueField = items.schema.getFieldById('qre6dphdxzfqwhz');
    if (tradeValueField) {
      items.schema.removeField('qre6dphdxzfqwhz');
    }

    // Remove price_history field
    const priceHistoryField = items.schema.getFieldById('price_history_field');
    if (priceHistoryField) {
      items.schema.removeField('price_history_field');
    }

    return dao.saveCollection(items);
  },
  (db) => {
    const dao = new Dao(db);

    // ========================================
    // Rollback listings collection
    // ========================================
    const listings = dao.findCollectionByNameOrId('w3c43ufqz9ejshk');

    // Restore listing_type field
    listings.schema.addField(
      new SchemaField({
        system: false,
        id: '6z7kue9hxfx36d9',
        name: 'listing_type',
        type: 'select',
        required: true,
        presentable: false,
        unique: false,
        options: {
          maxSelect: 1,
          values: ['trade', 'sell', 'want'],
        },
      })
    );

    // Restore prefer_bundle field
    listings.schema.addField(
      new SchemaField({
        system: false,
        id: '5ntcnt4banfiwbk',
        name: 'prefer_bundle',
        type: 'bool',
        required: false,
        presentable: false,
        unique: false,
        options: {},
      })
    );

    // Restore bundle_discount field
    listings.schema.addField(
      new SchemaField({
        system: false,
        id: 'bundle_discount',
        name: 'bundle_discount',
        type: 'number',
        required: false,
        presentable: false,
        unique: false,
        options: {
          min: 0,
          max: 100,
        },
      })
    );

    dao.saveCollection(listings);

    // ========================================
    // Rollback items collection
    // ========================================
    const items = dao.findCollectionByNameOrId('u0l5t5dn4gwl0sb');

    // Restore price field
    items.schema.addField(
      new SchemaField({
        system: false,
        id: 'll62ygj1a67n7hg',
        name: 'price',
        type: 'number',
        required: false,
        presentable: false,
        unique: false,
        options: {
          min: 0,
          max: null,
        },
      })
    );

    // Restore trade_value field
    items.schema.addField(
      new SchemaField({
        system: false,
        id: 'qre6dphdxzfqwhz',
        name: 'trade_value',
        type: 'number',
        required: false,
        presentable: false,
        unique: false,
        options: {
          min: 0,
          max: null,
        },
      })
    );

    // Restore price_history field
    items.schema.addField(
      new SchemaField({
        system: false,
        id: 'price_history_field',
        name: 'price_history',
        type: 'json',
        required: false,
        presentable: false,
        unique: false,
        options: {},
      })
    );

    return dao.saveCollection(items);
  }
);
