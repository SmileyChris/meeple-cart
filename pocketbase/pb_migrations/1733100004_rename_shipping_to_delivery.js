/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("trades")

  // Rename shipping_method to delivery_method
  const shippingField = collection.fields.find(f => f.name === "shipping_method")
  if (shippingField) {
    shippingField.name = "delivery_method"
    // Update select options: shipped -> post
    if (shippingField.options && shippingField.options.values) {
      shippingField.options.values = shippingField.options.values.map(v =>
        v === 'shipped' ? 'post' : v
      )
    }
  }

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("trades")

  // Revert: rename delivery_method back to shipping_method
  const deliveryField = collection.fields.find(f => f.name === "delivery_method")
  if (deliveryField) {
    deliveryField.name = "shipping_method"
    // Revert select options: post -> shipped
    if (deliveryField.options && deliveryField.options.values) {
      deliveryField.options.values = deliveryField.options.values.map(v =>
        v === 'post' ? 'shipped' : v
      )
    }
  }

  return app.save(collection)
})
