/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    const collection = app.findCollectionByNameOrId("discussion_threads");
    const listings = app.findCollectionByNameOrId("listings");

    // Check if field already exists
    if (!collection.fields.getByName("listing")) {
        collection.fields.add(new RelationField({
            name: "listing",
            collectionId: listings.id,
            cascadeDelete: false,
            minSelect: 0,
            maxSelect: 1,
        }));

        app.save(collection);
    }
}, (app) => {
    const collection = app.findCollectionByNameOrId("discussion_threads");
    collection.fields.removeByName("listing");
    app.save(collection);
})
