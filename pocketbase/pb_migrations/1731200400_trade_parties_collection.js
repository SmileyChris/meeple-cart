/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const usersId = app.findCollectionByNameOrId('users').id;

    // Create trade_parties collection
    const collection = new Collection({
      name: 'trade_parties',
      type: 'base',
    });

    // Basic Info
    collection.fields.add(
      new TextField({
        name: 'name',
        required: true,
        min: 3,
        max: 100,
      })
    );

    collection.fields.add(
      new EditorField({
        name: 'description',
        required: true,
      })
    );

    collection.fields.add(
      new RelationField({
        name: 'organizer',
        required: true,
        collectionId: usersId,
        cascadeDelete: false,
        minSelect: 1,
        maxSelect: 1,
      })
    );

    // Status & Phases
    collection.fields.add(
      new SelectField({
        name: 'status',
        required: true,
        maxSelect: 1,
        values: ['planning', 'submissions', 'want_lists', 'matching', 'execution', 'completed'],
      })
    );

    // Dates
    collection.fields.add(
      new DateField({
        name: 'submission_opens',
        required: true,
      })
    );

    collection.fields.add(
      new DateField({
        name: 'submission_closes',
        required: true,
      })
    );

    collection.fields.add(
      new DateField({
        name: 'want_list_opens',
        required: true,
      })
    );

    collection.fields.add(
      new DateField({
        name: 'want_list_closes',
        required: true,
      })
    );

    collection.fields.add(
      new DateField({
        name: 'algorithm_runs_at',
        required: true,
      })
    );

    collection.fields.add(
      new DateField({
        name: 'execution_deadline',
        required: true,
      })
    );

    // Configuration
    collection.fields.add(
      new NumberField({
        name: 'max_games_per_user',
        required: false,
        min: 1,
        max: 50,
      })
    );

    collection.fields.add(
      new BoolField({
        name: 'allow_no_trade',
        required: true,
      })
    );

    collection.fields.add(
      new TextField({
        name: 'regional_restriction',
        required: false,
      })
    );

    collection.fields.add(
      new EditorField({
        name: 'shipping_rules',
        required: false,
      })
    );

    // Stats
    collection.fields.add(
      new NumberField({
        name: 'participant_count',
        required: true,
        min: 0,
      })
    );

    collection.fields.add(
      new NumberField({
        name: 'game_count',
        required: true,
        min: 0,
      })
    );

    collection.fields.add(
      new NumberField({
        name: 'successful_matches',
        required: true,
        min: 0,
      })
    );

    // Indexes
    collection.createRule = '@request.auth.id = organizer';
    collection.updateRule = '@request.auth.id = organizer';
    collection.deleteRule = '@request.auth.id = organizer';
    collection.listRule = '@request.auth.id != ""';
    collection.viewRule = '@request.auth.id != ""';

    return app.save(collection);
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('trade_parties');
    return app.delete(collection);
  }
);
