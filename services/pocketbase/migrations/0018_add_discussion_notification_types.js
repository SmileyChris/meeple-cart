/// <reference path="../pb_data/types.d.ts" />

/**
 * Migration: Add discussion notification types
 * - discussion_reply: Someone replied to a discussion you're subscribed to
 * - discussion_mention: Someone mentioned you in a discussion
 */
migrate(
  (db) => {
    const dao = new Dao(db);
    const notificationsCollection = dao.findCollectionByNameOrId('notifications_collection');

    // Find the type field by name
    const typeField = notificationsCollection.schema.fields().find((f) => f.name === 'type');

    if (typeField) {
      // Add new discussion notification types
      typeField.options.values = [
        ...typeField.options.values,
        'discussion_reply',
        'discussion_mention',
      ];

      dao.saveCollection(notificationsCollection);
    }
  },
  (db) => {
    // Rollback: Remove discussion notification types
    const dao = new Dao(db);
    const notificationsCollection = dao.findCollectionByNameOrId('notifications_collection');

    const typeField = notificationsCollection.schema.fields().find((f) => f.name === 'type');
    if (typeField) {
      typeField.options.values = typeField.options.values.filter(
        (v) => v !== 'discussion_reply' && v !== 'discussion_mention'
      );

      dao.saveCollection(notificationsCollection);
    }
  }
);
