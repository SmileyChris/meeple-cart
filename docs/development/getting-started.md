# Getting Started

## Local prerequisites

- Node.js 20+ is required for the SvelteKit frontend.
- PocketBase runs as a standalone binary; the `just dev` command downloads the correct version automatically.
- Ensure `uv` is installed if you plan to serve the documentation locally (see below).

## Common workflows

```bash
# Install dependencies
npm install

# Start the full stack (PocketBase + SvelteKit)
just dev

# Run linting and type checks
npm run lint

# Run unit and integration tests
npm run test
```

PocketBase migrations are located under `pocketbase/pb_migrations/`. When you modify the schema, update `pocketbase/schema/pb_schema.json` to keep the snapshot in sync.

## Documentation preview

MkDocs (Material theme) powers these docs. With `uv` available, you can serve the site locally using `just docs`, which runs `uvx --from mkdocs-material mkdocs serve` under the hood.
