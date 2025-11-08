migrate(
  (db) => {
    const dao = new Dao(db);
    const collection = dao.findCollectionByNameOrId('fhggsowykv3hz86'); // users collection

    // Update preferred_regions field to allow JSON data (fix maxSize)
    const field = collection.schema.getFieldByName('preferred_regions');
    if (field) {
      field.options = {
        maxSize: 2000000, // 2MB max size for JSON data
      };
    }

    return dao.saveCollection(collection);
  },
  (db) => {
    const dao = new Dao(db);
    const collection = dao.findCollectionByNameOrId('fhggsowykv3hz86');

    // Revert to empty options
    const field = collection.schema.getFieldByName('preferred_regions');
    if (field) {
      field.options = {};
    }

    return dao.saveCollection(collection);
  }
);
