/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("offer_templates")

  collection.fields.push(new Field({
    name: "will_consider_split",
    type: "bool",
    required: false,
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("offer_templates")

  const field = collection.fields.find(f => f.name === "will_consider_split")
  if (field) {
    collection.fields.remove(field)
  }

  return app.save(collection)
})
