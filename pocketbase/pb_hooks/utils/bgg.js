/// <reference path="../../pb_data/types.d.ts" />

/**
 * BGG proxy request handling, shared by both routes in bgg.pb.js.
 *
 * PocketBase executes each route handler in its own goja runtime, so bgg.pb.js's handlers
 * cannot close over module-scope values defined in that file (confirmed empirically: a
 * handler referencing a sibling top-level function or const from bgg.pb.js throws
 * `ReferenceError: ... is not defined` at request time). Everything the handlers need
 * therefore lives here and is pulled in with `require` from inside the handler body - the
 * same pattern reputation.pb.js already uses via utils/reputation.js.
 *
 * `$os`, `$http`, `BadRequestError` and `toString` are PocketBase host globals, available
 * in whichever runtime this file ends up required into (they are not module-scope values,
 * so they are not subject to the isolation above).
 */

const BGG_UPSTREAM = 'https://boardgamegeek.com/xmlapi2';
const MIN_REQUEST_GAP_MS = 1000; // BGG's guidance: roughly one request per second.
const MAX_QUERY_LENGTH = 100;
const MAX_IDS = 20;

// Key into $app.store() (a Go-level, concurrency-safe store shared across every JS
// runtime) used to persist the last-call timestamp for the rate limit below. A plain JS
// module-scope variable would not survive between requests for the same reason bgg.pb.js's
// own top-level scope is unreachable from its handlers.
const RATE_LIMIT_STORE_KEY = 'bgg_last_upstream_call_at';

const ALLOWED_PARAMS = {
  search: ['query', 'type', 'exact'],
  thing: ['id', 'stats', 'type'],
};

function isValidIdList(value) {
  const ids = value.split(',');
  if (ids.length === 0 || ids.length > MAX_IDS) {
    return false;
  }
  return ids.every((id) => /^[0-9]+$/.test(id.trim()));
}

/**
 * Validates the request's query params against the given endpoint's allow-list and builds
 * the upstream query string. Throws BadRequestError (-> HTTP 400) for anything disallowed,
 * oversized, or malformed.
 */
function buildUpstreamQuery(endpoint, query) {
  const allowed = ALLOWED_PARAMS[endpoint];

  for (const key of Object.keys(query)) {
    if (allowed.indexOf(key) === -1) {
      throw new BadRequestError(`Unsupported query parameter "${key}".`);
    }
  }

  const parts = [];
  for (const key of allowed) {
    const value = query[key];
    if (value === undefined || value === null || value === '') {
      continue;
    }

    if (key === 'query' && value.length > MAX_QUERY_LENGTH) {
      throw new BadRequestError(`"query" must be at most ${MAX_QUERY_LENGTH} characters.`);
    }
    if (key === 'id' && !isValidIdList(value)) {
      throw new BadRequestError(`"id" must be at most ${MAX_IDS} comma-separated integers.`);
    }

    parts.push(`${key}=${encodeURIComponent(value)}`);
  }

  return parts.join('&');
}

/**
 * Handles a single BGG proxy request for the given endpoint ('search' or 'thing').
 *
 * @param {*} app - the PocketBase `$app` global from the calling handler.
 * @param {*} e - the PocketBase RequestEvent from the calling handler.
 * @param {'search'|'thing'} endpoint
 */
function handleBggRequest(app, e, endpoint) {
  const info = e.requestInfo();

  // Validate first: bad input is rejected the same way whether or not the token is
  // configured, so a misconfigured deploy doesn't mask a caller's mistake.
  const upstreamQuery = buildUpstreamQuery(endpoint, info.query || {});

  const token = $os.getenv('BGG_TOKEN');
  if (!token) {
    e.json(503, { error: 'BGG_TOKEN not configured' });
    return;
  }

  const now = Date.now();
  // Not atomic (get + set is two separate store calls), so two requests arriving at the
  // exact same instant could both read the same lastCall and both proceed - an acceptable
  // approximation for a ~1 req/s guidance limit, not a hard guarantee.
  const lastCall = app.store().get(RATE_LIMIT_STORE_KEY) || 0;
  if (now - lastCall < MIN_REQUEST_GAP_MS) {
    e.response.header().set('Retry-After', '1');
    e.string(429, 'Too many requests to the BGG proxy; retry in 1 second.');
    return;
  }
  app.store().set(RATE_LIMIT_STORE_KEY, now);

  const res = $http.send({
    url: `${BGG_UPSTREAM}/${endpoint}?${upstreamQuery}`,
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
    timeout: 30,
  });

  // Pass the upstream status straight through - including 202, which BGG uses to mean
  // "request queued, try again shortly" so the browser client's existing retry logic keeps
  // working unchanged.
  e.blob(res.statusCode, 'text/xml', toString(res.body));
}

module.exports = {
  BGG_UPSTREAM,
  MIN_REQUEST_GAP_MS,
  MAX_QUERY_LENGTH,
  MAX_IDS,
  ALLOWED_PARAMS,
  isValidIdList,
  buildUpstreamQuery,
  handleBggRequest,
};
