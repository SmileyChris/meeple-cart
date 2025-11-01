migrate(
  (db) => {
    const dao = new Dao(db);
    const collection = dao.findCollectionByNameOrId('fhggsowykv3hz86'); // users collection

    // Add preferred_regions field to store user's default region filters
    collection.schema.addField(
      new SchemaField({
        name: 'preferred_regions',
        type: 'json',
        required: false,
        options: {},
      })
    );

    return dao.saveCollection(collection);
  },
  (db) => {
    const dao = new Dao(db);
    const collection = dao.findCollectionByNameOrId('fhggsowykv3hz86');

    // Remove preferred_regions field
    collection.schema.removeField('preferred_regions');

    return dao.saveCollection(collection);
  }
);
