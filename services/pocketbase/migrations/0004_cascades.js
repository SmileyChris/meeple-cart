/// <reference path="../../pocketbase/pb_data/types.d.ts" />

migrate(
  (db) => {
    const dao = new Dao(db);

    // 1. Update users collection - add cascade stats fields
    const usersCollection = dao.findCollectionByNameOrId('fhggsowykv3hz86');

    usersCollection.schema.addField(
      new SchemaField({
        id: 'casc1seeded0001',
        name: 'cascades_seeded',
        type: 'number',
        required: true,
        options: {
          min: 0,
          max: null,
        },
      })
    );

    usersCollection.schema.addField(
      new SchemaField({
        id: 'casc2received02',
        name: 'cascades_received',
        type: 'number',
        required: true,
        options: {
          min: 0,
          max: null,
        },
      })
    );

    usersCollection.schema.addField(
      new SchemaField({
        id: 'casc3passed0003',
        name: 'cascades_passed',
        type: 'number',
        required: true,
        options: {
          min: 0,
          max: null,
        },
      })
    );

    usersCollection.schema.addField(
      new SchemaField({
        id: 'casc4broken0004',
        name: 'cascades_broken',
        type: 'number',
        required: true,
        options: {
          min: 0,
          max: null,
        },
      })
    );

    usersCollection.schema.addField(
      new SchemaField({
        id: 'casc5reputation',
        name: 'cascade_reputation',
        type: 'number',
        required: true,
        options: {
          min: 0,
          max: 100,
        },
      })
    );

    usersCollection.schema.addField(
      new SchemaField({
        id: 'casc6restrict06',
        name: 'cascade_restricted_until',
        type: 'date',
        required: false,
        options: {
          min: null,
          max: null,
        },
      })
    );

    usersCollection.schema.addField(
      new SchemaField({
        id: 'casc7canenter7',
        name: 'can_enter_cascades',
        type: 'bool',
        required: true,
        options: {},
      })
    );

    dao.saveCollection(usersCollection);

    // Initialize cascade fields for existing users
    db.newQuery(
      'UPDATE users SET cascades_seeded = 0, cascades_received = 0, cascades_passed = 0, cascades_broken = 0, cascade_reputation = 50, can_enter_cascades = TRUE WHERE cascades_seeded IS NULL'
    ).execute();

    // 2. Update notifications collection - add cascade notification types
    const notificationsCollection = dao.findCollectionByNameOrId('notifications_collection');
    const typeField = notificationsCollection.schema.getFieldByName('type');
    typeField.options.values = [
      'new_listing',
      'new_message',
      'price_drop',
      'listing_update',
      'cascade_won',
      'cascade_shipped',
      'cascade_received',
      'cascade_reminder',
      'cascade_deadline',
      'cascade_broken',
    ];
    dao.saveCollection(notificationsCollection);

    // 3. Create cascades collection
    const cascadesCollection = new Collection({
      id: 'm5n6p7q8r9s0t1u',
      name: 'cascades',
      type: 'base',
      system: false,
      schema: [
        new SchemaField({
          id: 'casc_name_field',
          name: 'name',
          type: 'text',
          required: false,
          options: {
            min: 0,
            max: 120,
            pattern: '',
          },
        }),
        new SchemaField({
          id: 'casc_desc_field',
          name: 'description',
          type: 'text',
          required: false,
          options: {
            min: 0,
            max: 2000,
            pattern: '',
          },
        }),
        new SchemaField({
          id: 'casc_status_fld',
          name: 'status',
          type: 'select',
          required: true,
          options: {
            maxSelect: 1,
            values: ['accepting_entries', 'selecting_winner', 'in_transit', 'awaiting_pass', 'completed', 'broken'],
          },
        }),
        new SchemaField({
          id: 'casc_game_field',
          name: 'current_game',
          type: 'relation',
          required: true,
          options: {
            collectionId: 'u0l5t5dn4gwl0sb',
            cascadeDelete: false,
            minSelect: 1,
            maxSelect: 1,
          },
        }),
        new SchemaField({
          id: 'casc_holder_fld',
          name: 'current_holder',
          type: 'relation',
          required: true,
          options: {
            collectionId: 'fhggsowykv3hz86',
            cascadeDelete: false,
            minSelect: 1,
            maxSelect: 1,
          },
        }),
        new SchemaField({
          id: 'casc_deadline_f',
          name: 'entry_deadline',
          type: 'date',
          required: true,
          options: {
            min: null,
            max: null,
          },
        }),
        new SchemaField({
          id: 'casc_region_fld',
          name: 'region',
          type: 'select',
          required: false,
          options: {
            maxSelect: 1,
            values: ['nz', 'au', 'worldwide', 'north_island', 'south_island'],
          },
        }),
        new SchemaField({
          id: 'casc_shipping_f',
          name: 'shipping_requirement',
          type: 'select',
          required: true,
          options: {
            maxSelect: 1,
            values: ['pickup_only', 'shipping_available', 'shipping_only'],
          },
        }),
        new SchemaField({
          id: 'casc_rules_fld',
          name: 'special_rules',
          type: 'text',
          required: false,
          options: {
            min: 0,
            max: 1000,
            pattern: '',
          },
        }),
        new SchemaField({
          id: 'casc_winner_fld',
          name: 'winner',
          type: 'relation',
          required: false,
          options: {
            collectionId: 'fhggsowykv3hz86',
            cascadeDelete: false,
            minSelect: 0,
            maxSelect: 1,
          },
        }),
        new SchemaField({
          id: 'casc_shipped_at',
          name: 'shipped_at',
          type: 'date',
          required: false,
          options: {
            min: null,
            max: null,
          },
        }),
        new SchemaField({
          id: 'casc_tracking_f',
          name: 'shipping_tracking',
          type: 'text',
          required: false,
          options: {
            min: 0,
            max: 200,
            pattern: '',
          },
        }),
        new SchemaField({
          id: 'casc_received_f',
          name: 'received_at',
          type: 'date',
          required: false,
          options: {
            min: null,
            max: null,
          },
        }),
        new SchemaField({
          id: 'casc_recv_by_f',
          name: 'received_confirmed_by',
          type: 'select',
          required: false,
          options: {
            maxSelect: 1,
            values: ['sender', 'receiver', 'auto'],
          },
        }),
        new SchemaField({
          id: 'casc_pass_dead',
          name: 'pass_deadline',
          type: 'date',
          required: false,
          options: {
            min: null,
            max: null,
          },
        }),
        new SchemaField({
          id: 'casc_generation',
          name: 'generation',
          type: 'number',
          required: true,
          options: {
            min: 0,
            max: null,
          },
        }),
        new SchemaField({
          id: 'casc_origin_fld',
          name: 'origin_cascade',
          type: 'relation',
          required: false,
          options: {
            collectionId: 'm5n6p7q8r9s0t1u',
            cascadeDelete: false,
            minSelect: 0,
            maxSelect: 1,
          },
        }),
        new SchemaField({
          id: 'casc_previous_f',
          name: 'previous_cascade',
          type: 'relation',
          required: false,
          options: {
            collectionId: 'm5n6p7q8r9s0t1u',
            cascadeDelete: false,
            minSelect: 0,
            maxSelect: 1,
          },
        }),
        new SchemaField({
          id: 'casc_entry_cnt',
          name: 'entry_count',
          type: 'number',
          required: true,
          options: {
            min: 0,
            max: null,
          },
        }),
        new SchemaField({
          id: 'casc_view_count',
          name: 'view_count',
          type: 'number',
          required: true,
          options: {
            min: 0,
            max: null,
          },
        }),
      ],
      indexes: [
        'CREATE INDEX idx_cascades_status ON cascades (status)',
        'CREATE INDEX idx_cascades_holder ON cascades (current_holder)',
        'CREATE INDEX idx_cascades_deadline ON cascades (entry_deadline)',
        'CREATE INDEX idx_cascades_region ON cascades (region)',
        'CREATE INDEX idx_cascades_winner ON cascades (winner)',
      ],
      listRule: '',
      viewRule: '',
      createRule: '@request.auth.id != ""',
      updateRule: 'current_holder = @request.auth.id || winner = @request.auth.id',
      deleteRule: 'current_holder = @request.auth.id && status = "accepting_entries"',
    });

    dao.saveCollection(cascadesCollection);

    // 4. Create cascade_entries collection
    const entriesCollection = new Collection({
      id: 'v2w3x4y5z6a7b8c',
      name: 'cascade_entries',
      type: 'base',
      system: false,
      schema: [
        new SchemaField({
          id: 'entry_cascade_f',
          name: 'cascade',
          type: 'relation',
          required: true,
          options: {
            collectionId: 'm5n6p7q8r9s0t1u',
            cascadeDelete: true,
            minSelect: 1,
            maxSelect: 1,
          },
        }),
        new SchemaField({
          id: 'entry_user_fld',
          name: 'user',
          type: 'relation',
          required: true,
          options: {
            collectionId: 'fhggsowykv3hz86',
            cascadeDelete: true,
            minSelect: 1,
            maxSelect: 1,
          },
        }),
        new SchemaField({
          id: 'entry_msg_field',
          name: 'message',
          type: 'text',
          required: false,
          options: {
            min: 0,
            max: 500,
            pattern: '',
          },
        }),
        new SchemaField({
          id: 'entry_withdrew_f',
          name: 'withdrew',
          type: 'bool',
          required: true,
          options: {},
        }),
      ],
      indexes: [
        'CREATE INDEX idx_entries_cascade ON cascade_entries (cascade)',
        'CREATE INDEX idx_entries_user ON cascade_entries (user)',
        'CREATE UNIQUE INDEX idx_entries_cascade_user ON cascade_entries (cascade, user)',
      ],
      listRule: '',
      viewRule: '',
      createRule: '@request.auth.id = user',
      updateRule: '@request.auth.id = user',
      deleteRule: '@request.auth.id = user',
    });

    dao.saveCollection(entriesCollection);

    // 5. Create cascade_history collection
    const historyCollection = new Collection({
      id: 'd9e0f1g2h3i4j5k',
      name: 'cascade_history',
      type: 'base',
      system: false,
      schema: [
        new SchemaField({
          id: 'hist_cascade_f',
          name: 'cascade',
          type: 'relation',
          required: true,
          options: {
            collectionId: 'm5n6p7q8r9s0t1u',
            cascadeDelete: true,
            minSelect: 1,
            maxSelect: 1,
          },
        }),
        new SchemaField({
          id: 'hist_generation',
          name: 'generation',
          type: 'number',
          required: true,
          options: {
            min: 0,
            max: null,
          },
        }),
        new SchemaField({
          id: 'hist_event_type',
          name: 'event_type',
          type: 'select',
          required: true,
          options: {
            maxSelect: 1,
            values: ['seeded', 'winner_selected', 'shipped', 'received', 'passed_on', 'deadline_missed', 'broken'],
          },
        }),
        new SchemaField({
          id: 'hist_event_date',
          name: 'event_date',
          type: 'date',
          required: true,
          options: {
            min: null,
            max: null,
          },
        }),
        new SchemaField({
          id: 'hist_actor_fld',
          name: 'actor',
          type: 'relation',
          required: true,
          options: {
            collectionId: 'fhggsowykv3hz86',
            cascadeDelete: false,
            minSelect: 1,
            maxSelect: 1,
          },
        }),
        new SchemaField({
          id: 'hist_related_u',
          name: 'related_user',
          type: 'relation',
          required: false,
          options: {
            collectionId: 'fhggsowykv3hz86',
            cascadeDelete: false,
            minSelect: 0,
            maxSelect: 1,
          },
        }),
        new SchemaField({
          id: 'hist_game_field',
          name: 'game',
          type: 'relation',
          required: false,
          options: {
            collectionId: 'u0l5t5dn4gwl0sb',
            cascadeDelete: false,
            minSelect: 0,
            maxSelect: 1,
          },
        }),
        new SchemaField({
          id: 'hist_notes_fld',
          name: 'notes',
          type: 'text',
          required: false,
          options: {
            min: 0,
            max: 1000,
            pattern: '',
          },
        }),
        new SchemaField({
          id: 'hist_ship_loc_f',
          name: 'shipped_to_location',
          type: 'text',
          required: false,
          options: {
            min: 0,
            max: 120,
            pattern: '',
          },
        }),
        new SchemaField({
          id: 'hist_ship_days',
          name: 'shipping_days',
          type: 'number',
          required: false,
          options: {
            min: 0,
            max: null,
          },
        }),
      ],
      indexes: [
        'CREATE INDEX idx_history_cascade ON cascade_history (cascade)',
        'CREATE INDEX idx_history_actor ON cascade_history (actor)',
        'CREATE INDEX idx_history_event_date ON cascade_history (event_date)',
      ],
      listRule: '',
      viewRule: '',
      createRule: null,
      updateRule: null,
      deleteRule: null,
    });

    dao.saveCollection(historyCollection);

    return null;
  },
  (db) => {
    const dao = new Dao(db);

    // Rollback: Remove cascade collections
    try {
      const historyCollection = dao.findCollectionByNameOrId('d9e0f1g2h3i4j5k');
      dao.deleteCollection(historyCollection);
    } catch (e) {
      // Collection might not exist
    }

    try {
      const entriesCollection = dao.findCollectionByNameOrId('v2w3x4y5z6a7b8c');
      dao.deleteCollection(entriesCollection);
    } catch (e) {
      // Collection might not exist
    }

    try {
      const cascadesCollection = dao.findCollectionByNameOrId('m5n6p7q8r9s0t1u');
      dao.deleteCollection(cascadesCollection);
    } catch (e) {
      // Collection might not exist
    }

    // Rollback: Remove cascade notification types from notifications
    try {
      const notificationsCollection = dao.findCollectionByNameOrId('notifications_collection');
      const typeField = notificationsCollection.schema.getFieldByName('type');
      typeField.options.values = ['new_listing', 'new_message', 'price_drop', 'listing_update'];
      dao.saveCollection(notificationsCollection);
    } catch (e) {
      // Field might not exist
    }

    // Rollback: Remove cascade fields from users
    try {
      const usersCollection = dao.findCollectionByNameOrId('fhggsowykv3hz86');
      usersCollection.schema.removeField('casc7canenter7');
      usersCollection.schema.removeField('casc6restrict06');
      usersCollection.schema.removeField('casc5reputation');
      usersCollection.schema.removeField('casc4broken0004');
      usersCollection.schema.removeField('casc3passed0003');
      usersCollection.schema.removeField('casc2received02');
      usersCollection.schema.removeField('casc1seeded0001');
      dao.saveCollection(usersCollection);
    } catch (e) {
      // Fields might not exist
    }

    return null;
  }
);
