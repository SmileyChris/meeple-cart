migrate(
  (db) => {
    const dao = new Dao(db);
    const collection = dao.findCollectionByNameOrId('w3c43ufqz9ejshk'); // listings collection

    // Add photo_region_map field to store game-to-photo region mappings
    collection.schema.addField(
      new SchemaField({
        name: 'photo_region_map',
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

    // Remove photo_region_map field
    collection.schema.removeField('photo_region_map');

    return dao.saveCollection(collection);
  }
);
