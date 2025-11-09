/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const usersId = app.findCollectionByNameOrId('users').id;
  const listingsId = app.findCollectionByNameOrId('listings').id;
  const itemsId = app.findCollectionByNameOrId('items').id;

  // Create offer_templates collection
  const offerTemplates = new Collection({
    name: 'offer_templates',
    type: 'base'
  });

  offerTemplates.fields.add(new RelationField({
    name: 'listing',
    required: true,
    collectionId: listingsId,
    cascadeDelete: true,
    minSelect: 1,
    maxSelect: 1
  }));

  offerTemplates.fields.add(new RelationField({
    name: 'owner',
    required: true,
    collectionId: usersId,
    cascadeDelete: false,
    minSelect: 1,
    maxSelect: 1
  }));

  offerTemplates.fields.add(new RelationField({
    name: 'items',
    required: true,
    collectionId: itemsId,
    cascadeDelete: false,
    minSelect: 1,
    maxSelect: 999
  }));

  offerTemplates.fields.add(new SelectField({
    name: 'template_type',
    required: true,
    maxSelect: 1,
    values: ['cash_only', 'trade_only', 'cash_or_trade']
  }));

  offerTemplates.fields.add(new NumberField({
    name: 'cash_amount',
    required: false,
    min: 0,
    max: null,
    noDecimal: true
  }));

  offerTemplates.fields.add(new JSONField({
    name: 'trade_for_items',
    required: false
  }));

  offerTemplates.fields.add(new BoolField({
    name: 'open_to_lower_offers',
    required: true
  }));

  offerTemplates.fields.add(new BoolField({
    name: 'open_to_shipping_negotiation',
    required: true
  }));

  offerTemplates.fields.add(new BoolField({
    name: 'open_to_trade_offers',
    required: true
  }));

  offerTemplates.fields.add(new SelectField({
    name: 'status',
    required: true,
    maxSelect: 1,
    values: ['active', 'accepted', 'invalidated', 'withdrawn']
  }));

  offerTemplates.fields.add(new TextField({
    name: 'display_name',
    required: false,
    min: 0,
    max: 120
  }));

  offerTemplates.fields.add(new TextField({
    name: 'notes',
    required: false,
    min: 0,
    max: 1000
  }));

  offerTemplates.indexes = [
    'CREATE INDEX idx_offer_templates_listing ON offer_templates (listing)',
    'CREATE INDEX idx_offer_templates_owner ON offer_templates (owner)',
    'CREATE INDEX idx_offer_templates_status ON offer_templates (status)'
  ];

  app.save(offerTemplates);

  // Create discussion_threads collection
  const discussionThreads = new Collection({
    name: 'discussion_threads',
    type: 'base'
  });

  discussionThreads.fields.add(new TextField({
    name: 'title',
    required: true,
    min: 3,
    max: 200
  }));

  discussionThreads.fields.add(new TextField({
    name: 'content',
    required: true,
    min: 1,
    max: 10000
  }));

  discussionThreads.fields.add(new RelationField({
    name: 'author',
    required: true,
    collectionId: usersId,
    cascadeDelete: false,
    minSelect: 1,
    maxSelect: 1
  }));

  discussionThreads.fields.add(new SelectField({
    name: 'thread_type',
    required: true,
    maxSelect: 1,
    values: ['discussion', 'wanted']
  }));

  discussionThreads.fields.add(new JSONField({
    name: 'wanted_items',
    required: false
  }));

  discussionThreads.fields.add(new SelectField({
    name: 'wanted_offer_type',
    required: false,
    maxSelect: 1,
    values: ['buying', 'trading', 'either']
  }));

  discussionThreads.fields.add(new NumberField({
    name: 'view_count',
    required: true,
    min: 0,
    max: null
  }));

  discussionThreads.fields.add(new NumberField({
    name: 'reply_count',
    required: true,
    min: 0,
    max: null
  }));

  discussionThreads.fields.add(new BoolField({
    name: 'is_pinned',
    required: true
  }));

  discussionThreads.fields.add(new BoolField({
    name: 'is_locked',
    required: true
  }));

  discussionThreads.indexes = [
    'CREATE INDEX idx_discussions_author ON discussion_threads (author)',
    'CREATE INDEX idx_discussions_type ON discussion_threads (thread_type)'
  ];

  app.save(discussionThreads);
}, (app) => {
  // Delete collections in reverse order
  const discussionThreads = app.findCollectionByNameOrId('discussion_threads');
  app.delete(discussionThreads);

  const offerTemplates = app.findCollectionByNameOrId('offer_templates');
  app.delete(offerTemplates);
});
