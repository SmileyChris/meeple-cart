# PocketBase Schema

This directory keeps the PocketBase schema and helper scripts used by Meeple Cart. Bring up PocketBase locally by downloading the binary (`npm run pocketbase:download`) and running `npm run pocketbase:serve`.

## Collections

`schema/pb_schema.json` outlines the managed collections:

- `users` (auth): profile metadata, contact preferences, and trust counters.
- `listings`: high-level listing records owned by users.
- `games`: individual games attached to listings for condition and pricing detail.
- `messages`: public and private conversations scoped to listings.
- `trades`: transaction lifecycle tracking including ratings.
- `vouches`: trust endorsements between community members.
- `watchlist`: saved searches and alerts per user.

Apply the schema using either:

- `just dev` / `scripts/dev.sh`: downloads PocketBase if needed, applies `pocketbase/pb_migrations/` automatically, and starts the local server.
- Manual CLI (repo root): `./pocketbase/pocketbase migrate up --dir pocketbase/pb_data --migrationsDir pocketbase/pb_migrations`
- Manual CLI (`cd pocketbase`): `./pocketbase migrate up`
- Admin UI: Collections → Import → upload `schema/pb_schema.json`

PocketBase stores its local data in `./pb_data` relative to the directory you run it from (so the repo keeps data under `pocketbase/pb_data`). Remove that folder if you need a clean slate. Use `POCKETBASE_URL` (see `.env.example`) to point the SvelteKit app at the running PocketBase instance.
