/// <reference path="../pb_data/types.d.ts" />
migrate(
  (db) => {
    const collection = new Collection({
      id: 'offer_templates_col',
      name: 'offer_templates',
      type: 'base',
      system: false,
      schema: [
        {
          system: false,
          id: 'tmpl_listing_fld',
          name: 'listing',
          type: 'relation',
          required: true,
          presentable: false,
          unique: false,
          options: {
            collectionId: 'w3c43ufqz9ejshk', // listings
            cascadeDelete: true,
            minSelect: 1,
            maxSelect: 1,
            displayFields: null,
          },
        },
        {
          system: false,
          id: 'tmpl_owner_fld',
          name: 'owner',
          type: 'relation',
          required: true,
          presentable: false,
          unique: false,
          options: {
            collectionId: 'fhggsowykv3hz86', // users
            cascadeDelete: false,
            minSelect: 1,
            maxSelect: 1,
            displayFields: null,
          },
        },
        {
          system: false,
          id: 'tmpl_items_fld',
          name: 'items',
          type: 'relation',
          required: true,
          presentable: false,
          unique: false,
          options: {
            collectionId: 'u0l5t5dn4gwl0sb', // items/games
            cascadeDelete: false,
            minSelect: 1,
            maxSelect: null,
            displayFields: null,
          },
        },
        {
          system: false,
          id: 'tmpl_type_fld',
          name: 'template_type',
          type: 'select',
          required: true,
          presentable: false,
          unique: false,
          options: {
            maxSelect: 1,
            values: ['cash_only', 'trade_only', 'cash_or_trade'],
          },
        },
        {
          system: false,
          id: 'tmpl_cash_amt_fld',
          name: 'cash_amount',
          type: 'number',
          required: false,
          presentable: false,
          unique: false,
          options: {
            min: 0,
            max: null,
            noDecimal: true,
          },
        },
        {
          system: false,
          id: 'tmpl_trade_for_fld',
          name: 'trade_for_items',
          type: 'json',
          required: false,
          presentable: false,
          unique: false,
          options: {},
        },
        {
          system: false,
          id: 'tmpl_ono_fld',
          name: 'open_to_lower_offers',
          type: 'bool',
          required: true,
          presentable: false,
          unique: false,
          options: {},
        },
        {
          system: false,
          id: 'tmpl_ship_neg_fld',
          name: 'open_to_shipping_negotiation',
          type: 'bool',
          required: true,
          presentable: false,
          unique: false,
          options: {},
        },
        {
          system: false,
          id: 'tmpl_trade_neg_fld',
          name: 'open_to_trade_offers',
          type: 'bool',
          required: true,
          presentable: false,
          unique: false,
          options: {},
        },
        {
          system: false,
          id: 'tmpl_status_fld',
          name: 'status',
          type: 'select',
          required: true,
          presentable: false,
          unique: false,
          options: {
            maxSelect: 1,
            values: ['active', 'accepted', 'invalidated', 'withdrawn'],
          },
        },
        {
          system: false,
          id: 'tmpl_accepted_trade_fld',
          name: 'accepted_by_trade',
          type: 'relation',
          required: false,
          presentable: false,
          unique: false,
          options: {
            collectionId: '50iprjgx7p8chq7', // trades
            cascadeDelete: false,
            minSelect: 0,
            maxSelect: 1,
            displayFields: null,
          },
        },
        {
          system: false,
          id: 'tmpl_display_name_fld',
          name: 'display_name',
          type: 'text',
          required: false,
          presentable: false,
          unique: false,
          options: {
            min: 0,
            max: 120,
            pattern: '',
          },
        },
        {
          system: false,
          id: 'tmpl_notes_fld',
          name: 'notes',
          type: 'text',
          required: false,
          presentable: false,
          unique: false,
          options: {
            min: 0,
            max: 500,
            pattern: '',
          },
        },
      ],
      indexes: [
        'CREATE INDEX idx_templates_listing ON offer_templates (listing)',
        'CREATE INDEX idx_templates_owner ON offer_templates (owner)',
        'CREATE INDEX idx_templates_status ON offer_templates (status)',
        'CREATE INDEX idx_templates_listing_status ON offer_templates (listing, status)',
      ],
      listRule: '',
      viewRule: '',
      createRule: '@request.auth.id = owner',
      updateRule: '@request.auth.id = owner',
      deleteRule: '@request.auth.id = owner && status = "active"',
      options: {},
    });

    return Dao(db).saveCollection(collection);
  },
  (db) => {
    const dao = new Dao(db);
    const collection = dao.findCollectionByNameOrId('offer_templates_col');
    return dao.deleteCollection(collection);
  }
);
