/// <reference path="../pb_data/types.d.ts" />
migrate(
  (db) => {
    const dao = new Dao(db);
    const collection = dao.findCollectionByNameOrId('50iprjgx7p8chq7'); // trades

    // Add offer_template field
    collection.schema.addField(
      new SchemaField({
        system: false,
        id: 'trade_template_fld',
        name: 'offer_template',
        type: 'relation',
        required: false,
        presentable: false,
        unique: false,
        options: {
          collectionId: 'offer_templates_col',
          cascadeDelete: false,
          minSelect: 0,
          maxSelect: 1,
          displayFields: null,
        },
      })
    );

    return dao.saveCollection(collection);
  },
  (db) => {
    const dao = new Dao(db);
    const collection = dao.findCollectionByNameOrId('50iprjgx7p8chq7');

    // Remove the field
    collection.schema.removeField('trade_template_fld');

    return dao.saveCollection(collection);
  }
);
