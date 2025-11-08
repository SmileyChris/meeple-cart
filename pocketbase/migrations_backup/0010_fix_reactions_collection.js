/// <reference path="../pb_data/types.d.ts" />

migrate(
  (db) => {
    const dao = new Dao(db);
    const collection = dao.findCollectionByNameOrId('react123456789');

    // Find the listing field
    const listingField = collection.schema.getFieldByName('listing');

    // Update the collectionId to point to listings instead of games
    listingField.options = {
      collectionId: 'w3c43ufqz9ejshk', // correct listings collection ID
      cascadeDelete: true,
      minSelect: 1,
      maxSelect: 1,
    };

    dao.saveCollection(collection);

    return null;
  },
  (db) => {
    const dao = new Dao(db);
    const collection = dao.findCollectionByNameOrId('react123456789');

    // Revert back to games collection (wrong, but for rollback)
    const listingField = collection.schema.getFieldByName('listing');
    listingField.options = {
      collectionId: 'u0l5t5dn4gwl0sb',
      cascadeDelete: true,
      minSelect: 1,
      maxSelect: 1,
    };

    dao.saveCollection(collection);

    return null;
  }
);
