/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
    const collection = app.findCollectionByNameOrId('discussion_threads');

    // Update is_pinned field to not be required (false is a valid value)
    const isPinnedField = collection.fields.getByName('is_pinned');
    if (isPinnedField) {
        isPinnedField.required = false;
    }

    // Update is_locked field to not be required (false is a valid value)
    const isLockedField = collection.fields.getByName('is_locked');
    if (isLockedField) {
        isLockedField.required = false;
    }

    app.save(collection);
}, (app) => {
    const collection = app.findCollectionByNameOrId('discussion_threads');

    // Revert: make fields required again
    const isPinnedField = collection.fields.getByName('is_pinned');
    if (isPinnedField) {
        isPinnedField.required = true;
    }

    const isLockedField = collection.fields.getByName('is_locked');
    if (isLockedField) {
        isLockedField.required = true;
    }

    app.save(collection);
});
