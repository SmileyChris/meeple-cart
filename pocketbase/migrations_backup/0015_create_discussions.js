/// <reference path="../pb_data/types.d.ts" />

/**
 * Migration: Create discussions system
 * - discussion_threads: Top-level discussion threads
 * - discussion_replies: Replies to threads
 */
migrate(
  (db) => {
    const dao = new Dao(db);

    // Create discussion_threads collection
    const threadsCollection = new Collection({
      id: 'discussion_threads',
      name: 'discussion_threads',
      type: 'base',
      system: false,
      schema: [
        new SchemaField({
          system: false,
          id: 'thread_title',
          name: 'title',
          type: 'text',
          required: true,
          presentable: false,
          unique: false,
          options: {
            min: 3,
            max: 200,
            pattern: '',
          },
        }),
        new SchemaField({
          system: false,
          id: 'thread_content',
          name: 'content',
          type: 'text',
          required: true,
          presentable: false,
          unique: false,
          options: {
            min: 1,
            max: 10000,
            pattern: '',
          },
        }),
        new SchemaField({
          system: false,
          id: 'thread_author',
          name: 'author',
          type: 'relation',
          required: true,
          presentable: false,
          unique: false,
          options: {
            collectionId: 'fhggsowykv3hz86', // users collection
            cascadeDelete: false,
            minSelect: 1,
            maxSelect: 1,
            displayFields: [],
          },
        }),
        new SchemaField({
          system: false,
          id: 'thread_pinned',
          name: 'pinned',
          type: 'bool',
          required: false,
          presentable: false,
          unique: false,
          options: {},
        }),
        new SchemaField({
          system: false,
          id: 'thread_locked',
          name: 'locked',
          type: 'bool',
          required: false,
          presentable: false,
          unique: false,
          options: {},
        }),
        new SchemaField({
          system: false,
          id: 'thread_views',
          name: 'view_count',
          type: 'number',
          required: true,
          presentable: false,
          unique: false,
          options: {
            min: 0,
            max: null,
          },
        }),
        new SchemaField({
          system: false,
          id: 'thread_reply_count',
          name: 'reply_count',
          type: 'number',
          required: true,
          presentable: false,
          unique: false,
          options: {
            min: 0,
            max: null,
          },
        }),
        new SchemaField({
          system: false,
          id: 'thread_last_reply',
          name: 'last_reply_at',
          type: 'date',
          required: false,
          presentable: false,
          unique: false,
          options: {
            min: null,
            max: null,
          },
        }),
      ],
      indexes: [
        'CREATE INDEX idx_threads_author ON discussion_threads (author)',
        'CREATE INDEX idx_threads_created ON discussion_threads (created)',
        'CREATE INDEX idx_threads_last_reply ON discussion_threads (last_reply_at)',
      ],
      listRule: '',
      viewRule: '',
      createRule: '@request.auth.id != ""',
      updateRule: 'author = @request.auth.id',
      deleteRule: 'author = @request.auth.id',
    });

    dao.saveCollection(threadsCollection);

    // Create discussion_replies collection
    const repliesCollection = new Collection({
      id: 'discussion_replies',
      name: 'discussion_replies',
      type: 'base',
      system: false,
      schema: [
        new SchemaField({
          system: false,
          id: 'reply_thread',
          name: 'thread',
          type: 'relation',
          required: true,
          presentable: false,
          unique: false,
          options: {
            collectionId: 'discussion_threads',
            cascadeDelete: true,
            minSelect: 1,
            maxSelect: 1,
            displayFields: [],
          },
        }),
        new SchemaField({
          system: false,
          id: 'reply_content',
          name: 'content',
          type: 'text',
          required: true,
          presentable: false,
          unique: false,
          options: {
            min: 1,
            max: 10000,
            pattern: '',
          },
        }),
        new SchemaField({
          system: false,
          id: 'reply_author',
          name: 'author',
          type: 'relation',
          required: true,
          presentable: false,
          unique: false,
          options: {
            collectionId: 'fhggsowykv3hz86', // users collection
            cascadeDelete: false,
            minSelect: 1,
            maxSelect: 1,
            displayFields: [],
          },
        }),
      ],
      indexes: [
        'CREATE INDEX idx_replies_thread ON discussion_replies (thread)',
        'CREATE INDEX idx_replies_author ON discussion_replies (author)',
        'CREATE INDEX idx_replies_created ON discussion_replies (created)',
      ],
      listRule: '',
      viewRule: '',
      createRule: '@request.auth.id != ""',
      updateRule: 'author = @request.auth.id',
      deleteRule: 'author = @request.auth.id',
    });

    dao.saveCollection(repliesCollection);
  },
  (db) => {
    // Rollback: Delete collections
    const dao = new Dao(db);
    dao.deleteCollection(dao.findCollectionByNameOrId('discussion_replies'));
    dao.deleteCollection(dao.findCollectionByNameOrId('discussion_threads'));
  }
);
