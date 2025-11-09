/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const users = app.findCollectionByNameOrId('users');

  // Update number fields to not be required (they'll have defaults from schema)
  const numberFields = [
    'trade_count',
    'vouch_count', 
    'cascades_seeded',
    'cascades_received',
    'cascades_passed',
    'cascades_broken',
    'cascade_reputation'
  ];

  numberFields.forEach(fieldName => {
    const field = users.fields.getByName(fieldName);
    if (field) {
      field.required = false;
    }
  });

  // Also make can_enter_cascades not required
  const canEnterField = users.fields.getByName('can_enter_cascades');
  if (canEnterField) {
    canEnterField.required = false;
  }

  app.save(users);
}, (app) => {
  const users = app.findCollectionByNameOrId('users');

  // Rollback: set fields back to required
  const fieldsToRequire = [
    'trade_count',
    'vouch_count',
    'cascades_seeded',
    'cascades_received',
    'cascades_passed',
    'cascades_broken',
    'cascade_reputation',
    'can_enter_cascades'
  ];

  fieldsToRequire.forEach(fieldName => {
    const field = users.fields.getByName(fieldName);
    if (field) {
      field.required = true;
    }
  });

  app.save(users);
});
