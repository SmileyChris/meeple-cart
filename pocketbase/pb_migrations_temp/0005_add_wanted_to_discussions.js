/// <reference path="../pb_data/types.d.ts" />
migrate(
  (db) => {
    const dao = new Dao(db);
    const collection = dao.findCollectionByNameOrId('discussion_threads'); // Get by name

    // Add thread_type field
    collection.schema.addField(
      new SchemaField({
        system: false,
        id: 'thread_type_fld',
        name: 'thread_type',
        type: 'select',
        required: true,
        presentable: false,
        unique: false,
        options: {
          maxSelect: 1,
          values: ['discussion', 'wanted'],
        },
      })
    );

    // Add wanted_items field
    collection.schema.addField(
      new SchemaField({
        system: false,
        id: 'wanted_items_fld',
        name: 'wanted_items',
        type: 'json',
        required: false,
        presentable: false,
        unique: false,
        options: {},
      })
    );

    // Add wanted_offer_type field
    collection.schema.addField(
      new SchemaField({
        system: false,
        id: 'wanted_offer_type_fld',
        name: 'wanted_offer_type',
        type: 'select',
        required: false,
        presentable: false,
        unique: false,
        options: {
          maxSelect: 1,
          values: ['buying', 'trading', 'either'],
        },
      })
    );

    // Add index for thread_type
    db.execSQL('CREATE INDEX idx_threads_type ON discussion_threads (thread_type)');

    // Set default thread_type for existing records
    db.execSQL("UPDATE discussion_threads SET thread_type = 'discussion' WHERE thread_type IS NULL");

    return dao.saveCollection(collection);
  },
  (db) => {
    const dao = new Dao(db);
    const collection = dao.findCollectionByNameOrId('discussion_threads');

    // Remove fields
    collection.schema.removeField('thread_type_fld');
    collection.schema.removeField('wanted_items_fld');
    collection.schema.removeField('wanted_offer_type_fld');

    // Drop index
    db.execSQL('DROP INDEX IF EXISTS idx_threads_type');

    return dao.saveCollection(collection);
  }
);
