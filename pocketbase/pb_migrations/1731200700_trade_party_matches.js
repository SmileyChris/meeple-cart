/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const tradePartiesId = app.findCollectionByNameOrId('trade_parties').id;
    const submissionsId = app.findCollectionByNameOrId('trade_party_submissions').id;
    const usersId = app.findCollectionByNameOrId('users').id;

    // Create trade_party_matches collection
    const collection = new Collection({
      name: 'trade_party_matches',
      type: 'base',
    });

    // Trade party reference
    collection.fields.add(
      new RelationField({
        name: 'trade_party',
        required: true,
        collectionId: tradePartiesId,
        cascadeDelete: true,
        minSelect: 1,
        maxSelect: 1,
      })
    );

    // Chain identification
    collection.fields.add(
      new TextField({
        name: 'chain_id',
        required: true,
      })
    );

    collection.fields.add(
      new NumberField({
        name: 'chain_position',
        required: true,
        min: 1,
      })
    );

    // The Trade - giving submission
    collection.fields.add(
      new RelationField({
        name: 'giving_submission',
        required: true,
        collectionId: submissionsId,
        cascadeDelete: false,
        minSelect: 1,
        maxSelect: 1,
      })
    );

    // The Trade - receiving submission
    collection.fields.add(
      new RelationField({
        name: 'receiving_submission',
        required: true,
        collectionId: submissionsId,
        cascadeDelete: false,
        minSelect: 1,
        maxSelect: 1,
      })
    );

    // Users involved
    collection.fields.add(
      new RelationField({
        name: 'giving_user',
        required: true,
        collectionId: usersId,
        cascadeDelete: false,
        minSelect: 1,
        maxSelect: 1,
      })
    );

    collection.fields.add(
      new RelationField({
        name: 'receiving_user',
        required: true,
        collectionId: usersId,
        cascadeDelete: false,
        minSelect: 1,
        maxSelect: 1,
      })
    );

    // Status tracking
    collection.fields.add(
      new SelectField({
        name: 'status',
        required: true,
        maxSelect: 1,
        values: ['pending', 'shipping', 'completed', 'disputed'],
      })
    );

    collection.fields.add(
      new DateField({
        name: 'shipped_at',
        required: false,
      })
    );

    collection.fields.add(
      new DateField({
        name: 'received_at',
        required: false,
      })
    );

    collection.fields.add(
      new TextField({
        name: 'tracking_number',
        required: false,
      })
    );

    // Access rules - participants can view their matches
    collection.createRule = null; // Only created by algorithm
    collection.updateRule = '@request.auth.id = giving_user || @request.auth.id = receiving_user';
    collection.deleteRule = null; // Can't delete matches
    collection.listRule = '@request.auth.id != ""';
    collection.viewRule = '@request.auth.id != ""';

    return app.save(collection);
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('trade_party_matches');
    return app.delete(collection);
  }
);
