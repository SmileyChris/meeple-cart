migrate(
  (db) => {
    const dao = new Dao(db);
    const collection = dao.findCollectionByNameOrId('u0l5t5dn4gwl0sb'); // games collection

    // Add price_history field
    collection.schema.addField(
      new SchemaField({
        name: 'price_history',
        type: 'json',
        required: false,
        options: {},
      })
    );

    return dao.saveCollection(collection);
  },
  (db) => {
    const dao = new Dao(db);
    const collection = dao.findCollectionByNameOrId('u0l5t5dn4gwl0sb');

    // Remove price_history field
    collection.schema.removeField('price_history');

    return dao.saveCollection(collection);
  }
);
