/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const usersId = app.findCollectionByNameOrId('users').id;
  const threadsId = app.findCollectionByNameOrId('discussion_threads').id;

  // Create discussion_subscriptions collection
  const subscriptions = new Collection({
    name: 'discussion_subscriptions',
    type: 'base'
  });

  subscriptions.fields.add(new RelationField({
    name: 'user',
    required: true,
    collectionId: usersId,
    cascadeDelete: true,
    minSelect: 1,
    maxSelect: 1
  }));

  subscriptions.fields.add(new RelationField({
    name: 'thread',
    required: true,
    collectionId: threadsId,
    cascadeDelete: true,
    minSelect: 1,
    maxSelect: 1
  }));

  subscriptions.indexes = [
    'CREATE INDEX idx_discussion_subs_user ON discussion_subscriptions (user)',
    'CREATE INDEX idx_discussion_subs_thread ON discussion_subscriptions (thread)',
    'CREATE UNIQUE INDEX idx_discussion_subs_unique ON discussion_subscriptions (user, thread)'
  ];

  app.save(subscriptions);
}, (app) => {
  const subscriptions = app.findCollectionByNameOrId('discussion_subscriptions');
  app.delete(subscriptions);
});
