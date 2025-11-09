/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const tradePartiesId = app.findCollectionByNameOrId('trade_parties').id;
    const usersId = app.findCollectionByNameOrId('users').id;

    // Create trade_party_submissions collection
    const collection = new Collection({
      name: 'trade_party_submissions',
      type: 'base',
    });

    // Relations
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

    collection.fields.add(
      new RelationField({
        name: 'user',
        required: true,
        collectionId: usersId,
        cascadeDelete: false,
        minSelect: 1,
        maxSelect: 1,
      })
    );

    // Game Details
    collection.fields.add(
      new TextField({
        name: 'title',
        required: true,
        min: 1,
        max: 200,
      })
    );

    collection.fields.add(
      new NumberField({
        name: 'bgg_id',
        required: false,
      })
    );

    collection.fields.add(
      new SelectField({
        name: 'condition',
        required: true,
        maxSelect: 1,
        values: ['mint', 'like_new', 'good', 'fair', 'poor'],
      })
    );

    collection.fields.add(
      new EditorField({
        name: 'description',
        required: false,
      })
    );

    collection.fields.add(
      new FileField({
        name: 'photos',
        required: false,
        maxSelect: 10,
        maxSize: 5242880, // 5MB
        mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        thumbs: ['200x200', '500x500'],
      })
    );

    // Shipping
    collection.fields.add(
      new TextField({
        name: 'ship_from_region',
        required: false,
      })
    );

    // Store as JSON string, parsed on client
    collection.fields.add(
      new TextField({
        name: 'will_ship_to',
        required: false,
      })
    );

    collection.fields.add(
      new TextField({
        name: 'shipping_notes',
        required: false,
      })
    );

    // Status
    collection.fields.add(
      new SelectField({
        name: 'status',
        required: true,
        maxSelect: 1,
        values: ['pending', 'approved', 'matched', 'shipped', 'completed', 'cancelled'],
      })
    );

    collection.fields.add(
      new RelationField({
        name: 'matched_with',
        required: false,
        collectionId: '', // Self-reference - will be set after creation
        cascadeDelete: false,
        minSelect: 0,
        maxSelect: 1,
      })
    );

    // Access rules
    collection.createRule = '@request.auth.id != "" && @request.auth.id = user';
    collection.updateRule = '@request.auth.id = user';
    collection.deleteRule = '@request.auth.id = user';
    collection.listRule = '@request.auth.id != ""';
    collection.viewRule = '@request.auth.id != ""';

    const saved = app.save(collection);

    // Update self-reference for matched_with
    const matchedWithField = saved.fields.getByName('matched_with');
    if (matchedWithField) {
      matchedWithField.collectionId = saved.id;
      app.save(saved);
    }

    return saved;
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('trade_party_submissions');
    return app.delete(collection);
  }
);
