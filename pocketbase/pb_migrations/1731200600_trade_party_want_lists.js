/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const submissionsId = app.findCollectionByNameOrId('trade_party_submissions').id;

    // Create trade_party_want_lists collection
    const collection = new Collection({
      name: 'trade_party_want_lists',
      type: 'base',
    });

    // My submission (the game I'm offering)
    collection.fields.add(
      new RelationField({
        name: 'my_submission',
        required: true,
        collectionId: submissionsId,
        cascadeDelete: true,
        minSelect: 1,
        maxSelect: 1,
      })
    );

    // Wanted submission (the game I want)
    collection.fields.add(
      new RelationField({
        name: 'wanted_submission',
        required: true,
        collectionId: submissionsId,
        cascadeDelete: true,
        minSelect: 1,
        maxSelect: 1,
      })
    );

    // Preference rank (1 = first choice, 2 = second, etc.)
    collection.fields.add(
      new NumberField({
        name: 'preference_rank',
        required: true,
        min: 1,
        max: 1000,
      })
    );

    // Access rules - users can only modify their own want lists
    collection.createRule = '@request.auth.id != "" && @request.auth.id = my_submission.user';
    collection.updateRule = '@request.auth.id = my_submission.user';
    collection.deleteRule = '@request.auth.id = my_submission.user';
    collection.listRule = '@request.auth.id != ""';
    collection.viewRule = '@request.auth.id != ""';

    return app.save(collection);
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('trade_party_want_lists');
    return app.delete(collection);
  }
);
