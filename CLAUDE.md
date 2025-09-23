# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development

- `just dev` - Primary dev command: installs dependencies, sets up .env, downloads PocketBase, applies migrations, and starts both PocketBase and SvelteKit dev servers
- `npm run dev` - Start SvelteKit dev server only (requires PocketBase running separately)

### Testing

- `npm run test` - Run Vitest unit tests
- `npm run test:watch` - Run Vitest in watch mode
- `npm run test:e2e` - Run Playwright end-to-end tests
- `npm run test:e2e:ui` - Run Playwright tests with UI

### Code Quality

- `npm run lint` - Format with Prettier and lint with ESLint
- `npm run format` - Format code with Prettier
- `npm run check` - Run Svelte type checking
- `npm run check:watch` - Run Svelte type checking in watch mode

### Build & Data

- `npm run build` - Production build via SvelteKit
- `npm run preview` - Preview production build
- `npm run seed:demo` - Seed database with demo data using `scripts/seed-demo-data.ts`

## Architecture

### Tech Stack

- **Frontend**: SvelteKit 2 with TypeScript and Tailwind CSS 4
- **Backend**: PocketBase (embedded SQLite with real-time APIs)
- **Testing**: Vitest for unit tests, Playwright for e2e
- **Build**: Vite, ESLint, Prettier

### Project Structure

- `src/routes/` - SvelteKit pages and API routes following file-based routing
- `src/lib/components/` - Reusable Svelte components (PascalCase naming)
- `src/lib/types/` - TypeScript type definitions for PocketBase records and domain models
- `src/lib/utils/` - Utility functions (camelCase naming)
- `services/pocketbase/` - PocketBase schema and migrations
- `scripts/` - Development and deployment scripts
- `static/` - Static assets served by SvelteKit

### PocketBase Integration

- Schema defined in `services/pocketbase/schema/pb_schema.json`
- Migrations in `services/pocketbase/migrations/`
- TypeScript types in `src/lib/types/pocketbase.ts` and `src/lib/types/listing.ts`
- Core collections: users (auth), listings, games, messages, trades, vouches, watchlist

### Key Domain Models

- **Listings**: Marketplace posts owned by users, support trade/sell/want types
- **Games**: Individual games within listings with condition, pricing, and BGG integration
- **Users**: Extended auth records with profile data, trade history, and trust metrics

### Development Workflow

1. `just dev` handles full environment setup including PocketBase binary download
2. Migrations auto-apply on startup
3. Frontend connects to PocketBase at http://127.0.0.1:8090 (configurable via `POCKETBASE_URL`)
4. Use snake_case for PocketBase field names, camelCase for TypeScript

### Testing Strategy

- Unit tests adjacent to source files (e.g., `Component.test.ts`)
- Mock PocketBase via shared test utilities
- E2e tests hit dev server with in-memory PocketBase
- Target >80% statement coverage

### Code Style (enforced by Prettier/ESLint)

- 2-space indentation, single quotes, trailing commas
- Components use PascalCase, utilities use camelCase
- Group Tailwind classes logically (layout → spacing → typography)
- Explicit TypeScript types at API boundaries
