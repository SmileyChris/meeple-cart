/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const usersId = app.findCollectionByNameOrId('users').id;
  const itemsId = app.findCollectionByNameOrId('items').id;

  // Create cascades collection (without self-references initially)
  const cascades = new Collection({
    name: 'cascades',
    type: 'base'
  });

  cascades.fields.add(new TextField({
    name: 'name',
    required: false,
    min: 0,
    max: 120
  }));

  cascades.fields.add(new TextField({
    name: 'description',
    required: false,
    min: 0,
    max: 2000
  }));

  cascades.fields.add(new SelectField({
    name: 'status',
    required: true,
    maxSelect: 1,
    values: [
      'accepting_entries',
      'selecting_winner',
      'in_transit',
      'awaiting_pass',
      'completed',
      'broken'
    ]
  }));

  cascades.fields.add(new RelationField({
    name: 'current_game',
    required: true,
    collectionId: itemsId,
    cascadeDelete: false,
    minSelect: 1,
    maxSelect: 1
  }));

  cascades.fields.add(new RelationField({
    name: 'current_holder',
    required: true,
    collectionId: usersId,
    cascadeDelete: false,
    minSelect: 1,
    maxSelect: 1
  }));

  cascades.fields.add(new DateField({
    name: 'entry_deadline',
    required: true,
    min: null,
    max: null
  }));

  cascades.fields.add(new SelectField({
    name: 'region',
    required: false,
    maxSelect: 1,
    values: ['nz', 'au', 'worldwide', 'north_island', 'south_island']
  }));

  cascades.fields.add(new SelectField({
    name: 'shipping_requirement',
    required: true,
    maxSelect: 1,
    values: ['pickup_only', 'shipping_available', 'shipping_only']
  }));

  cascades.fields.add(new TextField({
    name: 'special_rules',
    required: false,
    min: 0,
    max: 1000
  }));

  cascades.fields.add(new RelationField({
    name: 'winner',
    required: false,
    collectionId: usersId,
    cascadeDelete: false,
    minSelect: 0,
    maxSelect: 1
  }));

  cascades.fields.add(new DateField({
    name: 'shipped_at',
    required: false,
    min: null,
    max: null
  }));

  cascades.fields.add(new TextField({
    name: 'shipping_tracking',
    required: false,
    min: 0,
    max: 200
  }));

  cascades.fields.add(new DateField({
    name: 'received_at',
    required: false,
    min: null,
    max: null
  }));

  cascades.fields.add(new SelectField({
    name: 'received_confirmed_by',
    required: false,
    maxSelect: 1,
    values: ['sender', 'receiver', 'auto']
  }));

  cascades.fields.add(new DateField({
    name: 'pass_deadline',
    required: false,
    min: null,
    max: null
  }));

  cascades.fields.add(new NumberField({
    name: 'generation',
    required: true,
    min: 0,
    max: null,
    noDecimal: false
  }));

  cascades.fields.add(new NumberField({
    name: 'entry_count',
    required: true,
    min: 0,
    max: null,
    noDecimal: false
  }));

  cascades.fields.add(new NumberField({
    name: 'view_count',
    required: true,
    min: 0,
    max: null,
    noDecimal: false
  }));

  cascades.indexes = [
    'CREATE INDEX idx_cascades_status ON cascades (status)',
    'CREATE INDEX idx_cascades_holder ON cascades (current_holder)',
    'CREATE INDEX idx_cascades_deadline ON cascades (entry_deadline)',
    'CREATE INDEX idx_cascades_region ON cascades (region)',
    'CREATE INDEX idx_cascades_winner ON cascades (winner)'
  ];

  app.save(cascades);

  // Create cascade_entries collection
  const cascadeEntries = new Collection({
    name: 'cascade_entries',
    type: 'base'
  });

  cascadeEntries.fields.add(new RelationField({
    name: 'cascade',
    required: true,
    collectionId: cascades.id,
    cascadeDelete: true,
    minSelect: 1,
    maxSelect: 1
  }));

  cascadeEntries.fields.add(new RelationField({
    name: 'user',
    required: true,
    collectionId: usersId,
    cascadeDelete: true,
    minSelect: 1,
    maxSelect: 1
  }));

  cascadeEntries.fields.add(new TextField({
    name: 'message',
    required: false,
    min: 0,
    max: 500
  }));

  cascadeEntries.fields.add(new BoolField({
    name: 'withdrew',
    required: true
  }));

  cascadeEntries.indexes = [
    'CREATE INDEX idx_entries_cascade ON cascade_entries (cascade)',
    'CREATE INDEX idx_entries_user ON cascade_entries (user)',
    'CREATE UNIQUE INDEX idx_entries_cascade_user ON cascade_entries (cascade, user)'
  ];

  app.save(cascadeEntries);

  // Create cascade_history collection
  const cascadeHistory = new Collection({
    name: 'cascade_history',
    type: 'base'
  });

  cascadeHistory.fields.add(new RelationField({
    name: 'cascade',
    required: true,
    collectionId: cascades.id,
    cascadeDelete: true,
    minSelect: 1,
    maxSelect: 1
  }));

  cascadeHistory.fields.add(new NumberField({
    name: 'generation',
    required: true,
    min: 0,
    max: null,
    noDecimal: false
  }));

  cascadeHistory.fields.add(new SelectField({
    name: 'event_type',
    required: true,
    maxSelect: 1,
    values: [
      'seeded',
      'winner_selected',
      'shipped',
      'received',
      'passed_on',
      'deadline_missed',
      'broken'
    ]
  }));

  cascadeHistory.fields.add(new DateField({
    name: 'event_date',
    required: true,
    min: null,
    max: null
  }));

  cascadeHistory.fields.add(new RelationField({
    name: 'actor',
    required: true,
    collectionId: usersId,
    cascadeDelete: false,
    minSelect: 1,
    maxSelect: 1
  }));

  cascadeHistory.fields.add(new RelationField({
    name: 'related_user',
    required: false,
    collectionId: usersId,
    cascadeDelete: false,
    minSelect: 0,
    maxSelect: 1
  }));

  cascadeHistory.fields.add(new RelationField({
    name: 'game',
    required: false,
    collectionId: itemsId,
    cascadeDelete: false,
    minSelect: 0,
    maxSelect: 1
  }));

  cascadeHistory.fields.add(new TextField({
    name: 'notes',
    required: false,
    min: 0,
    max: 1000
  }));

  cascadeHistory.fields.add(new TextField({
    name: 'shipped_to_location',
    required: false,
    min: 0,
    max: 120
  }));

  cascadeHistory.fields.add(new NumberField({
    name: 'shipping_days',
    required: false,
    min: 0,
    max: null,
    noDecimal: false
  }));

  cascadeHistory.indexes = [
    'CREATE INDEX idx_history_cascade ON cascade_history (cascade)',
    'CREATE INDEX idx_history_actor ON cascade_history (actor)',
    'CREATE INDEX idx_history_event_date ON cascade_history (event_date)'
  ];

  app.save(cascadeHistory);
}, (app) => {
  // Delete collections in reverse order
  const cascadeHistory = app.findCollectionByNameOrId('cascade_history');
  app.delete(cascadeHistory);

  const cascadeEntries = app.findCollectionByNameOrId('cascade_entries');
  app.delete(cascadeEntries);

  const cascades = app.findCollectionByNameOrId('cascades');
  app.delete(cascades);
});
