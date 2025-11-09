/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  // Update users collection rules
  const users = app.findCollectionByNameOrId('users');
  users.listRule = '@request.auth.id != \'\'';
  users.viewRule = '';
  users.createRule = '';
  users.updateRule = 'id = @request.auth.id';
  users.deleteRule = '';
  app.save(users);

  // Update listings collection rules
  const listings = app.findCollectionByNameOrId('listings');
  listings.listRule = '';
  listings.viewRule = '';
  listings.createRule = '@request.auth.id = owner';
  listings.updateRule = '@request.auth.id = owner';
  listings.deleteRule = '@request.auth.id = owner';
  app.save(listings);

  // Update items collection rules
  const items = app.findCollectionByNameOrId('items');
  items.listRule = '';
  items.viewRule = '';
  items.createRule = '@request.auth.id != \'\'';
  items.updateRule = '@request.auth.id != \'\'';
  items.deleteRule = '@request.auth.id != \'\'';
  app.save(items);

  // Update offer_templates collection rules
  const offerTemplates = app.findCollectionByNameOrId('offer_templates');
  offerTemplates.listRule = '';
  offerTemplates.viewRule = '';
  offerTemplates.createRule = '@request.auth.id = owner';
  offerTemplates.updateRule = '@request.auth.id = owner';
  offerTemplates.deleteRule = '@request.auth.id = owner';
  app.save(offerTemplates);

  // Update discussion_threads collection rules
  const discussionThreads = app.findCollectionByNameOrId('discussion_threads');
  discussionThreads.listRule = '';
  discussionThreads.viewRule = '';
  discussionThreads.createRule = '@request.auth.id != \'\'';
  discussionThreads.updateRule = '@request.auth.id = author';
  discussionThreads.deleteRule = '@request.auth.id = author';
  app.save(discussionThreads);

  // Update vouches collection rules
  const vouches = app.findCollectionByNameOrId('vouches');
  vouches.listRule = '';
  vouches.viewRule = '';
  vouches.createRule = '@request.auth.id = voucher';
  vouches.updateRule = '@request.auth.id = voucher';
  vouches.deleteRule = '@request.auth.id = voucher';
  app.save(vouches);

  // Update watchlist collection rules
  const watchlist = app.findCollectionByNameOrId('watchlist');
  watchlist.listRule = 'user = @request.auth.id';
  watchlist.viewRule = 'user = @request.auth.id';
  watchlist.createRule = 'user = @request.auth.id';
  watchlist.updateRule = 'user = @request.auth.id';
  watchlist.deleteRule = 'user = @request.auth.id';
  app.save(watchlist);

  // Update notifications collection rules
  const notifications = app.findCollectionByNameOrId('notifications');
  notifications.listRule = 'user = @request.auth.id';
  notifications.viewRule = 'user = @request.auth.id';
  notifications.createRule = null;
  notifications.updateRule = 'user = @request.auth.id';
  notifications.deleteRule = 'user = @request.auth.id';
  app.save(notifications);

  // Update messages collection rules
  const messages = app.findCollectionByNameOrId('messages');
  messages.listRule = '';
  messages.viewRule = '';
  messages.createRule = '@request.auth.id != \'\'';
  messages.updateRule = 'sender = @request.auth.id';
  messages.deleteRule = 'sender = @request.auth.id';
  app.save(messages);

  // Update trades collection rules
  const trades = app.findCollectionByNameOrId('trades');
  trades.listRule = '';
  trades.viewRule = '';
  trades.createRule = '@request.auth.id != \'\'';
  trades.updateRule = 'buyer = @request.auth.id || seller = @request.auth.id';
  trades.deleteRule = 'buyer = @request.auth.id || seller = @request.auth.id';
  app.save(trades);

  // Update cascades collection rules
  const cascades = app.findCollectionByNameOrId('cascades');
  cascades.listRule = '';
  cascades.viewRule = '';
  cascades.createRule = '@request.auth.id != \'\'';
  cascades.updateRule = 'current_holder = @request.auth.id || winner = @request.auth.id';
  cascades.deleteRule = 'current_holder = @request.auth.id && status = \'accepting_entries\'';
  app.save(cascades);

  // Update cascade_entries collection rules
  const cascadeEntries = app.findCollectionByNameOrId('cascade_entries');
  cascadeEntries.listRule = '';
  cascadeEntries.viewRule = '';
  cascadeEntries.createRule = '@request.auth.id = user';
  cascadeEntries.updateRule = '@request.auth.id = user';
  cascadeEntries.deleteRule = '@request.auth.id = user';
  app.save(cascadeEntries);

  // Update cascade_history collection rules
  const cascadeHistory = app.findCollectionByNameOrId('cascade_history');
  cascadeHistory.listRule = '';
  cascadeHistory.viewRule = '';
  cascadeHistory.createRule = null;
  cascadeHistory.updateRule = null;
  cascadeHistory.deleteRule = null;
  app.save(cascadeHistory);
}, (app) => {
  // Rollback: remove all rules
  const collections = [
    'users', 'listings', 'items', 'offer_templates', 'discussion_threads',
    'vouches', 'watchlist', 'notifications', 'messages', 'trades',
    'cascades', 'cascade_entries', 'cascade_history'
  ];

  collections.forEach(name => {
    const collection = app.findCollectionByNameOrId(name);
    collection.listRule = null;
    collection.viewRule = null;
    collection.createRule = null;
    collection.updateRule = null;
    collection.deleteRule = null;
    app.save(collection);
  });
});
