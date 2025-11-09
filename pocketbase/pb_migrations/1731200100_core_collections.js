/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const usersId = app.findCollectionByNameOrId('users').id;

  // Create listings collection (SIMPLIFIED - no listing_type, prefer_bundle, bundle_discount)
  const listings = new Collection({
    name: 'listings',
    type: 'base'
  });

  listings.fields.add(new RelationField({
    name: 'owner',
    required: true,
    collectionId: usersId,
    cascadeDelete: false,
    minSelect: 1,
    maxSelect: 1
  }));

  listings.fields.add(new TextField({
    name: 'title',
    required: true,
    min: 3,
    max: 120
  }));

  listings.fields.add(new SelectField({
    name: 'status',
    required: true,
    maxSelect: 1,
    values: ['active', 'pending', 'completed', 'cancelled']
  }));

  listings.fields.add(new TextField({
    name: 'summary',
    required: false,
    min: 0,
    max: 2000
  }));

  listings.fields.add(new TextField({
    name: 'location',
    required: false,
    min: 0,
    max: 120
  }));

  listings.fields.add(new BoolField({
    name: 'shipping_available',
    required: false
  }));

  listings.fields.add(new NumberField({
    name: 'views',
    required: true,
    min: 0,
    max: null
  }));

  listings.fields.add(new DateField({
    name: 'bump_date',
    required: false,
    min: null,
    max: null
  }));

  listings.fields.add(new FileField({
    name: 'photos',
    required: false,
    maxSelect: 6,
    maxSize: 5242880,
    mimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
    thumbs: ['100x100', '800x600']
  }));

  listings.fields.add(new JSONField({
    name: 'photo_region_map',
    required: false
  }));

  listings.fields.add(new JSONField({
    name: 'status_history',
    required: false
  }));

  listings.indexes = [
    'CREATE INDEX idx_listings_owner ON listings (owner)',
    'CREATE INDEX idx_listings_status ON listings (status)'
  ];

  app.save(listings);

  // Create items collection (renamed from games, SIMPLIFIED - no price, trade_value, price_history)
  const items = new Collection({
    name: 'items',
    type: 'base'
  });

  items.fields.add(new RelationField({
    name: 'listing',
    required: true,
    collectionId: listings.id,
    cascadeDelete: true,
    minSelect: 1,
    maxSelect: 1
  }));

  items.fields.add(new NumberField({
    name: 'bgg_id',
    required: false,
    min: 0,
    max: null
  }));

  items.fields.add(new TextField({
    name: 'title',
    required: true,
    min: 1,
    max: 200
  }));

  items.fields.add(new NumberField({
    name: 'year',
    required: false,
    min: 1900,
    max: 2100
  }));

  items.fields.add(new SelectField({
    name: 'condition',
    required: true,
    maxSelect: 1,
    values: ['mint', 'excellent', 'good', 'fair', 'poor']
  }));

  items.fields.add(new TextField({
    name: 'notes',
    required: false,
    min: 0,
    max: 2000
  }));

  items.fields.add(new SelectField({
    name: 'status',
    required: true,
    maxSelect: 1,
    values: ['available', 'pending', 'sold', 'bundled']
  }));

  items.fields.add(new JSONField({
    name: 'photo_regions',
    required: false
  }));

  items.indexes = [
    'CREATE INDEX idx_items_listing ON items (listing)',
    'CREATE INDEX idx_items_bgg_id ON items (bgg_id)'
  ];

  app.save(items);
}, (app) => {
  // Delete collections in reverse order
  const items = app.findCollectionByNameOrId('items');
  app.delete(items);

  const listings = app.findCollectionByNameOrId('listings');
  app.delete(listings);
});
