migrate(
  (db) => {
    const dao = new Dao(db);

    // 1. Create cascades collection
    const cascadesCollection = new Collection({
      id: 'cascades_collection',
      name: 'cascades',
      type: 'base',
      system: false,
      schema: [
        {
          name: 'name',
          type: 'text',
          required: false,
          options: {
            min: 0,
            max: 120,
          },
        },
        {
          name: 'description',
          type: 'text',
          required: false,
          options: {
            min: 0,
            max: 2000,
          },
        },
        {
          name: 'status',
          type: 'select',
          required: true,
          options: {
            maxSelect: 1,
            values: [
              'accepting_entries',
              'selecting_winner',
              'in_transit',
              'awaiting_pass',
              'completed',
              'broken',
            ],
          },
        },
        {
          name: 'current_game',
          type: 'relation',
          required: true,
          options: {
            collectionId: 'u0l5t5dn4gwl0sb', // games collection
            cascadeDelete: false,
            minSelect: 1,
            maxSelect: 1,
          },
        },
        {
          name: 'current_holder',
          type: 'relation',
          required: true,
          options: {
            collectionId: 'fhggsowykv3hz86', // users collection
            cascadeDelete: false,
            minSelect: 1,
            maxSelect: 1,
          },
        },
        {
          name: 'entry_deadline',
          type: 'date',
          required: true,
          options: {},
        },
        {
          name: 'region',
          type: 'select',
          required: false,
          options: {
            maxSelect: 1,
            values: ['nz', 'au', 'worldwide', 'north_island', 'south_island'],
          },
        },
        {
          name: 'shipping_requirement',
          type: 'select',
          required: true,
          options: {
            maxSelect: 1,
            values: ['pickup_only', 'shipping_available', 'shipping_only'],
          },
        },
        {
          name: 'special_rules',
          type: 'text',
          required: false,
          options: {
            min: 0,
            max: 1000,
          },
        },
        {
          name: 'winner',
          type: 'relation',
          required: false,
          options: {
            collectionId: 'fhggsowykv3hz86', // users collection
            cascadeDelete: false,
            minSelect: 0,
            maxSelect: 1,
          },
        },
        {
          name: 'shipped_at',
          type: 'date',
          required: false,
          options: {},
        },
        {
          name: 'shipping_tracking',
          type: 'text',
          required: false,
          options: {
            min: 0,
            max: 200,
          },
        },
        {
          name: 'received_at',
          type: 'date',
          required: false,
          options: {},
        },
        {
          name: 'received_confirmed_by',
          type: 'select',
          required: false,
          options: {
            maxSelect: 1,
            values: ['sender', 'receiver', 'auto'],
          },
        },
        {
          name: 'pass_deadline',
          type: 'date',
          required: false,
          options: {},
        },
        {
          name: 'generation',
          type: 'number',
          required: true,
          options: {
            min: 0,
            max: null,
          },
        },
        {
          name: 'origin_cascade',
          type: 'relation',
          required: false,
          options: {
            collectionId: 'cascades_collection',
            cascadeDelete: false,
            minSelect: 0,
            maxSelect: 1,
          },
        },
        {
          name: 'previous_cascade',
          type: 'relation',
          required: false,
          options: {
            collectionId: 'cascades_collection',
            cascadeDelete: false,
            minSelect: 0,
            maxSelect: 1,
          },
        },
        {
          name: 'entry_count',
          type: 'number',
          required: true,
          options: {
            min: 0,
            max: null,
          },
        },
        {
          name: 'view_count',
          type: 'number',
          required: true,
          options: {
            min: 0,
            max: null,
          },
        },
      ],
      indexes: [
        'CREATE INDEX idx_cascades_status ON cascades (status)',
        'CREATE INDEX idx_cascades_holder ON cascades (current_holder)',
        'CREATE INDEX idx_cascades_deadline ON cascades (entry_deadline)',
        'CREATE INDEX idx_cascades_region ON cascades (region)',
        'CREATE INDEX idx_cascades_winner ON cascades (winner)',
      ],
      listRule: '', // Public listing
      viewRule: '', // Public view
      createRule: '@request.auth.id != ""', // Authenticated users can create
      updateRule:
        'current_holder = @request.auth.id || winner = @request.auth.id', // Holder or winner can update
      deleteRule: 'current_holder = @request.auth.id && status = "accepting_entries"', // Only delete if still accepting entries
    });

    dao.saveCollection(cascadesCollection);

    // 2. Create cascade_entries collection
    const entriesCollection = new Collection({
      id: 'cascade_entries_collection',
      name: 'cascade_entries',
      type: 'base',
      system: false,
      schema: [
        {
          name: 'cascade',
          type: 'relation',
          required: true,
          options: {
            collectionId: 'cascades_collection',
            cascadeDelete: true,
            minSelect: 1,
            maxSelect: 1,
          },
        },
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
          name: 'message',
          type: 'text',
          required: false,
          options: {
            min: 0,
            max: 500,
          },
        },
        {
          name: 'withdrew',
          type: 'bool',
          required: true,
          options: {},
        },
      ],
      indexes: [
        'CREATE INDEX idx_entries_cascade ON cascade_entries (cascade)',
        'CREATE INDEX idx_entries_user ON cascade_entries (user)',
        'CREATE UNIQUE INDEX idx_entries_cascade_user ON cascade_entries (cascade, user)',
      ],
      listRule: '', // Public listing
      viewRule: '', // Public view
      createRule: '@request.auth.id = user', // Users can enter
      updateRule: '@request.auth.id = user', // Users can withdraw their own entries
      deleteRule: '@request.auth.id = user', // Users can delete their own entries
    });

    dao.saveCollection(entriesCollection);

    // 3. Create cascade_history collection
    const historyCollection = new Collection({
      id: 'cascade_history_collection',
      name: 'cascade_history',
      type: 'base',
      system: false,
      schema: [
        {
          name: 'cascade',
          type: 'relation',
          required: true,
          options: {
            collectionId: 'cascades_collection',
            cascadeDelete: true,
            minSelect: 1,
            maxSelect: 1,
          },
        },
        {
          name: 'generation',
          type: 'number',
          required: true,
          options: {
            min: 0,
            max: null,
          },
        },
        {
          name: 'event_type',
          type: 'select',
          required: true,
          options: {
            maxSelect: 1,
            values: [
              'seeded',
              'winner_selected',
              'shipped',
              'received',
              'passed_on',
              'deadline_missed',
              'broken',
            ],
          },
        },
        {
          name: 'event_date',
          type: 'date',
          required: true,
          options: {},
        },
        {
          name: 'actor',
          type: 'relation',
          required: true,
          options: {
            collectionId: 'fhggsowykv3hz86', // users collection
            cascadeDelete: false,
            minSelect: 1,
            maxSelect: 1,
          },
        },
        {
          name: 'related_user',
          type: 'relation',
          required: false,
          options: {
            collectionId: 'fhggsowykv3hz86', // users collection
            cascadeDelete: false,
            minSelect: 0,
            maxSelect: 1,
          },
        },
        {
          name: 'game',
          type: 'relation',
          required: false,
          options: {
            collectionId: 'u0l5t5dn4gwl0sb', // games collection
            cascadeDelete: false,
            minSelect: 0,
            maxSelect: 1,
          },
        },
        {
          name: 'notes',
          type: 'text',
          required: false,
          options: {
            min: 0,
            max: 1000,
          },
        },
        {
          name: 'shipped_to_location',
          type: 'text',
          required: false,
          options: {
            min: 0,
            max: 120,
          },
        },
        {
          name: 'shipping_days',
          type: 'number',
          required: false,
          options: {
            min: 0,
            max: null,
          },
        },
      ],
      indexes: [
        'CREATE INDEX idx_history_cascade ON cascade_history (cascade)',
        'CREATE INDEX idx_history_actor ON cascade_history (actor)',
        'CREATE INDEX idx_history_event_date ON cascade_history (event_date)',
      ],
      listRule: '', // Public listing
      viewRule: '', // Public view
      createRule: null, // Only server can create history
      updateRule: null, // Immutable
      deleteRule: null, // Immutable
    });

    dao.saveCollection(historyCollection);

    // 4. Add cascade stats fields to users collection
    const usersCollection = dao.findCollectionByNameOrId('fhggsowykv3hz86');

    // Add cascades_seeded field
    usersCollection.schema.addField(
      new SchemaField({
        name: 'cascades_seeded',
        type: 'number',
        required: true,
        options: {
          min: 0,
          max: null,
        },
      })
    );

    // Add cascades_received field
    usersCollection.schema.addField(
      new SchemaField({
        name: 'cascades_received',
        type: 'number',
        required: true,
        options: {
          min: 0,
          max: null,
        },
      })
    );

    // Add cascades_passed field
    usersCollection.schema.addField(
      new SchemaField({
        name: 'cascades_passed',
        type: 'number',
        required: true,
        options: {
          min: 0,
          max: null,
        },
      })
    );

    // Add cascades_broken field
    usersCollection.schema.addField(
      new SchemaField({
        name: 'cascades_broken',
        type: 'number',
        required: true,
        options: {
          min: 0,
          max: null,
        },
      })
    );

    // Add cascade_reputation field
    usersCollection.schema.addField(
      new SchemaField({
        name: 'cascade_reputation',
        type: 'number',
        required: true,
        options: {
          min: 0,
          max: 100,
        },
      })
    );

    // Add cascade_restricted_until field
    usersCollection.schema.addField(
      new SchemaField({
        name: 'cascade_restricted_until',
        type: 'date',
        required: false,
        options: {},
      })
    );

    // Add can_enter_cascades field
    usersCollection.schema.addField(
      new SchemaField({
        name: 'can_enter_cascades',
        type: 'bool',
        required: true,
        options: {},
      })
    );

    dao.saveCollection(usersCollection);

    // 5. Update notifications collection to add cascade notification types
    const notificationsCollection = dao.findCollectionByNameOrId('notifications_collection');
    const typeField = notificationsCollection.schema.getFieldByName('type');

    // Add cascade notification types to existing values
    typeField.options.values = [
      ...typeField.options.values,
      'cascade_won',
      'cascade_shipped',
      'cascade_received',
      'cascade_reminder',
      'cascade_deadline',
      'cascade_broken',
    ];

    dao.saveCollection(notificationsCollection);

    return null;
  },
  (db) => {
    const dao = new Dao(db);

    // Rollback: Delete cascade collections
    const cascadesCollection = dao.findCollectionByNameOrId('cascades_collection');
    const entriesCollection = dao.findCollectionByNameOrId('cascade_entries_collection');
    const historyCollection = dao.findCollectionByNameOrId('cascade_history_collection');

    dao.deleteCollection(historyCollection);
    dao.deleteCollection(entriesCollection);
    dao.deleteCollection(cascadesCollection);

    // Rollback: Remove fields from users collection
    const usersCollection = dao.findCollectionByNameOrId('fhggsowykv3hz86');
    usersCollection.schema.removeField('cascades_seeded');
    usersCollection.schema.removeField('cascades_received');
    usersCollection.schema.removeField('cascades_passed');
    usersCollection.schema.removeField('cascades_broken');
    usersCollection.schema.removeField('cascade_reputation');
    usersCollection.schema.removeField('cascade_restricted_until');
    usersCollection.schema.removeField('can_enter_cascades');
    dao.saveCollection(usersCollection);

    // Rollback: Restore notifications collection
    const notificationsCollection = dao.findCollectionByNameOrId('notifications_collection');
    const typeField = notificationsCollection.schema.getFieldByName('type');
    typeField.options.values = ['new_listing', 'new_message', 'price_drop', 'listing_update'];
    dao.saveCollection(notificationsCollection);

    return null;
  }
);
