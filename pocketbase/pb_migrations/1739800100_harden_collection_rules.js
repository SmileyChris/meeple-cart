/// <reference path="../pb_data/types.d.ts" />

// Authorization hardening. Each change closes a way to forge trust or to break a feature
// that the rules made unusable. Asserted by src/lib/security/collection-rules.test.ts.

const PROTECTED_USER_FIELDS = [
  'trade_count',
  'vouch_count',
  'cascade_reputation',
  'cascades_seeded',
  'cascades_received',
  'cascades_passed',
  'cascades_broken',
  'phone_verified',
];

function denyFields(fields) {
  return fields.map((field) => `@request.body.${field}:isset = false`).join(' && ');
}

migrate(
  (app) => {
    // --- users -----------------------------------------------------------------
    // Reputation counters were writable by their own owner, so any user could PATCH
    // themselves an arbitrary trade count, vouch count, or cascade reputation. They are now
    // maintained exclusively by pb_hooks/reputation.pb.js.
    const users = app.findCollectionByNameOrId('users');
    users.createRule = denyFields(PROTECTED_USER_FIELDS);
    users.updateRule = `id = @request.auth.id && ${denyFields(PROTECTED_USER_FIELDS)}`;
    app.save(users);

    // --- trades ----------------------------------------------------------------
    // Any authenticated user could previously create a trade naming an arbitrary
    // counterparty, or name themselves on both sides to farm completed trades.
    const trades = app.findCollectionByNameOrId('trades');
    trades.createRule =
      '@request.auth.id != "" && @request.body.buyer = @request.auth.id' +
      ' && @request.body.seller != @request.auth.id';
    app.save(trades);

    // --- vouches ---------------------------------------------------------------
    // Self-vouching was possible, and vouch_count is a trust signal.
    const vouches = app.findCollectionByNameOrId('vouches');
    vouches.createRule =
      '@request.auth.id != "" && @request.body.voucher = @request.auth.id' +
      ' && @request.body.vouchee != @request.auth.id';

    // `created` was a *required plain date* rather than an autodate, so every vouch
    // creation failed validation with "Cannot be blank" — no caller sends it.
    vouches.fields.removeByName('created');
    vouches.fields.add(new AutodateField({ name: 'created', onCreate: true }));

    // One vouch per direction per pair is enforced in pb_hooks/reputation.pb.js rather than
    // by a composite unique index: PocketBase validates such an index against the row it has
    // just inserted and rejects every first vouch.
    app.save(vouches);

    // --- notifications ---------------------------------------------------------
    // Creation was superuser-only while the client makes 18 create calls, so every one of
    // them 403'd. Authenticated creation is allowed; pb_hooks/notifications.pb.js forces
    // `read` to false, restricts `type` to a known set, and rejects off-site links so a
    // forged notification cannot be used to phish another member.
    const notifications = app.findCollectionByNameOrId('notifications');
    notifications.createRule = '@request.auth.id != ""';

    // `type` is a select, so PocketBase rejects anything outside its list. Every trade and
    // offer notification the app sends was missing from it.
    const typeField = notifications.fields.getByName('type');
    const knownTypes = typeField.values || [];
    const tradeTypes = [
      'trade_initiated',
      'trade_accepted',
      'trade_shipped',
      'trade_received',
      'trade_completed',
      'trade_cancelled',
      'trade_update',
      'offer_received',
      'offer_accepted',
      'offer_declined',
      'vouch_received',
      'trade_party_match',
    ];
    for (const value of tradeTypes) {
      if (knownTypes.indexOf(value) === -1) {
        knownTypes.push(value);
      }
    }
    typeField.values = knownTypes;

    app.save(notifications);

    // --- reactions -------------------------------------------------------------
    // The collection was created as an empty shell: no fields, superuser-only reads, and
    // no update rule, while the UI reads, creates, updates and deletes it. Give it the
    // shape the client already assumes.
    const usersId = users.id;
    const listingsId = app.findCollectionByNameOrId('listings').id;
    const reactions = app.findCollectionByNameOrId('reactions');

    if (!reactions.fields.getByName('user')) {
      reactions.fields.add(
        new RelationField({
          name: 'user',
          required: true,
          collectionId: usersId,
          cascadeDelete: true,
          minSelect: 1,
          maxSelect: 1,
        })
      );
    }
    if (!reactions.fields.getByName('listing')) {
      reactions.fields.add(
        new RelationField({
          name: 'listing',
          required: true,
          collectionId: listingsId,
          cascadeDelete: true,
          minSelect: 1,
          maxSelect: 1,
        })
      );
    }
    if (!reactions.fields.getByName('emoji')) {
      reactions.fields.add(
        new SelectField({
          name: 'emoji',
          required: true,
          maxSelect: 1,
          values: ['❤️', '👍', '🔥', '😂', '🤔', '👀'],
        })
      );
    }

    reactions.addIndex('idx_reactions_user_listing', true, 'user, listing', '');
    reactions.listRule = '';
    reactions.viewRule = '';
    reactions.createRule = '@request.auth.id != "" && @request.body.user = @request.auth.id';
    reactions.updateRule = 'user = @request.auth.id';
    reactions.deleteRule = 'user = @request.auth.id';
    app.save(reactions);

    // --- trade_party_context ---------------------------------------------------
    // Also an empty shell with superuser-only reads while the matcher writes and reads it.
    const partiesId = app.findCollectionByNameOrId('trade_parties').id;
    const submissionsId = app.findCollectionByNameOrId('trade_party_submissions').id;
    const tradesId = trades.id;
    const context = app.findCollectionByNameOrId('trade_party_context');

    const contextFields = [
      () =>
        new RelationField({
          name: 'trade',
          required: false,
          collectionId: tradesId,
          cascadeDelete: false,
          maxSelect: 1,
        }),
      () =>
        new RelationField({
          name: 'party',
          required: true,
          collectionId: partiesId,
          cascadeDelete: true,
          minSelect: 1,
          maxSelect: 1,
        }),
      () => new TextField({ name: 'chain_id', required: true, max: 100 }),
      () => new NumberField({ name: 'chain_position', required: false }),
      () => new BoolField({ name: 'is_draft', required: false }),
      () =>
        new RelationField({
          name: 'giving_submission',
          required: true,
          collectionId: submissionsId,
          cascadeDelete: true,
          minSelect: 1,
          maxSelect: 1,
        }),
      () =>
        new RelationField({
          name: 'receiving_submission',
          required: true,
          collectionId: submissionsId,
          cascadeDelete: true,
          minSelect: 1,
          maxSelect: 1,
        }),
    ];

    for (const build of contextFields) {
      const field = build();
      if (!context.fields.getByName(field.name)) {
        context.fields.add(field);
      }
    }

    // Participants and the organiser need to read the chain they are part of.
    context.listRule = '@request.auth.id != ""';
    context.viewRule = '@request.auth.id != ""';
    context.createRule = '@request.auth.id = party.organizer';
    context.updateRule = '@request.auth.id = party.organizer';
    context.deleteRule = '@request.auth.id = party.organizer';
    app.save(context);
  },
  (app) => {
    const users = app.findCollectionByNameOrId('users');
    users.createRule = '';
    users.updateRule = 'id = @request.auth.id';
    app.save(users);

    const trades = app.findCollectionByNameOrId('trades');
    trades.createRule = "@request.auth.id != ''";
    app.save(trades);

    const vouches = app.findCollectionByNameOrId('vouches');
    vouches.createRule = '@request.auth.id = voucher';
    app.save(vouches);

    const reactions = app.findCollectionByNameOrId('reactions');
    reactions.listRule = null;
    reactions.viewRule = null;
    reactions.createRule = "@request.auth.id != ''";
    reactions.updateRule = null;
    reactions.deleteRule = "@request.auth.id != ''";
    app.save(reactions);

    const notifications = app.findCollectionByNameOrId('notifications');
    notifications.createRule = null;
    app.save(notifications);

    const context = app.findCollectionByNameOrId('trade_party_context');
    context.listRule = null;
    context.viewRule = null;
    context.createRule = "@request.auth.id != ''";
    context.updateRule = null;
    context.deleteRule = "@request.auth.id != ''";
    app.save(context);
  }
);
