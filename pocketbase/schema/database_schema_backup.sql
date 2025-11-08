CREATE TABLE `_migrations` (file VARCHAR(255) PRIMARY KEY NOT NULL, applied INTEGER NOT NULL);
CREATE TABLE `_admins` (
				`id`              TEXT PRIMARY KEY NOT NULL,
				`avatar`          INTEGER DEFAULT 0 NOT NULL,
				`email`           TEXT UNIQUE NOT NULL,
				`tokenKey`        TEXT UNIQUE NOT NULL,
				`passwordHash`    TEXT NOT NULL,
				`lastResetSentAt` TEXT DEFAULT "" NOT NULL,
				`created`         TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%fZ')) NOT NULL,
				`updated`         TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%fZ')) NOT NULL
			);
CREATE TABLE `_collections` (
				`id`         TEXT PRIMARY KEY NOT NULL,
				`system`     BOOLEAN DEFAULT FALSE NOT NULL,
				`type`       TEXT DEFAULT "base" NOT NULL,
				`name`       TEXT UNIQUE NOT NULL,
				`schema`     JSON DEFAULT "[]" NOT NULL,
				`indexes`    JSON DEFAULT "[]" NOT NULL,
				`listRule`   TEXT DEFAULT NULL,
				`viewRule`   TEXT DEFAULT NULL,
				`createRule` TEXT DEFAULT NULL,
				`updateRule` TEXT DEFAULT NULL,
				`deleteRule` TEXT DEFAULT NULL,
				`options`    JSON DEFAULT "{}" NOT NULL,
				`created`    TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%fZ')) NOT NULL,
				`updated`    TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%fZ')) NOT NULL
			);
CREATE TABLE `_params` (
				`id`      TEXT PRIMARY KEY NOT NULL,
				`key`     TEXT UNIQUE NOT NULL,
				`value`   JSON DEFAULT NULL,
				`created` TEXT DEFAULT "" NOT NULL,
				`updated` TEXT DEFAULT "" NOT NULL
			);
CREATE TABLE `_externalAuths` (
				`id`           TEXT PRIMARY KEY NOT NULL,
				`collectionId` TEXT NOT NULL,
				`recordId`     TEXT NOT NULL,
				`provider`     TEXT NOT NULL,
				`providerId`   TEXT NOT NULL,
				`created`      TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%fZ')) NOT NULL,
				`updated`      TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%fZ')) NOT NULL,
				---
				FOREIGN KEY (`collectionId`) REFERENCES `_collections` (`id`) ON UPDATE CASCADE ON DELETE CASCADE
			);
