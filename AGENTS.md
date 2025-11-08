# Repository Guidelines

## Project Structure & Module Organization

Meeple Cart currently contains planning docs in `spec/`. Keep the SvelteKit frontend under `src/` (standard `src/routes`, `src/lib`, `src/lib/components`) and PocketBase artifacts under `pocketbase/` (`schema/pb_schema.json` as the snapshot, `README.md` for usage, `pb_migrations/` for scripts, `pb_data/` for runtime data, and `migrations_backup/` for historical diffs). Shared packages (types, utilities) live under `packages/` with each module exported via `index.ts`. Store static assets in root `static/` and infrastructure files (Docker Compose, Fly.io configs) under `infra/`. Place the PocketBase binary plus runtime data inside `/pocketbase/`; migrations and schema files stay tracked while the binary remains gitignored.

## Build, Test, and Development Commands

Install dependencies with `npm install` from the project root. Use `just dev` to download PocketBase (if needed), apply migrations from `pocketbase/pb_migrations/`, launch the PocketBase server, and start the SvelteKit dev server simultaneously. When running services separately, invoke `scripts/download-pocketbase.sh`, `./pocketbase/pocketbase migrate up --dir pocketbase/pb_data --migrationsDir pocketbase/pb_migrations`, and `npm run dev`. Set `POCKETBASE_URL` in `.env` if you run the backend on a custom host. Execute type checks and linting via `npm run lint`, run the unit suite with `npm run test`, and call `npm run format` before pushing.

## Coding Style & Naming Conventions

Use TypeScript everywhere; prefer explicit types at API boundaries. Components follow PascalCase (`ListingCard.svelte`), utilities stay camelCase (`priceFormatter.ts`). Maintain 2-space indentation, trailing commas, and single quotes—Prettier and ESLint configs in the repo root enforce this. Tailwind utility classes should be grouped logically (layout → spacing → typography). PocketBase collection and field IDs use snake_case for clarity.

## Testing Guidelines

Vitest drives unit and integration tests inside `src/`. Place component tests adjacent to the source (`Component.test.ts`) and mock PocketBase via the shared test utilities in `packages/testing`. End-to-end coverage runs through Playwright (`npm run test:e2e`) hitting the dev server plus in-memory PocketBase. Aim for >80% statement coverage; CI will fail below that threshold.

## Commit & Pull Request Guidelines

There is no existing Git history, so adopt Conventional Commits (`feat:`, `fix:`, `chore:`) to keep the log searchable. Each pull request must describe the what/why, link to relevant spec sections (e.g., `spec/prd.md#success-metrics`), and include screenshots or terminal output when UI or CLI changes occur. Confirm linting, unit tests, and migrations all pass before requesting review, and note any follow-up work as TODOs in the PR body.
