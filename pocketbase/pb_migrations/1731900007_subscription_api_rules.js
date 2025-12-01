/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId('discussion_subscriptions');

  // Users can view their own subscriptions
  collection.listRule = '@request.auth.id != "" && user = @request.auth.id';
  collection.viewRule = '@request.auth.id != "" && user = @request.auth.id';

  // Users can create subscriptions for themselves
  collection.createRule = '@request.auth.id != "" && @request.body.user = @request.auth.id';

  // Users can delete their own subscriptions
  collection.deleteRule = '@request.auth.id != "" && user = @request.auth.id';

  // No one can update subscriptions (just create/delete)
  collection.updateRule = null;

  app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId('discussion_subscriptions');

  collection.listRule = null;
  collection.viewRule = null;
  collection.createRule = null;
  collection.deleteRule = null;
  collection.updateRule = null;

  app.save(collection);
});
