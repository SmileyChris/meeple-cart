# Meeple Cart

> A dedicated board game trading platform for Aotearoa's board gaming community

**Status:** 70% Complete - Core infrastructure done, trade workflow in progress
**Version:** 0.0.1 (Pre-MVP)
**Target Launch:** 3 weeks

---

## 🎯 What is Meeple Cart?

Meeple Cart enables New Zealand's 10,000+ board gamers to trade, sell, and acquire games without relying on Facebook. The platform provides:

- **Multi-game listings** with condition grading & BGG integration
- **Formal trade workflow** with status tracking & completion verification
- **Trust system** with vouches, ratings, and reputation tiers
- **Private messaging** per listing with notifications
- **Gift cascades** - community game giveaway system
- **Watchlist & search** for discovering games

**Why?** Facebook Marketplace lacks hobby-specific features (condition grading, trade facilitation, trust building) and the community wants a dedicated home.

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- Just command runner (optional but recommended)

### Setup

```bash
# Clone and setup
git clone <repo-url>
cd meeple

# One command to rule them all
just dev
```

The `just dev` recipe handles everything:

- ✅ Installs npm dependencies
- ✅ Creates `.env` from template
- ✅ Downloads PocketBase binary
- ✅ Applies database migrations
- ✅ Starts PocketBase server (http://127.0.0.1:8090)
- ✅ Starts SvelteKit dev server (http://127.0.0.1:5173)

**First run?** Wait ~30 seconds for migrations to complete, then visit http://127.0.0.1:5173

---

## 📋 Project Status

### ✅ Fully Implemented (Ready to Use)

- **Authentication** - Register/login via PocketBase
- **Listing Management** - Create/edit multi-game listings (trade/sell/want)
- **Messaging** - Private threads per listing with notifications
- **Gift Cascades** - Complete lifecycle (create → enter → select winner → track)
- **User Profiles** - Public profiles with stats
- **Notifications** - In-app center + email digests
- **Watchlist** - Save favorite listings
- **Theme Toggle** - Dark/light mode
- **Database Schema** - 11 collections, fully migrated

### 🚧 In Progress (Blocking MVP)

- **Trade Workflow** - Can message but can't formalize trades (UI exists but incomplete)
- **Feedback System** - Database ready, UI missing
- **Vouch System** - Partially wired, needs completion
- **Browse/Search** - Removed during merge, needs client-side rebuild
- **Trust Tiers** - Logic exists but not displayed

### 📅 Coming Next (3-Week Plan)

See **[spec/mvp-plan.md](./spec/mvp-plan.md)** for detailed roadmap.

**Week 1:** Complete trade workflow (initiate → confirm → complete)
**Week 2:** Feedback & trust system (ratings, reviews, vouches)
**Week 3:** Browse/search pages + launch prep

---

## 🛠️ Tech Stack

**Frontend:**

- SvelteKit 2 + Svelte 5 (runes mode)
- Tailwind CSS 4
- TypeScript

**Backend:**

- PocketBase (embedded SQLite)
- Real-time subscriptions
- Built-in auth & file storage

**Testing:**

- Vitest (unit tests)
- Playwright (E2E tests)

**Deployment:**

- Client-side SPA (no SSR)
- Static export via adapter-static
- Can deploy to any static host

---

## 📁 Project Structure

```
meeple/
├── src/
│   ├── routes/              # SvelteKit pages (13 route groups)
│   │   ├── listings/        # Marketplace (create/edit/manage)
│   │   ├── trades/          # Trade tracking (WIP)
│   │   ├── cascades/        # Gift cascade system
│   │   ├── messages/        # Private messaging
│   │   ├── notifications/   # Notification center
│   │   └── ...
│   ├── lib/
│   │   ├── components/      # Reusable Svelte components
│   │   ├── types/           # TypeScript types for PocketBase
│   │   ├── utils/           # Shared utilities
│   │   └── pocketbase.ts    # Client instance
│   └── app.css             # Tailwind + CSS variables
├── pocketbase/
│   ├── pocketbase*          # PocketBase binary (symlink)
│   ├── pocketbase-*/        # Versioned binaries
│   ├── pb_data/             # Local data dir (gitignored)
│   ├── pb_migrations/       # Active migrations
│   ├── migrations_backup/   # Historical migrations
│   ├── schema/              # pb_schema.json snapshot
│   └── README.md            # Backend usage notes
├── spec/                    # Feature specifications & migration docs
│   ├── migration/           # Migration guides and status
│   ├── reports/             # Progress and status reports
│   └── ...                  # Original specifications
├── docs/                    # Architecture & system docs
```

---

## 🧪 Development Commands

```bash
# Development
just dev              # Start PocketBase + SvelteKit dev server
npm run dev           # SvelteKit only (requires PocketBase running)

# Code Quality
npm run lint          # Prettier + ESLint
npm run format        # Prettier only
npm run check         # Svelte type checking

# Testing
npm run test          # Vitest unit tests
npm run test:watch    # Vitest watch mode
npm run test:e2e      # Playwright E2E tests
npm run test:e2e:ui   # Playwright with UI

# Build
npm run build         # Production build
npm run preview       # Preview production build

# Database
npm run seed:demo     # Seed demo data (from scripts/seed-demo-data.ts)
```

---

## 🗃️ Database Collections

| Collection        | Purpose                          | Status                        |
| ----------------- | -------------------------------- | ----------------------------- |
| `users`           | Auth + profiles with trade stats | ✅ Complete                   |
| `listings`        | Marketplace posts (multi-game)   | ✅ Complete                   |
| `games`           | Individual games within listings | ✅ Complete                   |
| `messages`        | Private messaging threads        | ✅ Complete                   |
| `trades`          | Formal trade records             | ✅ Schema done, UI incomplete |
| `vouches`         | Trust vouches between users      | ✅ Schema done, UI incomplete |
| `watchlist`       | Saved listings per user          | ✅ Complete                   |
| `notifications`   | In-app + email notifications     | ✅ Complete                   |
| `cascades`        | Gift cascade events              | ✅ Complete                   |
| `cascade_entries` | User entries in cascades         | ✅ Complete                   |
| `cascade_history` | Cascade event timeline           | ✅ Complete                   |

**Schema:** See `pocketbase/schema/pb_schema.json`
**Migrations:** Stored under `pocketbase/pb_migrations/`

---

## 📖 Documentation

| Document                                                 | Description                                    |
| -------------------------------------------------------- | ---------------------------------------------- |
| **[spec/mvp-plan.md](./spec/mvp-plan.md)**               | **Start here** - 3-week roadmap to launch      |
| [CLAUDE.md](./CLAUDE.md)                                 | Development setup & commands for AI assistants |
| [spec/prd.md](./spec/prd.md)                             | Product requirements & original vision         |
| [spec/trade-flow-gaps.md](./spec/trade-flow-gaps.md)     | Detailed implementation specs for trade flow   |
| [spec/migration/guide.md](./spec/migration/guide.md)     | **Database Setup Guide**                       |
| [docs/trust-and-vouches.md](./docs/trust-and-vouches.md) | Trust system documentation                     |
| [docs/listings.md](./docs/listings.md)                   | Listing lifecycle & mechanics                  |

---

## 🎯 Current Sprint Goals

**This Week:** Complete trade workflow (Days 1-5 from implementation plan)

- [ ] Add "Propose Trade" button to listings
- [ ] Build trade detail page with status management
- [ ] Implement trade completion flow
- [ ] Auto-update listing statuses
- [ ] Create trade dashboard

**Next Week:** Feedback & trust system
**Week After:** Browse/search + launch prep

Track progress in [spec/mvp-plan.md](./spec/mvp-plan.md)

---

## 🤝 Contributing

1. Read [CLAUDE.md](./CLAUDE.md) for setup & conventions
2. Check [spec/mvp-plan.md](./spec/mvp-plan.md) for current priorities
3. Create feature branch: `feat/your-feature-name`
4. Follow existing code style (Prettier enforced)
5. Write tests for new features
6. Submit PR with clear description

**Code Style:**

- 2-space indentation
- Single quotes
- Trailing commas
- PascalCase for components
- camelCase for utilities
- snake_case for PocketBase fields

---

## 🔧 Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# PocketBase URL (client-side accessible)
PUBLIC_POCKETBASE_URL=http://127.0.0.1:8090

# BoardGameGeek API token (server-side only, never exposed to the browser)
BGG_TOKEN=your-bgg-token-here
```

**Note:** The `PUBLIC_` prefix makes this available to browser via `$env/static/public` in SvelteKit.

**BGG_TOKEN:** BoardGameGeek's XML API2 now requires an `Authorization: Bearer <token>` header on every request. Since this app is a client-side SPA, that token can't live in `src/` - `just dev` / `scripts/dev.sh` load it from `.env` into the environment PocketBase runs in, and `pocketbase/pb_hooks/bgg.pb.js` proxies BGG search/lookup requests through `/api/bgg/search` and `/api/bgg/thing` so the browser never sees it. If `BGG_TOKEN` isn't set, those routes respond `503`.

---

## 🐛 Known Issues

- Some ESLint warnings remain (pre-existing, non-critical)
- Browse/wanted pages removed during merge (rebuilding in Week 3)
- Trade workflow incomplete (actively working on it)

See [GitHub Issues](./issues) for full list.

---

## 📊 Metrics (Target Post-Launch)

**Week 1:** 50+ users, 30+ listings, 10+ trades initiated
**Month 1:** 200+ users, 100+ listings, 30+ completed trades
**Quality:** <5% dispute rate, >4.0 avg rating, >50% 7-day retention

---

## 📜 License

[MIT License](./LICENSE) - See LICENSE file for details

---

## 🙏 Acknowledgments

- Built for New Zealand's board gaming community
- Inspired by "Buy, Sell and Trade Boardgames NZ" Facebook group
- BGG (BoardGameGeek) integration for game data
- PocketBase for making real-time apps simple

---

## 📞 Contact & Support

- **Issues:** [GitHub Issues](./issues)
- **Discussions:** [GitHub Discussions](./discussions)
- **Community:** (Will add Discord/Slack link at launch)

---

**Ready to contribute?** Start with [spec/mvp-plan.md](./spec/mvp-plan.md) 🚀
