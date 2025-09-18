# Meeple Cart

Meeple Cart is an in-progress trading platform for Aotearoa's board-gaming community. This repository currently provides the SvelteKit scaffold, Tailwind CSS 4 pipeline, PocketBase schema, baseline linting/formatting, and testing harness (Vitest + Playwright) described in `AGENTS.md`.

## Getting Started

```bash
npm install
just dev
```

The `just dev` recipe runs `scripts/dev.sh`, which ensures the PocketBase binary is downloaded, applies migrations, launches the PocketBase server, and starts the SvelteKit dev server at http://127.0.0.1:5173.

Create a `.env` from `.env.example` if you need to override the default PocketBase URL.

## Useful Scripts

- `npm run lint` – formats and lints the codebase.
- `npm run test` – runs Vitest in headless mode.
- `npm run test:e2e` – launches Playwright end-to-end tests (requires `npx playwright install`).
- `npm run build` – produces a production build via SvelteKit.
- `just dev` – runs PocketBase locally (download + migrate as needed) and starts the SvelteKit dev server.

Refer to `AGENTS.md` for full contributor guidelines.
