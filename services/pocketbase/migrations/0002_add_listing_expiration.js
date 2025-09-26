migrate((app) => {
  const collection = app.findCollectionByNameOrId("listings");
  
  // Add last_activity field - tracks the last time the listing was active
  collection.schema.addField(
    new SchemaField({
      id: "last_activity",
      name: "last_activity",
      type: "date",
      required: false,
      unique: false,
      options: {}
    })
  );
  
  // Add expires_at field - when the listing will be auto-archived
  collection.schema.addField(
    new SchemaField({
      id: "expires_at",
      name: "expires_at",
      type: "date",
      required: false,
      unique: false,
      options: {}
    })
  );
  
  // Add auto_extend field - whether to automatically extend expiration on activity
  collection.schema.addField(
    new SchemaField({
      id: "auto_extend",
      name: "auto_extend",
      type: "bool",
      required: false,
      unique: false,
      options: {}
    })
  );
  
  // Add response_count field for wanted listings
  collection.schema.addField(
    new SchemaField({
      id: "response_count",
      name: "response_count",
      type: "number",
      required: false,
      unique: false,
      options: {
        min: 0,
        max: null
      }
    })
  );
  
  // Add max_price field for wanted listings
  collection.schema.addField(
    new SchemaField({
      id: "max_price",
      name: "max_price",
      type: "number",
      required: false,
      unique: false,
      options: {
        min: 0,
        max: 99999
      }
    })
  );
  
  // Add urgent field for wanted listings
  collection.schema.addField(
    new SchemaField({
      id: "urgent",
      name: "urgent",
      type: "bool",
      required: false,
      unique: false,
      options: {}
    })
  );
  
  // Add condition field for browse filtering
  collection.schema.addField(
    new SchemaField({
      id: "condition",
      name: "condition",
      type: "select",
      required: false,
      unique: false,
      options: {
        maxSelect: 1,
        values: ["New", "Like New", "Very Good", "Good", "Fair"]
      }
    })
  );
  
  // Add price field for sell/trade listings
  collection.schema.addField(
    new SchemaField({
      id: "price",
      name: "price",
      type: "number",
      required: false,
      unique: false,
      options: {
        min: 0,
        max: 99999
      }
    })
  );
  
  return app.save(collection);
});

// Add a rule to automatically set expires_at on creation
migrate((app) => {
  const collection = app.findCollectionByNameOrId("listings");
  
  // Set default expiration to 30 days from creation for wanted listings
  // and 45 days for sale/trade listings
  collection.options.beforeCreateRule = `
    @request.body.last_activity = @now
    @request.body.expires_at = (@request.body.listing_type = "want") ? 
      (@now + 30 * 24 * 60 * 60) : 
      (@now + 45 * 24 * 60 * 60)
    @request.body.auto_extend = true
  `;
  
  // Update last_activity on any update
  collection.options.beforeUpdateRule = `
    @request.body.last_activity = @now
    // Extend expiration if auto_extend is enabled
    (@request.body.auto_extend = true) ? 
      @request.body.expires_at = (@now + 30 * 24 * 60 * 60) : 
      null
  `;
  
  return app.save(collection);
});