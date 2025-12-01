/// <reference path="../pb_data/types.d.ts" />

// Add regions field to listings collection
migrate((app) => {
  const listings = app.findCollectionByNameOrId('listings');

  // Add regions field (JSON array of region strings)
  listings.fields.add(new JSONField({
    name: 'regions',
    required: false
  }));

  return app.save(listings);
}, (app) => {
  const listings = app.findCollectionByNameOrId('listings');

  listings.fields.removeByName('regions');

  return app.save(listings);
});
