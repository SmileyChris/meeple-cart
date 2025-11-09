/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const collection = app.findCollectionByNameOrId('discussion_threads');
  const categoriesCollectionId = app.findCollectionByNameOrId('discussion_categories').id;

  // Add category field (relation to discussion_categories)
  collection.fields.add(new RelationField({
    name: 'category',
    required: true,
    collectionId: categoriesCollectionId,
    cascadeDelete: false,
    minSelect: 1,
    maxSelect: 1,
    displayFields: ['name']
  }));

  app.save(collection);

  // Migrate existing threads to categories
  // - If thread_type === 'wanted' -> assign to 'wanted' category
  // - Else -> assign to 'game-talk' category
  const wantedCategory = app.findFirstRecordByData('discussion_categories', 'slug', 'wanted');
  const gameTalkCategory = app.findFirstRecordByData('discussion_categories', 'slug', 'game-talk');

  if (!wantedCategory || !gameTalkCategory) {
    throw new Error('Required categories not found. Run previous migration first.');
  }

  const threads = app.findRecordsByFilter('discussion_threads', '', '');

  threads.forEach((thread) => {
    const categoryId = thread.getString('thread_type') === 'wanted' ? wantedCategory.id : gameTalkCategory.id;
    thread.set('category', categoryId);
    app.save(thread);
  });
}, (app) => {
  const collection = app.findCollectionByNameOrId('discussion_threads');

  // Remove category field
  collection.fields.removeById(collection.fields.getByName('category').id);

  app.save(collection);
});
