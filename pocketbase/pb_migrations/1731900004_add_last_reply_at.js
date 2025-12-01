/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId('discussion_threads');

  // Check if field already exists
  if (!collection.fields.getByName('last_reply_at')) {
    collection.fields.add(new DateField({
      name: 'last_reply_at',
      required: false,
      min: null,
      max: null
    }));

    // Add index for sorting by recent activity
    collection.indexes = [
      ...collection.indexes,
      'CREATE INDEX idx_discussions_last_reply ON discussion_threads (last_reply_at)'
    ];

    app.save(collection);
  }
}, (app) => {
  const collection = app.findCollectionByNameOrId('discussion_threads');
  collection.fields.removeByName('last_reply_at');

  // Remove the index
  collection.indexes = collection.indexes.filter(
    idx => !idx.includes('idx_discussions_last_reply')
  );

  app.save(collection);
});
