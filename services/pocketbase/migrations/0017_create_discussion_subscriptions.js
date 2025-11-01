/// <reference path="../pb_data/types.d.ts" />

/**
 * Migration: Create discussion subscriptions
 * - Users subscribe to discussions to get notifications
 * - Auto-subscribe when: replying, or owning a listing where discussion starts
 */
migrate(
  (db) => {
    const dao = new Dao(db);

    // Create discussion_subscriptions collection
    const subscriptionsCollection = new Collection({
      id: 'discussion_subs',
      name: 'discussion_subscriptions',
      type: 'base',
      system: false,
      schema: [
        new SchemaField({
          system: false,
          id: 'sub_user',
          name: 'user',
          type: 'relation',
          required: true,
          presentable: false,
          unique: false,
          options: {
            collectionId: 'fhggsowykv3hz86', // users collection
            cascadeDelete: true,
            minSelect: 1,
            maxSelect: 1,
            displayFields: [],
          },
        }),
        new SchemaField({
          system: false,
          id: 'sub_thread',
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
      ],
      indexes: [
        'CREATE INDEX idx_subs_user ON discussion_subscriptions (user)',
        'CREATE INDEX idx_subs_thread ON discussion_subscriptions (thread)',
        'CREATE UNIQUE INDEX idx_subs_user_thread ON discussion_subscriptions (user, thread)',
      ],
      listRule: 'user = @request.auth.id',
      viewRule: 'user = @request.auth.id',
      createRule: '@request.auth.id = user',
      updateRule: null, // No updates needed
      deleteRule: 'user = @request.auth.id',
    });

    dao.saveCollection(subscriptionsCollection);
  },
  (db) => {
    // Rollback: Delete collection
    const dao = new Dao(db);
    dao.deleteCollection(dao.findCollectionByNameOrId('discussion_subscriptions'));
  }
);
