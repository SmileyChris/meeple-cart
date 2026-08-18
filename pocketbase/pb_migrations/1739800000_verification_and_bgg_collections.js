/// <reference path="../pb_data/types.d.ts" />

// Creates five collections that the client already queries but which had no migration:
// verification_requests, verification_links, verification_pairs, verifier_settings, bgg_info.
// Without these, /settings, /verification/*, /trust-[code] and all BGG caching fail against
// a freshly migrated database.

migrate(
  (app) => {
    const usersId = app.findCollectionByNameOrId('users').id;

    // --- verification_requests -------------------------------------------------
    const requests = new Collection({
      name: 'verification_requests',
      type: 'base',
    });

    requests.fields.add(
      new RelationField({
        name: 'user',
        required: true,
        collectionId: usersId,
        cascadeDelete: true,
        minSelect: 1,
        maxSelect: 1,
      })
    );
    requests.fields.add(new TextField({ name: 'phone_hash', required: true, max: 128 }));
    requests.fields.add(new TextField({ name: 'phone_last_four', required: false, max: 4 }));
    requests.fields.add(
      new SelectField({
        name: 'status',
        required: true,
        maxSelect: 1,
        values: ['pending', 'assigned', 'sent', 'completed', 'expired', 'cancelled'],
      })
    );
    requests.fields.add(new NumberField({ name: 'queue_position', required: false }));
    requests.fields.add(new DateField({ name: 'assigned_at', required: false }));
    requests.fields.add(new DateField({ name: 'completed_at', required: false }));
    requests.fields.add(new DateField({ name: 'expires_at', required: false }));
    requests.fields.add(new AutodateField({ name: 'created', onCreate: true }));
    requests.fields.add(new AutodateField({ name: 'updated', onCreate: true, onUpdate: true }));

    // A phone hash is personal data: only the requester and assigned verifiers may read it.
    requests.listRule = 'user = @request.auth.id';
    requests.viewRule = 'user = @request.auth.id';
    requests.createRule = '@request.auth.id = user';
    requests.updateRule = 'user = @request.auth.id';
    requests.deleteRule = 'user = @request.auth.id';
    app.save(requests);

    const requestsId = app.findCollectionByNameOrId('verification_requests').id;

    // --- verification_links ----------------------------------------------------
    const links = new Collection({
      name: 'verification_links',
      type: 'base',
    });

    links.fields.add(new TextField({ name: 'code', required: true, min: 8, max: 8 }));
    links.fields.add(
      new RelationField({
        name: 'request',
        required: true,
        collectionId: requestsId,
        cascadeDelete: true,
        minSelect: 1,
        maxSelect: 1,
      })
    );
    links.fields.add(
      new RelationField({
        name: 'verifier',
        required: true,
        collectionId: usersId,
        cascadeDelete: false,
        minSelect: 1,
        maxSelect: 1,
      })
    );
    links.fields.add(new TextField({ name: 'target_phone_hash', required: true, max: 128 }));
    links.fields.add(new NumberField({ name: 'attempt_count', required: false }));
    links.fields.add(new BoolField({ name: 'used', required: false }));
    links.fields.add(new DateField({ name: 'expires_at', required: true }));
    links.fields.add(new DateField({ name: 'used_at', required: false }));
    links.fields.add(new AutodateField({ name: 'created', onCreate: true }));
    links.fields.add(new AutodateField({ name: 'updated', onCreate: true, onUpdate: true }));

    links.addIndex('idx_verification_links_code', true, 'code', '');

    // The code is the bearer secret; a link is readable by the verifier who owns it or the
    // user being verified. Redemption by code goes through a filtered query, not list access.
    links.listRule = 'verifier = @request.auth.id || request.user = @request.auth.id';
    links.viewRule = 'verifier = @request.auth.id || request.user = @request.auth.id';
    links.createRule = '@request.auth.id = verifier';
    links.updateRule = 'verifier = @request.auth.id || request.user = @request.auth.id';
    links.deleteRule = 'verifier = @request.auth.id';
    app.save(links);

    // --- verification_pairs ----------------------------------------------------
    // Records who verified whom, so the same pair cannot be reused to farm trust.
    const pairs = new Collection({
      name: 'verification_pairs',
      type: 'base',
    });

    pairs.fields.add(
      new RelationField({
        name: 'verifier',
        required: true,
        collectionId: usersId,
        cascadeDelete: false,
        minSelect: 1,
        maxSelect: 1,
      })
    );
    pairs.fields.add(
      new RelationField({
        name: 'verified',
        required: true,
        collectionId: usersId,
        cascadeDelete: false,
        minSelect: 1,
        maxSelect: 1,
      })
    );
    pairs.fields.add(new DateField({ name: 'verified_at', required: true }));
    pairs.fields.add(new AutodateField({ name: 'created', onCreate: true }));

    pairs.addIndex('idx_verification_pairs_unique', true, 'verifier, verified', '');

    pairs.listRule = '@request.auth.id != ""';
    pairs.viewRule = '@request.auth.id != ""';
    // Pairs are trust-bearing records; only server-side code may mint them.
    pairs.createRule = null;
    pairs.updateRule = null;
    pairs.deleteRule = null;
    app.save(pairs);

    // --- verifier_settings -----------------------------------------------------
    const settings = new Collection({
      name: 'verifier_settings',
      type: 'base',
    });

    settings.fields.add(
      new RelationField({
        name: 'user',
        required: true,
        collectionId: usersId,
        cascadeDelete: true,
        minSelect: 1,
        maxSelect: 1,
      })
    );
    settings.fields.add(new BoolField({ name: 'is_active', required: false }));
    settings.fields.add(new NumberField({ name: 'weekly_limit', required: false }));
    settings.fields.add(new NumberField({ name: 'total_verifications', required: false }));
    settings.fields.add(new NumberField({ name: 'success_count', required: false }));
    settings.fields.add(new DateField({ name: 'last_verification', required: false }));
    settings.fields.add(new NumberField({ name: 'karma_earned', required: false }));
    settings.fields.add(new AutodateField({ name: 'created', onCreate: true }));
    settings.fields.add(new AutodateField({ name: 'updated', onCreate: true, onUpdate: true }));

    settings.addIndex('idx_verifier_settings_user', true, 'user', '');

    settings.listRule = 'user = @request.auth.id';
    settings.viewRule = 'user = @request.auth.id';
    settings.createRule = '@request.auth.id = user';
    // A user may toggle availability but not award themselves karma or verification counts.
    settings.updateRule =
      'user = @request.auth.id' +
      ' && @request.body.total_verifications:isset = false' +
      ' && @request.body.success_count:isset = false' +
      ' && @request.body.karma_earned:isset = false';
    settings.deleteRule = 'user = @request.auth.id';
    app.save(settings);

    // --- bgg_info --------------------------------------------------------------
    // Per-user cache of BoardGameGeek metadata.
    const bgg = new Collection({
      name: 'bgg_info',
      type: 'base',
    });

    bgg.fields.add(
      new RelationField({
        name: 'user',
        required: true,
        collectionId: usersId,
        cascadeDelete: true,
        minSelect: 1,
        maxSelect: 1,
      })
    );
    bgg.fields.add(new NumberField({ name: 'bgg_id', required: true }));
    bgg.fields.add(new TextField({ name: 'title', required: true, max: 500 }));
    bgg.fields.add(new NumberField({ name: 'year_published', required: false }));
    bgg.fields.add(new TextField({ name: 'description', required: false, max: 20000 }));
    bgg.fields.add(new URLField({ name: 'thumbnail_url', required: false }));
    bgg.fields.add(new URLField({ name: 'image_url', required: false }));
    bgg.fields.add(new NumberField({ name: 'min_players', required: false }));
    bgg.fields.add(new NumberField({ name: 'max_players', required: false }));
    bgg.fields.add(new NumberField({ name: 'min_playtime', required: false }));
    bgg.fields.add(new NumberField({ name: 'max_playtime', required: false }));
    bgg.fields.add(new NumberField({ name: 'min_age', required: false }));
    bgg.fields.add(new NumberField({ name: 'average_rating', required: false }));
    bgg.fields.add(new NumberField({ name: 'rating_stddev', required: false }));
    bgg.fields.add(new NumberField({ name: 'num_ratings', required: false }));
    bgg.fields.add(new NumberField({ name: 'complexity_weight', required: false }));
    bgg.fields.add(new NumberField({ name: 'bgg_rank', required: false }));
    bgg.fields.add(new JSONField({ name: 'categories', required: false, maxSize: 20000 }));
    bgg.fields.add(new JSONField({ name: 'mechanics', required: false, maxSize: 20000 }));
    bgg.fields.add(new JSONField({ name: 'designers', required: false, maxSize: 20000 }));
    bgg.fields.add(new JSONField({ name: 'publishers', required: false, maxSize: 20000 }));
    bgg.fields.add(new DateField({ name: 'last_fetched', required: true }));
    bgg.fields.add(new TextField({ name: 'fetch_error', required: false, max: 2000 }));
    bgg.fields.add(new AutodateField({ name: 'created', onCreate: true }));
    bgg.fields.add(new AutodateField({ name: 'updated', onCreate: true, onUpdate: true }));

    bgg.addIndex('idx_bgg_info_user_game', true, 'user, bgg_id', '');

    // Cached public game metadata is readable by anyone; each user owns their own rows.
    bgg.listRule = '';
    bgg.viewRule = '';
    bgg.createRule = '@request.auth.id = user';
    bgg.updateRule = '@request.auth.id = user';
    bgg.deleteRule = '@request.auth.id = user';
    app.save(bgg);
  },
  (app) => {
    for (const name of [
      'bgg_info',
      'verifier_settings',
      'verification_pairs',
      'verification_links',
      'verification_requests',
    ]) {
      try {
        app.delete(app.findCollectionByNameOrId(name));
      } catch (err) {
        // Collection already absent; nothing to roll back.
      }
    }
  }
);
