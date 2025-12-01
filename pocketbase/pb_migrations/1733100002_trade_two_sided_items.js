/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("trades")
  const itemsId = app.findCollectionByNameOrId("items").id

  // Rename requested_items to seller_items (what buyer wants FROM seller)
  const requestedItemsField = collection.fields.find(f => f.name === "requested_items")
  if (requestedItemsField) {
    requestedItemsField.name = "seller_items"
  }

  // Rename cash_offer_amount to buyer_cash_amount (what buyer is OFFERING)
  const cashOfferField = collection.fields.find(f => f.name === "cash_offer_amount")
  if (cashOfferField) {
    cashOfferField.name = "buyer_cash_amount"
  }

  // Add buyer_items - items the buyer is offering from their own listings
  collection.fields.add(new RelationField({
    name: "buyer_items",
    required: false,
    collectionId: itemsId,
    cascadeDelete: false,
    minSelect: null,
    maxSelect: 999,
  }))

  // Add buyer_items_description - free text for items not in system
  collection.fields.add(new TextField({
    name: "buyer_items_description",
    required: false,
    min: null,
    max: 2000,
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("trades")

  // Revert: rename seller_items back to requested_items
  const sellerItemsField = collection.fields.find(f => f.name === "seller_items")
  if (sellerItemsField) {
    sellerItemsField.name = "requested_items"
  }

  // Revert: rename buyer_cash_amount back to cash_offer_amount
  const buyerCashField = collection.fields.find(f => f.name === "buyer_cash_amount")
  if (buyerCashField) {
    buyerCashField.name = "cash_offer_amount"
  }

  // Remove buyer_items field
  try { collection.fields.removeByName("buyer_items") } catch (e) {}

  // Remove buyer_items_description field
  try { collection.fields.removeByName("buyer_items_description") } catch (e) {}

  return app.save(collection)
})
