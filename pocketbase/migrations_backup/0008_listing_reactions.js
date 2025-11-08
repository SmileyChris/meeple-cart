/// <reference path="../pb_data/types.d.ts" />

migrate(
  (db) => {
    const dao = new Dao(db);

    // Create reactions collection
    const reactionsCollection = new Collection({
      id: 'react123456789',
      name: 'reactions',
      type: 'base',
      system: false,
      schema: [
        new SchemaField({
          id: 'react_user_fld',
          name: 'user',
          type: 'relation',
          required: true,
          options: {
            collectionId: 'fhggsowykv3hz86', // users collection
            cascadeDelete: true,
            minSelect: 1,
            maxSelect: 1,
          },
        }),
        new SchemaField({
          id: 'react_list_fld',
          name: 'listing',
          type: 'relation',
          required: true,
          options: {
            collectionId: 'w3c43ufqz9ejshk', // listings collection (was wrong - was games collection)
            cascadeDelete: true,
            minSelect: 1,
            maxSelect: 1,
          },
        }),
        new SchemaField({
          id: 'react_emoji_fld',
          name: 'emoji',
          type: 'select',
          required: true,
          options: {
            maxSelect: 1,
            values: ['👀', '❤️', '🔥', '👍', '🎉', '😍'],
          },
        }),
      ],
      indexes: [
        // Unique constraint: one reaction per user per listing
        'CREATE UNIQUE INDEX idx_user_listing ON reactions (user, listing)',
      ],
      listRule: '',
      viewRule: '',
      createRule: '@request.auth.id != "" && @request.auth.id = @request.data.user',
      updateRule: '@request.auth.id != "" && @request.auth.id = user',
      deleteRule: '@request.auth.id != "" && @request.auth.id = user',
    });

    dao.saveCollection(reactionsCollection);

    return null;
  },
  (db) => {
    const dao = new Dao(db);
    const collection = dao.findCollectionByNameOrId('react123456789');
    dao.deleteCollection(collection);
    return null;
  }
);
