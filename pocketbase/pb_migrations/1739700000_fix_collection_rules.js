migrate((app) => {
  // Fix users collection rules
  // Prevent public deletion of users
  const users = app.findCollectionByNameOrId('users');
  users.deleteRule = 'id = @request.auth.id';
  app.save(users);

  // Fix items collection rules
  // Ensure items can only be managed by the owner of the associated listing
  const items = app.findCollectionByNameOrId('items');
  items.createRule = 'listing.owner = @request.auth.id';
  items.updateRule = 'listing.owner = @request.auth.id';
  items.deleteRule = 'listing.owner = @request.auth.id';
  app.save(items);

  // Fix messages collection rules
  // Restrict visibility to participants or public messages
  const messages = app.findCollectionByNameOrId('messages');
  messages.listRule = 'sender = @request.auth.id || recipient = @request.auth.id || is_public = true';
  messages.viewRule = 'sender = @request.auth.id || recipient = @request.auth.id || is_public = true';
  app.save(messages);

  // Fix trades collection rules
  // Restrict visibility to participants
  const trades = app.findCollectionByNameOrId('trades');
  trades.listRule = 'buyer = @request.auth.id || seller = @request.auth.id';
  trades.viewRule = 'buyer = @request.auth.id || seller = @request.auth.id';
  app.save(trades);

}, (app) => {
  // Revert to previous (insecure but original) rules

  const users = app.findCollectionByNameOrId('users');
  users.deleteRule = '';
  app.save(users);

  const items = app.findCollectionByNameOrId('items');
  items.createRule = '@request.auth.id != \'\'';
  items.updateRule = '@request.auth.id != \'\'';
  items.deleteRule = '@request.auth.id != \'\'';
  app.save(items);

  const messages = app.findCollectionByNameOrId('messages');
  messages.listRule = '';
  messages.viewRule = '';
  app.save(messages);

  const trades = app.findCollectionByNameOrId('trades');
  trades.listRule = '';
  trades.viewRule = '';
  app.save(trades);
})
