///
/// Fix Nonzero Validation - Allow zero values for user statistics
/// PocketBase automatically enables "Nonzero" validation for required number fields
/// This migration explicitly disables it for user statistics fields
///

migrate(
  (db) => {
    const dao = new Dao(db);
    const usersCollection = dao.findCollectionByNameOrId('fhggsowykv3hz86'); // users

    // Make numeric statistics fields optional to avoid "nonzero" validation
    // We always provide default values (0) in the app, so this is safe
    const fieldsToFix = [
      'trade_count',
      'vouch_count',
      'cascades_seeded',
      'cascades_received',
      'cascades_passed',
      'cascades_broken',
      'cascade_reputation',
    ];

    for (const fieldName of fieldsToFix) {
      const field = usersCollection.schema.getFieldByName(fieldName);
      if (field) {
        field.required = false;
      }
    }

    dao.saveCollection(usersCollection);

    console.log('✅ Made user statistics fields optional to allow zero values');
  },
  (db) => {
    const dao = new Dao(db);
    const usersCollection = dao.findCollectionByNameOrId('fhggsowykv3hz86');

    // Rollback: Make fields required again
    const fieldsToFix = [
      'trade_count',
      'vouch_count',
      'cascades_seeded',
      'cascades_received',
      'cascades_passed',
      'cascades_broken',
      'cascade_reputation',
    ];

    for (const fieldName of fieldsToFix) {
      const field = usersCollection.schema.getFieldByName(fieldName);
      if (field) {
        field.required = true;
      }
    }

    dao.saveCollection(usersCollection);

    console.log('✅ Rollback: Made user statistics fields required again');
  }
);
