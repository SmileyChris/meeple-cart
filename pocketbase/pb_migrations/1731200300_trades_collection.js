/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const usersId = app.findCollectionByNameOrId('users').id;
  const listingsId = app.findCollectionByNameOrId('listings').id;
  const itemsId = app.findCollectionByNameOrId('items').id;

  // Create trades collection
  const trades = new Collection({
    name: 'trades',
    type: 'base'
  });

  trades.fields.add(new RelationField({
    name: 'listing',
    required: true,
    collectionId: listingsId,
    cascadeDelete: true,
    minSelect: 1,
    maxSelect: 1
  }));

  trades.fields.add(new RelationField({
    name: 'buyer',
    required: true,
    collectionId: usersId,
    cascadeDelete: false,
    minSelect: 1,
    maxSelect: 1
  }));

  trades.fields.add(new RelationField({
    name: 'seller',
    required: true,
    collectionId: usersId,
    cascadeDelete: false,
    minSelect: 1,
    maxSelect: 1
  }));

  trades.fields.add(new SelectField({
    name: 'status',
    required: true,
    maxSelect: 1,
    values: ['initiated', 'confirmed', 'completed', 'disputed', 'cancelled']
  }));

  trades.fields.add(new SelectField({
    name: 'offer_status',
    required: true,
    maxSelect: 1,
    values: ['pending', 'accepted', 'declined', 'withdrawn']
  }));

  trades.fields.add(new NumberField({
    name: 'cash_offer_amount',
    required: false,
    min: 0,
    max: null,
    noDecimal: true
  }));

  trades.fields.add(new RelationField({
    name: 'requested_items',
    required: false,
    collectionId: itemsId,
    cascadeDelete: false,
    minSelect: 0,
    maxSelect: 999
  }));

  trades.fields.add(new SelectField({
    name: 'shipping_method',
    required: false,
    maxSelect: 1,
    values: ['in_person', 'shipped', 'either']
  }));

  trades.fields.add(new TextField({
    name: 'offer_message',
    required: false,
    min: 0,
    max: 1000
  }));

  trades.fields.add(new TextField({
    name: 'declined_reason',
    required: false,
    min: 0,
    max: 500
  }));

  trades.fields.add(new NumberField({
    name: 'rating',
    required: false,
    min: 1,
    max: 5
  }));

  trades.fields.add(new TextField({
    name: 'review',
    required: false,
    min: 0,
    max: 2000
  }));

  trades.fields.add(new DateField({
    name: 'completed_date',
    required: false,
    min: null,
    max: null
  }));

  trades.indexes = [
    'CREATE INDEX idx_trades_listing ON trades (listing)',
    'CREATE INDEX idx_trades_participants ON trades (buyer, seller)',
    'CREATE INDEX idx_trades_listing_offer_status ON trades (listing, offer_status)'
  ];

  app.save(trades);
}, (app) => {
  // Delete trades collection
  const trades = app.findCollectionByNameOrId('trades');
  app.delete(trades);
});
