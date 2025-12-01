/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    const collections = ["listings", "items", "offer_templates", "discussion_threads"];

    for (const name of collections) {
        try {
            const collection = app.findCollectionByNameOrId(name);

            // Check if fields already exist to avoid errors
            const hasCreated = collection.fields.getByName("created");
            const hasUpdated = collection.fields.getByName("updated");

            if (!hasCreated) {
                collection.fields.add(new AutodateField({
                    name: "created",
                    onCreate: true,
                }));
            }

            if (!hasUpdated) {
                collection.fields.add(new AutodateField({
                    name: "updated",
                    onCreate: true,
                    onUpdate: true,
                }));
            }

            app.save(collection);
        } catch (e) {
            console.log(`Skipping ${name}: ${e.message}`);
        }
    }
}, (app) => {
    const collections = ["listings", "items", "offer_templates", "discussion_threads"];

    for (const name of collections) {
        try {
            const collection = app.findCollectionByNameOrId(name);
            collection.fields.removeByName("created");
            collection.fields.removeByName("updated");
            app.save(collection);
        } catch (e) {
            console.log(`Skipping ${name}: ${e.message}`);
        }
    }
})
