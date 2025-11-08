/// <reference path="../pb_data/types.d.ts" />

/**
 * Fix Nonzero Validation for discussion_threads
 * Allow zero values for view_count and reply_count
 */
migrate(
  (db) => {
    const dao = new Dao(db);
    const threadsCollection = dao.findCollectionByNameOrId('discussion_threads');

    // Make view_count and reply_count optional to avoid "nonzero" validation
    const fieldsToFix = ['view_count', 'reply_count'];

    for (const fieldName of fieldsToFix) {
      const field = threadsCollection.schema.getFieldByName(fieldName);
      if (field) {
        field.required = false;
      }
    }

    dao.saveCollection(threadsCollection);

    console.log('✅ Made discussion_threads count fields optional to allow zero values');
  },
  (db) => {
    const dao = new Dao(db);
    const threadsCollection = dao.findCollectionByNameOrId('discussion_threads');

    // Rollback: Make fields required again
    const fieldsToFix = ['view_count', 'reply_count'];

    for (const fieldName of fieldsToFix) {
      const field = threadsCollection.schema.getFieldByName(fieldName);
      if (field) {
        field.required = true;
      }
    }

    dao.saveCollection(threadsCollection);

    console.log('✅ Rollback: Made discussion_threads count fields required again');
  }
);
