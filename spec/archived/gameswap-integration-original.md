# GameSwap Feature Integration Spec

**Version:** 1.0
**Date:** 2025-10-30
**Status:** Planning
**Target:** Meeple Cart MVP+
**Product Spec:** See [trade-parties.md](./trade-parties.md) for user-facing feature design

---

## Executive Summary

This document outlines the **technical implementation plan** to integrate proven multi-party trade matching features from the [GameSwap](https://github.com/tactful-ai/gameswap) codebase into Meeple Cart. GameSwap is a production-ready SvelteKit application that uses the TradeMaximizer algorithm (Hungarian algorithm implementation) to compute optimal trade chains for board game exchanges.

**Note:** In Meeple Cart, we call this feature **"Trade Parties"** instead of "Math Trades" to make it more approachable for casual users. See [trade-parties.md](./trade-parties.md) for the complete product specification, user experience design, and feature roadmap.

### What We're Getting

1. **TradeMaximizer Algorithm** - Sophisticated multi-party matching engine
2. **Trade Optimization Logic** - Smart trade chain calculation
3. **Wants Groups** - "Any one of these games" functionality
4. **Cash Integration** - Mixed cash/item trade support
5. **Confirmation Workflow** - Sent/received tracking patterns
6. **Utility Functions** - Currency formatting, time countdown, etc.

### Key Architectural Difference

- **GameSwap:** Event-based batch trading (all trades computed at once for an event)
- **Meeple Cart:** Continuous marketplace (ongoing 1:1 trades between users)

**Adaptation Strategy:** Use TradeMaximizer as an **optional optimization feature** rather than core trade mechanism. Users can manually negotiate trades (MVP Week 1) OR use the "Trade Optimizer" to find multi-party matches (this spec, post-MVP).

---

## Table of Contents

1. [Core Features to Port](#1-core-features-to-port)
2. [Architecture Overview](#2-architecture-overview)
3. [Database Schema Changes](#3-database-schema-changes)
4. [Module Structure](#4-module-structure)
5. [Implementation Plan](#5-implementation-plan)
6. [File Migration Map](#6-file-migration-map)
7. [API Design](#7-api-design)
8. [UI Components](#8-ui-components)
9. [Administrative Management](#9-administrative-management)
10. [Testing Strategy](#10-testing-strategy)
11. [Rollout Plan](#11-rollout-plan)

---

## 1. Core Features to Port

### 1.1 TradeMaximizer Algorithm

**What It Does:**

- Computes optimal multi-party trade chains using the Hungarian algorithm
- Maximizes number of users trading or total chain length
- Handles "any one of" groups via dummy items
- Supports mixed cash/game trades
- Deterministic shuffling for consistent results

**Files to Copy:**

```
gameswap/src/lib/olwlg/trademax.js       → meeple/src/lib/trade-optimizer/trademax.js
gameswap/src/lib/olwlg/_trademax.ts      → meeple/src/lib/trade-optimizer/trademax.ts
gameswap/src/lib/olwlg/javarandom.js     → meeple/src/lib/trade-optimizer/javarandom.js
```

**Adaptations Needed:**

- None for core algorithm (pure logic)
- Update TypeScript wrapper for Meeple's data models

---

### 1.2 Trade Running Logic

**What It Does:**

- Fetches user games, wants, and offers from database
- Builds input format for TradeMaximizer
- Runs algorithm and parses results
- Returns matches as structured data

**File to Adapt:**

```
gameswap/src/routes/(event)/trades/trades.ts → meeple/src/lib/trade-optimizer/runner.ts
```

**Adaptations Needed:**

- Remove event scoping
- Query from Meeple's `listings`, `trade_preferences`, `trade_groups` collections
- Map results to Meeple's trade record format
- Add preview mode (don't create trades, just show possibilities)

---

### 1.3 Wants Groups ("Any One Of")

**What It Does:**

- Users can group multiple wanted items: "I want any one of Games X, Y, Z"
- Specify single offer set for the entire group
- Algorithm uses dummy items to represent groups

**Database Schema (New Collection):**

```typescript
type TradeGroup = {
  id: string;
  user: string; // relation(users)
  name: string; // User-provided name (e.g., "Worker placement games")
  listings: string[]; // Array of listing IDs (any one of these)
  offer_listings: string[]; // What they'll trade for ANY match
  offer_cash: number; // Or cash amount
  created: date;
  updated: date;
};
```

**UI Pattern:**

- Checkbox selection on browse page
- "Create group from selection" button
- Group management page (list groups, edit, delete)

---

### 1.4 Trade Preferences

**What It Does:**

- Users specify what they want and what they'll offer per item
- Multiple offers per want (trade Game A, B, OR C for Game X)
- Cash offers alongside game offers
- Priority ranking (implicit from list order)

**Database Schema (New Collection):**

```typescript
type TradePreference = {
  id: string;
  user: string; // relation(users)
  wanted_listing: string; // relation(listings) - What they want
  offer_listings: string[]; // Array of listing IDs they'll trade
  offer_cash: number; // Or cash amount
  priority: number; // 1 = highest, for ranking
  created: date;
  updated: date;
};
```

**Key Behaviors:**

- User can have multiple preferences for same wanted listing (different offers)
- Lower priority = higher preference in algorithm cost calculation
- Empty offers = "haven't decided yet" warning

---

### 1.5 Confirmation Workflow

**What It Does:**

- Track which items in a trade have been sent/received
- Visual indicators (badges, icons)
- Both parties can mark their side
- Admin override capability

**Database Fields (Add to `trades` collection):**

```typescript
// Extend existing trades collection
type Trade = {
  // ... existing fields
  buyer_items_sent: string[]; // Array of listing IDs sent by buyer
  seller_items_sent: string[]; // Array of listing IDs sent by seller
  buyer_items_received: string[]; // Array of listing IDs received by buyer
  seller_items_received: string[]; // Array of listing IDs received by seller
  confirmation_notes: string; // Optional shipping/tracking info
};
```

**UI Components:**

- Send button (mark as sent)
- Receive button (mark as received)
- Undo action
- Visual states: pending (gray), sent (blue), received (green)

---

### 1.6 Utility Functions

**Currency Formatting:**

```typescript
// gameswap/src/lib/utils.ts → meeple/src/lib/utils/currency.ts
function currency(price: number | null): string {
  return new Intl.NumberFormat('en-NZ', {
    style: 'currency',
    currency: 'NZD',
    trailingZeroDisplay: 'stripIfInteger',
  }).format(price ?? 0);
}
```

**Time Countdown:**

```typescript
// gameswap/src/routes/(event)/remaining.ts → meeple/src/lib/utils/countdown.ts
function timeRemaining(date: Date): string {
  // Returns "2 days 5 hours" or "45 minutes" etc.
}

function countdownStore(date: Date): Readable<string> {
  // Svelte store that updates automatically
}
```

---

## 2. Architecture Overview

### 2.1 Module Organization

```
src/lib/trade-optimizer/
├── algorithm/
│   ├── trademax.js           # Core algorithm (pure JS)
│   ├── trademax.ts           # TypeScript wrapper
│   └── javarandom.js         # Random generator
├── runner.ts                 # Trade calculation orchestrator
├── input-builder.ts          # Build TradeMaximizer input format
├── result-parser.ts          # Parse algorithm output
├── types.ts                  # TypeScript types
└── index.ts                  # Public API

src/lib/trade-preferences/
├── queries.ts                # PocketBase queries
├── validation.ts             # Preference validation
└── types.ts                  # TypeScript types

src/lib/trade-groups/
├── queries.ts                # PocketBase queries
├── validation.ts             # Group validation
└── types.ts                  # TypeScript types

src/routes/optimize-trades/   # New route
├── +page.svelte              # Optimizer UI
├── +page.ts                  # Load user data
└── preview/
    ├── +page.svelte          # Preview results before accepting
    └── +page.ts              # Load preview data

src/routes/preferences/        # New route
├── +page.svelte              # Manage trade preferences
└── +page.ts                  # Load preferences

src/routes/groups/             # New route (or /preferences/groups/)
├── +page.svelte              # Manage trade groups
└── +page.ts                  # Load groups

src/lib/components/TradeOptimizer/
├── PreferenceEditor.svelte   # Edit single preference
├── PreferenceList.svelte     # List all preferences
├── GroupEditor.svelte        # Create/edit group
├── GroupList.svelte          # List all groups
├── OfferSelector.svelte      # Checkbox UI for selecting offers
├── ResultsPreview.svelte     # Show optimization results
├── TradeChainVisualization.svelte  # Graph/list view of chains
└── ConfirmationTracker.svelte      # Sent/received badges
```

---

### 2.2 Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  User Actions                                                    │
├─────────────────────────────────────────────────────────────────┤
│  1. Browse listings                                              │
│  2. Add to preferences (with offers) or groups                   │
│  3. Click "Optimize Trades"                                      │
└───────────────┬─────────────────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────────────┐
│  Trade Optimizer Runner                                          │
├─────────────────────────────────────────────────────────────────┤
│  1. Fetch user's listings, preferences, groups                   │
│  2. Fetch all other active listings/preferences                  │
│  3. Build input for TradeMaximizer:                              │
│     - Create vertex for each listing                             │
│     - Create edge for each preference                            │
│     - Create dummy items for groups                              │
│  4. Run TradeMaximizer algorithm                                 │
│  5. Parse output into trade chains                               │
└───────────────┬─────────────────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────────────┐
│  Preview Results                                                 │
├─────────────────────────────────────────────────────────────────┤
│  - Show user what they'll get and what they'll send              │
│  - Show complete trade chains they're part of                    │
│  - Highlight new trading partners                                │
│  - Option to accept or cancel                                    │
└───────────────┬─────────────────────────────────────────────────┘
                │
                ▼ (if accepted)
┌─────────────────────────────────────────────────────────────────┐
│  Create Trade Records                                            │
├─────────────────────────────────────────────────────────────────┤
│  - Create `trades` records for each pair in chain                │
│  - Update listing status to 'pending'                            │
│  - Send notifications to all participants                        │
│  - Users proceed with MVP trade flow (confirm → complete)        │
└─────────────────────────────────────────────────────────────────┘
```

---

### 2.3 Integration with Existing MVP Trade Flow

**Scenario 1: Manual Trade (MVP Week 1)**

1. User A messages User B about a listing
2. They negotiate via messages
3. User A clicks "Propose Trade" on listing detail page
4. Trade record created with `status: 'initiated'`
5. Continue with MVP confirmation → completion flow

**Scenario 2: Optimized Trade (This Spec)**

1. User A adds preferences: "I want Listing X, will trade Listings Y or Z"
2. User B adds preferences: "I want Listing Y, will trade Listing W"
3. User C adds preferences: "I want Listing W, will trade Listing X"
4. Any user clicks "Optimize Trades"
5. Algorithm finds chain: A→B→C→A
6. All three get preview, all must accept
7. Three `trades` records created (A↔B, B↔C, C↔A)
8. Continue with MVP confirmation → completion flow

**Key Decision:** Optimized trades enter at the same point as manual trades (`status: 'initiated'`). The optimizer just automates the proposal step for multi-party scenarios.

---

## 3. Database Schema Changes

### 3.1 New Collections

#### `trade_preferences`

```typescript
{
  "name": "trade_preferences",
  "type": "base",
  "schema": [
    {
      "name": "user",
      "type": "relation",
      "required": true,
      "options": {
        "collectionId": "users",
        "cascadeDelete": true
      }
    },
    {
      "name": "wanted_listing",
      "type": "relation",
      "required": true,
      "options": {
        "collectionId": "listings",
        "cascadeDelete": true
      }
    },
    {
      "name": "offer_listings",
      "type": "relation",
      "required": false,
      "options": {
        "collectionId": "listings",
        "cascadeDelete": false,
        "maxSelect": null
      }
    },
    {
      "name": "offer_cash",
      "type": "number",
      "required": false,
      "options": {
        "min": 0
      }
    },
    {
      "name": "priority",
      "type": "number",
      "required": true,
      "options": {
        "min": 1,
        "max": 999
      }
    }
  ],
  "indexes": [
    "CREATE INDEX idx_preferences_user ON trade_preferences (user)",
    "CREATE INDEX idx_preferences_wanted ON trade_preferences (wanted_listing)"
  ],
  "listRule": "@request.auth.id != ''",
  "viewRule": "@request.auth.id != ''",
  "createRule": "@request.auth.id = user",
  "updateRule": "@request.auth.id = user",
  "deleteRule": "@request.auth.id = user"
}
```

#### `trade_groups`

```typescript
{
  "name": "trade_groups",
  "type": "base",
  "schema": [
    {
      "name": "user",
      "type": "relation",
      "required": true,
      "options": {
        "collectionId": "users",
        "cascadeDelete": true
      }
    },
    {
      "name": "name",
      "type": "text",
      "required": true,
      "options": {
        "min": 1,
        "max": 100
      }
    },
    {
      "name": "listings",
      "type": "relation",
      "required": true,
      "options": {
        "collectionId": "listings",
        "cascadeDelete": false,
        "maxSelect": null,
        "minSelect": 2
      }
    },
    {
      "name": "offer_listings",
      "type": "relation",
      "required": false,
      "options": {
        "collectionId": "listings",
        "cascadeDelete": false,
        "maxSelect": null
      }
    },
    {
      "name": "offer_cash",
      "type": "number",
      "required": false,
      "options": {
        "min": 0
      }
    }
  ],
  "indexes": [
    "CREATE INDEX idx_groups_user ON trade_groups (user)"
  ],
  "listRule": "@request.auth.id != ''",
  "viewRule": "@request.auth.id != ''",
  "createRule": "@request.auth.id = user",
  "updateRule": "@request.auth.id = user",
  "deleteRule": "@request.auth.id = user"
}
```

#### `optimization_results` (Optional - for caching)

```typescript
{
  "name": "optimization_results",
  "type": "base",
  "schema": [
    {
      "name": "user",
      "type": "relation",
      "required": true,
      "options": {
        "collectionId": "users",
        "cascadeDelete": true
      }
    },
    {
      "name": "chains",
      "type": "json",
      "required": true,
      "options": {}
    },
    {
      "name": "participants",
      "type": "relation",
      "required": true,
      "options": {
        "collectionId": "users",
        "cascadeDelete": false,
        "maxSelect": null
      }
    },
    {
      "name": "expires",
      "type": "date",
      "required": true,
      "options": {}
    },
    {
      "name": "accepted_by",
      "type": "relation",
      "required": false,
      "options": {
        "collectionId": "users",
        "cascadeDelete": false,
        "maxSelect": null
      }
    }
  ],
  "indexes": [
    "CREATE INDEX idx_results_user ON optimization_results (user)",
    "CREATE INDEX idx_results_expires ON optimization_results (expires)"
  ],
  "listRule": "@request.auth.id = user || participants ~ @request.auth.id",
  "viewRule": "@request.auth.id = user || participants ~ @request.auth.id",
  "createRule": "@request.auth.id = user",
  "updateRule": "@request.auth.id = user || participants ~ @request.auth.id",
  "deleteRule": "@request.auth.id = user"
}
```

---

### 3.2 Extend Existing Collections

#### `trades` - Add Confirmation Tracking

```typescript
// Add these fields to existing trades collection
{
  "name": "buyer_items_sent",
  "type": "relation",
  "required": false,
  "options": {
    "collectionId": "listings",
    "cascadeDelete": false,
    "maxSelect": null
  }
},
{
  "name": "seller_items_sent",
  "type": "relation",
  "required": false,
  "options": {
    "collectionId": "listings",
    "cascadeDelete": false,
    "maxSelect": null
  }
},
{
  "name": "buyer_items_received",
  "type": "relation",
  "required": false,
  "options": {
    "collectionId": "listings",
    "cascadeDelete": false,
    "maxSelect": null
  }
},
{
  "name": "seller_items_received",
  "type": "relation",
  "required": false,
  "options": {
    "collectionId": "listings",
    "cascadeDelete": false,
    "maxSelect": null
  }
},
{
  "name": "confirmation_notes",
  "type": "text",
  "required": false,
  "options": {
    "max": 500
  }
},
{
  "name": "is_multi_party",
  "type": "bool",
  "required": false,
  "options": {}
},
{
  "name": "optimization_result",
  "type": "relation",
  "required": false,
  "options": {
    "collectionId": "optimization_results",
    "cascadeDelete": true
  }
}
```

---

## 4. Module Structure

### 4.1 Trade Optimizer Core (`src/lib/trade-optimizer/`)

#### `algorithm/trademax.js`

- **Source:** Copy directly from gameswap
- **Changes:** None (pure algorithm)
- **Lines:** ~1,640
- **Purpose:** Core Hungarian algorithm implementation

#### `algorithm/trademax.ts`

- **Source:** Adapt from gameswap
- **Changes:** Update types for Meeple's models
- **Purpose:** TypeScript wrapper

```typescript
export interface TradeMaximizerOptions {
  allowDummies?: boolean;
  caseSensitive?: boolean;
  metric?: 'CHAIN-SIZES-SOS' | 'USERS-TRADING';
  iterations?: number;
  priorityScheme?: 'LINEAR' | 'TRIANGLE' | 'SQUARE';
}

export class TradeMaximizer {
  constructor(options?: TradeMaximizerOptions);
  run(input: string): string;
}
```

#### `algorithm/javarandom.js`

- **Source:** Copy directly from gameswap
- **Changes:** None
- **Purpose:** Deterministic random generation

---

#### `runner.ts` - Main Orchestrator

```typescript
import { pb } from '$lib/pocketbase';
import { TradeMaximizer } from './algorithm/trademax';
import { buildInput } from './input-builder';
import { parseResults } from './result-parser';
import type { OptimizationResult, TradeChain } from './types';

export async function optimizeTrades(
  userId: string,
  options?: {
    includeUser?: boolean; // Include user's own preferences
    onlyUserChains?: boolean; // Only return chains involving user
    previewOnly?: boolean; // Don't create trades, just preview
  }
): Promise<OptimizationResult> {
  // 1. Fetch all active listings
  const listings = await pb.collection('listings').getFullList({
    filter: 'status = "active"',
    expand: 'owner',
  });

  // 2. Fetch all trade preferences
  const preferences = await pb.collection('trade_preferences').getFullList({
    expand: 'user,wanted_listing,offer_listings',
  });

  // 3. Fetch all trade groups
  const groups = await pb.collection('trade_groups').getFullList({
    expand: 'user,listings,offer_listings',
  });

  // 4. Build input for TradeMaximizer
  const input = buildInput(listings, preferences, groups);

  // 5. Run algorithm
  const tm = new TradeMaximizer({
    allowDummies: true,
    metric: 'USERS-TRADING',
    iterations: 10,
    priorityScheme: 'LINEAR',
  });

  const output = tm.run(input);

  // 6. Parse results into chains
  const chains = parseResults(output, listings, preferences, groups);

  // 7. Filter to user's chains if requested
  const userChains = options?.onlyUserChains
    ? chains.filter((chain) => chain.participants.includes(userId))
    : chains;

  return {
    chains: userChains,
    allChains: chains,
    totalTrades: chains.reduce((sum, c) => sum + c.trades.length, 0),
    totalUsers: new Set(chains.flatMap((c) => c.participants)).size,
    input, // For debugging
    output, // For debugging
  };
}

export async function acceptOptimization(optimizationId: string, userId: string): Promise<void> {
  // 1. Fetch optimization result
  const result = await pb.collection('optimization_results').getOne(optimizationId, {
    expand: 'participants',
  });

  // 2. Check if user is participant
  if (!result.participants.includes(userId)) {
    throw new Error('User not in this optimization');
  }

  // 3. Mark as accepted by user
  await pb.collection('optimization_results').update(optimizationId, {
    'accepted_by+': userId,
  });

  // 4. Check if ALL participants have accepted
  const acceptedCount = result.accepted_by?.length ?? 0;
  const totalParticipants = result.participants.length;

  if (acceptedCount + 1 === totalParticipants) {
    // All accepted! Create trades
    await createTradesFromOptimization(result);
  }
}

async function createTradesFromOptimization(result: any): Promise<void> {
  const chains: TradeChain[] = result.chains;

  for (const chain of chains) {
    for (const trade of chain.trades) {
      await pb.collection('trades').create({
        listing: trade.listingId,
        buyer: trade.buyerId,
        seller: trade.sellerId,
        status: 'initiated',
        is_multi_party: true,
        optimization_result: result.id,
      });

      // Send notifications
      await pb.collection('notifications').create({
        user: trade.sellerId,
        type: 'trade_initiated',
        title: 'New trade from optimizer',
        message: `Trade chain found! Check your trades.`,
        link: `/trades`,
        read: false,
      });
    }
  }

  // Mark listings as pending
  const allListingIds = chains.flatMap((c) => c.trades.map((t) => t.listingId));
  for (const listingId of allListingIds) {
    await pb.collection('listings').update(listingId, {
      status: 'pending',
    });
  }
}
```

---

#### `input-builder.ts`

```typescript
import type { ListingRecord, TradePreferenceRecord, TradeGroupRecord } from '$lib/types/pocketbase';

export function buildInput(
  listings: ListingRecord[],
  preferences: TradePreferenceRecord[],
  groups: TradeGroupRecord[]
): string {
  const lines: string[] = [];

  // Header
  lines.push('#!CASE-SENSITIVE');
  lines.push('#!ALLOW-DUMMIES');
  lines.push('');

  // Official names section
  lines.push('!BEGIN-OFFICIAL-NAMES');

  // Add all listings
  for (const listing of listings) {
    lines.push(`${listing.id} ${escapeTitle(listing.title)}`);
  }

  // Add cash identifiers
  const cashOffers = new Set<string>();
  for (const pref of preferences) {
    if (pref.offer_cash > 0) {
      cashOffers.add(`$${pref.offer_cash}_from_${pref.user}`);
    }
  }
  for (const group of groups) {
    if (group.offer_cash > 0) {
      cashOffers.add(`$${group.offer_cash}_from_${group.user}`);
    }
  }
  for (const cashOffer of cashOffers) {
    lines.push(cashOffer);
  }

  // Add dummy items for groups
  for (const group of groups) {
    lines.push(`%${group.id} ${escapeTitle(group.name)}`);
  }

  lines.push('!END-OFFICIAL-NAMES');
  lines.push('');

  // User preferences
  for (const pref of preferences) {
    const username = pref.expand?.user?.username ?? pref.user;
    const wanted = pref.wanted_listing;
    const offers: string[] = [];

    // Add listing offers
    if (pref.offer_listings && pref.offer_listings.length > 0) {
      offers.push(...pref.offer_listings);
    }

    // Add cash offer
    if (pref.offer_cash > 0) {
      offers.push(`$${pref.offer_cash}_from_${pref.user}`);
    }

    if (offers.length > 0) {
      lines.push(`(${username}) ${wanted} : ${offers.join(' ')}`);
    }
  }

  // Group preferences (using dummy items)
  for (const group of groups) {
    const username = group.expand?.user?.username ?? group.user;
    const dummyId = `%${group.id}`;
    const offers: string[] = [];

    // Add listing offers
    if (group.offer_listings && group.offer_listings.length > 0) {
      offers.push(...group.offer_listings);
    }

    // Add cash offer
    if (group.offer_cash > 0) {
      offers.push(`$${group.offer_cash}_from_${group.user}`);
    }

    if (offers.length > 0) {
      // Dummy wants all items in group
      lines.push(`(${username}) ${dummyId} : ${group.listings.join(' ')}`);

      // User wants dummy (to receive one of the group)
      lines.push(`(${username}) ${group.listings[0]} : ${dummyId}`);
    }
  }

  return lines.join('\n');
}

function escapeTitle(title: string): string {
  // Remove parentheses to avoid conflicts with TradeMaximizer format
  return title.replace(/[()]/g, '');
}
```

---

#### `result-parser.ts`

```typescript
import type { TradeChain, Trade } from './types';

export function parseResults(
  output: string,
  listings: any[],
  preferences: any[],
  groups: any[]
): TradeChain[] {
  const chains: TradeChain[] = [];
  const lines = output.split('\n');

  let currentChain: TradeChain | null = null;

  for (const line of lines) {
    // Chain header: "*** CHAIN 1"
    if (line.startsWith('*** CHAIN')) {
      if (currentChain) {
        chains.push(currentChain);
      }
      currentChain = {
        chainNumber: parseInt(line.split(' ')[2]),
        trades: [],
        participants: [],
      };
      continue;
    }

    // Trade line: "alice receives ITEM_ID from bob"
    const match = line.match(/^(\w+) receives (.+?) from (\w+)/);
    if (match && currentChain) {
      const [, buyer, itemId, seller] = match;

      // Skip dummy items
      if (itemId.startsWith('%')) continue;

      // Skip cash for now (TODO: handle cash trades)
      if (itemId.startsWith('$')) continue;

      const listing = listings.find((l) => l.id === itemId);
      if (!listing) continue;

      currentChain.trades.push({
        listingId: itemId,
        listing,
        buyerId: buyer,
        sellerId: seller,
      });

      if (!currentChain.participants.includes(buyer)) {
        currentChain.participants.push(buyer);
      }
      if (!currentChain.participants.includes(seller)) {
        currentChain.participants.push(seller);
      }
    }
  }

  // Push last chain
  if (currentChain && currentChain.trades.length > 0) {
    chains.push(currentChain);
  }

  return chains;
}
```

---

#### `types.ts`

```typescript
import type { ListingRecord, UserRecord } from '$lib/types/pocketbase';

export interface Trade {
  listingId: string;
  listing: ListingRecord;
  buyerId: string;
  sellerId: string;
}

export interface TradeChain {
  chainNumber: number;
  trades: Trade[];
  participants: string[]; // User IDs
}

export interface OptimizationResult {
  chains: TradeChain[];
  allChains: TradeChain[]; // Including non-user chains
  totalTrades: number;
  totalUsers: number;
  input: string; // Debug
  output: string; // Debug
}

export interface UserTradesSummary {
  getting: ListingRecord[];
  sending: ListingRecord[];
  partners: UserRecord[];
}
```

---

#### `index.ts` - Public API

```typescript
export { optimizeTrades, acceptOptimization } from './runner';
export { TradeMaximizer } from './algorithm/trademax';
export type { Trade, TradeChain, OptimizationResult, UserTradesSummary } from './types';
```

---

### 4.2 Trade Preferences Module (`src/lib/trade-preferences/`)

#### `queries.ts`

```typescript
import { pb } from '$lib/pocketbase';
import type { TradePreferenceRecord } from '$lib/types/pocketbase';

export async function getUserPreferences(userId: string): Promise<TradePreferenceRecord[]> {
  return pb.collection('trade_preferences').getFullList({
    filter: `user = "${userId}"`,
    expand: 'wanted_listing,offer_listings',
    sort: 'priority',
  });
}

export async function createPreference(
  userId: string,
  wantedListingId: string,
  offerListingIds: string[],
  offerCash: number = 0,
  priority: number = 999
): Promise<TradePreferenceRecord> {
  return pb.collection('trade_preferences').create({
    user: userId,
    wanted_listing: wantedListingId,
    offer_listings: offerListingIds,
    offer_cash: offerCash,
    priority,
  });
}

export async function updatePreference(
  preferenceId: string,
  updates: Partial<TradePreferenceRecord>
): Promise<TradePreferenceRecord> {
  return pb.collection('trade_preferences').update(preferenceId, updates);
}

export async function deletePreference(preferenceId: string): Promise<void> {
  await pb.collection('trade_preferences').delete(preferenceId);
}

export async function reorderPreferences(userId: string, preferenceIds: string[]): Promise<void> {
  // Update priorities based on new order
  for (let i = 0; i < preferenceIds.length; i++) {
    await pb.collection('trade_preferences').update(preferenceIds[i], {
      priority: i + 1,
    });
  }
}
```

---

#### `validation.ts`

```typescript
export function validatePreference(
  wantedListingId: string,
  offerListingIds: string[],
  offerCash: number,
  userListingIds: string[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Can't want your own listing
  if (userListingIds.includes(wantedListingId)) {
    errors.push("You can't trade for your own listing");
  }

  // Must offer something
  if (offerListingIds.length === 0 && offerCash === 0) {
    errors.push('You must offer at least one game or cash');
  }

  // Can only offer your own listings
  for (const offerId of offerListingIds) {
    if (!userListingIds.includes(offerId)) {
      errors.push(`You don't own listing ${offerId}`);
    }
  }

  // Can't offer wanted listing
  if (offerListingIds.includes(wantedListingId)) {
    errors.push("You can't offer the same listing you want");
  }

  // Cash must be positive
  if (offerCash < 0) {
    errors.push('Cash amount must be positive');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
```

---

### 4.3 Trade Groups Module (`src/lib/trade-groups/`)

Similar structure to `trade-preferences/`, with:

- `queries.ts` - CRUD operations for groups
- `validation.ts` - Group validation (min 2 listings, must be different, etc.)

---

## 5. Implementation Plan

### Phase 1: Foundation (Week 1)

**Goal:** Set up module structure and copy algorithm

**Tasks:**

1. ✅ Create module directories
2. ✅ Copy TradeMaximizer files
3. ✅ Add TypeScript types
4. ✅ Write unit tests for algorithm
5. ✅ Create PocketBase migrations for new collections

**Deliverable:** Algorithm runs with test data

---

### Phase 2: Data Layer (Week 2)

**Goal:** Build preference/group management

**Tasks:**

1. ✅ Implement `trade_preferences` CRUD
2. ✅ Implement `trade_groups` CRUD
3. ✅ Write validation functions
4. ✅ Add indexes to database
5. ✅ Write unit tests for queries

**Deliverable:** Can create/edit preferences via API

---

### Phase 3: Optimizer Logic (Week 3)

**Goal:** Build input/output pipeline

**Tasks:**

1. ✅ Implement `input-builder.ts`
2. ✅ Implement `result-parser.ts`
3. ✅ Implement `runner.ts` (main orchestrator)
4. ✅ Write integration tests
5. ✅ Add error handling

**Deliverable:** Can run optimizer and get results

---

### Phase 4: UI Components (Week 4)

**Goal:** Build preference management UI

**Tasks:**

1. ✅ Create `PreferenceList.svelte`
2. ✅ Create `PreferenceEditor.svelte`
3. ✅ Create `OfferSelector.svelte`
4. ✅ Create `GroupList.svelte`
5. ✅ Create `GroupEditor.svelte`
6. ✅ Add to browse page: "Add to preferences" button

**Deliverable:** Users can manage preferences

---

### Phase 5: Optimizer UI (Week 5)

**Goal:** Build optimization flow

**Tasks:**

1. ✅ Create `/optimize-trades` route
2. ✅ Create `ResultsPreview.svelte`
3. ✅ Create `TradeChainVisualization.svelte`
4. ✅ Implement acceptance flow
5. ✅ Add notifications

**Deliverable:** Users can run optimizer and accept results

---

### Phase 6: Confirmation Tracking (Week 6)

**Goal:** Add sent/received tracking

**Tasks:**

1. ✅ Extend `trades` collection schema
2. ✅ Create `ConfirmationTracker.svelte`
3. ✅ Add to trade detail page
4. ✅ Update trade dashboard to show tracking
5. ✅ Write tests

**Deliverable:** Users can mark items sent/received

---

### Phase 7: Polish & Launch (Week 7)

**Goal:** Testing, docs, launch

**Tasks:**

1. ✅ Write end-to-end tests
2. ✅ Performance testing with large datasets
3. ✅ Write user documentation
4. ✅ Add help tooltips
5. ✅ Beta test with real users
6. ✅ Launch to production

**Deliverable:** Feature live and stable

---

## 6. File Migration Map

### Direct Copies (Minimal Changes)

| Source (gameswap)                      | Destination (meeple)                              | Changes                                 |
| -------------------------------------- | ------------------------------------------------- | --------------------------------------- |
| `src/lib/olwlg/trademax.js`            | `src/lib/trade-optimizer/algorithm/trademax.js`   | None                                    |
| `src/lib/olwlg/javarandom.js`          | `src/lib/trade-optimizer/algorithm/javarandom.js` | None                                    |
| `src/lib/utils.ts` (currency function) | `src/lib/utils/currency.ts`                       | Change locale to en-NZ, currency to NZD |
| `src/routes/(event)/remaining.ts`      | `src/lib/utils/countdown.ts`                      | Remove event dependency                 |

### Heavy Adaptations

| Source (gameswap)                            | Destination (meeple)                                           | Changes                                                        |
| -------------------------------------------- | -------------------------------------------------------------- | -------------------------------------------------------------- |
| `src/lib/olwlg/_trademax.ts`                 | `src/lib/trade-optimizer/algorithm/trademax.ts`                | Update types for Meeple models                                 |
| `src/routes/(event)/trades/trades.ts`        | `src/lib/trade-optimizer/runner.ts`                            | Remove event scoping, use Meeple collections, add preview mode |
| `src/components/WantOffers.svelte`           | `src/lib/components/TradeOptimizer/OfferSelector.svelte`       | Adapt to Meeple's UI style, use Tailwind classes               |
| `src/routes/(event)/trades/all/+page.svelte` | `src/lib/components/TradeOptimizer/ConfirmationTracker.svelte` | Extract confirmation UI into component                         |

### Inspiration Only (Rewrite)

| Source (gameswap)              | Destination (meeple)                  | Approach                                                  |
| ------------------------------ | ------------------------------------- | --------------------------------------------------------- |
| `src/routes/(event)/my/wants/` | `src/routes/preferences/+page.svelte` | Reference UI patterns, rebuild for continuous marketplace |
| `src/routes/(event)/browse/`   | Update existing `src/routes/browse/`  | Add "Add to preferences" button                           |
| `src/routes/(event)/trades/`   | Update existing `src/routes/trades/`  | Add "Optimize" button, chain visualization                |

---

## 7. API Design

### 7.1 Client-Side API

```typescript
// Import in any component
import { optimizeTrades, acceptOptimization } from '$lib/trade-optimizer';
import { getUserPreferences, createPreference } from '$lib/trade-preferences/queries';
import { getUserGroups, createGroup } from '$lib/trade-groups/queries';

// Example usage in +page.svelte
async function runOptimizer() {
  try {
    const result = await optimizeTrades(user.id, {
      onlyUserChains: true,
      previewOnly: true,
    });

    // Show preview
    previewData = result;
  } catch (err) {
    console.error('Optimization failed:', err);
    showError('Could not find any trades. Try adjusting your preferences.');
  }
}

async function acceptResult(optimizationId: string) {
  await acceptOptimization(optimizationId, user.id);
  showSuccess('Trade accepted! Waiting for others to accept.');
}
```

---

### 7.2 PocketBase API Endpoints

All operations use PocketBase client SDK. No custom endpoints needed.

**Preferences:**

```typescript
// Create
pb.collection('trade_preferences').create({
  user: userId,
  wanted_listing: listingId,
  offer_listings: [offerId1, offerId2],
  offer_cash: 50,
  priority: 1,
});

// List user's preferences
pb.collection('trade_preferences').getFullList({
  filter: `user = "${userId}"`,
  expand: 'wanted_listing,offer_listings',
  sort: 'priority',
});

// Update
pb.collection('trade_preferences').update(prefId, {
  offer_listings: [offerId3],
});

// Delete
pb.collection('trade_preferences').delete(prefId);
```

**Groups:**

```typescript
// Create
pb.collection('trade_groups').create({
  user: userId,
  name: 'Worker placement games',
  listings: [listingId1, listingId2, listingId3],
  offer_listings: [offerId1],
  offer_cash: 0,
});

// List user's groups
pb.collection('trade_groups').getFullList({
  filter: `user = "${userId}"`,
  expand: 'listings,offer_listings',
});
```

---

## 8. UI Components

### 8.1 Preference Management

#### `/src/routes/preferences/+page.svelte`

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { currentUser } from '$lib/pocketbase';
  import { getUserPreferences } from '$lib/trade-preferences/queries';
  import PreferenceList from '$lib/components/TradeOptimizer/PreferenceList.svelte';
  import PreferenceEditor from '$lib/components/TradeOptimizer/PreferenceEditor.svelte';

  let preferences = $state([]);
  let showEditor = $state(false);
  let editingPreference = $state(null);

  onMount(async () => {
    if ($currentUser) {
      preferences = await getUserPreferences($currentUser.id);
    }
  });
</script>

<div class="container mx-auto px-4 py-8">
  <div class="flex items-center justify-between mb-6">
    <h1 class="text-3xl font-bold">Trade Preferences</h1>
    <button
      class="btn-primary"
      onclick={() => {
        showEditor = true;
        editingPreference = null;
      }}
    >
      Add Preference
    </button>
  </div>

  <div class="bg-surface-card rounded-lg p-6 mb-6">
    <h2 class="text-xl font-semibold mb-2">How It Works</h2>
    <p class="text-secondary">
      Add games you want and specify what you're willing to trade for them. When you run the trade
      optimizer, it will find multi-party trade chains that give you what you want while helping
      others too.
    </p>
  </div>

  {#if preferences.length === 0}
    <div class="text-center py-12">
      <p class="text-secondary mb-4">You haven't added any preferences yet.</p>
      <button class="btn-primary" onclick={() => (showEditor = true)}>
        Add Your First Preference
      </button>
    </div>
  {:else}
    <PreferenceList
      {preferences}
      onedit={(pref) => {
        showEditor = true;
        editingPreference = pref;
      }}
      ondelete={async (prefId) => {
        await deletePreference(prefId);
        preferences = preferences.filter((p) => p.id !== prefId);
      }}
    />

    <button class="btn-accent btn-lg mt-8 w-full" onclick={() => goto('/optimize-trades')}>
      Optimize My Trades
    </button>
  {/if}

  {#if showEditor}
    <PreferenceEditor
      preference={editingPreference}
      onclose={() => {
        showEditor = false;
        editingPreference = null;
      }}
      onsave={async (newPref) => {
        preferences = await getUserPreferences($currentUser.id);
        showEditor = false;
      }}
    />
  {/if}
</div>
```

---

#### `PreferenceList.svelte`

```svelte
<script lang="ts">
  import { currency } from '$lib/utils/currency';

  let {
    preferences = $bindable(),
    onedit,
    ondelete,
  }: {
    preferences: any[];
    onedit: (pref: any) => void;
    ondelete: (prefId: string) => void;
  } = $props();
</script>

<div class="space-y-4">
  {#each preferences as pref (pref.id)}
    <div class="bg-surface rounded-lg border border-subtle p-4 flex items-start gap-4">
      <!-- Wanted listing -->
      <div class="flex-1">
        <div class="flex items-center gap-2 mb-2">
          <span class="badge badge-primary">Priority {pref.priority}</span>
          <h3 class="font-semibold">
            {pref.expand?.wanted_listing?.title ?? 'Unknown listing'}
          </h3>
        </div>

        <!-- Offers -->
        <div class="text-sm text-secondary">
          <span class="font-medium">Will trade:</span>
          {#if pref.offer_listings?.length > 0}
            <ul class="list-disc list-inside mt-1">
              {#each pref.expand?.offer_listings ?? [] as offer}
                <li>{offer.title}</li>
              {/each}
            </ul>
          {/if}
          {#if pref.offer_cash > 0}
            <p class="text-accent font-medium mt-1">
              or {currency(pref.offer_cash)} cash
            </p>
          {/if}
          {#if !pref.offer_listings?.length && !pref.offer_cash}
            <p class="text-warning">⚠️ No offers yet</p>
          {/if}
        </div>
      </div>

      <!-- Actions -->
      <div class="flex gap-2">
        <button class="btn-sm btn-secondary" onclick={() => onedit(pref)}> Edit </button>
        <button class="btn-sm btn-error" onclick={() => ondelete(pref.id)}> Delete </button>
      </div>
    </div>
  {/each}
</div>
```

---

#### `OfferSelector.svelte`

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { pb, currentUser } from '$lib/pocketbase';
  import { currency } from '$lib/utils/currency';

  let {
    selectedOffers = $bindable([]),
    offerCash = $bindable(0),
    excludeListingId,
  }: {
    selectedOffers: string[];
    offerCash: number;
    excludeListingId?: string;
  } = $props();

  let userListings = $state([]);

  onMount(async () => {
    if ($currentUser) {
      userListings = await pb.collection('listings').getFullList({
        filter: `owner = "${$currentUser.id}" && status = "active"`,
        sort: '-created',
      });

      // Exclude the wanted listing
      if (excludeListingId) {
        userListings = userListings.filter((l) => l.id !== excludeListingId);
      }
    }
  });

  function toggleListing(listingId: string) {
    if (selectedOffers.includes(listingId)) {
      selectedOffers = selectedOffers.filter((id) => id !== listingId);
    } else {
      selectedOffers = [...selectedOffers, listingId];
    }
  }
</script>

<div class="space-y-4">
  <div>
    <h3 class="font-semibold mb-2">Select games to offer:</h3>
    {#if userListings.length === 0}
      <p class="text-secondary text-sm">You don't have any active listings to offer.</p>
    {:else}
      <div class="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
        {#each userListings as listing}
          <label class="flex items-center gap-3 p-2 rounded hover:bg-surface-hover cursor-pointer">
            <input
              type="checkbox"
              class="checkbox"
              checked={selectedOffers.includes(listing.id)}
              onchange={() => toggleListing(listing.id)}
            />
            <span class="text-sm">{listing.title}</span>
          </label>
        {/each}
      </div>
    {/if}
  </div>

  <div class="divider">OR</div>

  <div>
    <label class="block mb-2">
      <span class="font-semibold">Offer cash:</span>
    </label>
    <div class="flex items-center gap-2">
      <span class="text-2xl">$</span>
      <input
        type="number"
        class="input flex-1"
        min="0"
        step="5"
        bind:value={offerCash}
        placeholder="0"
      />
      <span class="text-secondary">NZD</span>
    </div>
  </div>

  {#if selectedOffers.length === 0 && offerCash === 0}
    <p class="text-warning text-sm">⚠️ Please select at least one game or enter a cash amount</p>
  {/if}
</div>
```

---

### 8.2 Trade Optimizer

#### `/src/routes/optimize-trades/+page.svelte`

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { currentUser } from '$lib/pocketbase';
  import { optimizeTrades } from '$lib/trade-optimizer';
  import ResultsPreview from '$lib/components/TradeOptimizer/ResultsPreview.svelte';
  import TradeChainVisualization from '$lib/components/TradeOptimizer/TradeChainVisualization.svelte';

  let isRunning = $state(false);
  let result = $state(null);
  let error = $state('');

  async function runOptimizer() {
    if (!$currentUser) return;

    isRunning = true;
    error = '';

    try {
      result = await optimizeTrades($currentUser.id, {
        onlyUserChains: true,
        previewOnly: true,
      });

      if (result.chains.length === 0) {
        error = 'No trade chains found. Try adding more preferences or adjusting your offers.';
      }
    } catch (err) {
      console.error('Optimization error:', err);
      error = 'Failed to run optimizer. Please try again.';
    } finally {
      isRunning = false;
    }
  }

  onMount(() => {
    // Auto-run if user has preferences
    runOptimizer();
  });
</script>

<div class="container mx-auto px-4 py-8">
  <h1 class="text-3xl font-bold mb-6">Trade Optimizer</h1>

  <div class="bg-surface-card rounded-lg p-6 mb-6">
    <h2 class="text-xl font-semibold mb-2">How It Works</h2>
    <p class="text-secondary mb-4">
      The trade optimizer finds multi-party trade chains where everyone gets something they want.
      For example: You trade Game A to Alice, Alice trades Game B to Bob, and Bob trades Game C to
      you. Everyone wins!
    </p>
    <button class="btn-primary" onclick={runOptimizer} disabled={isRunning}>
      {isRunning ? 'Finding trades...' : 'Run Optimizer'}
    </button>
  </div>

  {#if error}
    <div class="alert alert-warning mb-6">
      {error}
    </div>
  {/if}

  {#if result && result.chains.length > 0}
    <div class="space-y-6">
      <ResultsPreview {result} userId={$currentUser.id} />

      <div class="divider"></div>

      <h2 class="text-2xl font-bold">Trade Chains</h2>
      {#each result.chains as chain, i}
        <TradeChainVisualization {chain} chainNumber={i + 1} />
      {/each}
    </div>
  {/if}
</div>
```

---

#### `ResultsPreview.svelte`

```svelte
<script lang="ts">
  import { goto } from '$app/navigation';
  import { acceptOptimization } from '$lib/trade-optimizer';
  import type { OptimizationResult } from '$lib/trade-optimizer';

  let {
    result,
    userId,
  }: {
    result: OptimizationResult;
    userId: string;
  } = $props();

  // Calculate what user gets and sends
  let userSummary = $derived.by(() => {
    const getting = [];
    const sending = [];

    for (const chain of result.chains) {
      for (const trade of chain.trades) {
        if (trade.buyerId === userId) {
          getting.push(trade.listing);
        }
        if (trade.sellerId === userId) {
          sending.push(trade.listing);
        }
      }
    }

    return { getting, sending };
  });

  async function acceptTrades() {
    // TODO: Save result to optimization_results, send notifications
    goto('/trades');
  }
</script>

<div class="bg-surface-card rounded-lg p-6">
  <h2 class="text-2xl font-bold mb-4">Your Trades</h2>

  <div class="grid md:grid-cols-2 gap-6">
    <!-- Getting -->
    <div>
      <h3 class="text-lg font-semibold mb-3 text-success">
        📥 Getting ({userSummary.getting.length})
      </h3>
      {#if userSummary.getting.length === 0}
        <p class="text-secondary text-sm">Nothing found</p>
      {:else}
        <ul class="space-y-2">
          {#each userSummary.getting as listing}
            <li class="bg-surface rounded p-2">
              {listing.title}
            </li>
          {/each}
        </ul>
      {/if}
    </div>

    <!-- Sending -->
    <div>
      <h3 class="text-lg font-semibold mb-3 text-info">
        📤 Sending ({userSummary.sending.length})
      </h3>
      {#if userSummary.sending.length === 0}
        <p class="text-secondary text-sm">Nothing to send</p>
      {:else}
        <ul class="space-y-2">
          {#each userSummary.sending as listing}
            <li class="bg-surface rounded p-2">
              {listing.title}
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  </div>

  <!-- Summary stats -->
  <div class="mt-6 pt-6 border-t border-subtle">
    <div class="flex justify-between text-sm text-secondary mb-4">
      <span>Total chains: {result.chains.length}</span>
      <span>Total trades: {result.totalTrades}</span>
      <span>Total users: {result.totalUsers}</span>
    </div>

    <button class="btn-accent w-full" onclick={acceptTrades}> Accept These Trades </button>
    <p class="text-xs text-secondary text-center mt-2">
      All participants must accept before trades are created
    </p>
  </div>
</div>
```

---

## 9. Administrative Management

### 9.1 Admin Dashboard Overview

Administrators need visibility and control over the trade optimizer system to monitor health, resolve disputes, and ensure fair matching. This section outlines the administrative features required for managing the trade optimization system.

---

### 9.2 Admin Analytics & Monitoring

#### Optimization Metrics Dashboard (`/admin/optimizer`)

**Key Metrics:**

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { pb } from '$lib/pocketbase';

  let metrics = $state({
    totalOptimizations: 0,
    successfulChains: 0,
    averageChainLength: 0,
    totalParticipants: 0,
    acceptanceRate: 0,
    averageRunTime: 0,
    lastRunDate: null,
    activePreferences: 0,
    activeGroups: 0,
  });

  onMount(async () => {
    // Fetch optimization_results stats
    const results = await pb.collection('optimization_results').getFullList();

    metrics.totalOptimizations = results.length;
    metrics.successfulChains = results.filter(
      (r) => r.accepted_by?.length === r.participants.length
    ).length;

    // Calculate averages
    const chainLengths = results.map((r) => r.chains.length);
    metrics.averageChainLength = chainLengths.reduce((a, b) => a + b, 0) / chainLengths.length;

    metrics.acceptanceRate = (metrics.successfulChains / metrics.totalOptimizations) * 100;

    // Fetch active preferences/groups counts
    metrics.activePreferences = await pb
      .collection('trade_preferences')
      .getList(1, 1, {
        filter: 'created > "2025-01-01"',
      })
      .then((r) => r.totalItems);

    metrics.activeGroups = await pb
      .collection('trade_groups')
      .getList(1, 1, {
        filter: 'created > "2025-01-01"',
      })
      .then((r) => r.totalItems);
  });
</script>

<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
  <div class="stat bg-surface-card">
    <div class="stat-title">Total Optimizations</div>
    <div class="stat-value">{metrics.totalOptimizations}</div>
  </div>

  <div class="stat bg-surface-card">
    <div class="stat-title">Successful Chains</div>
    <div class="stat-value">{metrics.successfulChains}</div>
    <div class="stat-desc">{metrics.acceptanceRate.toFixed(1)}% acceptance rate</div>
  </div>

  <div class="stat bg-surface-card">
    <div class="stat-title">Avg Chain Length</div>
    <div class="stat-value">{metrics.averageChainLength.toFixed(1)}</div>
  </div>

  <div class="stat bg-surface-card">
    <div class="stat-title">Active Preferences</div>
    <div class="stat-value">{metrics.activePreferences}</div>
  </div>

  <div class="stat bg-surface-card">
    <div class="stat-title">Active Groups</div>
    <div class="stat-value">{metrics.activeGroups}</div>
  </div>

  <div class="stat bg-surface-card">
    <div class="stat-title">Total Participants</div>
    <div class="stat-value">{metrics.totalParticipants}</div>
  </div>
</div>
```

**Time-Series Charts:**

- Optimizations per day (last 30 days)
- Success rate trend
- Average run time trend
- User engagement (preferences added per day)

---

### 9.3 Optimization History & Logs

#### View All Optimizations (`/admin/optimizer/history`)

**Features:**

- Paginated list of all optimization runs
- Filter by: date, user, success/failure, chain count
- Sort by: date, participants, chain length
- Quick actions: view details, rerun, cancel

**Table Columns:**
| ID | Date | User | Chains | Participants | Status | Accepted By | Actions |
|---|---|---|---|---|---|---|---|
| opt_123 | 2025-10-30 14:23 | alice | 3 | 7 | Pending | 4/7 | View, Cancel |
| opt_122 | 2025-10-30 12:15 | bob | 2 | 5 | Complete | 5/5 | View Details |
| opt_121 | 2025-10-29 18:45 | charlie | 0 | 0 | Failed | - | View Error |

**Detail View:**

```svelte
<!-- Optimization Detail Modal -->
<div class="modal">
  <h2>Optimization #{result.id}</h2>

  <div class="grid grid-cols-2 gap-4 mb-6">
    <div>
      <strong>Initiated By:</strong>
      {result.expand?.user?.display_name}
    </div>
    <div>
      <strong>Date:</strong>
      {new Date(result.created).toLocaleString()}
    </div>
    <div>
      <strong>Status:</strong>
      <span class="badge badge-{getStatusColor(result)}">
        {getStatus(result)}
      </span>
    </div>
    <div>
      <strong>Expires:</strong>
      {new Date(result.expires).toLocaleString()}
    </div>
  </div>

  <!-- Show raw algorithm input/output -->
  <details>
    <summary>Algorithm Input (Debug)</summary>
    <pre class="bg-surface p-4 overflow-x-auto">{result.chains[0]?.input}</pre>
  </details>

  <details>
    <summary>Algorithm Output (Debug)</summary>
    <pre class="bg-surface p-4 overflow-x-auto">{result.chains[0]?.output}</pre>
  </details>

  <!-- Show all trade chains -->
  <h3 class="text-xl font-bold mt-6 mb-3">Trade Chains</h3>
  {#each result.chains as chain}
    <TradeChainVisualization {chain} />
  {/each}

  <!-- Show acceptance status -->
  <h3 class="text-xl font-bold mt-6 mb-3">Acceptance Status</h3>
  <div class="space-y-2">
    {#each result.expand?.participants ?? [] as participant}
      <div class="flex items-center justify-between bg-surface p-3 rounded">
        <span>{participant.display_name}</span>
        {#if result.accepted_by?.includes(participant.id)}
          <span class="badge badge-success">✓ Accepted</span>
        {:else}
          <span class="badge badge-warning">⏳ Pending</span>
        {/if}
      </div>
    {/each}
  </div>
</div>
```

---

### 9.4 Manual Intervention Tools

#### Force Accept Optimization

**Use Case:** User accepted but can't click due to technical issue

```typescript
async function forceAcceptOptimization(optimizationId: string, userId: string) {
  // Admin override to mark user as accepted
  await pb.collection('optimization_results').update(optimizationId, {
    'accepted_by+': userId,
  });

  // Log admin action
  await pb.collection('admin_logs').create({
    admin: currentAdmin.id,
    action: 'force_accept_optimization',
    target_id: optimizationId,
    details: `Forced acceptance for user ${userId}`,
    timestamp: new Date().toISOString(),
  });
}
```

#### Cancel Optimization

**Use Case:** Optimization stuck, participants not responding, dispute

```typescript
async function cancelOptimization(optimizationId: string, reason: string) {
  const result = await pb.collection('optimization_results').getOne(optimizationId);

  // Mark as cancelled
  await pb.collection('optimization_results').update(optimizationId, {
    status: 'cancelled',
    cancel_reason: reason,
  });

  // Notify all participants
  for (const participantId of result.participants) {
    await pb.collection('notifications').create({
      user: participantId,
      type: 'optimization_cancelled',
      title: 'Trade optimization cancelled',
      message: `An admin cancelled the optimization: ${reason}`,
      link: `/optimize-trades`,
      read: false,
    });
  }

  // Log admin action
  await pb.collection('admin_logs').create({
    admin: currentAdmin.id,
    action: 'cancel_optimization',
    target_id: optimizationId,
    details: reason,
    timestamp: new Date().toISOString(),
  });
}
```

#### Rerun Optimization

**Use Case:** Algorithm failed, want to try with different parameters

```typescript
async function rerunOptimization(optimizationId: string, options?: any) {
  const result = await pb.collection('optimization_results').getOne(optimizationId);

  // Get original user's preferences
  const userId = result.user;

  // Run optimizer again with new options
  const newResult = await optimizeTrades(userId, {
    ...options,
    iterations: options?.iterations ?? 20, // More iterations for better results
  });

  // Save new result
  const newRecord = await pb.collection('optimization_results').create({
    user: userId,
    chains: newResult.chains,
    participants: newResult.chains.flatMap((c) => c.participants),
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    is_rerun: true,
    original_optimization: optimizationId,
  });

  // Log admin action
  await pb.collection('admin_logs').create({
    admin: currentAdmin.id,
    action: 'rerun_optimization',
    target_id: optimizationId,
    details: `Rerun with iterations: ${options?.iterations}`,
    timestamp: new Date().toISOString(),
  });

  return newRecord;
}
```

---

### 9.5 User Preference Management

#### View User's Preferences (`/admin/users/[id]/preferences`)

**Admin View:**

- See all user's trade preferences
- See all user's trade groups
- Identify problematic preferences (e.g., offering deleted listings)
- Bulk delete invalid preferences
- Edit priorities on behalf of user

```svelte
<script lang="ts">
  let { userId } = $props();

  let preferences = $state([]);
  let groups = $state([]);
  let issues = $state([]);

  onMount(async () => {
    preferences = await pb.collection('trade_preferences').getFullList({
      filter: `user = "${userId}"`,
      expand: 'wanted_listing,offer_listings',
    });

    groups = await pb.collection('trade_groups').getFullList({
      filter: `user = "${userId}"`,
      expand: 'listings,offer_listings',
    });

    // Check for issues
    issues = validateAllPreferences(preferences, groups);
  });

  function validateAllPreferences(prefs, grps) {
    const issues = [];

    for (const pref of prefs) {
      // Check if wanted listing exists
      if (!pref.expand?.wanted_listing) {
        issues.push({
          type: 'missing_wanted',
          preferenceId: pref.id,
          message: 'Wanted listing no longer exists',
        });
      }

      // Check if any offer listing is missing
      if (pref.offer_listings) {
        for (const offerId of pref.offer_listings) {
          const exists = pref.expand?.offer_listings?.find((l) => l.id === offerId);
          if (!exists) {
            issues.push({
              type: 'missing_offer',
              preferenceId: pref.id,
              message: `Offer listing ${offerId} no longer exists`,
            });
          }
        }
      }

      // Check if no offers
      if (!pref.offer_listings?.length && !pref.offer_cash) {
        issues.push({
          type: 'no_offers',
          preferenceId: pref.id,
          message: 'No offers specified',
        });
      }
    }

    return issues;
  }

  async function fixIssue(issue) {
    if (issue.type === 'missing_wanted' || issue.type === 'missing_offer') {
      // Delete the invalid preference
      await pb.collection('trade_preferences').delete(issue.preferenceId);
      preferences = preferences.filter((p) => p.id !== issue.preferenceId);
    }
  }
</script>

<div class="space-y-6">
  <!-- Issues Section -->
  {#if issues.length > 0}
    <div class="alert alert-warning">
      <h3 class="font-bold">⚠️ Found {issues.length} issues</h3>
      <ul class="mt-2 space-y-2">
        {#each issues as issue}
          <li class="flex items-center justify-between">
            <span>{issue.message}</span>
            <button class="btn-sm btn-primary" onclick={() => fixIssue(issue)}> Fix </button>
          </li>
        {/each}
      </ul>
    </div>
  {/if}

  <!-- Preferences List -->
  <div>
    <h3 class="text-xl font-bold mb-3">Preferences ({preferences.length})</h3>
    <PreferenceList {preferences} readonly={true} />
  </div>

  <!-- Groups List -->
  <div>
    <h3 class="text-xl font-bold mb-3">Groups ({groups.length})</h3>
    <GroupList {groups} readonly={true} />
  </div>
</div>
```

---

### 9.6 Algorithm Configuration

#### Admin Settings (`/admin/optimizer/settings`)

**Configurable Parameters:**

```typescript
type OptimizerConfig = {
  enabled: boolean; // Global on/off switch
  maxIterations: number; // Default: 10, max: 50
  metric: 'CHAIN-SIZES-SOS' | 'USERS-TRADING';
  priorityScheme: 'LINEAR' | 'TRIANGLE' | 'SQUARE';
  allowDummies: boolean; // Enable groups feature
  caseSensitive: boolean;
  maxChainLength: number; // Limit chain size (e.g., max 6 people)
  minChainLength: number; // Filter out tiny chains (e.g., min 3)
  expirationDays: number; // Days until optimization expires (default: 7)
  maxConcurrentOptimizations: number; // Rate limiting
  requireAllAcceptance: boolean; // All must accept vs. majority
  autoRunSchedule: string; // Cron expression (e.g., "0 0 * * 1" = weekly)
};

// Stored in PocketBase settings collection
const config = await pb.collection('settings').getFirstListItem('key = "optimizer_config"');
```

**UI:**

```svelte
<form onsubmit={saveConfig}>
  <div class="form-control">
    <label class="label">
      <span>Enabled</span>
      <input type="checkbox" class="toggle" bind:checked={config.enabled} />
    </label>
  </div>

  <div class="form-control">
    <label class="label">Max Iterations</label>
    <input type="number" class="input" bind:value={config.maxIterations} min="1" max="50" />
    <span class="label-text-alt">Higher = better results, slower runtime</span>
  </div>

  <div class="form-control">
    <label class="label">Optimization Metric</label>
    <select class="select" bind:value={config.metric}>
      <option value="USERS-TRADING">Maximize users trading</option>
      <option value="CHAIN-SIZES-SOS">Maximize chain length</option>
    </select>
  </div>

  <div class="form-control">
    <label class="label">Priority Scheme</label>
    <select class="select" bind:value={config.priorityScheme}>
      <option value="LINEAR">Linear (1, 2, 3, ...)</option>
      <option value="TRIANGLE">Triangle (1, 3, 6, 10, ...)</option>
      <option value="SQUARE">Square (1, 4, 9, 16, ...)</option>
    </select>
    <span class="label-text-alt">How much to penalize lower-priority wants</span>
  </div>

  <div class="form-control">
    <label class="label">
      <span>Allow Groups (Dummy Items)</span>
      <input type="checkbox" class="toggle" bind:checked={config.allowDummies} />
    </label>
  </div>

  <div class="form-control">
    <label class="label">Max Chain Length</label>
    <input type="number" class="input" bind:value={config.maxChainLength} min="2" max="20" />
    <span class="label-text-alt">Filter out chains longer than this</span>
  </div>

  <div class="form-control">
    <label class="label">Expiration (days)</label>
    <input type="number" class="input" bind:value={config.expirationDays} min="1" max="30" />
  </div>

  <div class="form-control">
    <label class="label">
      <span>Require All Participants to Accept</span>
      <input type="checkbox" class="toggle" bind:checked={config.requireAllAcceptance} />
    </label>
    <span class="label-text-alt">If false, trades execute when majority accepts</span>
  </div>

  <button type="submit" class="btn-primary mt-4">Save Configuration</button>
</form>
```

---

### 9.7 Performance Monitoring

#### Slow Query Detection

**Monitor:**

- Average optimization run time
- P95, P99 latency
- Timeouts
- Algorithm iterations vs. results quality

**Alerts:**

- Run time > 10 seconds
- Timeout rate > 5%
- Zero results > 50% (algorithm not finding matches)

**Dashboard Visualization:**

```svelte
<script>
  import Chart from 'chart.js/auto';

  onMount(() => {
    const ctx = document.getElementById('perfChart');
    const data = perfMetrics.map((m) => ({
      x: new Date(m.timestamp),
      y: m.runtime_ms,
    }));

    new Chart(ctx, {
      type: 'line',
      data: {
        datasets: [
          {
            label: 'Run Time (ms)',
            data: data,
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1,
          },
        ],
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
            title: { display: true, text: 'Milliseconds' },
          },
        },
      },
    });
  });
</script>

<!-- Performance Chart -->
<div class="chart-container">
  <h3>Optimization Run Time (Last 100)</h3>
  <canvas id="perfChart"></canvas>
</div>
```

---

### 9.8 Dispute Resolution

#### Handle Disputed Chains

**Scenario:** User A accepted but now regrets, claims algorithm was wrong

**Admin Actions:**

1. **Review Chain:** View optimization detail, verify algorithm logic
2. **Check Preferences:** Ensure user's preferences were valid at time of run
3. **Cancel if Justified:** If algorithm error or user has valid claim
4. **Educate if Not:** Explain how algorithm works, what they agreed to

**Dispute Log:**

```typescript
type DisputeLog = {
  id: string;
  optimization: string; // relation(optimization_results)
  user: string; // relation(users) - who disputed
  reason: string; // User's claim
  admin: string; // relation(users) - admin handling
  resolution: 'cancelled' | 'upheld' | 'modified';
  notes: string; // Admin notes
  created: date;
  resolved: date;
};
```

---

### 9.9 System Health Checks

#### Automated Health Monitoring

**Checks (Run Daily):**

1. **Orphaned Preferences:** Preferences pointing to deleted listings
2. **Expired Optimizations:** Clean up old results (> 30 days)
3. **Stuck Acceptances:** Optimizations pending > 7 days
4. **Dead Groups:** Groups with < 2 valid listings

**Cleanup Script:**

```typescript
async function runHealthChecks() {
  const report = {
    orphanedPreferences: 0,
    expiredOptimizations: 0,
    stuckAcceptances: 0,
    deadGroups: 0,
  };

  // 1. Find and delete orphaned preferences
  const allPrefs = await pb.collection('trade_preferences').getFullList({
    expand: 'wanted_listing,offer_listings',
  });

  for (const pref of allPrefs) {
    if (!pref.expand?.wanted_listing) {
      await pb.collection('trade_preferences').delete(pref.id);
      report.orphanedPreferences++;
    }
  }

  // 2. Delete expired optimizations
  const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const expired = await pb.collection('optimization_results').getFullList({
    filter: `created < "${cutoffDate.toISOString()}"`,
  });

  for (const opt of expired) {
    await pb.collection('optimization_results').delete(opt.id);
    report.expiredOptimizations++;
  }

  // 3. Cancel stuck acceptances
  const stuckDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const stuck = await pb.collection('optimization_results').getFullList({
    filter: `created < "${stuckDate.toISOString()}" && status = "pending"`,
  });

  for (const opt of stuck) {
    await cancelOptimization(opt.id, 'Automatically cancelled due to timeout');
    report.stuckAcceptances++;
  }

  // 4. Clean up dead groups
  const groups = await pb.collection('trade_groups').getFullList({
    expand: 'listings',
  });

  for (const group of groups) {
    const validListings = group.expand?.listings?.filter((l) => l.status === 'active') ?? [];
    if (validListings.length < 2) {
      await pb.collection('trade_groups').delete(group.id);
      report.deadGroups++;
    }
  }

  // Log report
  await pb.collection('admin_logs').create({
    admin: 'system',
    action: 'health_check',
    details: JSON.stringify(report),
    timestamp: new Date().toISOString(),
  });

  return report;
}
```

---

### 9.10 Admin Permissions

**Role-Based Access:**

```typescript
type AdminPermissions = {
  canViewMetrics: boolean; // View analytics dashboard
  canViewHistory: boolean; // View optimization history
  canCancelOptimizations: boolean;
  canForceAccept: boolean;
  canRerunOptimizations: boolean;
  canEditConfig: boolean; // Change algorithm parameters
  canViewUserPreferences: boolean;
  canEditUserPreferences: boolean;
  canRunHealthChecks: boolean;
};

// Different admin levels
const ADMIN_ROLES = {
  viewer: {
    canViewMetrics: true,
    canViewHistory: true,
    canViewUserPreferences: true,
  },
  moderator: {
    ...ADMIN_ROLES.viewer,
    canCancelOptimizations: true,
    canForceAccept: true,
    canRerunOptimizations: true,
  },
  admin: {
    ...ADMIN_ROLES.moderator,
    canEditConfig: true,
    canEditUserPreferences: true,
    canRunHealthChecks: true,
  },
};
```

**Check Permissions:**

```typescript
function requirePermission(permission: keyof AdminPermissions) {
  const user = get(currentUser);
  const permissions = ADMIN_ROLES[user.admin_role];

  if (!permissions?.[permission]) {
    throw new Error('Insufficient permissions');
  }
}

// Usage
async function editConfig() {
  requirePermission('canEditConfig');
  // ... proceed with edit
}
```

---

### 9.11 Database Schema for Admin Features

**New Collections:**

#### `admin_logs`

```typescript
{
  "name": "admin_logs",
  "type": "base",
  "schema": [
    {
      "name": "admin",
      "type": "relation",
      "required": true,
      "options": {
        "collectionId": "users",
        "cascadeDelete": false
      }
    },
    {
      "name": "action",
      "type": "text",
      "required": true,
      "options": {}
    },
    {
      "name": "target_id",
      "type": "text",
      "required": false,
      "options": {}
    },
    {
      "name": "details",
      "type": "text",
      "required": false,
      "options": {}
    }
  ],
  "indexes": [
    "CREATE INDEX idx_admin_logs_admin ON admin_logs (admin)",
    "CREATE INDEX idx_admin_logs_created ON admin_logs (created)"
  ],
  "listRule": "@request.auth.admin_role != ''",
  "viewRule": "@request.auth.admin_role != ''",
  "createRule": "@request.auth.admin_role != ''",
  "updateRule": null,
  "deleteRule": null
}
```

#### `settings` (if doesn't exist)

```typescript
{
  "name": "settings",
  "type": "base",
  "schema": [
    {
      "name": "key",
      "type": "text",
      "required": true,
      "options": {
        "min": 1,
        "max": 100
      }
    },
    {
      "name": "value",
      "type": "json",
      "required": true,
      "options": {}
    }
  ],
  "indexes": [
    "CREATE UNIQUE INDEX idx_settings_key ON settings (key)"
  ],
  "listRule": "@request.auth.id != ''",
  "viewRule": "@request.auth.id != ''",
  "createRule": "@request.auth.admin_role = 'admin'",
  "updateRule": "@request.auth.admin_role = 'admin'",
  "deleteRule": "@request.auth.admin_role = 'admin'"
}
```

**Extend Existing Collections:**

Add to `users`:

```typescript
{
  "name": "admin_role",
  "type": "select",
  "required": false,
  "options": {
    "values": ["viewer", "moderator", "admin"]
  }
}
```

Add to `optimization_results`:

```typescript
{
  "name": "status",
  "type": "select",
  "required": true,
  "options": {
    "values": ["pending", "accepted", "cancelled", "expired"]
  }
},
{
  "name": "cancel_reason",
  "type": "text",
  "required": false,
  "options": {}
},
{
  "name": "is_rerun",
  "type": "bool",
  "required": false,
  "options": {}
},
{
  "name": "original_optimization",
  "type": "relation",
  "required": false,
  "options": {
    "collectionId": "optimization_results",
    "cascadeDelete": false
  }
}
```

---

### 9.12 Admin Best Practices

**When to Intervene:**

1. ✅ User reports technical issue preventing acceptance
2. ✅ Optimization stuck for > 7 days
3. ✅ Algorithm timeout/error needs investigation
4. ✅ Listings became invalid after optimization run
5. ❌ User simply changed their mind (educate, don't cancel)
6. ❌ User doesn't like the match (algorithm worked as intended)

**Logging Everything:**

- Every admin action must be logged
- Include reason/justification
- Preserve audit trail for disputes

**Communication:**

- Always notify affected users when intervening
- Explain what happened and why
- Provide link to help docs

---

## 10. Testing Strategy

### 10.1 Unit Tests

**Algorithm Tests** (`src/lib/trade-optimizer/algorithm/trademax.test.ts`):

```typescript
import { describe, it, expect } from 'vitest';
import { TradeMaximizer } from './trademax';

describe('TradeMaximizer', () => {
  it('finds simple 2-person trade', () => {
    const input = `
#!CASE-SENSITIVE
!BEGIN-OFFICIAL-NAMES
game1 Game One
game2 Game Two
!END-OFFICIAL-NAMES
(alice) game1 : game2
(bob) game2 : game1
    `;

    const tm = new TradeMaximizer();
    const output = tm.run(input);

    expect(output).toContain('alice receives game1 from bob');
    expect(output).toContain('bob receives game2 from alice');
  });

  it('finds 3-person circular trade', () => {
    // A wants B's game, B wants C's game, C wants A's game
    // ...
  });

  it('handles dummy items for groups', () => {
    // ...
  });
});
```

**Input Builder Tests** (`src/lib/trade-optimizer/input-builder.test.ts`):

```typescript
describe('buildInput', () => {
  it('generates correct format for simple preferences', () => {
    // ...
  });

  it('includes cash offers', () => {
    // ...
  });

  it('creates dummy items for groups', () => {
    // ...
  });
});
```

---

### 10.2 Integration Tests

**Trade Flow Test** (`src/lib/trade-optimizer/runner.test.ts`):

```typescript
describe('optimizeTrades', () => {
  it('returns empty chains when no preferences exist', async () => {
    const result = await optimizeTrades('user123');
    expect(result.chains).toHaveLength(0);
  });

  it('finds trades between users with matching preferences', async () => {
    // Setup: Create test users, listings, preferences
    // Run optimizer
    // Assert: Chains found, correct participants
  });
});
```

---

### 10.3 E2E Tests

**Full Optimizer Flow** (`tests/e2e/trade-optimizer.spec.ts`):

```typescript
import { test, expect } from '@playwright/test';

test('complete optimization flow', async ({ page, context }) => {
  // Setup: Two users with complementary preferences
  const alice = await context.newPage();
  const bob = page;

  // Alice adds preference: wants Bob's game, offers her game
  // Bob adds preference: wants Alice's game, offers his game

  // Alice runs optimizer
  // Alice sees preview with trade chain
  // Alice accepts

  // Bob sees notification
  // Bob views and accepts

  // Both see trades created in dashboard
  // Trades have status 'initiated'
});
```

---

## 11. Rollout Plan

### 11.1 Beta Phase (2 weeks)

**Target:** 20-30 active users

**Goals:**

- Test algorithm with real data
- Gather UX feedback
- Identify edge cases
- Monitor performance

**Beta Features:**

- Trade preferences (no groups yet)
- Basic optimizer (manual run only)
- Simple results preview
- Manual acceptance (no multi-party coordination)

**Success Metrics:**

- 10+ optimization runs
- 5+ accepted trade chains
- No critical bugs
- Average run time < 2 seconds

---

### 11.2 Launch Phase (MVP+ Release)

**Marketing:**

- Blog post: "Introducing Trade Optimizer"
- Email to all users
- Social media announcement
- Demo video

**Documentation:**

- Help page with examples
- FAQ section
- Video tutorial

**Monitoring:**

- Error tracking (Sentry)
- Performance metrics
- User engagement (# of preferences, optimization runs, acceptances)

---

### 11.3 Post-Launch Improvements

**Month 1:**

- Add trade groups ("any one of")
- Improve visualization (graph view)
- Add filtering/sorting to results
- Performance optimizations

**Month 2:**

- Auto-run optimizer weekly (email digest)
- "Smart suggestions" for preferences
- Trade chain history
- Advanced metrics (preference efficiency)

**Month 3:**

- Mobile app support
- Push notifications for matches
- Reputation integration (prefer trusted users)
- Cash trade support

---

## Appendix A: TradeMaximizer Input Format

### Format Specification

```
#!CASE-SENSITIVE           # Case-sensitive item names
#!ALLOW-DUMMIES           # Enable dummy items for groups

!BEGIN-OFFICIAL-NAMES
item_id Item Display Name
%dummy_id Dummy Item Name
$cash_id $50 from username
!END-OFFICIAL-NAMES

(username) wanted_item : offered_item1 offered_item2
(username) wanted_item : offered_item3
```

### Example: 3-Person Circular Trade

```
#!CASE-SENSITIVE
!BEGIN-OFFICIAL-NAMES
game1 Catan
game2 Ticket to Ride
game3 Pandemic
!END-OFFICIAL-NAMES

(alice) game2 : game1
(bob) game3 : game2
(charlie) game1 : game3
```

**Output:**

```
TRADE CHAINS:
*** CHAIN 1
alice receives game2 from bob
bob receives game3 from charlie
charlie receives game1 from alice
```

---

## Appendix B: Algorithm Complexity

### Time Complexity

- **Input:** N listings, P preferences
- **Graph building:** O(P) to create edges
- **Matching:** O(N³) for Hungarian algorithm
- **Cycle extraction:** O(N)
- **Total:** O(N³) per iteration

### Space Complexity

- **Graph storage:** O(N + P)
- **Matrices:** O(N²)
- **Total:** O(N²)

### Performance Targets

- **Small (< 100 listings):** < 1 second
- **Medium (100-500):** < 5 seconds
- **Large (500-1000):** < 15 seconds
- **Very Large (1000+):** May need optimization or pagination

### Optimization Strategies

1. **Shrinking:** Reduce graph size by removing low-priority edges
2. **Caching:** Store recent results for 5 minutes
3. **Incremental:** Only recompute when preferences change
4. **Web Worker:** Run algorithm in background thread (future)

---

## Appendix C: Edge Cases & Error Handling

### Edge Cases

1. **No matches found**
   - Display: "No trade chains found. Try adjusting your offers."
   - Action: Suggest adding more preferences or increasing offers

2. **Single-user "chain"**
   - Filter out: Only show multi-party chains
   - Edge case: User trading with themselves (should be impossible via validation)

3. **Circular dependencies in groups**
   - Example: Group A wants items from Group B, Group B wants items from Group A
   - Algorithm handles via dummy items

4. **Deleted listings in preferences**
   - Check at optimizer run time
   - Remove invalid preferences
   - Notify user

5. **User no longer owns offered listing**
   - Validate before creating trades
   - Show error in preview

### Error States

| Error              | User Message                                        | Recovery                          |
| ------------------ | --------------------------------------------------- | --------------------------------- |
| No preferences     | "Add trade preferences first"                       | Link to preferences page          |
| Algorithm timeout  | "Optimization taking too long. Try again."          | Reduce iterations or shrink graph |
| Network error      | "Connection lost. Check your internet."             | Retry button                      |
| Invalid data       | "Some preferences are invalid. Please review."      | Highlight invalid prefs           |
| Acceptance timeout | "Not all users accepted in time. Trades cancelled." | Rerun optimizer                   |

---

## Conclusion

This spec provides a comprehensive plan for integrating GameSwap's proven multi-party trade matching features into Meeple Cart. The TradeMaximizer algorithm is production-ready and can power an exciting "Trade Optimizer" feature that sets Meeple apart from simple marketplace platforms.

**Next Steps:**

1. Review and approve this spec
2. Decide on priority (post-MVP or include in MVP Week 3?)
3. Begin Phase 1: Copy algorithm and set up module structure
4. Create PocketBase migrations for new collections
5. Implement incrementally following the 7-phase plan

**Questions? Decisions Needed:**

- Should we launch optimizer as beta-only feature first?
- Do we need trade groups in v1 or just simple preferences?
- Should we support cash trades from day 1?
- What's the priority vs. MVP Week 2-3 tasks?

---

**Document Version:** 1.0
**Last Updated:** 2025-10-30
**Authors:** Claude Code + Chris (Meeple Cart team)
**Status:** 📝 Draft - Awaiting Review
