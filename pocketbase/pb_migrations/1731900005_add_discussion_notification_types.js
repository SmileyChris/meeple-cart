/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId('notifications');
  const typeField = collection.fields.getByName('type');

  if (typeField) {
    // Add discussion notification types to existing values
    const existingValues = typeField.values || [];
    const newTypes = ['discussion_reply', 'discussion_mention'];

    // Only add types that don't already exist
    for (const newType of newTypes) {
      if (!existingValues.includes(newType)) {
        existingValues.push(newType);
      }
    }

    typeField.values = existingValues;
    app.save(collection);
  }
}, (app) => {
  const collection = app.findCollectionByNameOrId('notifications');
  const typeField = collection.fields.getByName('type');

  if (typeField) {
    // Remove discussion notification types
    typeField.values = (typeField.values || []).filter(
      v => v !== 'discussion_reply' && v !== 'discussion_mention'
    );
    app.save(collection);
  }
});
