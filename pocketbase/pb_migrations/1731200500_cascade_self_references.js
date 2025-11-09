/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  // Get cascades collection
  const cascades = app.findCollectionByNameOrId('cascades');

  // Add origin_cascade field (self-reference)
  cascades.fields.add(new RelationField({
    name: 'origin_cascade',
    required: false,
    collectionId: cascades.id,
    cascadeDelete: false,
    minSelect: 0,
    maxSelect: 1
  }));

  // Add previous_cascade field (self-reference)
  cascades.fields.add(new RelationField({
    name: 'previous_cascade',
    required: false,
    collectionId: cascades.id,
    cascadeDelete: false,
    minSelect: 0,
    maxSelect: 1
  }));

  app.save(cascades);
}, (app) => {
  // Rollback: remove self-reference fields
  const cascades = app.findCollectionByNameOrId('cascades');

  cascades.fields.removeByName('previous_cascade');
  cascades.fields.removeByName('origin_cascade');

  app.save(cascades);
});
