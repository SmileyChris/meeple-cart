/// <reference path="../pb_data/types.d.ts" />

// PocketBase treats 0 and false as blank, so a *required* number or bool field rejects its
// own natural initial value. Every one of these made a create call fail:
//
//   listings.views          -> listing creation returned "views: Cannot be blank"
//   notifications.read      -> every notification write failed, all 18 client call sites
//   discussion_threads.*     -> thread creation failed on view_count / reply_count
//   messages.is_public      -> private messages could not be created
//
// Counters and flags are initialised by their zero value, so none of them should be
// required. Asserted by src/lib/security/collection-rules.test.ts.

const COUNTER_FIELDS = {
  bgg_info: ['bgg_id'],
  cascade_entries: ['withdrew'],
  cascade_history: ['generation'],
  cascades: ['generation', 'entry_count', 'view_count'],
  discussion_categories: ['order', 'enabled'],
  discussion_threads: ['view_count', 'reply_count'],
  listings: ['views'],
  messages: ['is_public'],
  notifications: ['read'],
  trade_parties: ['allow_no_trade'],
  trade_party_matches: ['chain_position'],
  trade_party_want_lists: ['preference_rank'],
};

migrate(
  (app) => {
    for (const name in COUNTER_FIELDS) {
      const collection = app.findCollectionByNameOrId(name);

      for (const fieldName of COUNTER_FIELDS[name]) {
        const field = collection.fields.getByName(fieldName);
        if (field) {
          field.required = false;
        }
      }

      app.save(collection);
    }
  },
  (app) => {
    for (const name in COUNTER_FIELDS) {
      const collection = app.findCollectionByNameOrId(name);

      for (const fieldName of COUNTER_FIELDS[name]) {
        const field = collection.fields.getByName(fieldName);
        if (field) {
          field.required = true;
        }
      }

      app.save(collection);
    }
  }
);
