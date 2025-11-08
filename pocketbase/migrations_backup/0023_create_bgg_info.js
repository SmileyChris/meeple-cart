/// <reference path="../pb_data/types.d.ts" />

/**
 * Migration: Create 'bgg_info' collection
 *
 * This migration creates a per-user collection for BoardGameGeek metadata.
 * Each user fetches and stores their own BGG data when creating listings.
 * This prevents malicious users from poisoning shared BGG data.
 *
 * Design:
 * - Each user fetches BGG data from their browser when listing items
 * - Data is stored with (user, bgg_id) compound key
 * - Multiple users can have separate entries for the same BGG game
 * - If a user fakes BGG data, it only affects their own listings
 *
 * Benefits:
 * - User-specific BGG data cache (no cross-contamination)
 * - Enables rich search/filtering by BGG metadata
 * - Provides fallback images/data when user doesn't upload
 * - Trust model: users trust their own fetched data
 */
migrate(
  (db) => {
    const dao = new Dao(db);

    const collection = new Collection({
      id: 'bgg_info_collection',
      name: 'bgg_info',
      type: 'base',
      system: false,
      schema: [
        // User who fetched this BGG data
        {
          id: 'user_field',
          name: 'user',
          type: 'relation',
          required: true,
          unique: false,
          options: {
            collectionId: 'fhggsowykv3hz86', // users collection
            cascadeDelete: true,
            minSelect: 1,
            maxSelect: 1,
          },
        },

        // Core identifiers
        {
          id: 'bgg_id_field',
          name: 'bgg_id',
          type: 'number',
          required: true,
          unique: false, // Uniqueness enforced by compound index (user, bgg_id)
          options: {
            min: 1,
            max: null,
          },
        },
        {
          id: 'title_field',
          name: 'title',
          type: 'text',
          required: true,
          unique: false,
          options: {
            min: 1,
            max: 500,
            pattern: '',
          },
        },
        {
          id: 'year_published_field',
          name: 'year_published',
          type: 'number',
          required: false,
          unique: false,
          options: {
            min: 1900,
            max: 2100,
          },
        },
        {
          id: 'description_field',
          name: 'description',
          type: 'text',
          required: false,
          unique: false,
          options: {
            min: 0,
            max: 10000,
            pattern: '',
          },
        },

        // Media (URLs from BGG)
        {
          id: 'thumbnail_url_field',
          name: 'thumbnail_url',
          type: 'url',
          required: false,
          unique: false,
          options: {
            exceptDomains: [],
            onlyDomains: [],
          },
        },
        {
          id: 'image_url_field',
          name: 'image_url',
          type: 'url',
          required: false,
          unique: false,
          options: {
            exceptDomains: [],
            onlyDomains: [],
          },
        },

        // Gameplay data
        {
          id: 'min_players_field',
          name: 'min_players',
          type: 'number',
          required: false,
          unique: false,
          options: {
            min: 1,
            max: 100,
          },
        },
        {
          id: 'max_players_field',
          name: 'max_players',
          type: 'number',
          required: false,
          unique: false,
          options: {
            min: 1,
            max: 100,
          },
        },
        {
          id: 'min_playtime_field',
          name: 'min_playtime',
          type: 'number',
          required: false,
          unique: false,
          options: {
            min: 1,
            max: 10000,
          },
        },
        {
          id: 'max_playtime_field',
          name: 'max_playtime',
          type: 'number',
          required: false,
          unique: false,
          options: {
            min: 1,
            max: 10000,
          },
        },
        {
          id: 'min_age_field',
          name: 'min_age',
          type: 'number',
          required: false,
          unique: false,
          options: {
            min: 0,
            max: 100,
          },
        },

        // Ratings and statistics
        {
          id: 'average_rating_field',
          name: 'average_rating',
          type: 'number',
          required: false,
          unique: false,
          options: {
            min: 0,
            max: 10,
          },
        },
        {
          id: 'rating_stddev_field',
          name: 'rating_stddev',
          type: 'number',
          required: false,
          unique: false,
          options: {
            min: 0,
            max: null,
          },
        },
        {
          id: 'num_ratings_field',
          name: 'num_ratings',
          type: 'number',
          required: false,
          unique: false,
          options: {
            min: 0,
            max: null,
          },
        },
        {
          id: 'complexity_weight_field',
          name: 'complexity_weight',
          type: 'number',
          required: false,
          unique: false,
          options: {
            min: 0,
            max: 5,
          },
        },
        {
          id: 'bgg_rank_field',
          name: 'bgg_rank',
          type: 'number',
          required: false,
          unique: false,
          options: {
            min: 1,
            max: null,
          },
        },

        // Taxonomy (JSON arrays)
        {
          id: 'categories_field',
          name: 'categories',
          type: 'json',
          required: false,
          unique: false,
          options: {},
        },
        {
          id: 'mechanics_field',
          name: 'mechanics',
          type: 'json',
          required: false,
          unique: false,
          options: {},
        },
        {
          id: 'designers_field',
          name: 'designers',
          type: 'json',
          required: false,
          unique: false,
          options: {},
        },
        {
          id: 'publishers_field',
          name: 'publishers',
          type: 'json',
          required: false,
          unique: false,
          options: {},
        },

        // Cache management
        {
          id: 'last_fetched_field',
          name: 'last_fetched',
          type: 'date',
          required: true,
          unique: false,
          options: {
            min: '',
            max: '',
          },
        },
        {
          id: 'fetch_error_field',
          name: 'fetch_error',
          type: 'text',
          required: false,
          unique: false,
          options: {
            min: 0,
            max: 1000,
            pattern: '',
          },
        },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_bgg_info_user_bgg_id ON bgg_info (user, bgg_id)', // Unique per user
        'CREATE INDEX idx_bgg_info_bgg_id ON bgg_info (bgg_id)', // For lookups
        'CREATE INDEX idx_bgg_info_title ON bgg_info (title)',
        'CREATE INDEX idx_bgg_info_last_fetched ON bgg_info (last_fetched)',
      ],
      listRule: '', // Public read access (anyone can see BGG data)
      viewRule: '', // Public read access
      createRule: '@request.auth.id != "" && @request.auth.id = user', // Authenticated users can create their own entries
      updateRule: '@request.auth.id != "" && @request.auth.id = user', // Users can only update their own entries
      deleteRule: '@request.auth.id != "" && @request.auth.id = user', // Users can only delete their own entries
    });

    return dao.saveCollection(collection);
  },
  (db) => {
    // Rollback: Delete the bgg_info collection
    const dao = new Dao(db);

    const collection = dao.findCollectionByNameOrId('bgg_info_collection');

    return dao.deleteCollection(collection);
  }
);
