/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId('discussion_replies');

  // Check if field already exists
  if (!collection.fields.getByName('created')) {
    collection.fields.add(new AutodateField({
      name: 'created',
      onCreate: true,
    }));
  }

  if (!collection.fields.getByName('updated')) {
    collection.fields.add(new AutodateField({
      name: 'updated',
      onCreate: true,
      onUpdate: true,
    }));
  }

  app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId('discussion_replies');
  collection.fields.removeByName('created');
  collection.fields.removeByName('updated');
  app.save(collection);
});
