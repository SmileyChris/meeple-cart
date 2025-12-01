/// <reference path="../pb_data/types.d.ts" />

/**
 * Migration: Fix offer_templates boolean fields
 *
 * Boolean fields with required: true in PocketBase means the value must be TRUE.
 * For booleans that should accept both true and false, we need required: false.
 */
migrate((app) => {
  const offerTemplates = app.findCollectionByNameOrId('offer_templates');

  // Find and update boolean fields to be non-required
  // This allows false values to be accepted
  const boolFields = ['open_to_lower_offers', 'open_to_trade_offers', 'can_post'];

  for (const fieldName of boolFields) {
    const field = offerTemplates.fields.find(f => f.name === fieldName);
    if (field) {
      field.required = false;
    }
  }

  app.save(offerTemplates);

}, (app) => {
  // Rollback: restore required: true (though this causes issues)
  const offerTemplates = app.findCollectionByNameOrId('offer_templates');

  const boolFields = ['open_to_lower_offers', 'open_to_trade_offers', 'can_post'];

  for (const fieldName of boolFields) {
    const field = offerTemplates.fields.find(f => f.name === fieldName);
    if (field) {
      field.required = true;
    }
  }

  app.save(offerTemplates);
});
