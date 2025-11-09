/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  // Add tags field to discussion_threads
  const threads = app.findCollectionByNameOrId('discussion_threads');

  threads.fields.add(new JSONField({
    name: 'tags',
    required: false
  }));

  app.save(threads);

  // Create discussion_replies collection
  const replies = new Collection({
    name: 'discussion_replies',
    type: 'base'
  });

  const threadsId = app.findCollectionByNameOrId('discussion_threads').id;
  const usersId = app.findCollectionByNameOrId('users').id;

  replies.fields.add(new RelationField({
    name: 'thread',
    required: true,
    collectionId: threadsId,
    cascadeDelete: true,
    minSelect: 1,
    maxSelect: 1,
    displayFields: ['title']
  }));

  replies.fields.add(new RelationField({
    name: 'author',
    required: true,
    collectionId: usersId,
    cascadeDelete: false,
    minSelect: 1,
    maxSelect: 1,
    displayFields: ['display_name']
  }));

  replies.fields.add(new TextField({
    name: 'content',
    required: true,
    min: 1,
    max: 10000
  }));

  replies.fields.add(new BoolField({
    name: 'edited',
    required: false
  }));

  replies.fields.add(new DateField({
    name: 'edited_at',
    required: false
  }));

  replies.indexes = [
    'CREATE INDEX idx_replies_thread ON discussion_replies (thread)',
    'CREATE INDEX idx_replies_author ON discussion_replies (author)'
  ];

  replies.listRule = '';
  replies.viewRule = '';
  replies.createRule = '@request.auth.id != ""';
  replies.updateRule = '@request.auth.id = author.id';
  replies.deleteRule = '@request.auth.id = author.id';

  app.save(replies);

  // Add quoted_reply field after collection is created (self-reference)
  replies.fields.add(new RelationField({
    name: 'quoted_reply',
    required: false,
    collectionId: replies.id,
    cascadeDelete: false,
    minSelect: 0,
    maxSelect: 1,
    displayFields: ['content']
  }));

  app.save(replies);

  // Create discussion_reactions collection
  const reactions = new Collection({
    name: 'discussion_reactions',
    type: 'base'
  });

  reactions.fields.add(new RelationField({
    name: 'thread',
    required: false,
    collectionId: threadsId,
    cascadeDelete: true,
    minSelect: 0,
    maxSelect: 1
  }));

  reactions.fields.add(new RelationField({
    name: 'reply',
    required: false,
    collectionId: replies.id,
    cascadeDelete: true,
    minSelect: 0,
    maxSelect: 1
  }));

  reactions.fields.add(new RelationField({
    name: 'user',
    required: true,
    collectionId: usersId,
    cascadeDelete: true,
    minSelect: 1,
    maxSelect: 1
  }));

  reactions.fields.add(new SelectField({
    name: 'emoji',
    required: true,
    maxSelect: 1,
    values: ['❤️', '👍', '🔥', '😂', '🤔', '👀']
  }));

  reactions.indexes = [
    'CREATE UNIQUE INDEX idx_reactions_unique ON discussion_reactions (user, thread, reply, emoji)',
    'CREATE INDEX idx_reactions_thread ON discussion_reactions (thread)',
    'CREATE INDEX idx_reactions_reply ON discussion_reactions (reply)'
  ];

  reactions.listRule = '';
  reactions.viewRule = '';
  reactions.createRule = '@request.auth.id != ""';
  reactions.updateRule = '@request.auth.id = user.id';
  reactions.deleteRule = '@request.auth.id = user.id';

  app.save(reactions);

}, (app) => {
  // Remove tags field from discussion_threads
  const threads = app.findCollectionByNameOrId('discussion_threads');
  const tagsField = threads.fields.getByName('tags');
  if (tagsField) {
    threads.fields.removeById(tagsField.id);
    app.save(threads);
  }

  // Delete discussion_reactions collection
  const reactions = app.findCollectionByNameOrId('discussion_reactions');
  if (reactions) {
    app.delete(reactions);
  }

  // Delete discussion_replies collection
  const replies = app.findCollectionByNameOrId('discussion_replies');
  if (replies) {
    app.delete(replies);
  }
});
