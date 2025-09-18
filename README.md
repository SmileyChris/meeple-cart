# Meeple Cart

Meeple Cart is an in-progress trading platform for Aotearoa's board-gaming community. This repository currently provides the SvelteKit scaffold, Tailwind CSS 4 pipeline, PocketBase schema, baseline linting/formatting, and testing harness (Vitest + Playwright) described in `AGENTS.md`.

## Getting Started

```bash
just dev
```

The `just dev` recipe now handles first-run setup for you:

- Installs npm dependencies when `node_modules/` is missing.
- Copies `.env.example` to `.env` if you haven't created one yet (edit it afterward to change settings).
- Runs `scripts/dev.sh`, which downloads PocketBase when necessary, applies migrations, starts the PocketBase server, and launches the SvelteKit dev server at http://127.0.0.1:5173.

## Useful Scripts

- `npm run lint` – formats and lints the codebase.
- `npm run test` – runs Vitest in headless mode.
- `npm run test:e2e` – launches Playwright end-to-end tests (requires `npx playwright install`).
- `npm run build` – produces a production build via SvelteKit.
- `just dev` – runs PocketBase locally (download + migrate as needed) and starts the SvelteKit dev server.

Refer to `AGENTS.md` for full contributor guidelines.
