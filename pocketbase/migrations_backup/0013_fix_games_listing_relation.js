/// <reference path="../pb_data/types.d.ts" />
migrate(
  (db) => {
    const dao = new Dao(db);
    const collection = dao.findCollectionByNameOrId('u0l5t5dn4gwl0sb');

    // Update the listing relation to use the correct collection ID
    collection.schema.addField(
      new SchemaField({
        system: false,
        id: 'riq8vjw6ltf9ic1',
        name: 'listing',
        type: 'relation',
        required: true,
        presentable: false,
        unique: false,
        options: {
          collectionId: 'w3c43ufqz9ejshk',
          cascadeDelete: true,
          minSelect: 1,
          maxSelect: 1,
          displayFields: null,
        },
      })
    );

    return dao.saveCollection(collection);
  },
  (db) => {
    const dao = new Dao(db);
    const collection = dao.findCollectionByNameOrId('u0l5t5dn4gwl0sb');

    // Revert to old incorrect ID
    collection.schema.addField(
      new SchemaField({
        system: false,
        id: 'riq8vjw6ltf9ic1',
        name: 'listing',
        type: 'relation',
        required: true,
        presentable: false,
        unique: false,
        options: {
          collectionId: 'listings',
          cascadeDelete: true,
          minSelect: 1,
          maxSelect: 1,
          displayFields: null,
        },
      })
    );

    return dao.saveCollection(collection);
  }
);
