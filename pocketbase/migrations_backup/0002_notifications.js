migrate(
  (db) => {
    const collection = new Collection({
      id: 'notifications_collection',
      name: 'notifications',
      type: 'base',
      system: false,
      schema: [
        {
          name: 'user',
          type: 'relation',
          required: true,
          options: {
            collectionId: 'fhggsowykv3hz86', // users collection
            cascadeDelete: true,
            minSelect: 1,
            maxSelect: 1,
          },
        },
        {
          name: 'type',
          type: 'select',
          required: true,
          options: {
            maxSelect: 1,
            values: ['new_listing', 'new_message', 'price_drop', 'listing_update'],
          },
        },
        {
          name: 'title',
          type: 'text',
          required: true,
          options: {
            min: 1,
            max: 200,
          },
        },
        {
          name: 'message',
          type: 'text',
          required: false,
          options: {
            min: 0,
            max: 500,
          },
        },
        {
          name: 'link',
          type: 'text',
          required: false,
          options: {
            min: 0,
            max: 255,
          },
        },
        {
          name: 'listing',
          type: 'relation',
          required: false,
          options: {
            collectionId: 'udc64p17e6s37kf', // listings collection
            cascadeDelete: true,
            minSelect: 0,
            maxSelect: 1,
          },
        },
        {
          name: 'read',
          type: 'bool',
          required: true,
          options: {},
        },
      ],
      indexes: [
        'CREATE INDEX idx_notifications_user ON notifications (user)',
        'CREATE INDEX idx_notifications_user_read ON notifications (user, read)',
      ],
      listRule: 'user = @request.auth.id',
      viewRule: 'user = @request.auth.id',
      createRule: null, // Only server can create
      updateRule: 'user = @request.auth.id', // Users can mark as read
      deleteRule: 'user = @request.auth.id',
    });

    return Dao(db).saveCollection(collection);
  },
  (db) => {
    const dao = new Dao(db);
    const collection = dao.findCollectionByNameOrId('notifications_collection');
    return dao.deleteCollection(collection);
  }
);
