/// <reference path="../../pocketbase/pb_data/types.d.ts" />

migrate(
  (db) => {
    const dao = new Dao(db);

    // Delete the watchlist collection since reactions now serve this purpose
    const collection = dao.findCollectionByNameOrId('t4djrv5xct2ymfk');
    dao.deleteCollection(collection);

    return null;
  },
  (db) => {
    const dao = new Dao(db);

    // Recreate watchlist collection for rollback
    const watchlistCollection = new Collection({
      id: 't4djrv5xct2ymfk',
      name: 'watchlist',
      type: 'base',
      system: false,
      schema: [
        new SchemaField({
          id: 't9ja4wp8fbx7dqa',
          name: 'user',
          type: 'relation',
          required: true,
          options: {
            collectionId: 'fhggsowykv3hz86', // users
            cascadeDelete: true,
            minSelect: 1,
            maxSelect: 1,
          },
        }),
        new SchemaField({
          id: 'j9p1223fj0xonc7',
          name: 'listing',
          type: 'relation',
          required: false,
          options: {
            collectionId: 'w3c43ufqz9ejshk', // listings
            cascadeDelete: true,
            minSelect: 0,
            maxSelect: 1,
          },
        }),
        new SchemaField({
          id: 'ifkag8h2451519d',
          name: 'bgg_id',
          type: 'number',
          required: false,
          options: {
            min: 0,
            max: null,
          },
        }),
        new SchemaField({
          id: '8zne1uxv9hwmf7z',
          name: 'max_price',
          type: 'number',
          required: false,
          options: {
            min: 0,
            max: null,
          },
        }),
        new SchemaField({
          id: '207ra4ls0dwe4rf',
          name: 'max_distance',
          type: 'number',
          required: false,
          options: {
            min: 0,
            max: null,
          },
        }),
      ],
      indexes: [
        'CREATE INDEX idx_watchlist_user ON watchlist (user)',
        'CREATE UNIQUE INDEX idx_watchlist_unique ON watchlist (user, bgg_id)',
      ],
      listRule: 'user = @request.auth.id',
      viewRule: 'user = @request.auth.id',
      createRule: 'user = @request.auth.id',
      updateRule: 'user = @request.auth.id',
      deleteRule: 'user = @request.auth.id',
    });

    dao.saveCollection(watchlistCollection);

    return null;
  }
);
