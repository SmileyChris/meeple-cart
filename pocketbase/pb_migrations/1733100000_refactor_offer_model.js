/// <reference path="../pb_data/types.d.ts" />

/**
 * Migration: Refactor to listing → offer_template → game(s) model
 *
 * This migration:
 * 1. Adds can_post to offer_templates
 * 2. Removes template_type and open_to_shipping_negotiation from offer_templates
 * 3. Removes shipping_available from listings
 *
 * The new model:
 * - listings: container/grouping owned by user
 * - offer_templates: the actual "for sale/trade" unit with price, shipping, trade terms
 * - items: individual items describing condition, BGG info, etc.
 */
migrate((app) => {
  // 1. Update offer_templates - add can_post, remove deprecated fields
  const offerTemplates = app.findCollectionByNameOrId('offer_templates');

  // Add can_post field
  offerTemplates.fields.add(new BoolField({
    id: 'offer_can_post',
    name: 'can_post',
    required: true
  }));

  // Remove deprecated fields if they exist
  try { offerTemplates.fields.removeByName('template_type'); } catch (e) {}
  try { offerTemplates.fields.removeByName('open_to_shipping_negotiation'); } catch (e) {}

  app.save(offerTemplates);

  // 2. Update listings - remove shipping_available (now on offer_template as can_post)
  const listings = app.findCollectionByNameOrId('listings');

  // Remove fields if they exist
  try { listings.fields.removeByName('shipping_available'); } catch (e) {}
  try { listings.fields.removeByName('listing_type'); } catch (e) {}
  try { listings.fields.removeByName('prefer_bundle'); } catch (e) {}
  try { listings.fields.removeByName('bundle_discount'); } catch (e) {}

  // Remove listing_type index if it exists
  if (listings.indexes) {
    listings.indexes = listings.indexes.filter(idx => !idx.includes('listing_type'));
  }

  app.save(listings);

}, (app) => {
  // Rollback: restore removed fields

  // Restore offer_templates
  const offerTemplates = app.findCollectionByNameOrId('offer_templates');

  try { offerTemplates.fields.removeByName('can_post'); } catch (e) {}

  offerTemplates.fields.add(new SelectField({
    name: 'template_type',
    required: true,
    maxSelect: 1,
    values: ['cash_only', 'trade_only', 'cash_or_trade']
  }));

  offerTemplates.fields.add(new BoolField({
    name: 'open_to_shipping_negotiation',
    required: true
  }));

  app.save(offerTemplates);

  // Restore listings
  const listings = app.findCollectionByNameOrId('listings');

  listings.fields.add(new BoolField({
    id: '5hhzvlaqpt6jjtm',
    name: 'shipping_available',
    required: false
  }));

  app.save(listings);
});
