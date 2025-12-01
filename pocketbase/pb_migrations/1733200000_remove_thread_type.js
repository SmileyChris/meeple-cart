/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId('discussion_threads');

  // Remove the thread_type field - it's redundant with category
  const threadTypeField = collection.fields.find(f => f.name === 'thread_type');
  if (threadTypeField) {
    collection.fields.remove(threadTypeField);
  }

  // Remove the index on thread_type
  collection.indexes = collection.indexes.filter(idx => !idx.includes('thread_type'));

  app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId('discussion_threads');

  // Re-add thread_type field (for rollback)
  collection.fields.add(new SelectField({
    name: 'thread_type',
    required: true,
    maxSelect: 1,
    values: ['discussion', 'wanted']
  }));

  // Re-add index
  collection.indexes.push('CREATE INDEX idx_discussions_type ON discussion_threads (thread_type)');

  app.save(collection);
});
