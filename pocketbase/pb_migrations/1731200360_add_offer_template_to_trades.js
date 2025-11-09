/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const trades = app.findCollectionByNameOrId('trades');
  const offerTemplatesId = app.findCollectionByNameOrId('offer_templates').id;

  // Add offer_template relation to trades
  trades.fields.add(new RelationField({
    name: 'offer_template',
    required: false,
    collectionId: offerTemplatesId,
    cascadeDelete: false,
    minSelect: 0,
    maxSelect: 1
  }));

  app.save(trades);
}, (app) => {
  // Rollback: remove offer_template field
  const trades = app.findCollectionByNameOrId('trades');
  trades.fields.removeByName('offer_template');
  app.save(trades);
});
