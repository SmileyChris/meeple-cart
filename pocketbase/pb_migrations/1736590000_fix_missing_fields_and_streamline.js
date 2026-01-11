/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    // 1. Fix missing timestamps and add visibility to trade_parties
    const tradeParties = app.findCollectionByNameOrId("trade_parties");

    // Add created/updated if missing
    if (!tradeParties.fields.getByName("created")) {
        tradeParties.fields.add(new AutodateField({ name: "created", onCreate: true }));
    }
    if (!tradeParties.fields.getByName("updated")) {
        tradeParties.fields.add(new AutodateField({ name: "updated", onCreate: true, onUpdate: true }));
    }

    // Add is_public field
    tradeParties.fields.add(new BoolField({
        name: "is_public",
        defaultValue: true,
    }));

    // Set default values for count fields to avoid "cannot be blank" errors
    const statFields = ["participant_count", "game_count", "successful_matches"];
    for (const fieldName of statFields) {
        const field = tradeParties.fields.getByName(fieldName);
        if (field) {
            field.defaultValue = 0;
            field.required = false; // Make them not required to be super safe
        }
    }

    // Make description optional
    const descriptionField = tradeParties.fields.getByName("description");
    if (descriptionField) {
        descriptionField.required = false;
    }

    app.save(tradeParties);

    // 2. Add timestamps to other collections
    const collectionsToFix = ["notifications", "watchlist", "messages", "vouches"];
    for (const name of collectionsToFix) {
        try {
            const collection = app.findCollectionByNameOrId(name);
            let changed = false;

            if (!collection.fields.getByName("created")) {
                collection.fields.add(new AutodateField({ name: "created", onCreate: true }));
                changed = true;
            }
            if (!collection.fields.getByName("updated")) {
                collection.fields.add(new AutodateField({ name: "updated", onCreate: true, onUpdate: true }));
                changed = true;
            }

            if (changed) {
                app.save(collection);
            }
        } catch (e) {
            console.log(`Skipping ${name}: ${e.message}`);
        }
    }

    // 3. Create reactions collection
    const users = app.findCollectionByNameOrId("users");
    const listings = app.findCollectionByNameOrId("listings");

    const reactions = new Collection({
        name: "reactions",
        type: "base",
        fields: [
            new RelationField({
                name: "user",
                collectionId: users.id,
                required: true,
                maxSelect: 1,
            }),
            new RelationField({
                name: "listing",
                collectionId: listings.id,
                required: true,
                maxSelect: 1,
            }),
            new SelectField({
                name: "emoji",
                required: true,
                maxSelect: 1,
                values: ['👀', '❤️', '🔥', '👍', '🎉', '😍'],
            }),
        ],
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
    });

    // Add timestamps to reactions too
    reactions.fields.add(new AutodateField({ name: "created", onCreate: true }));
    reactions.fields.add(new AutodateField({ name: "updated", onCreate: true, onUpdate: true }));

    app.save(reactions);

}, (app) => {
    // Rollback logic
    const tradeParties = app.findCollectionByNameOrId("trade_parties");
    try { tradeParties.fields.removeByName("is_public"); } catch (e) { }
    app.save(tradeParties);

    const reactions = app.findCollectionByNameOrId("reactions");
    if (reactions) {
        app.delete(reactions);
    }
});
