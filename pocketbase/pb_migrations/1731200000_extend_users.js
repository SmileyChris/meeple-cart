/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  // Get the auto-created users collection
  const users = app.findCollectionByNameOrId("users");

  // Add custom fields using proper field type constructors
  users.fields.add(new TextField({
    name: 'display_name',
    required: true,
    min: 2,
    max: 64
  }));

  users.fields.add(new TextField({
    name: 'location',
    required: false,
    max: 120
  }));

  users.fields.add(new TextField({
    name: 'phone',
    required: false,
    max: 32,
    pattern: '^\\+?[0-9 ]{6,32}$'
  }));

  users.fields.add(new NumberField({
    name: 'trade_count',
    required: true,
    min: 0
  }));

  users.fields.add(new NumberField({
    name: 'vouch_count',
    required: true,
    min: 0
  }));

  users.fields.add(new DateField({
    name: 'joined_date',
    required: true
  }));

  users.fields.add(new TextField({
    name: 'bio',
    required: false,
    max: 2000
  }));

  users.fields.add(new SelectField({
    name: 'preferred_contact',
    required: true,
    maxSelect: 1,
    values: ['platform', 'email', 'phone']
  }));

  users.fields.add(new JSONField({
    name: 'notification_prefs',
    required: false
  }));

  users.fields.add(new NumberField({
    name: 'cascades_seeded',
    required: true,
    min: 0
  }));

  users.fields.add(new NumberField({
    name: 'cascades_received',
    required: true,
    min: 0
  }));

  users.fields.add(new NumberField({
    name: 'cascades_passed',
    required: true,
    min: 0
  }));

  users.fields.add(new NumberField({
    name: 'cascades_broken',
    required: true,
    min: 0
  }));

  users.fields.add(new NumberField({
    name: 'cascade_reputation',
    required: true,
    min: 0,
    max: 100
  }));

  users.fields.add(new DateField({
    name: 'cascade_restricted_until',
    required: false
  }));

  users.fields.add(new BoolField({
    name: 'can_enter_cascades',
    required: true
  }));

  // Add indexes
  users.indexes = [
    'CREATE INDEX idx_users_display_name ON users (display_name)',
    'CREATE INDEX idx_users_location ON users (location)'
  ];

  // Update auth options
  users.options = {
    allowEmailAuth: true,
    allowOAuth2Auth: false,
    allowUsernameAuth: false,
    emailAuth: true,
    emailVisibility: false,
    minPasswordLength: 10,
    requireEmail: true
  };

  app.save(users);
}, (app) => {
  // Rollback: remove custom fields from users collection
  const users = app.findCollectionByNameOrId("users");

  // Remove fields by name
  const fieldNames = [
    'display_name', 'location', 'phone', 'trade_count', 'vouch_count',
    'joined_date', 'bio', 'preferred_contact', 'notification_prefs',
    'cascades_seeded', 'cascades_received', 'cascades_passed',
    'cascades_broken', 'cascade_reputation', 'cascade_restricted_until',
    'can_enter_cascades'
  ];

  fieldNames.forEach(name => {
    users.fields.removeByName(name);
  });

  // Remove indexes
  users.indexes = [];

  // Reset to default auth options
  users.options = {
    allowEmailAuth: true,
    allowOAuth2Auth: false,
    allowUsernameAuth: false,
    minPasswordLength: 8,
    requireEmail: true
  };

  app.save(users);
});
