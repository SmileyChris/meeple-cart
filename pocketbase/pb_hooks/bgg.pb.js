/// <reference path="../pb_data/types.d.ts" />

// Proxies two read-only BoardGameGeek XML API2 endpoints so the browser (a client-side SPA
// with no server of its own besides PocketBase) never has to hold BGG_TOKEN. As of
// 2026-09-12 BGG requires `Authorization: Bearer <token>` on every request and returns 401
// without it - see https://boardgamegeek.com/wiki/page/BGG_XML_API2.
//
// PocketBase executes each route handler in its own goja runtime, so the actual proxy
// logic (query validation, rate limiting, the upstream call) lives in utils/bgg.js and is
// pulled in with `require` from inside each handler body - see that file's header comment,
// and reputation.pb.js / utils/reputation.js for the same pattern already used elsewhere in
// this codebase.
//
// Both routes require a logged-in user ($apis.requireAuth()): anonymous access would let
// any script consume the shared ~1 req/s upstream budget. Every current caller
// (BggSearch.svelte, used from listings/new and the trade-party submission form) already
// only runs for an authenticated user.

onBootstrap((e) => {
  e.next();

  if (!$os.getenv('BGG_TOKEN')) {
    console.warn(
      '[bgg] BGG_TOKEN is not set; /api/bgg/search and /api/bgg/thing will respond 503 until it is configured.'
    );
  }
});

routerAdd(
  'GET',
  '/api/bgg/search',
  (e) => {
    const { handleBggRequest } = require(`${__hooks}/utils/bgg.js`);
    handleBggRequest($app, e, 'search');
  },
  $apis.requireAuth()
);

routerAdd(
  'GET',
  '/api/bgg/thing',
  (e) => {
    const { handleBggRequest } = require(`${__hooks}/utils/bgg.js`);
    handleBggRequest($app, e, 'thing');
  },
  $apis.requireAuth()
);