CREATE UNIQUE INDEX _externalAuths_record_provider_idx on `_externalAuths` (`collectionId`, `recordId`, `provider`);
CREATE UNIQUE INDEX _externalAuths_collection_provider_idx on `_externalAuths` (`collectionId`, `provider`, `providerId`);
CREATE TABLE `users` (`bio` TEXT DEFAULT '' NOT NULL, `created` TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%fZ')) NOT NULL, `display_name` TEXT DEFAULT '' NOT NULL, `email` TEXT DEFAULT '' NOT NULL, `emailVisibility` BOOLEAN DEFAULT FALSE NOT NULL, `id` TEXT PRIMARY KEY DEFAULT ('r'||lower(hex(randomblob(7)))) NOT NULL, `joined_date` TEXT DEFAULT '' NOT NULL, `lastResetSentAt` TEXT DEFAULT '' NOT NULL, `lastVerificationSentAt` TEXT DEFAULT '' NOT NULL, `location` TEXT DEFAULT '' NOT NULL, `notification_prefs` JSON DEFAULT NULL, `passwordHash` TEXT NOT NULL, `phone` TEXT DEFAULT '' NOT NULL, `preferred_contact` TEXT DEFAULT '' NOT NULL, `tokenKey` TEXT NOT NULL, `trade_count` NUMERIC DEFAULT 0 NOT NULL, `updated` TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%fZ')) NOT NULL, `username` TEXT NOT NULL, `verified` BOOLEAN DEFAULT FALSE NOT NULL, `vouch_count` NUMERIC DEFAULT 0 NOT NULL, "cascades_seeded" NUMERIC DEFAULT 0 NOT NULL, "cascades_received" NUMERIC DEFAULT 0 NOT NULL, "cascades_passed" NUMERIC DEFAULT 0 NOT NULL, "cascades_broken" NUMERIC DEFAULT 0 NOT NULL, "cascade_reputation" NUMERIC DEFAULT 0 NOT NULL, "cascade_restricted_until" TEXT DEFAULT '' NOT NULL, "can_enter_cascades" BOOLEAN DEFAULT FALSE NOT NULL, "preferred_regions" JSON DEFAULT NULL, "phone_verified" BOOLEAN DEFAULT FALSE NOT NULL, "phone_hash" TEXT DEFAULT '' NOT NULL);
CREATE UNIQUE INDEX _fhggsowykv3hz86_username_idx ON `users` (`username`);
CREATE UNIQUE INDEX _fhggsowykv3hz86_email_idx ON `users` (`email`) WHERE `email` != '';
CREATE UNIQUE INDEX _fhggsowykv3hz86_tokenKey_idx ON `users` (`tokenKey`);
CREATE TABLE `listings` (`bump_date` TEXT DEFAULT '' NOT NULL, `bundle_discount` NUMERIC DEFAULT 0 NOT NULL, `created` TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%fZ')) NOT NULL, `id` TEXT PRIMARY KEY DEFAULT ('r'||lower(hex(randomblob(7)))) NOT NULL, `listing_type` TEXT DEFAULT '' NOT NULL, `location` TEXT DEFAULT '' NOT NULL, `owner` TEXT DEFAULT '' NOT NULL, `photos` JSON DEFAULT '[]' NOT NULL, `prefer_bundle` BOOLEAN DEFAULT FALSE NOT NULL, `status` TEXT DEFAULT '' NOT NULL, `summary` TEXT DEFAULT '' NOT NULL, `title` TEXT DEFAULT '' NOT NULL, `updated` TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%fZ')) NOT NULL, `views` NUMERIC DEFAULT 0 NOT NULL, "photo_region_map" JSON DEFAULT NULL, "status_history" JSON DEFAULT NULL, "regions" JSON DEFAULT '[]' NOT NULL);
CREATE TABLE IF NOT EXISTS "items" (`bgg_id` NUMERIC DEFAULT 0 NOT NULL, `condition` TEXT DEFAULT '' NOT NULL, `created` TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%fZ')) NOT NULL, `id` TEXT PRIMARY KEY DEFAULT ('r'||lower(hex(randomblob(7)))) NOT NULL, `listing` TEXT DEFAULT '' NOT NULL, `notes` TEXT DEFAULT '' NOT NULL, `photo_regions` JSON DEFAULT NULL, `price` NUMERIC DEFAULT 0 NOT NULL, `status` TEXT DEFAULT '' NOT NULL, `title` TEXT DEFAULT '' NOT NULL, `trade_value` NUMERIC DEFAULT 0 NOT NULL, `updated` TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%fZ')) NOT NULL, `year` NUMERIC DEFAULT 0 NOT NULL, "price_history" JSON DEFAULT NULL, "can_post" BOOLEAN DEFAULT FALSE NOT NULL);
CREATE TABLE `messages` (`content` TEXT DEFAULT '' NOT NULL, `created` TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%fZ')) NOT NULL, `id` TEXT PRIMARY KEY DEFAULT ('r'||lower(hex(randomblob(7)))) NOT NULL, `is_public` BOOLEAN DEFAULT FALSE NOT NULL, `listing` TEXT DEFAULT '' NOT NULL, `read` BOOLEAN DEFAULT FALSE NOT NULL, `recipient` TEXT DEFAULT '' NOT NULL, `sender` TEXT DEFAULT '' NOT NULL, `thread_id` TEXT DEFAULT '' NOT NULL, `updated` TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%fZ')) NOT NULL);
CREATE INDEX `idx_messages_listing_thread` ON `messages` (
  `listing`,
  `thread_id`
);
CREATE INDEX `idx_messages_sender` ON `messages` (`sender`);
CREATE TABLE `trades` (`buyer` TEXT DEFAULT '' NOT NULL, `completed_date` TEXT DEFAULT '' NOT NULL, `created` TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%fZ')) NOT NULL, `id` TEXT PRIMARY KEY DEFAULT ('r'||lower(hex(randomblob(7)))) NOT NULL, `listing` TEXT DEFAULT '' NOT NULL, `rating` NUMERIC DEFAULT 0 NOT NULL, `review` TEXT DEFAULT '' NOT NULL, `seller` TEXT DEFAULT '' NOT NULL, `status` TEXT DEFAULT '' NOT NULL, `updated` TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%fZ')) NOT NULL, "shipping_method" TEXT DEFAULT '' NOT NULL, "games" JSON DEFAULT '[]' NOT NULL);
CREATE TABLE `vouches` (`created` TEXT DEFAULT '' NOT NULL, `id` TEXT PRIMARY KEY DEFAULT ('r'||lower(hex(randomblob(7)))) NOT NULL, `message` TEXT DEFAULT '' NOT NULL, `updated` TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%fZ')) NOT NULL, `vouchee` TEXT DEFAULT '' NOT NULL, `voucher` TEXT DEFAULT '' NOT NULL);
CREATE INDEX `idx_vouches_vouchee` ON `vouches` (`vouchee`);
CREATE TABLE `notifications` (`created` TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%fZ')) NOT NULL, `id` TEXT PRIMARY KEY DEFAULT ('r'||lower(hex(randomblob(7)))) NOT NULL, `link` TEXT DEFAULT '' NOT NULL, `listing` TEXT DEFAULT '' NOT NULL, `message` TEXT DEFAULT '' NOT NULL, `read` BOOLEAN DEFAULT FALSE NOT NULL, `title` TEXT DEFAULT '' NOT NULL, `type` TEXT DEFAULT '' NOT NULL, `updated` TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%fZ')) NOT NULL, `user` TEXT DEFAULT '' NOT NULL);
CREATE TABLE `cascades` (`created` TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%fZ')) NOT NULL, `current_game` TEXT DEFAULT '' NOT NULL, `current_holder` TEXT DEFAULT '' NOT NULL, `description` TEXT DEFAULT '' NOT NULL, `entry_count` NUMERIC DEFAULT 0 NOT NULL, `entry_deadline` TEXT DEFAULT '' NOT NULL, `generation` NUMERIC DEFAULT 0 NOT NULL, `id` TEXT PRIMARY KEY DEFAULT ('r'||lower(hex(randomblob(7)))) NOT NULL, `name` TEXT DEFAULT '' NOT NULL, `origin_cascade` TEXT DEFAULT '' NOT NULL, `pass_deadline` TEXT DEFAULT '' NOT NULL, `previous_cascade` TEXT DEFAULT '' NOT NULL, `received_at` TEXT DEFAULT '' NOT NULL, `received_confirmed_by` TEXT DEFAULT '' NOT NULL, `region` TEXT DEFAULT '' NOT NULL, `shipped_at` TEXT DEFAULT '' NOT NULL, `shipping_requirement` TEXT DEFAULT '' NOT NULL, `shipping_tracking` TEXT DEFAULT '' NOT NULL, `special_rules` TEXT DEFAULT '' NOT NULL, `status` TEXT DEFAULT '' NOT NULL, `updated` TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%fZ')) NOT NULL, `view_count` NUMERIC DEFAULT 0 NOT NULL, `winner` TEXT DEFAULT '' NOT NULL);
CREATE INDEX `idx_cascades_status` ON `cascades` (`status`);
CREATE INDEX `idx_cascades_holder` ON `cascades` (`current_holder`);
CREATE INDEX `idx_cascades_deadline` ON `cascades` (`entry_deadline`);
CREATE INDEX `idx_cascades_region` ON `cascades` (`region`);
CREATE INDEX `idx_cascades_winner` ON `cascades` (`winner`);
CREATE TABLE `cascade_entries` (`cascade` TEXT DEFAULT '' NOT NULL, `created` TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%fZ')) NOT NULL, `id` TEXT PRIMARY KEY DEFAULT ('r'||lower(hex(randomblob(7)))) NOT NULL, `message` TEXT DEFAULT '' NOT NULL, `updated` TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%fZ')) NOT NULL, `user` TEXT DEFAULT '' NOT NULL, `withdrew` BOOLEAN DEFAULT FALSE NOT NULL);
CREATE INDEX `idx_entries_cascade` ON `cascade_entries` (`cascade`);
CREATE INDEX `idx_entries_user` ON `cascade_entries` (`user`);
CREATE UNIQUE INDEX `idx_entries_cascade_user` ON `cascade_entries` (
  `cascade`,
  `user`
);
CREATE TABLE `cascade_history` (`actor` TEXT DEFAULT '' NOT NULL, `cascade` TEXT DEFAULT '' NOT NULL, `created` TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%fZ')) NOT NULL, `event_date` TEXT DEFAULT '' NOT NULL, `event_type` TEXT DEFAULT '' NOT NULL, `game` TEXT DEFAULT '' NOT NULL, `generation` NUMERIC DEFAULT 0 NOT NULL, `id` TEXT PRIMARY KEY DEFAULT ('r'||lower(hex(randomblob(7)))) NOT NULL, `notes` TEXT DEFAULT '' NOT NULL, `related_user` TEXT DEFAULT '' NOT NULL, `shipped_to_location` TEXT DEFAULT '' NOT NULL, `shipping_days` NUMERIC DEFAULT 0 NOT NULL, `updated` TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%fZ')) NOT NULL);
CREATE INDEX `idx_history_cascade` ON `cascade_history` (`cascade`);
CREATE INDEX `idx_history_actor` ON `cascade_history` (`actor`);
CREATE INDEX `idx_history_event_date` ON `cascade_history` (`event_date`);
CREATE TABLE `reactions` (`created` TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%fZ')) NOT NULL, `emoji` TEXT DEFAULT '' NOT NULL, `id` TEXT PRIMARY KEY DEFAULT ('r'||lower(hex(randomblob(7)))) NOT NULL, `listing` TEXT DEFAULT '' NOT NULL, `updated` TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%fZ')) NOT NULL, `user` TEXT DEFAULT '' NOT NULL);
CREATE UNIQUE INDEX `idx_user_listing` ON `reactions` (
  `user`,
  `listing`
);
CREATE TABLE `discussion_threads` (`author` TEXT DEFAULT '' NOT NULL, `content` TEXT DEFAULT '' NOT NULL, `created` TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%fZ')) NOT NULL, `id` TEXT PRIMARY KEY DEFAULT ('r'||lower(hex(randomblob(7)))) NOT NULL, `last_reply_at` TEXT DEFAULT '' NOT NULL, `locked` BOOLEAN DEFAULT FALSE NOT NULL, `pinned` BOOLEAN DEFAULT FALSE NOT NULL, `reply_count` NUMERIC DEFAULT 0 NOT NULL, `title` TEXT DEFAULT '' NOT NULL, `updated` TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%fZ')) NOT NULL, `view_count` NUMERIC DEFAULT 0 NOT NULL, "listing" TEXT DEFAULT '' NOT NULL);
CREATE TABLE `discussion_replies` (`author` TEXT DEFAULT '' NOT NULL, `content` TEXT DEFAULT '' NOT NULL, `created` TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%fZ')) NOT NULL, `id` TEXT PRIMARY KEY DEFAULT ('r'||lower(hex(randomblob(7)))) NOT NULL, `thread` TEXT DEFAULT '' NOT NULL, `updated` TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%fZ')) NOT NULL);
CREATE INDEX `idx_replies_thread` ON `discussion_replies` (`thread`);
CREATE INDEX `idx_replies_author` ON `discussion_replies` (`author`);
CREATE INDEX `idx_replies_created` ON `discussion_replies` (`created`);
CREATE TABLE `discussion_subscriptions` (`created` TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%fZ')) NOT NULL, `id` TEXT PRIMARY KEY DEFAULT ('r'||lower(hex(randomblob(7)))) NOT NULL, `thread` TEXT DEFAULT '' NOT NULL, `updated` TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%fZ')) NOT NULL, `user` TEXT DEFAULT '' NOT NULL);
CREATE INDEX `idx_subs_user` ON `discussion_subscriptions` (`user`);
CREATE INDEX `idx_subs_thread` ON `discussion_subscriptions` (`thread`);
CREATE UNIQUE INDEX `idx_subs_user_thread` ON `discussion_subscriptions` (
  `user`,
  `thread`
);
CREATE INDEX `idx_notifications_user` ON `notifications` (`user`);
CREATE INDEX `idx_notifications_user_read` ON `notifications` (
  `user`,
  `read`
);
CREATE TABLE `verification_requests` (`assigned_at` TEXT DEFAULT '' NOT NULL, `completed_at` TEXT DEFAULT '' NOT NULL, `created` TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%fZ')) NOT NULL, `expires_at` TEXT DEFAULT '' NOT NULL, `id` TEXT PRIMARY KEY DEFAULT ('r'||lower(hex(randomblob(7)))) NOT NULL, `phone_hash` TEXT DEFAULT '' NOT NULL, `phone_last_four` TEXT DEFAULT '' NOT NULL, `queue_position` NUMERIC DEFAULT 0 NOT NULL, `status` TEXT DEFAULT '' NOT NULL, `updated` TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%fZ')) NOT NULL, `user` TEXT DEFAULT '' NOT NULL);
CREATE INDEX `idx_verification_requests_status` ON `verification_requests` (`status`);
CREATE INDEX `idx_verification_requests_user` ON `verification_requests` (`user`);
CREATE TABLE `verification_links` (`attempt_count` NUMERIC DEFAULT 0 NOT NULL, `code` TEXT DEFAULT '' NOT NULL, `created` TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%fZ')) NOT NULL, `expires_at` TEXT DEFAULT '' NOT NULL, `id` TEXT PRIMARY KEY DEFAULT ('r'||lower(hex(randomblob(7)))) NOT NULL, `request` TEXT DEFAULT '' NOT NULL, `target_phone_hash` TEXT DEFAULT '' NOT NULL, `updated` TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%fZ')) NOT NULL, `used` BOOLEAN DEFAULT FALSE NOT NULL, `used_at` TEXT DEFAULT '' NOT NULL, `verifier` TEXT DEFAULT '' NOT NULL);
CREATE UNIQUE INDEX `idx_verification_links_code` ON `verification_links` (`code`);
CREATE INDEX `idx_verification_links_request` ON `verification_links` (`request`);
CREATE TABLE `verifier_settings` (`created` TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%fZ')) NOT NULL, `id` TEXT PRIMARY KEY DEFAULT ('r'||lower(hex(randomblob(7)))) NOT NULL, `is_active` BOOLEAN DEFAULT FALSE NOT NULL, `karma_earned` NUMERIC DEFAULT 0 NOT NULL, `last_verification` TEXT DEFAULT '' NOT NULL, `success_count` NUMERIC DEFAULT 0 NOT NULL, `total_verifications` NUMERIC DEFAULT 0 NOT NULL, `updated` TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%fZ')) NOT NULL, `user` TEXT DEFAULT '' NOT NULL, `weekly_limit` NUMERIC DEFAULT 0 NOT NULL);
CREATE INDEX `idx_verifier_settings_user` ON `verifier_settings` (`user`);
CREATE TABLE `verification_pairs` (`created` TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%fZ')) NOT NULL, `id` TEXT PRIMARY KEY DEFAULT ('r'||lower(hex(randomblob(7)))) NOT NULL, `updated` TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%fZ')) NOT NULL, `verified` TEXT DEFAULT '' NOT NULL, `verified_at` TEXT DEFAULT '' NOT NULL, `verifier` TEXT DEFAULT '' NOT NULL);
CREATE UNIQUE INDEX `idx_verification_pairs_unique` ON `verification_pairs` (
  `verifier`,
  `verified`
);
CREATE INDEX `idx_users_display_name` ON `users` (`display_name`);
CREATE INDEX `idx_users_location` ON `users` (`location`);
CREATE INDEX `idx_threads_author` ON `discussion_threads` (`author`);
CREATE INDEX `idx_threads_created` ON `discussion_threads` (`created`);
CREATE INDEX `idx_threads_last_reply` ON `discussion_threads` (`last_reply_at`);
CREATE INDEX `idx_threads_listing` ON `discussion_threads` (`listing`);
CREATE INDEX `idx_listings_owner` ON `listings` (`owner`);
CREATE INDEX `idx_listings_status` ON `listings` (`status`);
CREATE INDEX `idx_listings_type` ON `listings` (`listing_type`);
CREATE TABLE `bgg_info` (`average_rating` NUMERIC DEFAULT 0 NOT NULL, `bgg_id` NUMERIC DEFAULT 0 NOT NULL, `bgg_rank` NUMERIC DEFAULT 0 NOT NULL, `categories` JSON DEFAULT NULL, `complexity_weight` NUMERIC DEFAULT 0 NOT NULL, `created` TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%fZ')) NOT NULL, `description` TEXT DEFAULT '' NOT NULL, `designers` JSON DEFAULT NULL, `fetch_error` TEXT DEFAULT '' NOT NULL, `id` TEXT PRIMARY KEY DEFAULT ('r'||lower(hex(randomblob(7)))) NOT NULL, `image_url` TEXT DEFAULT '' NOT NULL, `last_fetched` TEXT DEFAULT '' NOT NULL, `max_players` NUMERIC DEFAULT 0 NOT NULL, `max_playtime` NUMERIC DEFAULT 0 NOT NULL, `mechanics` JSON DEFAULT NULL, `min_age` NUMERIC DEFAULT 0 NOT NULL, `min_players` NUMERIC DEFAULT 0 NOT NULL, `min_playtime` NUMERIC DEFAULT 0 NOT NULL, `num_ratings` NUMERIC DEFAULT 0 NOT NULL, `publishers` JSON DEFAULT NULL, `rating_stddev` NUMERIC DEFAULT 0 NOT NULL, `thumbnail_url` TEXT DEFAULT '' NOT NULL, `title` TEXT DEFAULT '' NOT NULL, `updated` TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%fZ')) NOT NULL, `user` TEXT DEFAULT '' NOT NULL, `year_published` NUMERIC DEFAULT 0 NOT NULL);
CREATE UNIQUE INDEX `idx_bgg_info_user_bgg_id` ON `bgg_info` (
  `user`,
  `bgg_id`
);
CREATE INDEX `idx_bgg_info_bgg_id` ON `bgg_info` (`bgg_id`);
CREATE INDEX `idx_bgg_info_title` ON `bgg_info` (`title`);
CREATE INDEX `idx_bgg_info_last_fetched` ON `bgg_info` (`last_fetched`);
CREATE INDEX `idx_games_listing` ON `items` (`listing`);
CREATE INDEX `idx_games_bgg_id` ON `items` (`bgg_id`);
CREATE INDEX `idx_trades_listing` ON `trades` (`listing`);
CREATE INDEX `idx_trades_participants` ON `trades` (
  `buyer`,
  `seller`
);
