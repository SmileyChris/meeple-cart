/// <reference path="../pb_data/types.d.ts" />

/**
 * Fix user creation rule to allow public registration
 *
 * The users collection had createRule = "" which denies all creation.
 * This migration sets it to allow anyone to create accounts.
 */

migrate(
  (db) => {
    // Execute raw SQL to update the createRule for users collection
    // Setting to empty string means anyone can create (for auth collections)
    db.newQuery(
      "UPDATE _collections SET createRule = NULL WHERE id = 'fhggsowykv3hz86'"
    ).execute();
  },
  (db) => {
    // Rollback: set back to empty string (deny all)
    db.newQuery("UPDATE _collections SET createRule = '' WHERE id = 'fhggsowykv3hz86'").execute();
  }
);
