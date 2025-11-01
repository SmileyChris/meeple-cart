/// <reference path="../pb_data/types.d.ts" />

/**
 * Migration: Add listing relation to discussion threads
 * This allows discussions to be associated with specific listings
 * while also supporting general discussions (when listing is null)
 */
migrate(
  (db) => {
    const dao = new Dao(db);
    const threadsCollection = dao.findCollectionByNameOrId('discussion_threads');

    // Add optional listing relation field
    threadsCollection.schema.addField(
      new SchemaField({
        system: false,
        id: 'thread_listing',
        name: 'listing',
        type: 'relation',
        required: false,
        presentable: false,
        unique: false,
        options: {
          collectionId: 'w3c43ufqz9ejshk', // listings collection
          cascadeDelete: false,
          minSelect: null,
          maxSelect: 1,
          displayFields: [],
        },
      })
    );

    // Add index for listing field using collection's indexes array
    threadsCollection.indexes.push(
      'CREATE INDEX idx_threads_listing ON discussion_threads (listing)'
    );

    dao.saveCollection(threadsCollection);
  },
  (db) => {
    // Rollback: Remove listing field and index
    const dao = new Dao(db);
    const threadsCollection = dao.findCollectionByNameOrId('discussion_threads');

    // Remove the index from the collection's indexes array
    threadsCollection.indexes = threadsCollection.indexes.filter(
      (idx) => !idx.includes('idx_threads_listing')
    );

    threadsCollection.schema.removeField('thread_listing');
    dao.saveCollection(threadsCollection);
  }
);
