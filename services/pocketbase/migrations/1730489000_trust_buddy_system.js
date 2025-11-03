///
/// Trust Buddy Verification System - Database Migration
/// Creates 4 new collections and adds phone_verified field to users
///

migrate(
  (db) => {
    // ============================================
    // 1. ADD PHONE_VERIFIED TO USERS COLLECTION
    // ============================================

    const dao = new Dao(db);
    const usersCollection = dao.findCollectionByNameOrId('fhggsowykv3hz86'); // users collection

    // Add phone_verified boolean field
    usersCollection.schema.addField(
      new SchemaField({
        system: false,
        id: 'phone_verified',
        name: 'phone_verified',
        type: 'bool',
        required: false,
        unique: false,
        options: {},
      })
    );

    // Add phone_hash field for security
    usersCollection.schema.addField(
      new SchemaField({
        system: false,
        id: 'phone_hash',
        name: 'phone_hash',
        type: 'text',
        required: false,
        unique: false,
        options: {
          min: null,
          max: 64,
          pattern: '',
        },
      })
    );

    dao.saveCollection(usersCollection);

    // ============================================
    // 2. CREATE VERIFICATION_REQUESTS COLLECTION
    // ============================================

    const verificationRequests = new Collection({
      id: 'verification_requests',
      name: 'verification_requests',
      type: 'base',
      system: false,
      schema: [
        {
          system: false,
          id: 'user',
          name: 'user',
          type: 'relation',
          required: true,
          unique: false,
          options: {
            collectionId: 'fhggsowykv3hz86', // users
            cascadeDelete: true,
            minSelect: null,
            maxSelect: 1,
            displayFields: ['display_name'],
          },
        },
        {
          system: false,
          id: 'phone_hash',
          name: 'phone_hash',
          type: 'text',
          required: true,
          unique: false,
          options: {
            min: 64,
            max: 64,
            pattern: '',
          },
        },
        {
          system: false,
          id: 'phone_last_four',
          name: 'phone_last_four',
          type: 'text',
          required: false,
          unique: false,
          options: {
            min: 4,
            max: 4,
            pattern: '',
          },
        },
        {
          system: false,
          id: 'status',
          name: 'status',
          type: 'select',
          required: true,
          unique: false,
          options: {
            maxSelect: 1,
            values: ['pending', 'assigned', 'sent', 'completed', 'expired', 'cancelled'],
          },
        },
        {
          system: false,
          id: 'queue_position',
          name: 'queue_position',
          type: 'number',
          required: false,
          unique: false,
          options: {
            min: 0,
            max: null,
          },
        },
        {
          system: false,
          id: 'assigned_at',
          name: 'assigned_at',
          type: 'date',
          required: false,
          unique: false,
          options: {},
        },
        {
          system: false,
          id: 'completed_at',
          name: 'completed_at',
          type: 'date',
          required: false,
          unique: false,
          options: {},
        },
        {
          system: false,
          id: 'expires_at',
          name: 'expires_at',
          type: 'date',
          required: false,
          unique: false,
          options: {},
        },
      ],
      indexes: [
        'CREATE INDEX idx_verification_requests_status ON verification_requests(status)',
        'CREATE INDEX idx_verification_requests_user ON verification_requests(user)',
      ],
      listRule: '@request.auth.id != "" && (@request.auth.id = user || @request.auth.verified_phone = true)',
      viewRule: '@request.auth.id != "" && (@request.auth.id = user || @request.auth.verified_phone = true)',
      createRule: '@request.auth.id != "" && @request.auth.id = user',
      updateRule: null,
      deleteRule: '@request.auth.id = user',
      options: {},
    });

    dao.saveCollection(verificationRequests);

    // ============================================
    // 3. CREATE VERIFICATION_LINKS COLLECTION
    // ============================================

    const verificationLinks = new Collection({
      id: 'verification_links',
      name: 'verification_links',
      type: 'base',
      system: false,
      schema: [
        {
          system: false,
          id: 'code',
          name: 'code',
          type: 'text',
          required: true,
          unique: true,
          options: {
            min: 8,
            max: 8,
            pattern: '^[A-Z0-9]{8}$',
          },
        },
        {
          system: false,
          id: 'request',
          name: 'request',
          type: 'relation',
          required: true,
          unique: false,
          options: {
            collectionId: 'verification_requests',
            cascadeDelete: true,
            minSelect: null,
            maxSelect: 1,
            displayFields: [],
          },
        },
        {
          system: false,
          id: 'verifier',
          name: 'verifier',
          type: 'relation',
          required: true,
          unique: false,
          options: {
            collectionId: 'fhggsowykv3hz86', // users
            cascadeDelete: false,
            minSelect: null,
            maxSelect: 1,
            displayFields: ['display_name'],
          },
        },
        {
          system: false,
          id: 'target_phone_hash',
          name: 'target_phone_hash',
          type: 'text',
          required: true,
          unique: false,
          options: {
            min: 64,
            max: 64,
            pattern: '',
          },
        },
        {
          system: false,
          id: 'attempt_count',
          name: 'attempt_count',
          type: 'number',
          required: false,
          unique: false,
          options: {
            min: 0,
            max: null,
          },
        },
        {
          system: false,
          id: 'used',
          name: 'used',
          type: 'bool',
          required: false,
          unique: false,
          options: {},
        },
        {
          system: false,
          id: 'expires_at',
          name: 'expires_at',
          type: 'date',
          required: true,
          unique: false,
          options: {},
        },
        {
          system: false,
          id: 'used_at',
          name: 'used_at',
          type: 'date',
          required: false,
          unique: false,
          options: {},
        },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_verification_links_code ON verification_links(code)',
        'CREATE INDEX idx_verification_links_request ON verification_links(request)',
      ],
      listRule: null, // Private - only accessed via API
      viewRule: null, // Private - only accessed via API
      createRule: null, // Only via hooks/API
      updateRule: null, // Only via hooks/API
      deleteRule: null,
      options: {},
    });

    dao.saveCollection(verificationLinks);

    // ============================================
    // 4. CREATE VERIFIER_SETTINGS COLLECTION
    // ============================================

    const verifierSettings = new Collection({
      id: 'verifier_settings',
      name: 'verifier_settings',
      type: 'base',
      system: false,
      schema: [
        {
          system: false,
          id: 'user',
          name: 'user',
          type: 'relation',
          required: true,
          unique: true,
          options: {
            collectionId: 'fhggsowykv3hz86', // users
            cascadeDelete: true,
            minSelect: null,
            maxSelect: 1,
            displayFields: ['display_name'],
          },
        },
        {
          system: false,
          id: 'is_active',
          name: 'is_active',
          type: 'bool',
          required: false,
          unique: false,
          options: {},
        },
        {
          system: false,
          id: 'weekly_limit',
          name: 'weekly_limit',
          type: 'number',
          required: false,
          unique: false,
          options: {
            min: 1,
            max: 50,
          },
        },
        {
          system: false,
          id: 'total_verifications',
          name: 'total_verifications',
          type: 'number',
          required: false,
          unique: false,
          options: {
            min: 0,
            max: null,
          },
        },
        {
          system: false,
          id: 'success_count',
          name: 'success_count',
          type: 'number',
          required: false,
          unique: false,
          options: {
            min: 0,
            max: null,
          },
        },
        {
          system: false,
          id: 'last_verification',
          name: 'last_verification',
          type: 'date',
          required: false,
          unique: false,
          options: {},
        },
        {
          system: false,
          id: 'karma_earned',
          name: 'karma_earned',
          type: 'number',
          required: false,
          unique: false,
          options: {
            min: 0,
            max: null,
          },
        },
      ],
      indexes: ['CREATE INDEX idx_verifier_settings_user ON verifier_settings(user)'],
      listRule: '@request.auth.id != "" && @request.auth.verified_phone = true',
      viewRule: '@request.auth.id != ""',
      createRule: '@request.auth.id != "" && @request.auth.id = user',
      updateRule: '@request.auth.id = user',
      deleteRule: '@request.auth.id = user',
      options: {},
    });

    dao.saveCollection(verifierSettings);

    // ============================================
    // 5. CREATE VERIFICATION_PAIRS COLLECTION
    // ============================================

    const verificationPairs = new Collection({
      id: 'verification_pairs',
      name: 'verification_pairs',
      type: 'base',
      system: false,
      schema: [
        {
          system: false,
          id: 'verifier',
          name: 'verifier',
          type: 'relation',
          required: true,
          unique: false,
          options: {
            collectionId: 'fhggsowykv3hz86', // users
            cascadeDelete: true,
            minSelect: null,
            maxSelect: 1,
            displayFields: ['display_name'],
          },
        },
        {
          system: false,
          id: 'verified',
          name: 'verified',
          type: 'relation',
          required: true,
          unique: false,
          options: {
            collectionId: 'fhggsowykv3hz86', // users
            cascadeDelete: true,
            minSelect: null,
            maxSelect: 1,
            displayFields: ['display_name'],
          },
        },
        {
          system: false,
          id: 'verified_at',
          name: 'verified_at',
          type: 'date',
          required: true,
          unique: false,
          options: {},
        },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_verification_pairs_unique ON verification_pairs(verifier, verified)',
      ],
      listRule: '@request.auth.id != "" && (@request.auth.id = verifier || @request.auth.id = verified)',
      viewRule: '@request.auth.id != "" && (@request.auth.id = verifier || @request.auth.id = verified)',
      createRule: null, // Only via hooks/API
      updateRule: null,
      deleteRule: null,
      options: {},
    });

    dao.saveCollection(verificationPairs);

    console.log('✅ Trust Buddy system migrations completed successfully');
  },
  (db) => {
    // Rollback migration
    const dao = new Dao(db);

    // Remove phone_verified and phone_hash from users
    const usersCollection = dao.findCollectionByNameOrId('fhggsowykv3hz86');
    usersCollection.schema.removeField('phone_verified');
    usersCollection.schema.removeField('phone_hash');
    dao.saveCollection(usersCollection);

    // Delete collections in reverse order
    dao.deleteCollection(dao.findCollectionByNameOrId('verification_pairs'));
    dao.deleteCollection(dao.findCollectionByNameOrId('verifier_settings'));
    dao.deleteCollection(dao.findCollectionByNameOrId('verification_links'));
    dao.deleteCollection(dao.findCollectionByNameOrId('verification_requests'));

    console.log('✅ Trust Buddy system migrations rolled back');
  }
);
