/// <reference path="../types/pocketbase.d.ts" />

/**
 * Allow authenticated users to view other users' profiles
 * This is required for listing detail pages to expand owner information
 */
migrate(
  (db) => {
    const dao = new Dao(db);
    const collection = dao.findCollectionByNameOrId('users');

    // Update viewRule to allow anyone to view user profiles
    // This enables expanding owner information on listing pages for all visitors
    // Note: email is protected by emailVisibility: false in the collection settings
    collection.viewRule = '';

    return dao.saveCollection(collection);
  },
  (db) => {
    const dao = new Dao(db);
    const collection = dao.findCollectionByNameOrId('users');

    // Rollback: restore original restrictive viewRule
    collection.viewRule = 'id = @request.auth.id';

    return dao.saveCollection(collection);
  }
);
