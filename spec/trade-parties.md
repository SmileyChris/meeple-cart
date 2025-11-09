# Trade Parties Specification

**Version:** 2.0 (Merged)
**Last Updated:** 2025-11-09
**Status:** Placeholder Pages Created
**Implementation Status:** Planning Phase

---

## Table of Contents

### Part 1: Product & User Experience
1. [Executive Summary](#executive-summary)
2. [Current Implementation Status](#current-implementation-status)
3. [How Trade Parties Work](#how-trade-parties-work)
4. [Key Features](#key-features)
5. [User Experience Design](#user-experience-design)
6. [Success Metrics](#success-metrics)

### Part 2: Technical Implementation
7. [Technical Architecture](#technical-architecture)
8. [TradeMaximizer Algorithm](#trademaxim algorithm)
9. [Database Schema](#database-schema)
10. [Module Structure](#module-structure)
11. [Implementation Plan](#implementation-plan)
12. [File Migration from GameSwap](#file-migration-from-gameswap)
13. [API Design](#api-design)
14. [UI Components](#ui-components)
15. [Administrative Management](#administrative-management)
16. [Testing Strategy](#testing-strategy)
17. [Rollout Plan](#rollout-plan)

### Appendices
- [Appendix A: TradeMaximizer Input Format](#appendix-a-trademaxim-input-format)
- [Appendix B: Algorithm Complexity](#appendix-b-algorithm-complexity)
- [Appendix C: Edge Cases & Error Handling](#appendix-c-edge-cases--error-handling)

---

# PART 1: PRODUCT & USER EXPERIENCE

---

## Executive Summary

Trade Parties (formerly known as "Math Trades" in the board gaming community) are **smart multi-way trading events** where an algorithm finds optimal trade chains across multiple participants. Unlike traditional 1-on-1 trades, Trade Parties allow users to trade with multiple people simultaneously through circular trade chains, maximizing the chances of everyone getting games they want.

### What Makes Trade Parties Special

- **Algorithmic Matching**: Uses the TradeMaximizer algorithm (Hungarian algorithm) to find optimal trade chains
- **Multi-Way Trades**: Participants can be part of circular chains (A→B→C→A)
- **Fair & Transparent**: All trade chains are visible and explainable
- **Event-Based**: Organized as time-bound events with submission and matching phases
- **Community-Driven**: Great for regular meetup groups or regional communities

### Technical Foundation

This feature will be powered by the **TradeMaximizer algorithm** (Hungarian algorithm implementation) from the [GameSwap project](https://github.com/tactful-ai/gameswap), a production-ready SvelteKit application that uses proven algorithms for board game math trades.

**Key Technical Points:**
- O(N³) complexity, handles 100-500 games in <5 seconds
- Deterministic results (same input = same output)
- Supports priority ranking, "any one of" groups, and cash trades
- Battle-tested in production environments

---

## Current Implementation Status

### ✅ Placeholder Pages Created (Nov 2025)

**Routes:**
- `/trade-parties` - Browse active and past trade parties
- `/trade-parties/new` - Create a new trade party (auth required)
- `/trade-parties/[id]` - View trade party details

**Pages Include:**
- Feature explanation and benefits
- 4-phase process visualization
- Mock layouts showing planned UI
- "Coming Soon" messaging
- Educational content about how it works

### 🎯 Not Yet Implemented

**Frontend:**
- Event creation workflow
- Game submission system
- Want list builder
- Results display
- Shipping coordination tools

**Backend:**
- Database schema for trade parties
- TradeMaximizer algorithm integration
- Trade matching service
- Notification system for results

---

## How Trade Parties Work

### The 4-Phase Process

#### 1. **Submission Phase** (1-2 weeks)

**Organizer Creates Event:**
- Event name and description
- Submission deadline
- Regional restrictions (optional)
- Shipping requirements
- Rules and guidelines

**Participants Submit Games:**
- Game details (title, condition, BGG ID)
- Shipping preferences
- Special notes or restrictions
- No commitments yet - just interest

#### 2. **Want List Phase** (1 week)

**Participants Build Preferences:**
- Browse all submitted games
- Build "want lists" for each of their submitted games
  - Example: "For my Wingspan, I'd accept: Gloomhaven, Brass, or Ark Nova"
- Rank preferences (1st choice, 2nd choice, etc.)
- Can include "no trade" option (keep game if no good matches)
- Want lists are private until matching

#### 3. **Algorithm Execution** (Instant)

**System Runs TradeMaximizer:**
- Builds graph: Nodes = games, Edges = want list entries
- Finds optimal trade chains:
  - Simple: A→B (direct swap)
  - Circular: A→B→C→A (everyone gets something they want)
  - Complex: A→B→C→D→E→F→A (longer chains)
- Maximizes:
  - Number of successful trades
  - Preference rankings
  - Total participant satisfaction
- Results published simultaneously to all participants

#### 4. **Execution Phase** (2-4 weeks)

**Matched Participants:**
- See their trade chains
- Coordinate shipping directly:
  - Exchange contact info
  - Agree on shipping method
  - Track packages
- Mark trades complete when received
- Leave feedback for trade partners

---

## Key Features

### For Participants

**Benefits:**
- Higher chance of successful trades (multi-way vs 1-on-1)
- Algorithm finds matches you might not have discovered
- Organized, time-bound events create urgency
- Fair system - everyone uses same algorithm
- "No trade" protection - not forced into unwanted trades

**User Flow:**
1. Browse active trade parties
2. Join event (if within submission window)
3. Submit games with photos and descriptions
4. Wait for want list phase to open
5. Browse all submissions, build want lists
6. Wait for results
7. View matches and trade chain
8. Coordinate with trade partners
9. Complete trades and leave feedback

### For Organizers

**Responsibilities:**
- Create and configure trade party
- Set clear rules and deadlines
- Moderate submissions (if needed)
- Run algorithm at specified time
- Handle disputes (if any)
- Manage event communication

**Tools Needed:**
- Event setup form
- Participant management dashboard
- Submission moderation queue
- Algorithm execution button
- Results publication controls
- Communication tools (announcements, Q&A)

---

## User Experience Design

### Browse Page (`/trade-parties`)

**Tabs:**
- Active (currently accepting submissions or want lists)
- Accepting Submissions (submission phase open)
- Results (matching complete, execution in progress)
- Completed (all trades finished)

**Each Card Shows:**
- Event name and organizer
- Current phase + countdown
- Participant count and games submitted
- "Join" or "View Results" button

### Create Page (`/trade-parties/new`)

**Form Sections:**
1. Basic Info (name, description)
2. Timeline (all phase dates)
3. Rules & Restrictions (max games, regions, shipping)
4. Configuration (no-trade option, etc.)

**Validation:**
- Submission must close before want lists open
- Want lists must close before algorithm runs
- Algorithm must run before execution deadline

### Detail Page (`/trade-parties/[id]`)

**Different Views by Phase:**

**During Submissions:**
- Submit games button
- List of your submissions
- Participant count (but not individual participants yet)

**During Want Lists:**
- Browse all submissions
- Build want lists for each of your games
- Your want list progress

**After Matching:**
- Your matches and trade chains
- Shipping coordination UI
- Track trade status

**After Completion:**
- Results summary
- Successful matches
- Feedback from partners

---

## Success Metrics

When implemented, track:
- **Participation Rate**: % of community members joining events
- **Match Success Rate**: % of submitted games that get matched
- **Completion Rate**: % of matches that complete successfully
- **Average Chain Length**: Complexity of trade chains
- **Organizer Satisfaction**: Ease of running events
- **User Satisfaction**: Would participate again?

---

# PART 2: TECHNICAL IMPLEMENTATION

---

## Technical Architecture

### Integration with GameSwap

This feature integrates proven multi-party trade matching from the [GameSwap](https://github.com/tactful-ai/gameswap) codebase. GameSwap is a production-ready SvelteKit application that uses the TradeMaximizer algorithm (Hungarian algorithm implementation) to compute optimal trade chains for board game exchanges.

### What We're Getting from GameSwap

1. **TradeMaximizer Algorithm** - Sophisticated multi-party matching engine
2. **Trade Optimization Logic** - Smart trade chain calculation
3. **Wants Groups** - "Any one of these games" functionality
4. **Cash Integration** - Mixed cash/item trade support (future)
5. **Confirmation Workflow** - Sent/received tracking patterns
6. **Utility Functions** - Currency formatting, time countdown, etc.

### Key Architectural Difference

- **GameSwap:** Event-based batch trading (all trades computed at once for an event)
- **Meeple Cart:** Event-based trade parties (matching the GameSwap model)

**Our Approach:** Trade parties are organized events with submission deadlines, just like GameSwap. Users submit games to an event, build want lists, and the algorithm runs at a scheduled time.

### Module Organization

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

src/routes/trade-parties/
├── +page.svelte              # Browse page
├── new/
│   └── +page.svelte          # Create event page
└── [id]/
    ├── +page.svelte          # Event detail page
    ├── +page.ts              # Page loader
    ├── submit/               # Submit games to event
    ├── wants/                # Build want lists
    └── results/              # View results

src/lib/components/TradeParty/
├── EventCard.svelte          # Event preview card
├── SubmissionForm.svelte     # Submit game to event
├── WantListBuilder.svelte    # Build want lists
├── ResultsViewer.svelte      # View results
└── TradeChainViz.svelte      # Visualize trade chains
```

---

## TradeMaximizer Algorithm

### Implementation Details

**We will use the proven TradeMaximizer algorithm from GameSwap** rather than building from scratch. This is a battle-tested Hungarian algorithm implementation specifically designed for board game math trades.

**Key Features:**
- Deterministic results (same input = same output)
- Multiple optimization metrics (maximize users trading vs. maximize chain length)
- Priority scheme support (linear, triangle, square)
- Dummy items for "any one of" groups
- Cash trade support (future)

### Algorithm Flow

1. **Build Input Format:**
   ```
   #!CASE-SENSITIVE
   #!ALLOW-DUMMIES

   !BEGIN-OFFICIAL-NAMES
   game1 Wingspan
   game2 Gloomhaven
   game3 Brass Birmingham
   !END-OFFICIAL-NAMES

   (alice) game2 : game1
   (bob) game3 : game2
   (charlie) game1 : game3
   ```

2. **Run TradeMaximizer:**
   - Finds optimal cycles using Hungarian algorithm
   - Returns trade chains as structured output

3. **Parse Results:**
   ```
   TRADE CHAINS:
   *** CHAIN 1
   alice receives game2 from bob
   bob receives game3 from charlie
   charlie receives game1 from alice
   ```

4. **Create Trades:**
   - Extract trade chains
   - Map to Meeple Cart trade records
   - Send notifications to all participants

### Performance Expectations

- **< 100 games:** < 1 second
- **100-500 games:** < 5 seconds
- **500-1000 games:** < 15 seconds
- **1000+ games:** May need optimization

**Time Complexity:** O(N³) per iteration
**Space Complexity:** O(N²)

See [Appendix B](#appendix-b-algorithm-complexity) for detailed complexity analysis.

---

## Database Schema

### New Collections

#### `trade_parties` Collection

```typescript
interface TradePartyRecord extends RecordModel {
  // Basic Info
  name: string;                    // "Summer 2026 Auckland Trade Party"
  description: text;               // Event details, rules, etc.
  organizer: string;               // Relation to users

  // Status & Phases
  status: 'planning' | 'submissions' | 'want_lists' | 'matching' | 'execution' | 'completed';

  // Dates
  submission_opens: datetime;      // When participants can submit games
  submission_closes: datetime;     // Deadline for game submissions
  want_list_opens: datetime;       // When want list building opens
  want_list_closes: datetime;      // Deadline for want lists
  algorithm_runs_at: datetime;     // When results will be published
  execution_deadline: datetime;    // When trades should be completed by

  // Configuration
  max_games_per_user: number;      // Optional limit (e.g., 10)
  allow_no_trade: boolean;         // Can users opt to keep game if no matches
  regional_restriction: string;    // e.g., "auckland", "north-island", null
  shipping_rules: text;            // Free text shipping guidelines

  // Stats
  participant_count: number;
  game_count: number;
  successful_matches: number;

  // Relations
  expand?: {
    organizer?: UserRecord;
  };
}
```

**PocketBase Schema:**

```json
{
  "name": "trade_parties",
  "type": "base",
  "schema": [
    {
      "name": "name",
      "type": "text",
      "required": true,
      "options": {
        "min": 3,
        "max": 100
      }
    },
    {
      "name": "description",
      "type": "editor",
      "required": true
    },
    {
      "name": "organizer",
      "type": "relation",
      "required": true,
      "options": {
        "collectionId": "users",
        "cascadeDelete": false
      }
    },
    {
      "name": "status",
      "type": "select",
      "required": true,
      "options": {
        "values": ["planning", "submissions", "want_lists", "matching", "execution", "completed"]
      }
    },
    {
      "name": "submission_opens",
      "type": "date",
      "required": true
    },
    {
      "name": "submission_closes",
      "type": "date",
      "required": true
    },
    {
      "name": "want_list_opens",
      "type": "date",
      "required": true
    },
    {
      "name": "want_list_closes",
      "type": "date",
      "required": true
    },
    {
      "name": "algorithm_runs_at",
      "type": "date",
      "required": true
    },
    {
      "name": "execution_deadline",
      "type": "date",
      "required": true
    },
    {
      "name": "max_games_per_user",
      "type": "number",
      "required": false,
      "options": {
        "min": 1,
        "max": 50
      }
    },
    {
      "name": "allow_no_trade",
      "type": "bool",
      "required": true
    },
    {
      "name": "regional_restriction",
      "type": "text",
      "required": false
    },
    {
      "name": "shipping_rules",
      "type": "editor",
      "required": false
    },
    {
      "name": "participant_count",
      "type": "number",
      "required": true
    },
    {
      "name": "game_count",
      "type": "number",
      "required": true
    },
    {
      "name": "successful_matches",
      "type": "number",
      "required": true
    }
  ],
  "indexes": [
    "CREATE INDEX idx_trade_parties_status ON trade_parties (status)",
    "CREATE INDEX idx_trade_parties_organizer ON trade_parties (organizer)"
  ],
  "listRule": "@request.auth.id != ''",
  "viewRule": "@request.auth.id != ''",
  "createRule": "@request.auth.id = organizer",
  "updateRule": "@request.auth.id = organizer",
  "deleteRule": "@request.auth.id = organizer"
}
```

#### `trade_party_submissions` Collection

```typescript
interface TradePartySubmissionRecord extends RecordModel {
  trade_party: string;             // Relation to trade_parties
  user: string;                    // Relation to users

  // Game Details
  title: string;
  bgg_id?: number;
  condition: 'mint' | 'like_new' | 'good' | 'fair' | 'poor';
  description: text;
  photos: file[];                  // Game photos

  // Shipping
  ship_from_region: string;        // User's location
  will_ship_to: string[];          // Regions they'll ship to
  shipping_notes: text;

  // Status
  status: 'pending' | 'approved' | 'matched' | 'shipped' | 'completed' | 'cancelled';
  matched_with?: string;           // Relation to another submission (if matched)

  expand?: {
    user?: UserRecord;
    matched_with?: TradePartySubmissionRecord;
  };
}
```

#### `trade_party_want_lists` Collection

```typescript
interface TradePartyWantListRecord extends RecordModel {
  my_submission: string;           // Relation to trade_party_submissions (my game)
  wanted_submission: string;       // Relation to trade_party_submissions (game I want)
  preference_rank: number;         // 1 = first choice, 2 = second, etc.

  expand?: {
    my_submission?: TradePartySubmissionRecord;
    wanted_submission?: TradePartySubmissionRecord;
  };
}
```

#### `trade_party_matches` Collection

```typescript
interface TradePartyMatchRecord extends RecordModel {
  trade_party: string;             // Relation to trade_parties
  chain_id: string;                // UUID for the trade chain
  chain_position: number;          // Position in chain (1, 2, 3...)

  // The Trade
  giving_submission: string;       // Relation to trade_party_submissions
  receiving_submission: string;    // Relation to trade_party_submissions
  giving_user: string;             // Relation to users
  receiving_user: string;          // Relation to users

  // Status
  status: 'pending' | 'shipping' | 'completed' | 'disputed';
  shipped_at?: datetime;
  received_at?: datetime;
  tracking_number?: string;

  expand?: {
    giving_submission?: TradePartySubmissionRecord;
    receiving_submission?: TradePartySubmissionRecord;
    giving_user?: UserRecord;
    receiving_user?: UserRecord;
  };
}
```

---

## Module Structure

### Trade Optimizer Core (`src/lib/trade-optimizer/`)

#### `algorithm/trademax.js`

- **Source:** Copy directly from GameSwap
- **Changes:** None (pure algorithm)
- **Lines:** ~1,640
- **Purpose:** Core Hungarian algorithm implementation

#### `algorithm/trademax.ts`

- **Source:** Adapt from GameSwap
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

#### `runner.ts` - Main Orchestrator

```typescript
import { pb } from '$lib/pocketbase';
import { TradeMaximizer } from './algorithm/trademax';
import { buildInput } from './input-builder';
import { parseResults } from './result-parser';
import type { OptimizationResult, TradeChain } from './types';

export async function runTradePartyAlgorithm(
  tradePartyId: string
): Promise<OptimizationResult> {
  // 1. Fetch all submissions for this trade party
  const submissions = await pb.collection('trade_party_submissions').getFullList({
    filter: `trade_party = "${tradePartyId}" && status = "approved"`,
    expand: 'user',
  });

  // 2. Fetch all want lists
  const wantLists = await pb.collection('trade_party_want_lists').getFullList({
    filter: `my_submission.trade_party = "${tradePartyId}"`,
    expand: 'my_submission,wanted_submission',
  });

  // 3. Build input for TradeMaximizer
  const input = buildInput(submissions, wantLists);

  // 4. Run algorithm
  const tm = new TradeMaximizer({
    allowDummies: true,
    metric: 'USERS-TRADING',
    iterations: 10,
    priorityScheme: 'LINEAR',
  });

  const output = tm.run(input);

  // 5. Parse results into chains
  const chains = parseResults(output, submissions, wantLists);

  // 6. Create match records
  await createMatchRecords(tradePartyId, chains);

  // 7. Send notifications
  await notifyParticipants(tradePartyId, chains);

  return {
    chains,
    totalTrades: chains.reduce((sum, c) => sum + c.trades.length, 0),
    totalUsers: new Set(chains.flatMap((c) => c.participants)).size,
    input, // For debugging
    output, // For debugging
  };
}

async function createMatchRecords(tradePartyId: string, chains: TradeChain[]): Promise<void> {
  for (const chain of chains) {
    const chainId = crypto.randomUUID();

    for (let i = 0; i < chain.trades.length; i++) {
      const trade = chain.trades[i];

      await pb.collection('trade_party_matches').create({
        trade_party: tradePartyId,
        chain_id: chainId,
        chain_position: i + 1,
        giving_submission: trade.givingSubmissionId,
        receiving_submission: trade.receivingSubmissionId,
        giving_user: trade.givingUserId,
        receiving_user: trade.receivingUserId,
        status: 'pending',
      });
    }
  }
}

async function notifyParticipants(tradePartyId: string, chains: TradeChain[]): Promise<void> {
  const allUsers = new Set(chains.flatMap((c) => c.participants));

  for (const userId of allUsers) {
    await pb.collection('notifications').create({
      user: userId,
      type: 'trade_party_results',
      title: 'Trade Party Results Published!',
      message: 'The algorithm has found matches. Check your results!',
      link: `/trade-parties/${tradePartyId}/results`,
      read: false,
    });
  }
}
```

#### `input-builder.ts`

```typescript
import type { TradePartySubmissionRecord, TradePartyWantListRecord } from '$lib/types/pocketbase';

export function buildInput(
  submissions: TradePartySubmissionRecord[],
  wantLists: TradePartyWantListRecord[]
): string {
  const lines: string[] = [];

  // Header
  lines.push('#!CASE-SENSITIVE');
  lines.push('#!ALLOW-DUMMIES');
  lines.push('');

  // Official names section
  lines.push('!BEGIN-OFFICIAL-NAMES');

  // Add all submissions
  for (const submission of submissions) {
    lines.push(`${submission.id} ${escapeTitle(submission.title)}`);
  }

  lines.push('!END-OFFICIAL-NAMES');
  lines.push('');

  // Build want list entries
  for (const want of wantLists) {
    const username = want.expand?.my_submission?.expand?.user?.username ?? 'unknown';
    const wantedId = want.wanted_submission;
    const offeredId = want.my_submission;

    lines.push(`(${username}) ${wantedId} : ${offeredId}`);
  }

  return lines.join('\n');
}

function escapeTitle(title: string): string {
  // Remove parentheses to avoid conflicts with TradeMaximizer format
  return title.replace(/[()]/g, '');
}
```

#### `result-parser.ts`

```typescript
import type { TradeChain, Trade } from './types';

export function parseResults(
  output: string,
  submissions: any[],
  wantLists: any[]
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
      const [, receivingUser, submissionId, givingUser] = match;

      const submission = submissions.find((s) => s.id === submissionId);
      if (!submission) continue;

      currentChain.trades.push({
        givingSubmissionId: submissionId,
        receivingSubmissionId: submissionId,
        givingUserId: givingUser,
        receivingUserId: receivingUser,
        submission,
      });

      if (!currentChain.participants.includes(receivingUser)) {
        currentChain.participants.push(receivingUser);
      }
      if (!currentChain.participants.includes(givingUser)) {
        currentChain.participants.push(givingUser);
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

#### `types.ts`

```typescript
import type { TradePartySubmissionRecord } from '$lib/types/pocketbase';

export interface Trade {
  givingSubmissionId: string;
  receivingSubmissionId: string;
  givingUserId: string;
  receivingUserId: string;
  submission: TradePartySubmissionRecord;
}

export interface TradeChain {
  chainNumber: number;
  trades: Trade[];
  participants: string[]; // User IDs
}

export interface OptimizationResult {
  chains: TradeChain[];
  totalTrades: number;
  totalUsers: number;
  input: string; // Debug
  output: string; // Debug
}
```

---

## Implementation Plan

### Phase 1: Foundation ✅ COMPLETE

**Goal:** Set up module structure and copy algorithm

**Tasks:**

1. ✅ Create placeholder pages
2. ✅ Create module directories
3. ✅ Copy TradeMaximizer files from GameSwap
4. ✅ Add TypeScript types
5. ✅ Write unit tests for algorithm
6. ✅ Create PocketBase migrations for new collections

**Deliverable:** Algorithm runs with test data ✅

---

### Phase 2: Database & Event Management (SKIPPED)

**Note:** Skipped event creation UI for now. Using manual database seeding for initial parties.

---

### Phase 3: Submission System ✅ COMPLETE

**Goal:** Build game submission workflow

**Tasks:**

1. ✅ Create submission form (SubmissionForm.svelte)
2. ✅ Add BGG search integration (BggSearch.svelte)
3. ✅ Implement submission listing on party page
4. ✅ Add delete functionality for submissions
5. ✅ Photo upload support (via FormData)
6. ✅ Shipping information fields
7. ✅ Auto-increment/decrement party game_count

**Deliverable:** Users can submit games to events ✅

---

### Phase 4: Want List Builder ✅ COMPLETE

**Goal:** Build want list creation UI

**Tasks:**

1. ✅ Create want list builder interface (WantListBuilder.svelte)
2. ✅ Implement preference ranking (up/down buttons for reordering)
3. ✅ Add "no trade" option (checkbox to opt out)
4. ✅ Display available submissions from other users
5. ✅ Save/update want lists to PocketBase
6. ✅ Load existing want lists on mount
7. ✅ Integrate into party detail page during want list phase
8. ✅ Toggle open/close for each submission's builder
9. ✅ Filter out user's own submissions from available list

**Deliverable:** Users can build want lists ✅

---

### Phase 5: Algorithm Integration 🚧 NEXT UP

**Goal:** Integrate TradeMaximizer and run matching algorithm

**Tasks:**

1. ✅ Implement `input-builder.ts` (COMPLETED - Phase 1)
2. ✅ Implement `result-parser.ts` (COMPLETED - Phase 1)
3. ✅ Write unit tests for algorithm (COMPLETED - Phase 1)
4. 🚧 Implement `runner.ts` - Orchestrate algorithm execution
5. 🚧 Create match records from algorithm results
6. 🚧 Add admin/organizer trigger button for algorithm
7. 🚧 Send notifications to matched participants
8. 🚧 Update party status after algorithm runs
9. 🚧 Handle algorithm errors gracefully

**Deliverable:** Algorithm runs and creates matches

---

### Phase 6: Results & Execution (Week 6)

**Goal:** Display results and manage execution

**Tasks:**

1. ⏸ Build results viewer
2. ⏸ Create trade chain visualization
3. ⏸ Add shipping coordination UI
4. ⏸ Implement status tracking
5. ⏸ Add notifications

**Deliverable:** Users can view and execute trades

---

### Phase 7: Polish & Launch (Week 7)

**Goal:** Testing, docs, launch

**Tasks:**

1. ⏸ Write end-to-end tests
2. ⏸ Performance testing with large datasets
3. ⏸ Write user documentation
4. ⏸ Add help tooltips
5. ⏸ Beta test with real users
6. ⏸ Launch to production

**Deliverable:** Feature live and stable

---

## File Migration from GameSwap

### Direct Copies (Minimal Changes)

| Source (GameSwap) | Destination (Meeple) | Changes |
|---|---|---|
| `src/lib/olwlg/trademax.js` | `src/lib/trade-optimizer/algorithm/trademax.js` | None |
| `src/lib/olwlg/javarandom.js` | `src/lib/trade-optimizer/algorithm/javarandom.js` | None |
| `src/lib/utils.ts` (currency) | `src/lib/utils/currency.ts` | Change to NZD |
| `src/routes/(event)/remaining.ts` | `src/lib/utils/countdown.ts` | Remove event dependency |

### Heavy Adaptations

| Source (GameSwap) | Destination (Meeple) | Changes |
|---|---|---|
| `src/lib/olwlg/_trademax.ts` | `src/lib/trade-optimizer/algorithm/trademax.ts` | Update types |
| `src/routes/(event)/trades/trades.ts` | `src/lib/trade-optimizer/runner.ts` | Adapt for trade parties model |
| `src/components/WantOffers.svelte` | `src/lib/components/TradeParty/WantListBuilder.svelte` | Redesign UI |

---

## API Design

### Client-Side API

```typescript
// Import in any component
import { runTradePartyAlgorithm } from '$lib/trade-optimizer';

// Example usage in admin interface
async function runAlgorithm(tradePartyId: string) {
  try {
    const result = await runTradePartyAlgorithm(tradePartyId);

    // Show results
    console.log(`Found ${result.chains.length} trade chains`);
    console.log(`${result.totalUsers} users matched`);

    // Update event status
    await pb.collection('trade_parties').update(tradePartyId, {
      status: 'execution',
      successful_matches: result.totalTrades,
    });
  } catch (err) {
    console.error('Algorithm failed:', err);
    showError('Could not run algorithm. Please try again.');
  }
}
```

### PocketBase API Endpoints

All operations use PocketBase client SDK. No custom endpoints needed.

**Trade Parties:**

```typescript
// Create event
pb.collection('trade_parties').create({
  name: 'Summer 2026 Auckland Trade Party',
  organizer: userId,
  status: 'planning',
  submission_opens: new Date('2026-01-01'),
  submission_closes: new Date('2026-01-14'),
  want_list_opens: new Date('2026-01-15'),
  want_list_closes: new Date('2026-01-21'),
  algorithm_runs_at: new Date('2026-01-22'),
  execution_deadline: new Date('2026-02-05'),
  // ... other fields
});

// List active events
pb.collection('trade_parties').getList(1, 20, {
  filter: 'status = "submissions" || status = "want_lists"',
  sort: '-created',
});
```

**Submissions:**

```typescript
// Submit game to event
pb.collection('trade_party_submissions').create({
  trade_party: tradePartyId,
  user: userId,
  title: 'Wingspan',
  condition: 'like_new',
  description: 'Complete with all expansions',
  photos: [photoFile],
  status: 'pending',
});

// List submissions for event
pb.collection('trade_party_submissions').getFullList({
  filter: `trade_party = "${tradePartyId}" && status = "approved"`,
  expand: 'user',
});
```

**Want Lists:**

```typescript
// Add to want list
pb.collection('trade_party_want_lists').create({
  my_submission: mySubmissionId,
  wanted_submission: wantedSubmissionId,
  preference_rank: 1,
});

// Get my want lists
pb.collection('trade_party_want_lists').getFullList({
  filter: `my_submission.user = "${userId}"`,
  expand: 'my_submission,wanted_submission',
  sort: 'preference_rank',
});
```

---

## UI Components

### Event Card (`EventCard.svelte`)

```svelte
<script lang="ts">
  import type { TradePartyRecord } from '$lib/types/pocketbase';

  let { event }: { event: TradePartyRecord } = $props();

  let countdown = $derived.by(() => {
    const now = new Date();
    const deadline = new Date(event.submission_closes);
    const diff = deadline.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    return `${days} days`;
  });
</script>

<div class="bg-surface-card rounded-lg border border-subtle p-6">
  <div class="mb-3 flex items-center gap-2">
    <span class="badge badge-{getStatusColor(event.status)}">
      {event.status}
    </span>
    <span class="text-sm text-muted">Closes in {countdown}</span>
  </div>

  <h3 class="mb-2 text-xl font-bold text-primary">{event.name}</h3>

  <div class="mb-4 flex items-center gap-4 text-sm text-secondary">
    <span>{event.participant_count} participants</span>
    <span>·</span>
    <span>{event.game_count} games</span>
  </div>

  <a href="/trade-parties/{event.id}" class="btn-primary w-full">
    View Event
  </a>
</div>
```

### Want List Builder (`WantListBuilder.svelte`)

```svelte
<script lang="ts">
  import { pb, currentUser } from '$lib/pocketbase';
  import type { TradePartySubmissionRecord } from '$lib/types/pocketbase';

  let {
    mySubmission,
    availableSubmissions
  }: {
    mySubmission: TradePartySubmissionRecord;
    availableSubmissions: TradePartySubmissionRecord[];
  } = $props();

  let wantList = $state<string[]>([]);

  async function addToWantList(submissionId: string) {
    const rank = wantList.length + 1;

    await pb.collection('trade_party_want_lists').create({
      my_submission: mySubmission.id,
      wanted_submission: submissionId,
      preference_rank: rank,
    });

    wantList = [...wantList, submissionId];
  }

  async function removeFromWantList(submissionId: string) {
    const record = await pb.collection('trade_party_want_lists').getFirstListItem(
      `my_submission = "${mySubmission.id}" && wanted_submission = "${submissionId}"`
    );

    await pb.collection('trade_party_want_lists').delete(record.id);
    wantList = wantList.filter(id => id !== submissionId);
  }
</script>

<div class="space-y-4">
  <div class="bg-surface-card rounded-lg p-4">
    <h3 class="mb-2 font-semibold text-primary">
      Building want list for: {mySubmission.title}
    </h3>
    <p class="text-sm text-secondary">
      Select games you'd accept in trade. Order matters - higher priority first.
    </p>
  </div>

  <div class="space-y-2">
    {#each availableSubmissions as submission}
      <div class="flex items-center justify-between bg-surface rounded-lg p-3">
        <div class="flex-1">
          <h4 class="font-medium text-primary">{submission.title}</h4>
          <p class="text-xs text-muted">
            Offered by {submission.expand?.user?.display_name} · {submission.condition}
          </p>
        </div>

        {#if wantList.includes(submission.id)}
          <button
            class="btn-sm btn-error"
            onclick={() => removeFromWantList(submission.id)}
          >
            Remove (#{wantList.indexOf(submission.id) + 1})
          </button>
        {:else}
          <button
            class="btn-sm btn-primary"
            onclick={() => addToWantList(submission.id)}
          >
            Add to Want List
          </button>
        {/if}
      </div>
    {/each}
  </div>
</div>
```

### Trade Chain Visualization (`TradeChainViz.svelte`)

```svelte
<script lang="ts">
  import type { TradeChain } from '$lib/trade-optimizer/types';

  let { chain }: { chain: TradeChain } = $props();
</script>

<div class="bg-surface-card rounded-lg border border-subtle p-6">
  <h3 class="mb-4 text-lg font-semibold text-primary">
    Chain {chain.chainNumber} · {chain.participants.length} participants
  </h3>

  <div class="space-y-3">
    {#each chain.trades as trade, i}
      <div class="flex items-center gap-4">
        <div class="flex-1 rounded-lg bg-surface-body p-3">
          <p class="text-sm font-medium text-primary">{trade.givingUserId}</p>
          <p class="text-xs text-muted">gives {trade.submission.title}</p>
        </div>

        <div class="text-2xl text-accent">→</div>

        <div class="flex-1 rounded-lg bg-surface-body p-3">
          <p class="text-sm font-medium text-primary">{trade.receivingUserId}</p>
          <p class="text-xs text-success">receives {trade.submission.title}</p>
        </div>
      </div>
    {/each}
  </div>
</div>
```

---

## Administrative Management

### Admin Dashboard (`/admin/trade-parties`)

**Metrics:**
- Total trade parties created
- Active events
- Average participants per event
- Match success rate
- Completion rate

**Actions:**
- View all trade parties
- Run algorithm for event
- Cancel event
- Moderate submissions
- Handle disputes

### Running the Algorithm

**Admin Interface:**

```svelte
<script lang="ts">
  import { runTradePartyAlgorithm } from '$lib/trade-optimizer';

  let { tradeParty } = $props();
  let isRunning = $state(false);
  let results = $state(null);

  async function runAlgorithm() {
    isRunning = true;
    try {
      results = await runTradePartyAlgorithm(tradeParty.id);
      alert(`Found ${results.chains.length} trade chains!`);
    } catch (err) {
      alert('Algorithm failed: ' + err.message);
    } finally {
      isRunning = false;
    }
  }
</script>

<div class="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
  <h3 class="font-semibold text-amber-200 mb-2">⚠️ Algorithm Control</h3>
  <p class="text-sm text-amber-300/80 mb-4">
    Ready to run the matching algorithm? This will find optimal trade chains and
    notify all participants of their matches.
  </p>

  <button
    class="btn-primary"
    onclick={runAlgorithm}
    disabled={isRunning}
  >
    {isRunning ? 'Running Algorithm...' : 'Run Matching Algorithm'}
  </button>

  {#if results}
    <div class="mt-4 p-3 bg-emerald-500/10 rounded">
      <p class="text-sm text-emerald-200">
        ✓ Found {results.chains.length} chains with {results.totalTrades} trades
      </p>
    </div>
  {/if}
</div>
```

---

## Testing Strategy

### Unit Tests

**Algorithm Tests:**

```typescript
import { describe, it, expect } from 'vitest';
import { TradeMaximizer } from './trademax';

describe('TradeMaximizer', () => {
  it('finds simple 2-person trade', () => {
    const input = `
#!CASE-SENSITIVE
!BEGIN-OFFICIAL-NAMES
game1 Wingspan
game2 Gloomhaven
!END-OFFICIAL-NAMES
(alice) game2 : game1
(bob) game1 : game2
    `;

    const tm = new TradeMaximizer();
    const output = tm.run(input);

    expect(output).toContain('alice receives game2 from bob');
    expect(output).toContain('bob receives game1 from alice');
  });

  it('finds 3-person circular trade', () => {
    // A wants B's game, B wants C's game, C wants A's game
    // Test implementation...
  });
});
```

**Input Builder Tests:**

```typescript
describe('buildInput', () => {
  it('generates correct format for submissions', () => {
    const submissions = [
      { id: 'sub1', title: 'Wingspan', user: 'alice' },
      { id: 'sub2', title: 'Gloomhaven', user: 'bob' },
    ];

    const wantLists = [
      { my_submission: 'sub1', wanted_submission: 'sub2', preference_rank: 1 },
    ];

    const input = buildInput(submissions, wantLists);

    expect(input).toContain('!BEGIN-OFFICIAL-NAMES');
    expect(input).toContain('sub1 Wingspan');
    expect(input).toContain('(alice) sub2 : sub1');
  });
});
```

### Integration Tests

**Full Event Flow:**

```typescript
describe('Trade Party Event Flow', () => {
  it('completes full event lifecycle', async () => {
    // 1. Create event
    const event = await pb.collection('trade_parties').create({
      name: 'Test Event',
      status: 'submissions',
      // ... other fields
    });

    // 2. Users submit games
    const sub1 = await pb.collection('trade_party_submissions').create({
      trade_party: event.id,
      user: 'alice',
      title: 'Wingspan',
      status: 'approved',
    });

    // 3. Users build want lists
    await pb.collection('trade_party_want_lists').create({
      my_submission: sub1.id,
      wanted_submission: sub2.id,
      preference_rank: 1,
    });

    // 4. Run algorithm
    const result = await runTradePartyAlgorithm(event.id);

    // 5. Assert matches created
    expect(result.chains.length).toBeGreaterThan(0);
  });
});
```

### E2E Tests

**User Participation Flow:**

```typescript
test('user can participate in trade party', async ({ page }) => {
  // Navigate to trade parties
  await page.goto('/trade-parties');

  // Find and join event
  await page.click('text=Summer 2026 Trade Party');
  await page.click('text=Join Event');

  // Submit game
  await page.fill('input[name="title"]', 'Wingspan');
  await page.selectOption('select[name="condition"]', 'like_new');
  await page.click('text=Submit Game');

  // Build want list
  await page.click('text=Build Want Lists');
  await page.check('[data-submission-id="sub_123"]');
  await page.click('text=Save Want List');

  // Verify submission
  await expect(page.locator('text=Want list saved')).toBeVisible();
});
```

---

## Rollout Plan

### Phase 1: Internal Testing (Week 1)

**Goal:** Test with development team

**Tasks:**
- Create test event with team members
- Submit test games
- Build want lists
- Run algorithm
- Review results

**Success Criteria:**
- Algorithm completes successfully
- Results match expectations
- No critical bugs

### Phase 2: Beta Testing (Weeks 2-3)

**Goal:** Test with 20-30 users

**Tasks:**
- Recruit beta testers
- Create first public event
- Monitor participation
- Gather feedback
- Fix issues

**Success Criteria:**
- 10+ algorithm runs
- 5+ completed trade chains
- Positive user feedback
- Average run time < 5 seconds

### Phase 3: Public Launch (Week 4)

**Goal:** Launch to all users

**Tasks:**
- Announcement blog post
- Email campaign
- Social media promotion
- Create documentation
- Monitor metrics

**Success Criteria:**
- 50+ participants in first event
- 80%+ match success rate
- 90%+ completion rate

---

## Future Enhancements

### Phase 1 Features (Post-MVP)

- Basic event creation ✓
- Game submission with photos ✓
- Simple want list builder ✓
- TradeMaximizer algorithm ✓
- Results display ✓

### Phase 2 Features (Month 2-3)

- **Advanced Want Lists:**
  - Drag-and-drop ranking
  - "Any one of" groups
  - Conditional preferences

- **Better Visualization:**
  - Graph view of trade chains
  - Interactive chain explorer
  - SVG/Canvas rendering

- **Cash Integration:**
  - Mixed cash/game trades
  - Payment tracking
  - Escrow support (future)

### Phase 3 Features (Month 4-6)

- **Automation:**
  - Auto-run algorithm at scheduled time
  - Weekly email digests
  - Reminder notifications

- **Analytics:**
  - Historical stats
  - Match success trends
  - User participation metrics

- **Mobile:**
  - Push notifications
  - Mobile-optimized UI
  - App support

---

# APPENDICES

---

## Appendix A: TradeMaximizer Input Format

### Format Specification

```
#!CASE-SENSITIVE           # Case-sensitive item names
#!ALLOW-DUMMIES           # Enable dummy items for groups

!BEGIN-OFFICIAL-NAMES
item_id Item Display Name
%dummy_id Dummy Item Name  # Optional: for "any one of" groups
!END-OFFICIAL-NAMES

(username) wanted_item : offered_item1 offered_item2
(username) wanted_item : offered_item3
```

### Example: 3-Person Circular Trade

**Input:**

```
#!CASE-SENSITIVE
!BEGIN-OFFICIAL-NAMES
game1 Wingspan
game2 Gloomhaven
game3 Brass Birmingham
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

- **Input:** N submissions, W want list entries
- **Graph building:** O(W) to create edges
- **Matching:** O(N³) for Hungarian algorithm
- **Cycle extraction:** O(N)
- **Total:** O(N³) per iteration

### Space Complexity

- **Graph storage:** O(N + W)
- **Matrices:** O(N²)
- **Total:** O(N²)

### Performance Targets

- **Small (< 100 submissions):** < 1 second
- **Medium (100-500):** < 5 seconds
- **Large (500-1000):** < 15 seconds
- **Very Large (1000+):** May need optimization

### Optimization Strategies

1. **Reduce graph size:** Filter low-priority wants
2. **Cache results:** Store for 5 minutes
3. **Incremental updates:** Only recompute when data changes
4. **Web Worker:** Run in background thread (future)

---

## Appendix C: Edge Cases & Error Handling

### Edge Cases

1. **No matches found**
   - Display: "No trade chains found. Encourage more participants."
   - Action: Suggest lowering standards or adding more games

2. **Single-user chain**
   - Filter out: Only show multi-party chains (2+ people)

3. **Deleted submissions**
   - Check before algorithm runs
   - Remove invalid want list entries
   - Notify affected users

4. **User withdraws after matching**
   - Mark chain as broken
   - Notify other participants
   - Option to rerun algorithm

### Error States

| Error | User Message | Recovery |
|---|---|---|
| No submissions | "No one has submitted games yet" | Encourage participation |
| No want lists | "Participants need to build want lists" | Send reminders |
| Algorithm timeout | "Matching took too long. Contact admin." | Reduce dataset or increase timeout |
| Network error | "Connection lost. Try again." | Retry button |
| Invalid data | "Some submissions are invalid" | Highlight issues |

---

## Conclusion

Trade Parties provide a unique value proposition for Meeple Cart:

1. **Community Building**: Regular events bring people together
2. **Efficient Trading**: Higher success rate than 1-on-1
3. **Differentiation**: Feature not found on other NZ platforms
4. **Engagement**: Events create urgency and excitement
5. **Viral Growth**: Successful events attract new users

The technical foundation from GameSwap provides a proven, battle-tested algorithm. Combined with Meeple Cart's existing trade infrastructure and community features, Trade Parties can become a cornerstone feature that drives engagement and sets the platform apart.

**Next Steps:**

1. Review and approve this merged specification
2. Create PocketBase migrations for new collections
3. Begin Phase 1: Copy TradeMaximizer algorithm files
4. Set up module structure
5. Build event creation UI
6. Implement incrementally following the 7-phase plan

---

**Document Version:** 2.0 (Merged from trade-parties v1.0 + gameswap-integration v1.0)
**Last Updated:** 2025-11-09
**Authors:** Claude Code + Chris (Meeple Cart team)
**Status:** 📋 Comprehensive Spec - Ready for Implementation
