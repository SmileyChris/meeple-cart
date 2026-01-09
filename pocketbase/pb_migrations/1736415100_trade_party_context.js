/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    const trades = app.findCollectionByNameOrId("trades");
    const tradeParties = app.findCollectionByNameOrId("trade_parties");
    const tradePartySubmissions = app.findCollectionByNameOrId("trade_party_submissions");

    // 1. Update trades collection
    // Make listing optional
    const listingField = trades.fields.getByName("listing");
    if (listingField) {
        listingField.required = false;
    }

    // Add is_draft field to trades
    trades.fields.add(new BoolField({
        name: "is_draft",
        required: false,
        defaultValue: false,
    }));

    app.save(trades);

    // 2. Create trade_party_context collection (Through table)
    const contextCollection = new Collection({
        name: "trade_party_context",
        type: "base",
        fields: [
            new RelationField({
                name: "trade",
                collectionId: trades.id,
                maxSelect: 1,
                required: false, // Optional until finalized
            }),
            new RelationField({
                name: "party",
                collectionId: tradeParties.id,
                maxSelect: 1,
                required: true,
            }),
            new TextField({
                name: "chain_id",
                required: true,
            }),
            new NumberField({
                name: "chain_position",
                required: true,
            }),
            new BoolField({
                name: "is_draft",
                defaultValue: true,
            }),
            new RelationField({
                name: "giving_submission",
                collectionId: tradePartySubmissions.id,
                maxSelect: 1,
                required: true,
            }),
            new RelationField({
                name: "receiving_submission",
                collectionId: tradePartySubmissions.id,
                maxSelect: 1,
                required: true,
            })
        ],
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''", // Simplified for migration, will refine in runner
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
    });

    app.save(contextCollection);

}, (app) => {
    const trades = app.findCollectionByNameOrId("trades");
    const listingField = trades.fields.getByName("listing");
    if (listingField) {
        listingField.required = true;
    }
    trades.fields.removeByName("is_draft");
    app.save(trades);

    const contextCollection = app.findCollectionByNameOrId("trade_party_context");
    if (contextCollection) {
        app.delete(contextCollection);
    }
})
