/// <reference path="../pb_data/types.d.ts" />

/**
 * Fix user creation rule to allow public registration
 *
 * The users collection had createRule = "" which denies all creation.
 * This migration sets it to allow anyone to create accounts.
 */

migrate(
  (db) => {
    const dao = new Dao(db);
    const collection = dao.findCollectionByNameOrId('fhggsowykv3hz86'); // users collection ID

    // Allow anyone to create user accounts
    // For auth collections, null createRule allows public registration
    collection.createRule = null;

    return dao.saveCollection(collection);
  },
  (db) => {
    const dao = new Dao(db);
    const collection = dao.findCollectionByNameOrId('fhggsowykv3hz86');

    // Rollback: set back to deny all
    collection.createRule = '';

    return dao.saveCollection(collection);
  }
);
