/// <reference path="../../pb_data/types.d.ts" />

/**
 * Helpers shared by the hook handlers.
 *
 * PocketBase executes each handler in its own goja runtime, so handlers cannot close over
 * module-scope values from reputation.pb.js. Anything shared has to live here and be
 * `require`d from inside the handler body.
 */

/** Apply a signed delta to numeric fields on a user. Counters never go below zero. */
function adjustUser(app, userId, deltas) {
  if (!userId) return;

  let user;
  try {
    user = app.findRecordById('users', userId);
  } catch (err) {
    return; // Account removed; nothing to maintain.
  }

  for (const field in deltas) {
    const next = (user.getInt(field) || 0) + deltas[field];
    user.set(field, next < 0 ? 0 : next);
  }

  app.save(user);
}

module.exports = { adjustUser };
