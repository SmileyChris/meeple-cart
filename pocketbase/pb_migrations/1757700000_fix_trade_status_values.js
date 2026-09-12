/// <reference path="../pb_data/types.d.ts" />

// 1736414700_enhanced_trade_flow.js tried to update trades.status via
// `statusField.options.values`, but PocketBase 0.32's JS field objects have no `.options` -
// select values live directly on `field.values`. The `if (statusField && statusField.options)`
// guard was always false, so that block silently no-op'd and the live schema kept the original
// 5-value status enum while src/routes/trades/** has always written 'accepted', 'shipped' and
// 'received' too. The same bug (via `.options.values`) meant 1733100004_rename_shipping_to_delivery.js
// renamed the field to delivery_method but never converted its 'shipped' value to 'post', which
// src/routes/listings/[id]/+page.svelte writes. This migration fixes both using the correct
// `field.values` API, keeping the old values so existing rows are never invalidated.
migrate(
  (app) => {
    const trades = app.findCollectionByNameOrId('trades');

    const statusField = trades.fields.getByName('status');
    if (statusField) {
      statusField.values = [
        'initiated',
        'confirmed',
        'accepted',
        'shipped',
        'received',
        'completed',
        'disputed',
        'cancelled',
      ];
    }

    const deliveryField = trades.fields.getByName('delivery_method');
    if (deliveryField) {
      deliveryField.values = ['in_person', 'post', 'either', 'shipped'];
    }

    app.save(trades);
  },
  (app) => {
    const trades = app.findCollectionByNameOrId('trades');

    const statusField = trades.fields.getByName('status');
    if (statusField) {
      statusField.values = ['initiated', 'confirmed', 'completed', 'disputed', 'cancelled'];
    }

    const deliveryField = trades.fields.getByName('delivery_method');
    if (deliveryField) {
      deliveryField.values = ['in_person', 'shipped', 'either'];
    }

    app.save(trades);
  }
);
