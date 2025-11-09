/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const usersId = app.findCollectionByNameOrId('users').id;
  const listingsId = app.findCollectionByNameOrId('listings').id;

  // Create vouches collection
  const vouches = new Collection({
    name: 'vouches',
    type: 'base'
  });

  vouches.fields.add(new RelationField({
    name: 'voucher',
    required: true,
    collectionId: usersId,
    cascadeDelete: false,
    minSelect: 1,
    maxSelect: 1
  }));

  vouches.fields.add(new RelationField({
    name: 'vouchee',
    required: true,
    collectionId: usersId,
    cascadeDelete: false,
    minSelect: 1,
    maxSelect: 1
  }));

  vouches.fields.add(new TextField({
    name: 'message',
    required: false,
    min: 0,
    max: 1000
  }));

  vouches.fields.add(new DateField({
    name: 'created',
    required: true,
    min: null,
    max: null
  }));

  vouches.indexes = [
    'CREATE INDEX idx_vouches_vouchee ON vouches (vouchee)'
  ];

  app.save(vouches);

  // Create watchlist collection
  const watchlist = new Collection({
    name: 'watchlist',
    type: 'base'
  });

  watchlist.fields.add(new RelationField({
    name: 'user',
    required: true,
    collectionId: usersId,
    cascadeDelete: true,
    minSelect: 1,
    maxSelect: 1
  }));

  watchlist.fields.add(new RelationField({
    name: 'listing',
    required: false,
    collectionId: listingsId,
    cascadeDelete: true,
    minSelect: 0,
    maxSelect: 1
  }));

  watchlist.fields.add(new NumberField({
    name: 'bgg_id',
    required: false,
    min: 0,
    max: null
  }));

  watchlist.fields.add(new NumberField({
    name: 'max_price',
    required: false,
    min: 0,
    max: null
  }));

  watchlist.fields.add(new NumberField({
    name: 'max_distance',
    required: false,
    min: 0,
    max: null
  }));

  watchlist.indexes = [
    'CREATE INDEX idx_watchlist_user ON watchlist (user)',
    'CREATE UNIQUE INDEX idx_watchlist_unique ON watchlist (user, bgg_id)'
  ];

  app.save(watchlist);

  // Create notifications collection
  const notifications = new Collection({
    name: 'notifications',
    type: 'base'
  });

  notifications.fields.add(new RelationField({
    name: 'user',
    required: true,
    collectionId: usersId,
    cascadeDelete: true,
    minSelect: 1,
    maxSelect: 1
  }));

  notifications.fields.add(new SelectField({
    name: 'type',
    required: true,
    maxSelect: 1,
    values: [
      'new_listing',
      'new_message',
      'price_drop',
      'listing_update',
      'cascade_won',
      'cascade_shipped',
      'cascade_received',
      'cascade_reminder',
      'cascade_deadline',
      'cascade_broken'
    ]
  }));

  notifications.fields.add(new TextField({
    name: 'title',
    required: true,
    min: 1,
    max: 200
  }));

  notifications.fields.add(new TextField({
    name: 'message',
    required: false,
    min: 0,
    max: 500
  }));

  notifications.fields.add(new TextField({
    name: 'link',
    required: false,
    min: 0,
    max: 255
  }));

  notifications.fields.add(new RelationField({
    name: 'listing',
    required: false,
    collectionId: listingsId,
    cascadeDelete: true,
    minSelect: 0,
    maxSelect: 1
  }));

  notifications.fields.add(new BoolField({
    name: 'read',
    required: true
  }));

  notifications.indexes = [
    'CREATE INDEX idx_notifications_user ON notifications (user)',
    'CREATE INDEX idx_notifications_user_read ON notifications (user, read)'
  ];

  app.save(notifications);

  // Create messages collection
  const messages = new Collection({
    name: 'messages',
    type: 'base'
  });

  messages.fields.add(new RelationField({
    name: 'listing',
    required: true,
    collectionId: listingsId,
    cascadeDelete: true,
    minSelect: 1,
    maxSelect: 1
  }));

  messages.fields.add(new TextField({
    name: 'thread_id',
    required: true,
    min: 1,
    max: 64
  }));

  messages.fields.add(new RelationField({
    name: 'sender',
    required: true,
    collectionId: usersId,
    cascadeDelete: false,
    minSelect: 1,
    maxSelect: 1
  }));

  messages.fields.add(new RelationField({
    name: 'recipient',
    required: false,
    collectionId: usersId,
    cascadeDelete: false,
    minSelect: 0,
    maxSelect: 1
  }));

  messages.fields.add(new TextField({
    name: 'content',
    required: true,
    min: 1,
    max: 4000
  }));

  messages.fields.add(new BoolField({
    name: 'is_public',
    required: true
  }));

  messages.fields.add(new BoolField({
    name: 'read',
    required: false
  }));

  messages.indexes = [
    'CREATE INDEX idx_messages_listing_thread ON messages (listing, thread_id)',
    'CREATE INDEX idx_messages_sender ON messages (sender)'
  ];

  app.save(messages);
}, (app) => {
  // Delete collections in reverse order
  const messages = app.findCollectionByNameOrId('messages');
  app.delete(messages);

  const notifications = app.findCollectionByNameOrId('notifications');
  app.delete(notifications);

  const watchlist = app.findCollectionByNameOrId('watchlist');
  app.delete(watchlist);

  const vouches = app.findCollectionByNameOrId('vouches');
  app.delete(vouches);
});
