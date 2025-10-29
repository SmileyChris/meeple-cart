migrate(
  (db) => {
    const dao = new Dao(db);
    const collection = dao.findCollectionByNameOrId('w3c43ufqz9ejshk'); // listings collection

    // Add status_history field to track listing status changes
    collection.schema.addField(
      new SchemaField({
        name: 'status_history',
        type: 'json',
        required: false,
        options: {},
      })
    );

    return dao.saveCollection(collection);
  },
  (db) => {
    const dao = new Dao(db);
    const collection = dao.findCollectionByNameOrId('w3c43ufqz9ejshk');

    // Remove status_history field
    collection.schema.removeField('status_history');

    return dao.saveCollection(collection);
  }
);
