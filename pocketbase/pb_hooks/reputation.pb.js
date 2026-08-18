/// <reference path="../pb_data/types.d.ts" />

// Server-side ownership of every trust-bearing counter on the users collection.
//
// These fields are denied to clients by 1739800100_harden_collection_rules.js, so this file
// is the only thing that may write them. Previously the browser incremented them directly,
// which meant any user could PATCH themselves an arbitrary reputation — and, because a
// client can only write its own record, the cross-user increments in the trade and vouch
// flows would 403 mid-handler and abort the rest of the flow.
//
// Each handler runs in its own runtime and cannot see anything defined in this file's
// scope, so shared helpers are pulled in with `require` inside the handler body.

// --- new accounts start from known defaults ---------------------------------
// Registration is anonymous, so the client is not allowed to send these at all.
onRecordCreate((e) => {
  e.record.set('trade_count', 0);
  e.record.set('vouch_count', 0);
  e.record.set('cascades_seeded', 0);
  e.record.set('cascades_received', 0);
  e.record.set('cascades_passed', 0);
  e.record.set('cascades_broken', 0);
  e.record.set('cascade_reputation', 50);
  e.record.set('can_enter_cascades', true);
  e.record.set('phone_verified', false);

  if (!e.record.getString('joined_date')) {
    e.record.set('joined_date', new Date().toISOString());
  }

  e.next();
}, 'users');

// --- vouches ----------------------------------------------------------------
onRecordCreate((e) => {
  const { adjustUser } = require(`${__hooks}/utils/reputation.js`);

  const voucher = e.record.getString('voucher');
  const vouchee = e.record.getString('vouchee');

  // One vouch per direction per pair, so repeat vouching cannot inflate trust.
  const existing = $app.findRecordsByFilter(
    'vouches',
    'voucher = {:voucher} && vouchee = {:vouchee}',
    '',
    1,
    0,
    { voucher: voucher, vouchee: vouchee }
  );
  if (existing.length > 0) {
    throw new BadRequestError('You have already vouched for this member.');
  }

  e.next();
  adjustUser($app, vouchee, { vouch_count: 1 });
}, 'vouches');

onRecordDelete((e) => {
  const { adjustUser } = require(`${__hooks}/utils/reputation.js`);
  const vouchee = e.record.getString('vouchee');
  e.next();
  adjustUser($app, vouchee, { vouch_count: -1 });
}, 'vouches');

// --- trades -----------------------------------------------------------------
// Increment both sides exactly once, on the transition into `completed`.
onRecordUpdate((e) => {
  const { adjustUser } = require(`${__hooks}/utils/reputation.js`);

  let previous = '';
  try {
    previous = $app.findRecordById('trades', e.record.id).getString('status');
  } catch (err) {
    previous = '';
  }

  const next = e.record.getString('status');

  e.next();

  if (next === 'completed' && previous !== 'completed') {
    adjustUser($app, e.record.getString('buyer'), { trade_count: 1 });
    adjustUser($app, e.record.getString('seller'), { trade_count: 1 });
  }
}, 'trades');

// --- cascades ---------------------------------------------------------------
onRecordCreate((e) => {
  const { adjustUser } = require(`${__hooks}/utils/reputation.js`);
  e.next();
  adjustUser($app, e.record.getString('current_holder'), { cascades_seeded: 1 });
}, 'cascades');

// --- phone verification -----------------------------------------------------
// `phone_verified` is a trust signal, so it is set only when a verification link is
// actually redeemed, never by either party writing the field directly.
onRecordUpdate((e) => {
  e.next();

  if (!e.record.getBool('used')) return;

  let request;
  try {
    request = $app.findRecordById('verification_requests', e.record.getString('request'));
  } catch (err) {
    return;
  }

  const userId = request.getString('user');
  if (!userId) return;

  try {
    const user = $app.findRecordById('users', userId);
    user.set('phone_verified', true);
    $app.save(user);
  } catch (err) {
    // Account removed between redemption and this hook.
  }
}, 'verification_links');
