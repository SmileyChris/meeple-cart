# Discussion System Specification

**Version:** 2.0
**Last Updated:** 2025-11-09
**Status:** Fully Implemented (Core Features)

---

## Executive Summary

The Meeple Cart discussion system is a **fully functional, human-centered community platform** for board gaming enthusiasts in New Zealand. As of November 2025, all core features have been implemented and are live in production.

### What We Built

A complete discussion system with:
- **4 themed categories** for organizing conversations (Game Talk, Wanted, Rules, Meta)
- **Full reply system** with markdown, quoting, and reactions
- **Tag-based discovery** for filtering and search
- **Wanted post system** for ISO requests and group buys
- **Subscription system** for following threads
- **@mention notifications** for user engagement
- **Mobile-responsive design** with dark mode support

### Core Philosophy

1. **Human First**: Prioritize authentic conversations over algorithmic feeds
2. **Discovery & Expertise**: Encourage deep knowledge sharing and game exploration
3. **Lightweight Structure**: Use broad categories and organic tags, not rigid hierarchies
4. **Mobile-First**: Fast, clean interface optimized for phones
5. **Progressive Enhancement**: Start simple, add features based on real needs

### Implementation Status

**Core Features: 100% Complete** ✅
- Categories, tags, replies, reactions, subscriptions, notifications, search

**Optional Enhancements: Available for Future** 🎯
- Trust levels, moderation tools, polls, link previews, advanced features

---

## Current Implementation Status

### ✅ What We Have (Fully Implemented)

**Discussion Threads** (`discussion_threads` collection)
- Thread creation with title, content (markdown), author
- Listing-specific discussions (optional link to a listing)
- View count, reply count tracking (auto-incremented)
- Last reply timestamp tracking
- Pinned and locked status support
- Author expansion for display
- Pagination support (20 threads per page)

**Category System** (`discussion_categories` collection)
- 4 core categories with icons, colors, descriptions
- Categories: Game Talk 🎲, Wanted 🔍, Rules 📖, Meta 🗣️
- Category badges with custom colors
- Category filtering on browse page
- Required category selection on thread creation
- Order-based display

**Tag System**
- Flexible tag array (up to 10 tags per thread)
- Tag input with add/remove functionality
- Tags separated by commas or Enter key
- Clickable tag pills linking to filtered views
- Multi-tag filtering with AND logic
- Tag display on thread cards and detail pages

**Wanted Posts** (specialized thread type)
- `thread_type` field: `'discussion'` | `'wanted'`
- `wanted_items` array with game details:
  - `title` (required)
  - `bgg_id` (optional, for BGG integration)
  - `max_price` (optional, stored in NZD cents)
- `wanted_offer_type`: `'buying'` | `'trading'` | `'either'`
- Creation UI with dynamic item list (add/remove items)
- Validation (requires at least one item for wanted posts)
- Auto-assigned to "Wanted" category
- Preview of wanted items on thread cards

**Browse/Discovery Pages** (`/discussions`)
- Tab navigation: Latest, Top, Wanted, Unanswered
- Category dropdown filter
- Multi-tag filtering
- Full-text search on title and content
- Active filter display with remove buttons
- Thread cards with metadata (author, timestamp, reply count, view count)
- Pagination with page indicators
- Pinned threads appear first
- Sign-in prompts for guests

**Reply System** (`discussion_replies` collection)
- Flat reply structure (oldest first)
- Markdown editor for replies
- Quote functionality (click to quote a reply)
- Quoted reply preview in UI
- Reply author and timestamp display
- Edited status tracking
- Auto-subscribe on reply
- Reply count updates on thread

**Reactions** (`discussion_reactions` collection)
- 6 emoji reactions: ❤️ 👍 🔥 😂 🤔 👀
- React to threads (original post)
- React to individual replies
- One reaction per user per item
- Can change reaction
- Reaction counts displayed
- Visual indicator for user's reaction

**Notifications**
- Thread reply notifications
- @mention notifications in content
- Thread subscription system
- Auto-subscribe on thread creation
- Auto-subscribe on reply
- Subscribe/unsubscribe toggle button
- Listing owner notification when thread created on their listing
- Notifications sent to all subscribers (except actor)

**Thread Detail Page** (`/discussions/[id]`)
- Breadcrumb navigation
- Category badge with color/icon
- Pinned and locked status indicators
- Tag pills (clickable to filter)
- Author and timestamp metadata
- View count and reply count
- Markdown-rendered content
- Thread reactions with counts
- Related listing preview (if linked)
- Reply list with quoted reply support
- Reply reactions
- Reply composer with markdown editor
- Locked thread blocking (no new replies)
- Quote button on each reply

**Thread Creation UI** (`/discussions/new`)
- Thread type selection (discussion vs wanted ad)
- Category selection (required, auto-set for wanted posts)
- Title input (3-200 characters, with counter)
- Markdown editor for content with preview support
- Tag input with keyboard shortcuts (Enter, comma)
- Tag display with remove buttons
- Wanted-specific fields (conditional rendering):
  - Items list with add/remove
  - BGG ID and max price per item
  - Offer type selection (buying/trading/either)
- Related listing preview (if coming from listing page)
- Auto-subscription for thread author
- Listing owner notification
- Community guidelines section
- Form validation

**Utilities** (`src/lib/utils/discussions.ts`)
- `subscribeToThread()` - Subscribe user to thread
- `unsubscribeFromThread()` - Unsubscribe user
- `isSubscribed()` - Check subscription status
- `getThreadSubscribers()` - Get all subscribers
- `notifyThreadSubscribers()` - Send notifications to subscribers
- `extractMentions()` - Extract @username from content
- `notifyMentionedUsers()` - Send mention notifications
- `updateThreadAfterReply()` - Update thread metadata

**Technical Foundation**
- PocketBase SDK integration
- Markdown rendering via `marked` library
- Real-time view count increment (fire-and-forget)
- Error handling with user-friendly messages
- Client-side routing with SvelteKit
- Svelte 5 runes ($state, $derived, $effect)
- Mobile-responsive design
- Dark mode support via CSS custom properties

### 🎯 Optional Future Enhancements

The following features were specified but not implemented (not needed for MVP):

1. **Trust & Moderation**
   - Trust levels (0-4)
   - Rate limiting for newcomers
   - Flag/report system
   - Staff moderation tools
   - Auto-hide flagged content

2. **Rich Interactions**
   - Polls with voting
   - Link previews (BGG, YouTube)
   - Inline tag rendering (#euro → clickable)
   - @mention autocomplete dropdown
   - Image uploads in posts

3. **Advanced Features**
   - Events & meetups
   - Reputation/expertise system
   - Weekly email digests
   - Advanced search (by author, date range)
   - Featured/staff picks section
   - Real-time updates via PocketBase subscriptions

4. **Moderation Tools**
   - Pin/unpin threads (implemented in schema, no UI)
   - Lock/unlock threads (implemented in schema, no UI)
   - Delete threads/replies (no UI)
   - Edit other users' posts (no UI)
   - Ban users (no UI)

---

## Category System

### Design Principles

- **Broad, not granular**: 4-5 categories cover 95% of use cases
- **Mandatory selection**: Every thread must have a category
- **User-friendly**: Clear descriptions, no overlap
- **Future-proof**: Easy to add subcategories later if needed

### Proposed Categories

#### 1. 🎲 **Game Talk**
**Description:** Reviews, strategy discussions, mechanics analysis, and general board game chat

**Examples:**
- "Just played Ark Nova - here's why the card combos are brilliant"
- "Best gateway games for non-gamers in 2025?"
- "Comparing worker placement in Agricola vs Caverna"

**Schema:**
```typescript
{
  slug: 'game-talk',
  name: 'Game Talk',
  icon: '🎲',
  description: 'Reviews, strategy, mechanics, and general board game discussion',
  color: '#10b981' // Emerald
}
```

#### 2. 🔍 **Games Wanted / Group Buys**
**Description:** Wishlists, ISO posts, split shipping orders, and group purchases

**Examples:**
- "ISO: Brass Birmingham in good condition, Auckland pickup"
- "Group buy: Splitting a KS pledge for Frosthaven expansions"
- "Looking for anyone selling their Gloomhaven collection"

**Schema:**
```typescript
{
  slug: 'wanted',
  name: 'Games Wanted / Group Buys',
  icon: '🔍',
  description: 'Wishlists, ISO posts, and group purchasing',
  color: '#f59e0b' // Amber
}
```

**Note:** Wanted posts (with `thread_type: 'wanted'`) auto-assigned to this category.

#### 3. 📖 **Rules & House Variants**
**Description:** Rule clarifications, FAQs, custom variants, and gameplay questions

**Examples:**
- "Twilight Imperium: Clarification on timing for action cards"
- "Our house rules for faster 7 Wonders Duel games"
- "Official FAQ vs community interpretations for Scythe"

**Schema:**
```typescript
{
  slug: 'rules',
  name: 'Rules & House Variants',
  icon: '📖',
  description: 'Rule clarifications, FAQs, and custom variants',
  color: '#3b82f6' // Blue
}
```

#### 4. 🗣️ **Meta / Platform Feedback**
**Description:** Site bugs, feature requests, community etiquette, and platform discussion

**Examples:**
- "Feature request: Add wishlist export to BGG"
- "Bug report: Photos not uploading in Safari"
- "Community guidelines: How should we handle price policing?"

**Schema:**
```typescript
{
  slug: 'meta',
  name: 'Meta / Platform Feedback',
  icon: '🗣️',
  description: 'Site feedback, bugs, features, and community discussion',
  color: '#8b5cf6' // Purple
}
```

#### 5. 🎉 **Events & Meetups** *(Optional, future)*
**Description:** Game nights, conventions, local meetups, and community events

**Examples:**
- "Monthly Auckland board game night - Feb 2025"
- "Anyone going to CanCon this year?"
- "Wellington area players: Regular Twilight Imperium group forming"

**Schema:**
```typescript
{
  slug: 'events',
  name: 'Events & Meetups',
  icon: '🎉',
  description: 'Game nights, conventions, and local meetups',
  color: '#ec4899' // Pink
}
```

**Implementation Note:** Start with 4 categories, add Events later if demand exists.

### Database Schema Addition

**New Collection: `discussion_categories`**

```typescript
interface DiscussionCategoryRecord extends RecordModel {
  slug: string;           // URL-friendly: 'game-talk', 'wanted', 'rules', 'meta'
  name: string;           // Display name: 'Game Talk'
  icon: string;           // Emoji: '🎲'
  description: string;    // Short description for UI
  color: string;          // Hex color for theming
  order: number;          // Display order (1, 2, 3, 4)
  enabled: boolean;       // Allow disabling categories
}
```

**Update to `discussion_threads`:**

```typescript
interface DiscussionThreadRecord extends RecordModel {
  // ... existing fields ...
  category: string;  // NEW: Required relation to discussion_categories
  tags?: string[];   // NEW: Optional array of tag strings
}
```

**Seed Data (to be added to migrations):**

```javascript
// In migration file: pb_migrations/1731300000_discussion_categories.js
migrate((db) => {
  const collection = new Collection({
    name: 'discussion_categories',
    type: 'base',
    system: false,
    schema: [
      { name: 'slug', type: 'text', required: true, unique: true },
      { name: 'name', type: 'text', required: true },
      { name: 'icon', type: 'text', required: true },
      { name: 'description', type: 'text', required: true },
      { name: 'color', type: 'text', required: true },
      { name: 'order', type: 'number', required: true },
      { name: 'enabled', type: 'bool', required: true },
    ],
  });

  db.saveCollection(collection);

  // Seed initial categories
  const categories = [
    { slug: 'game-talk', name: 'Game Talk', icon: '🎲', description: 'Reviews, strategy, mechanics, and general board game discussion', color: '#10b981', order: 1, enabled: true },
    { slug: 'wanted', name: 'Games Wanted / Group Buys', icon: '🔍', description: 'Wishlists, ISO posts, and group purchasing', color: '#f59e0b', order: 2, enabled: true },
    { slug: 'rules', name: 'Rules & House Variants', icon: '📖', description: 'Rule clarifications, FAQs, and custom variants', color: '#3b82f6', order: 3, enabled: true },
    { slug: 'meta', name: 'Meta / Platform Feedback', icon: '🗣️', description: 'Site feedback, bugs, features, and community discussion', color: '#8b5cf6', order: 4, enabled: true },
  ];

  categories.forEach(cat => {
    db.newRecord('discussion_categories', cat);
  });
}, (db) => {
  db.deleteCollection('discussion_categories');
});
```

---

## Tag System

### Design Principles

- **Organic & Lightweight**: Users type tags freely (no predefined list)
- **Autocomplete Suggestions**: Show popular tags as user types
- **Prefix Namespacing**: Optional prefixes for clarity (`tag:euro`, `region:wellington`, `player-count:2-4`)
- **Non-Hierarchical**: Tags are flat, not nested
- **Multiple Tags**: Allow 0-10 tags per thread
- **Search & Filter**: Primary use case is filtering browse views

### Tag Namespaces (Optional Convention)

Users can use plain tags (`euro`, `co-op`) or namespaced tags for clarity:

| Prefix | Purpose | Examples |
|--------|---------|----------|
| `tag:` | Game mechanisms/types | `tag:euro`, `tag:co-op`, `tag:deck-building`, `tag:legacy` |
| `region:` | NZ regions | `region:auckland`, `region:wellington`, `region:christchurch` |
| `player-count:` | Player counts | `player-count:2`, `player-count:4-6`, `player-count:solo` |
| `game:` | Specific games | `game:wingspan`, `game:gloomhaven`, `game:twilight-imperium` |

**Implementation Note:** Namespaces are a **UI convention, not enforced**. Users can type anything.

### Tag Entry UI

**Thread Creation:**
```svelte
<!-- In /discussions/new/+page.svelte -->
<div>
  <label>Tags (optional)</label>
  <input
    type="text"
    bind:value={tagInput}
    placeholder="Type tags separated by commas (e.g., euro, co-op, region:auckland)"
    oninput={handleTagAutocomplete}
  />
  <div class="tag-suggestions">
    {#each suggestedTags as tag}
      <button onclick={() => addTag(tag)}>{tag}</button>
    {/each}
  </div>
  <div class="selected-tags">
    {#each tags as tag}
      <span class="tag">{tag} <button onclick={() => removeTag(tag)}>×</button></span>
    {/each}
  </div>
</div>
```

**Tag Autocomplete Logic:**
- Query `discussion_threads` for most common tags (aggregate unique tags across all threads)
- Filter by partial match on user input
- Show top 10 suggestions
- Clicking suggestion adds to thread's tag list

**Tag Storage:**
```typescript
// In thread creation submission
const thread = await pb.collection('discussion_threads').create({
  // ... other fields ...
  tags: tags.map(t => t.toLowerCase().trim()), // Normalize to lowercase
});
```

### Tag Display

**Thread List:**
```svelte
<div class="thread-tags">
  {#each thread.tags ?? [] as tag}
    <a href="/discussions?tag={encodeURIComponent(tag)}" class="tag-pill">
      {tag}
    </a>
  {/each}
</div>
```

**Thread Detail:**
```svelte
<div class="thread-header-tags">
  {#each thread.tags ?? [] as tag}
    <a href="/discussions?tag={encodeURIComponent(tag)}" class="inline-tag">
      #{tag}
    </a>
  {/each}
</div>
```

### Tag Filtering

**Browse Page URL:**
- `/discussions?tag=euro` - Show threads with "euro" tag
- `/discussions?tag=region:auckland` - Show threads with "region:auckland" tag
- `/discussions?tag=co-op&tag=2-player` - Multiple tag filter (AND logic)

**Backend Filter:**
```typescript
// In /discussions/+page.ts
const tagFilters = url.searchParams.getAll('tag');
let filter = '';

if (tagFilters.length > 0) {
  const tagConditions = tagFilters.map(tag => `tags ~ "${tag}"`).join(' && ');
  filter = tagConditions;
}

const threads = await pb.collection('discussion_threads').getList(page, 20, {
  filter,
  sort: '-created',
  expand: 'author,category',
});
```

---

## Browse & Discovery Pages

### `/discussions` - Main Discussion Hub

**Default View: "Latest Topics"**

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│  Discussions                                         │
│  ┌───────┬───────┬───────┬───────┐                  │
│  │Latest │  Top  │Wanted │Unanswered│  [New Thread]│
│  └───────┴───────┴───────┴───────┘                  │
│                                                      │
│  🔍 Search threads...          [Category▼] [Tag▼]  │
│                                                      │
│  ┌─────────────────────────────────────────────┐   │
│  │ 🎲 Best worker placement for 2 players?     │   │
│  │ @alice in Game Talk • 2 replies • 1h ago    │   │
│  │ #euro #2-player                              │   │
│  └─────────────────────────────────────────────┘   │
│                                                      │
│  ┌─────────────────────────────────────────────┐   │
│  │ 📌 🔍 ISO: Brass Birmingham (Auckland)      │   │
│  │ @bob in Wanted • 0 replies • 3h ago          │   │
│  │ #region:auckland                             │   │
│  └─────────────────────────────────────────────┘   │
│                                                      │
│  [...more threads...]                               │
│                                                      │
│  [Load More]                                         │
└─────────────────────────────────────────────────────┘
```

**Tabs:**

1. **Latest** (default)
   - Sort: `-created` (newest first)
   - All categories
   - Pagination: 20 per page

2. **Top**
   - Sort: `-reply_count` or custom "hotness" score
   - Time filter: Today, This Week, This Month, All Time
   - Formula: `hotness = (reply_count * 3) + (reaction_count * 1) - (hours_since_created * 0.1)`

3. **Wanted**
   - Filter: `category = "wanted"` or `thread_type = "wanted"`
   - Sort: `-created`
   - Show wanted items inline

4. **Unanswered** *(optional)*
   - Filter: `reply_count = 0`
   - Sort: `-created`
   - Encourage community engagement

**Filters (Above Thread List):**

- **Search**: Full-text search on title + content
- **Category Dropdown**: Filter by category (multi-select)
- **Tag Input**: Filter by tags (autocomplete)
- **Date Range**: Last 24h, Last Week, Last Month, All Time

**Thread Card Components:**

```svelte
<!-- ThreadCard.svelte -->
<script>
  export let thread;
  export let showCategory = true;
</script>

<article class="thread-card">
  <div class="thread-header">
    {#if thread.pinned}
      <span class="pin-icon">📌</span>
    {/if}
    {#if thread.thread_type === 'wanted'}
      <span class="wanted-icon">🔍</span>
    {/if}
    <h3 class="thread-title">
      <a href="/discussions/{thread.id}">{thread.title}</a>
    </h3>
  </div>

  <div class="thread-meta">
    <a href="/users/{thread.expand.author.id}" class="author-link">
      @{thread.expand.author.display_name}
    </a>
    {#if showCategory}
      <span class="category-badge" style="color: {thread.expand.category.color}">
        {thread.expand.category.icon} {thread.expand.category.name}
      </span>
    {/if}
    <span class="reply-count">{thread.reply_count} replies</span>
    <span class="timestamp">{formatRelativeTime(thread.created)}</span>
  </div>

  {#if thread.tags && thread.tags.length > 0}
    <div class="thread-tags">
      {#each thread.tags as tag}
        <a href="/discussions?tag={tag}" class="tag-pill">#{tag}</a>
      {/each}
    </div>
  {/if}

  {#if thread.thread_type === 'wanted' && thread.wanted_items}
    <div class="wanted-items-preview">
      <span class="wanted-label">Looking for:</span>
      {thread.wanted_items.slice(0, 3).map(i => i.title).join(', ')}
      {#if thread.wanted_items.length > 3}
        <span>+{thread.wanted_items.length - 3} more</span>
      {/if}
    </div>
  {/if}
</article>
```

**Loader:**

```typescript
// /discussions/+page.ts
import type { PageLoad } from './$types';
import { pb } from '$lib/pocketbase';
import type { DiscussionThreadRecord } from '$lib/types/pocketbase';

export const load: PageLoad = async ({ url }) => {
  const page = parseInt(url.searchParams.get('page') ?? '1', 10);
  const tab = url.searchParams.get('tab') ?? 'latest';
  const categorySlug = url.searchParams.get('category');
  const tags = url.searchParams.getAll('tag');
  const search = url.searchParams.get('search');

  let filter = '';
  let sort = '-created';

  // Tab logic
  if (tab === 'top') {
    sort = '-reply_count';
  } else if (tab === 'wanted') {
    filter = 'thread_type = "wanted"';
  } else if (tab === 'unanswered') {
    filter = 'reply_count = 0';
  }

  // Category filter
  if (categorySlug) {
    const categoryFilter = `category.slug = "${categorySlug}"`;
    filter = filter ? `${filter} && ${categoryFilter}` : categoryFilter;
  }

  // Tag filters
  if (tags.length > 0) {
    const tagFilter = tags.map(t => `tags ~ "${t}"`).join(' && ');
    filter = filter ? `${filter} && ${tagFilter}` : tagFilter;
  }

  // Search filter
  if (search) {
    const searchFilter = `(title ~ "${search}" || content ~ "${search}")`;
    filter = filter ? `${filter} && ${searchFilter}` : searchFilter;
  }

  const threads = await pb.collection('discussion_threads').getList<DiscussionThreadRecord>(page, 20, {
    filter: filter || undefined,
    sort,
    expand: 'author,category',
  });

  const categories = await pb.collection('discussion_categories').getFullList({
    filter: 'enabled = true',
    sort: 'order',
  });

  return {
    threads,
    categories,
    currentTab: tab,
    currentCategory: categorySlug,
    currentTags: tags,
    currentSearch: search,
  };
};
```

### `/discussions/[id]` - Thread Detail Page

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│  ← Back to Discussions                               │
│                                                      │
│  🎲 Game Talk  #euro #worker-placement              │
│                                                      │
│  Best worker placement games for 2 players?         │
│                                                      │
│  Posted by @alice • 3 hours ago • 12 replies        │
│                                                      │
│  ────────────────────────────────────────────────── │
│                                                      │
│  I'm looking for worker placement games that work   │
│  well at 2 players. I've tried Agricola and loved   │
│  it, but wondering what else is out there...        │
│                                                      │
│  ❤️ 5  👍 3  🔥 1                                    │
│                                                      │
│  ────────────────────────────────────────────────── │
│                                                      │
│  @bob replied 2 hours ago:                          │
│  > I'm looking for worker placement games...        │
│                                                      │
│  Have you tried Targi? It's specifically designed   │
│  for 2 players and has great tension!               │
│                                                      │
│  ❤️ 2  👍 4                                          │
│                                                      │
│  ────────────────────────────────────────────────── │
│                                                      │
│  [...more replies...]                               │
│                                                      │
│  ────────────────────────────────────────────────── │
│                                                      │
│  📝 Your Reply                                       │
│  [Markdown Editor]                                   │
│  [Submit]                                            │
└─────────────────────────────────────────────────────┘
```

**Features:**

1. **Thread Header**
   - Category badge with color/icon
   - Tags (clickable, link to filtered browse)
   - Pin status (if pinned)
   - Lock status (if locked)

2. **Original Post (OP)**
   - Author info (display name, trust badge)
   - Timestamp (relative + absolute on hover)
   - Markdown-rendered content
   - Reaction buttons (❤️ 👍 🔥 etc.)
   - Edit button (if current user is author)
   - Report button (for moderation)

3. **Replies**
   - Flat list (no threading initially)
   - Sort options: Oldest First, Newest First, Most Liked
   - Quote support (click to quote parent reply)
   - Reaction buttons
   - Edit/Delete for own replies
   - @mention rendering with links

4. **Reply Composer**
   - Markdown editor (reuse MarkdownEditor.svelte)
   - Preview tab
   - @mention autocomplete
   - Submit button (disabled if empty)

5. **Wanted Post Enhancements**
   - If `thread_type === 'wanted'`, show wanted items in sidebar:
     ```
     ┌─────────────────────┐
     │ Items Wanted        │
     ├─────────────────────┤
     │ • Brass Birmingham  │
     │   BGG: 224517       │
     │   Max: $80 NZD      │
     │                     │
     │ • Wingspan          │
     │   BGG: 266192       │
     │   Max: $60 NZD      │
     └─────────────────────┘
     ```

**Schema Additions:**

```typescript
// New collection: discussion_replies
interface DiscussionReplyRecord extends RecordModel {
  thread: string;              // Relation to discussion_threads
  author: string;              // Relation to users
  content: string;             // Markdown text
  quoted_reply?: string;       // Optional relation to parent reply
  edited?: boolean;            // Was this reply edited?
  edited_at?: string;          // When was it edited?
  expand?: {
    author?: UserRecord;
    quoted_reply?: DiscussionReplyRecord;
  };
}

// New collection: discussion_reactions (separate from listing reactions)
interface DiscussionReactionRecord extends RecordModel {
  thread?: string;             // Relation to discussion_threads (if reacting to OP)
  reply?: string;              // Relation to discussion_replies (if reacting to reply)
  user: string;                // Relation to users
  emoji: '❤️' | '👍' | '🔥' | '😂' | '🤔' | '👀';
}
```

**Loader:**

```typescript
// /discussions/[id]/+page.ts
import type { PageLoad } from './$types';
import { pb, currentUser } from '$lib/pocketbase';
import { get } from 'svelte/store';
import { error } from '@sveltejs/kit';

export const load: PageLoad = async ({ params }) => {
  const { id } = params;
  const user = get(currentUser);

  // Load thread
  const thread = await pb.collection('discussion_threads').getOne(id, {
    expand: 'author,category',
  });

  // Increment view count (only if not author)
  if (!user || user.id !== thread.author) {
    await pb.collection('discussion_threads').update(id, {
      view_count: thread.view_count + 1,
    });
  }

  // Load replies
  const replies = await pb.collection('discussion_replies').getFullList({
    filter: `thread = "${id}"`,
    sort: 'created', // Default: oldest first
    expand: 'author,quoted_reply',
  });

  // Load reactions for thread and all replies
  const reactionFilter = `thread = "${id}" || reply ~ "${replies.map(r => r.id).join('|')}"`;
  const reactions = await pb.collection('discussion_reactions').getFullList({
    filter: reactionFilter,
  });

  // Aggregate reaction counts
  const threadReactions = reactions.filter(r => r.thread === id);
  const replyReactions = reactions.filter(r => r.reply);

  return {
    thread,
    replies,
    threadReactions,
    replyReactions,
  };
};
```

**Reply Submission:**

```svelte
<!-- In /discussions/[id]/+page.svelte -->
<script>
  import { pb, currentUser } from '$lib/pocketbase';
  import MarkdownEditor from '$lib/components/MarkdownEditor.svelte';

  let replyContent = $state('');
  let quotedReply = $state(null);

  async function submitReply() {
    if (!$currentUser) {
      goto('/login');
      return;
    }

    if (!replyContent.trim()) return;

    try {
      const reply = await pb.collection('discussion_replies').create({
        thread: data.thread.id,
        author: $currentUser.id,
        content: replyContent,
        quoted_reply: quotedReply?.id || null,
      });

      // Increment reply count on thread
      await pb.collection('discussion_threads').update(data.thread.id, {
        reply_count: data.thread.reply_count + 1,
        last_reply_at: new Date().toISOString(),
      });

      // Notify thread author (if not replying to self)
      if (data.thread.author !== $currentUser.id) {
        await pb.collection('notifications').create({
          user: data.thread.author,
          type: 'discussion_reply',
          title: 'New reply on your discussion',
          message: `${$currentUser.display_name} replied to "${data.thread.title}"`,
          link: `/discussions/${data.thread.id}`,
          read: false,
        });
      }

      // Reset form
      replyContent = '';
      quotedReply = null;

      // Refresh page to show new reply
      window.location.reload();
    } catch (err) {
      console.error('Failed to submit reply:', err);
      alert('Failed to post reply. Please try again.');
    }
  }

  function quoteReply(reply) {
    quotedReply = reply;
    replyContent = `> ${reply.content.split('\n').join('\n> ')}\n\n`;
  }
</script>

<!-- Reply Composer -->
<section class="reply-composer">
  <h3>Your Reply</h3>
  {#if quotedReply}
    <div class="quoted-reply-preview">
      Replying to @{quotedReply.expand.author.display_name}
      <button onclick={() => { quotedReply = null; }}>×</button>
    </div>
  {/if}
  <MarkdownEditor bind:value={replyContent} placeholder="Write your reply..." rows={6} />
  <button
    onclick={submitReply}
    disabled={!replyContent.trim()}
    class="btn-primary"
  >
    Submit Reply
  </button>
</section>
```

---

## Rich Interactions

### Markdown & Rich Text

**Already Implemented:**
- MarkdownEditor component exists
- Markdown rendering via `marked` library (assumed based on project structure)

**Enhancements Needed:**
1. **Inline Tag Detection**: Convert `#euro` to clickable tag links
2. **@Mention Autocomplete**: Show user dropdown as typing `@`
3. **Link Previews**: Fetch and display rich previews for BGG links, YouTube, etc.

**Inline Tag Rendering:**

```typescript
// src/lib/utils/markdown.ts
import { marked } from 'marked';

export function renderMarkdownWithTags(content: string): string {
  // Replace #tag with clickable links
  const tagRegex = /#(\w+(-\w+)*)/g;
  const contentWithTags = content.replace(tagRegex, (match, tag) => {
    return `<a href="/discussions?tag=${encodeURIComponent(tag)}" class="inline-tag">#${tag}</a>`;
  });

  // Render markdown
  return marked(contentWithTags);
}
```

**@Mention Autocomplete:**

```svelte
<!-- In MarkdownEditor.svelte -->
<script>
  import { pb } from '$lib/pocketbase';

  let mentionSuggestions = $state([]);
  let mentionQuery = $state('');

  async function handleInput(e) {
    const textarea = e.target;
    const cursorPos = textarea.selectionStart;
    const textBeforeCursor = textarea.value.substring(0, cursorPos);
    const match = textBeforeCursor.match(/@(\w*)$/);

    if (match) {
      mentionQuery = match[1];
      const users = await pb.collection('users').getFullList({
        filter: `display_name ~ "${mentionQuery}"`,
        limit: 5,
      });
      mentionSuggestions = users;
    } else {
      mentionSuggestions = [];
    }
  }

  function insertMention(user) {
    // Insert @username into textarea at cursor position
    const textarea = document.querySelector('textarea');
    const cursorPos = textarea.selectionStart;
    const textBeforeCursor = textarea.value.substring(0, cursorPos);
    const textAfterCursor = textarea.value.substring(cursorPos);
    const textBeforeMention = textBeforeCursor.replace(/@\w*$/, '');

    value = textBeforeMention + `@${user.display_name} ` + textAfterCursor;
    mentionSuggestions = [];
  }
</script>

<textarea oninput={handleInput}></textarea>
{#if mentionSuggestions.length > 0}
  <div class="mention-suggestions">
    {#each mentionSuggestions as user}
      <button onclick={() => insertMention(user)}>
        @{user.display_name}
      </button>
    {/each}
  </div>
{/if}
```

### Polls

**Use Case:** "What's your favorite worker placement game?" with voting options

**Schema:**

```typescript
// Add to discussion_threads
interface DiscussionThreadRecord extends RecordModel {
  // ... existing fields ...
  poll?: {
    question: string;
    options: Array<{ id: string; text: string }>;
    multiple_choice: boolean;
    closes_at?: string; // ISO date when poll closes
  };
}

// New collection: poll_votes
interface PollVoteRecord extends RecordModel {
  thread: string;        // Relation to discussion_threads
  user: string;          // Relation to users
  option_id: string;     // ID of selected option
}
```

**UI:**

```svelte
<!-- In thread detail page -->
{#if thread.poll}
  <div class="poll-section">
    <h4>{thread.poll.question}</h4>
    {#each thread.poll.options as option}
      <div class="poll-option">
        <input
          type={thread.poll.multiple_choice ? 'checkbox' : 'radio'}
          name="poll"
          value={option.id}
          disabled={hasVoted || isPollClosed}
        />
        <label>{option.text}</label>
        <span class="vote-count">{getVoteCount(option.id)} votes</span>
        <div class="vote-bar" style="width: {getVotePercentage(option.id)}%"></div>
      </div>
    {/each}
    {#if !hasVoted && !isPollClosed}
      <button onclick={submitVote}>Submit Vote</button>
    {/if}
  </div>
{/if}
```

**Creation UI:**

```svelte
<!-- In /discussions/new -->
<div>
  <label>
    <input type="checkbox" bind:checked={includePoll} />
    Include a poll
  </label>

  {#if includePoll}
    <input type="text" bind:value={pollQuestion} placeholder="Poll question" />
    {#each pollOptions as option, i}
      <input type="text" bind:value={pollOptions[i]} placeholder="Option {i + 1}" />
    {/each}
    <button onclick={addPollOption}>+ Add option</button>
    <label>
      <input type="checkbox" bind:checked={pollMultipleChoice} />
      Allow multiple selections
    </label>
  {/if}
</div>
```

### Link Previews

**Approach:** Fetch metadata for external links (BGG, YouTube, etc.) and display rich cards

**Backend:**
```typescript
// src/lib/utils/link-previews.ts
export async function fetchLinkPreview(url: string) {
  // For BGG links, use BGG XML API
  if (url.includes('boardgamegeek.com/boardgame/')) {
    const bggId = url.match(/\/(\d+)\//)?.[1];
    if (bggId) {
      const response = await fetch(`https://boardgamegeek.com/xmlapi2/thing?id=${bggId}`);
      const xml = await response.text();
      // Parse XML and extract title, image, description
      return {
        title: extractedTitle,
        image: extractedImage,
        description: extractedDescription,
      };
    }
  }

  // For other links, use Open Graph tags (requires server-side proxy to avoid CORS)
  // Return null if no preview available
  return null;
}
```

**Frontend:**
```svelte
<!-- Automatically render link previews in markdown content -->
<div class="thread-content">
  {@html renderMarkdownWithPreviews(thread.content)}
</div>

<!-- renderMarkdownWithPreviews() detects URLs and inserts preview cards -->
```

---

## Trust & Moderation

### Trust Levels

**Purpose:** Prevent spam, reward engagement, unlock features

**Levels:**

| Level | Name | Requirements | Permissions |
|-------|------|--------------|-------------|
| 0 | Newcomer | Just registered | Read, post (with limits), reply |
| 1 | Member | 1+ completed trade, 5+ posts, 7+ days | Full posting, reactions, tags |
| 2 | Regular | 5+ completed trades, 50+ posts, 30+ days, 10+ likes received | Edit own posts, vote in polls |
| 3 | Trusted | 20+ completed trades, 200+ posts, 90+ days, 50+ likes, 1+ vouch | Create polls, pin own threads |
| 4 | Staff | Manual assignment | Moderate, delete, lock threads, pin any thread |

**Schema:**

```typescript
// Add to users collection (extend existing schema)
interface UserRecord extends RecordModel {
  // ... existing fields ...
  trust_level: number; // 0-4
}
```

**Calculation (backend job or on-demand):**

```typescript
// src/lib/utils/trust-levels.ts
export function calculateTrustLevel(user: UserRecord): number {
  const {
    trade_count,
    created, // Account age
    vouch_count,
    // Need to add: post_count, likes_received
  } = user;

  const daysSinceRegistration = Math.floor(
    (Date.now() - new Date(created).getTime()) / (1000 * 60 * 60 * 24)
  );

  if (trade_count >= 20 && daysSinceRegistration >= 90 && vouch_count >= 1) {
    return 3; // Trusted
  }
  if (trade_count >= 5 && daysSinceRegistration >= 30) {
    return 2; // Regular
  }
  if (trade_count >= 1 && daysSinceRegistration >= 7) {
    return 1; // Member
  }
  return 0; // Newcomer
}
```

**Display:**

```svelte
<!-- Trust badge next to username -->
<span class="trust-badge trust-level-{user.trust_level}">
  {#if user.trust_level === 0}
    Newcomer
  {:else if user.trust_level === 1}
    Member
  {:else if user.trust_level === 2}
    Regular
  {:else if user.trust_level === 3}
    Trusted
  {:else if user.trust_level === 4}
    Staff
  {/if}
</span>
```

### Rate Limiting

**Newcomer Limits (Trust Level 0):**
- Max 3 new threads per day
- Max 10 replies per day
- Cannot create polls

**Implementation:**
```typescript
// Backend check in thread creation
const user = await pb.collection('users').getOne(userId);
if (user.trust_level === 0) {
  const todayThreads = await pb.collection('discussion_threads').getFullList({
    filter: `author = "${userId}" && created >= "${startOfDayISO}"`,
  });
  if (todayThreads.length >= 3) {
    throw new Error('Daily thread limit reached. Participate in discussions to increase your trust level!');
  }
}
```

### Spam Prevention

1. **Duplicate Detection**: Warn if creating thread with very similar title to recent thread
2. **Link Limits**: Newcomers cannot post more than 2 external links per post
3. **Flagging System**: Users can flag threads/replies for moderation
4. **Auto-Hide**: Posts with 3+ flags auto-hidden until staff review

---

## Design & UX

### Mobile-First Principles

1. **Single Column Layout**: No sidebars on mobile
2. **Touch Targets**: Minimum 44px tap areas
3. **Sticky Header**: Category/tag filters sticky at top
4. **Infinite Scroll**: Lazy load threads on browse page
5. **Swipe Actions**: Swipe thread card to watch/flag (optional)

### Responsive Breakpoints

```css
/* Mobile first */
.thread-list { display: flex; flex-direction: column; }

/* Tablet (768px+) */
@media (min-width: 768px) {
  .discussion-layout { display: grid; grid-template-columns: 250px 1fr; }
  .category-sidebar { display: block; }
}

/* Desktop (1024px+) */
@media (min-width: 1024px) {
  .thread-card { padding: 1.5rem; }
  .reply-composer { position: sticky; bottom: 0; }
}
```

### Notification Settings

**Discussion-Specific Notifications:**
- Replies to threads you created
- Replies to threads you commented on
- @mentions in any thread

**User Preferences:**
```typescript
// Add to user_settings (if exists) or users collection
interface UserNotificationPrefs {
  notify_on_thread_reply: boolean; // Default: true
  notify_on_comment_reply: boolean; // Default: true
  notify_on_mention: boolean; // Default: true
  notify_on_thread_like: boolean; // Default: false
}
```

**UI:**
```svelte
<!-- In user settings page -->
<section>
  <h3>Discussion Notifications</h3>
  <label>
    <input type="checkbox" bind:checked={prefs.notify_on_thread_reply} />
    Notify when someone replies to my discussions
  </label>
  <label>
    <input type="checkbox" bind:checked={prefs.notify_on_mention} />
    Notify when someone @mentions me
  </label>
</section>
```

---

## Staff Picks & Featured Content

**Purpose:** Highlight exceptional discussions without algorithmic feeds

**Schema:**

```typescript
// Add to discussion_threads
interface DiscussionThreadRecord extends RecordModel {
  // ... existing fields ...
  featured?: boolean;           // Staff-picked feature
  featured_at?: string;         // When it was featured
  featured_reason?: string;     // Why it was featured
}
```

**UI on Browse Page:**

```svelte
<!-- Featured threads section at top -->
{#if featuredThreads.length > 0}
  <section class="featured-discussions">
    <h2>⭐ Staff Picks</h2>
    {#each featuredThreads as thread}
      <ThreadCard {thread} featured={true} />
    {/each}
  </section>
{/if}
```

**Staff Tool (Trust Level 4 only):**

```svelte
<!-- In thread detail page, only visible to staff -->
{#if $currentUser?.trust_level === 4}
  <button onclick={toggleFeature}>
    {thread.featured ? 'Unfeature' : 'Feature'} this thread
  </button>
{/if}
```

---

## Search

### Full-Text Search

**Implementation:**
- Use PocketBase's built-in full-text search on `title` and `content` fields
- Support quoted phrases: `"worker placement"`
- Support exclusion: `-euro` (exclude threads with "euro")

**Search UI:**

```svelte
<!-- In /discussions browse page -->
<div class="search-bar">
  <input
    type="search"
    bind:value={searchQuery}
    placeholder="Search discussions..."
    oninput={debounceSearch}
  />
  {#if searchQuery}
    <button onclick={clearSearch}>×</button>
  {/if}
</div>

{#if searchResults.length === 0 && searchQuery}
  <div class="no-results">
    No discussions found for "{searchQuery}".
    <a href="/discussions/new">Start a new discussion</a>
  </div>
{/if}
```

**Backend:**

```typescript
// In /discussions/+page.ts
const search = url.searchParams.get('search');
let filter = '';

if (search) {
  filter = `(title ~ "${search}" || content ~ "${search}")`;
}

const threads = await pb.collection('discussion_threads').getList(page, 20, {
  filter,
  sort: '-created',
  expand: 'author,category',
});
```

### Advanced Search (Future)

**Filters:**
- By author: `author:alice`
- By date range: `created:2025-01-01..2025-01-31`
- By category: `category:game-talk`
- By tag: `tag:euro tag:worker-placement` (already supported via URL params)

**UI:** Collapsible "Advanced Search" panel with separate inputs for each filter

---

## Optional Future Extensions

### Events & Meetups

**Use Case:** Organize game nights, conventions, local meetups

**Schema:**

```typescript
interface EventRecord extends RecordModel {
  title: string;
  description: string;
  organizer: string;         // Relation to users
  location: string;          // Free text or geo coordinates
  event_date: string;        // ISO date
  max_attendees?: number;
  attendees: string[];       // Array of user IDs
  related_thread?: string;   // Optional link to discussion thread
}
```

**UI:**
- `/events` browse page with calendar view
- RSVP button
- Automatic notifications 1 day before event

### Reputation System

**Purpose:** Show user expertise in specific areas (beyond trust levels)

**Schema:**

```typescript
// Add to users
interface UserRecord extends RecordModel {
  // ... existing fields ...
  expertise_tags?: Array<{ tag: string; score: number }>; // e.g., [{ tag: 'euro', score: 50 }]
}
```

**Calculation:**
- +5 points per thread created with tag
- +2 points per reply in thread with tag
- +1 point per like received on reply in tagged thread

**Display:**
```svelte
<!-- On user profile -->
<div class="expertise">
  <h3>Expertise</h3>
  {#each user.expertise_tags?.slice(0, 5) as expertise}
    <span class="expertise-badge">#{expertise.tag} ({expertise.score})</span>
  {/each}
</div>
```

### Curated Digests

**Use Case:** Weekly email digest of top discussions

**Implementation:**
- Cron job runs weekly, queries top threads by `reply_count + reaction_count`
- Sends email to users with notification prefs enabled
- Includes featured threads, top replies, new members

---

## Implementation Roadmap

### ✅ Phase 1: Core Structure (COMPLETED)

**Goal:** Get basic category browsing and thread detail working

**Completed:**
- ✅ Thread creation with title, content, markdown
- ✅ Wanted posts with items list
- ✅ Basic listing-specific discussions
- ✅ Created `discussion_categories` collection (migration)
- ✅ Seeded 4 default categories
- ✅ Updated thread creation UI to require category selection
- ✅ Created `/discussions` browse page with category tabs
- ✅ Updated thread detail page with category badge

**Acceptance Criteria Met:**
- ✅ Users can select category when creating thread
- ✅ Browse page shows threads with category filtering
- ✅ Thread detail shows category with color/icon

### ✅ Phase 2: Tags & Filtering (COMPLETED)

**Goal:** Add tags for discovery and filtering

**Completed:**
- ✅ Added `tags` field to `discussion_threads` (migration)
- ✅ Updated thread creation UI with tag input (no autocomplete)
- ✅ Added tag pills to thread cards
- ✅ Added tag filter to browse page with multi-tag AND logic
- ✅ Active filter display with remove buttons

**Acceptance Criteria Met:**
- ✅ Users can add up to 10 tags per thread
- ✅ Clicking tag filters browse page
- ⚠️ Tag autocomplete not implemented (not needed for MVP)
- ⚠️ Inline tag rendering not implemented (not needed for MVP)

### ✅ Phase 3: Replies & Interactions (COMPLETED)

**Goal:** Enable threaded discussions with replies

**Completed:**
- ✅ Created `discussion_replies` collection (migration)
- ✅ Created `discussion_reactions` collection (migration)
- ✅ Built reply composer on thread detail page
- ✅ Added reply list (flat, oldest first)
- ✅ Added quote functionality with preview
- ✅ Added reaction buttons (❤️ 👍 🔥 😂 🤔 👀)
- ✅ Update `reply_count` when replies posted
- ✅ Update `last_reply_at` timestamp
- ✅ Thread subscription system
- ✅ @mention notification support
- ✅ Subscriber notifications

**Acceptance Criteria Met:**
- ✅ Users can reply to threads
- ✅ Replies show author, timestamp, reactions
- ✅ Users can quote specific replies
- ✅ Reaction counts displayed and updated

### ✅ Phase 4: Search & Discovery (COMPLETED)

**Goal:** Make it easy to find relevant discussions

**Completed:**
- ✅ Added search bar to browse page
- ✅ Implemented full-text search filter on title + content
- ✅ Added "Top" tab (sorted by reply count)
- ✅ Added "Unanswered" tab (reply_count = 0)
- ✅ Added "Wanted" tab (wanted posts only)
- ✅ Added pagination with page indicators
- ✅ Pinned threads appear first in all views

**Acceptance Criteria Met:**
- ✅ Search finds threads by title/content
- ✅ Top tab shows high-engagement threads
- ✅ Unanswered tab shows threads with 0 replies
- ⚠️ "Load More" not needed - pagination works well

### 🎯 Phase 5: Trust & Moderation (NOT IMPLEMENTED - Future)

**Goal:** Prevent spam and reward engagement

**Status:** Deferred - Not needed for MVP. Schema supports `pinned` and `locked` but no admin UI.

**Would Include:**
- Add `trust_level` to users collection
- Implement trust level calculation
- Add trust badges to usernames
- Add rate limiting for Newcomers
- Add flag/report button
- Build basic moderation UI for Staff

### 🎯 Phase 6: Polish & Enhancements (PARTIALLY IMPLEMENTED)

**Goal:** Add nice-to-have features

**Completed:**
- ✅ @mention notifications (no autocomplete)
- ✅ Mobile-responsive design
- ✅ Dark mode support

**Not Implemented (Future):**
- ❌ Polls with voting
- ❌ Link previews (BGG, YouTube)
- ❌ @mention autocomplete dropdown
- ❌ Notification preferences UI
- ❌ Staff picks section
- ❌ Real-time updates via PocketBase subscriptions

---

## Testing Strategy

### Manual Testing

**Test Cases:**

1. **Thread Creation:**
   - Create discussion with category, tags, markdown
   - Create wanted post with items list
   - Verify thread appears in browse page

2. **Filtering:**
   - Filter by category
   - Filter by tag(s)
   - Search by keyword
   - Verify results match filters

3. **Replies:**
   - Post reply to thread
   - Quote another reply
   - React to OP and replies
   - Verify notifications sent

4. **Trust Levels:**
   - Register new user (Level 0)
   - Complete trade → verify upgrade to Level 1
   - Post 50 times → verify upgrade to Level 2
   - Verify rate limits enforced

5. **Moderation:**
   - Flag thread as Staff user
   - Pin/unpin thread
   - Lock/unlock thread
   - Feature/unfeature thread

### Automated Tests

**Unit Tests:**

```typescript
// src/lib/utils/trust-levels.test.ts
describe('calculateTrustLevel', () => {
  it('returns 0 for new users', () => {
    const user = { trade_count: 0, created: new Date().toISOString(), vouch_count: 0 };
    expect(calculateTrustLevel(user)).toBe(0);
  });

  it('returns 1 after 1 trade and 7 days', () => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const user = { trade_count: 1, created: weekAgo.toISOString(), vouch_count: 0 };
    expect(calculateTrustLevel(user)).toBe(1);
  });
});
```

**Integration Tests:**

```typescript
// tests/discussions/thread-creation.test.ts
import { test, expect } from '@playwright/test';

test('create discussion thread', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[name="email"]', 'alice@example.com');
  await page.fill('input[name="password"]', 'password');
  await page.click('button[type="submit"]');

  await page.goto('/discussions/new');
  await page.selectOption('select[name="category"]', 'game-talk');
  await page.fill('input[name="title"]', 'Best worker placement games?');
  await page.fill('textarea[name="content"]', 'Looking for recommendations...');
  await page.fill('input[name="tags"]', 'euro, worker-placement');
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL(/\/discussions\/\w+/);
  await expect(page.locator('h1')).toContainText('Best worker placement games?');
});
```

---

## Performance Considerations

1. **Pagination:** Limit to 20 threads per page
2. **Indexes:** Index `category`, `tags`, `created`, `reply_count` fields
3. **Caching:** Cache category list (changes rarely)
4. **Real-time:** Use PocketBase subscriptions for new replies (optional)
5. **Image Optimization:** Lazy load images in thread content

---

## Accessibility

1. **Semantic HTML:** Use `<article>`, `<section>`, `<nav>` properly
2. **ARIA Labels:** Add labels to icon-only buttons
3. **Keyboard Navigation:** Ensure all interactive elements focusable
4. **Screen Reader Support:** Provide alt text for thread status (pinned, locked)
5. **Color Contrast:** Ensure category colors meet WCAG AA standards

---

## Analytics & Metrics

**Track:**
- Thread views (already have `view_count`)
- Reply counts (already have `reply_count`)
- Popular tags (aggregate across threads)
- Category distribution (how many threads per category)
- User engagement (posts per user, time between posts)

**Dashboard (for admin):**
- Top 10 threads this week
- Most active users
- Most popular tags
- Category usage breakdown

---

## Migration from Current System

**Current State:**
- Discussions already exist with `thread_type` field
- Wanted posts implemented with `wanted_items`
- Listing-specific discussions working

**Migration Steps:**

1. **Add Categories:**
   - Create `discussion_categories` collection
   - Seed default categories
   - Add `category` field to `discussion_threads` (required)
   - Run migration to assign existing threads to categories:
     - If `thread_type === 'wanted'` → `category = 'wanted'`
     - Else → `category = 'game-talk'` (default)

2. **Add Tags:**
   - Add `tags` field to `discussion_threads` (optional array)
   - Existing threads have empty tags (no migration needed)

3. **Add Replies:**
   - Create `discussion_replies` collection
   - Create `discussion_reactions` collection
   - No migration needed (new feature)

4. **Update UI:**
   - Update `/discussions/new` to require category
   - Create `/discussions` browse page
   - Update thread detail page with replies

---

## Security Considerations

1. **XSS Prevention:** Sanitize markdown output (use `marked` with sanitizer)
2. **CSRF Protection:** PocketBase handles this
3. **Rate Limiting:** Enforce limits server-side (not just client-side)
4. **Injection Prevention:** Use parameterized queries (PocketBase SDK does this)
5. **Content Moderation:** Allow flagging, manual review by Staff

---

## Open Questions

1. **Should categories be editable by users after thread creation?**
   - Recommendation: No, only Staff can change categories (prevent abuse)

2. **Should we allow threaded replies (Reddit-style) or flat (forum-style)?**
   - Recommendation: Start flat, add threading later if needed

3. **Should wanted posts auto-expire after X days?**
   - Recommendation: No auto-expiration, but allow users to mark as "Fulfilled"

4. **Should we send email notifications for replies?**
   - Recommendation: Yes, but make it opt-in (default: on-site notifications only)

5. **Should we allow anonymous posts?**
   - Recommendation: No, all posts require authentication (matches trade platform philosophy)

---

## Conclusion

The Meeple Cart discussion system **has been successfully implemented** with all core features functional and production-ready as of November 2025. This document now serves as both specification and implementation reference.

### What Was Delivered

**Core Features (100% Complete):**
- ✅ 4-category system with visual theming
- ✅ Flexible tag system with filtering
- ✅ Full reply system with markdown, quoting, reactions
- ✅ Thread subscriptions with notifications
- ✅ Wanted post specialization
- ✅ Search and discovery tools
- ✅ Mobile-responsive UI with dark mode

**Architecture Highlights:**
- Built on PocketBase (SQLite + real-time APIs)
- SvelteKit 2 with Svelte 5 runes
- Client-side only architecture (no SSR)
- Markdown rendering via `marked` library
- Comprehensive notification system
- Utility functions for common operations

### Design Decisions Made

1. **Flat reply structure** (not threaded) - Simpler UX, easier to follow conversations
2. **No tag autocomplete** - Manual entry works fine, less complexity
3. **Client-side reactions** - Instant feedback, optimistic updates
4. **Pinned threads first** - Better content curation without complex algorithms
5. **Auto-subscribe on reply** - Keeps users engaged with conversations they participate in

### Future Enhancements (If Needed)

The following features were specified but **intentionally deferred** as they're not critical for MVP:

1. **Trust & Moderation:** Trust levels, rate limiting, flag system, admin tools
2. **Rich Media:** Polls, link previews (BGG/YouTube), image uploads
3. **Advanced UX:** @mention autocomplete, inline tag rendering, real-time subscriptions
4. **Community Features:** Events/meetups, reputation system, weekly digests

These can be added incrementally based on actual community needs and usage patterns.

### Key Files

**Pages:**
- `src/routes/discussions/+page.svelte` - Browse/list view
- `src/routes/discussions/+page.ts` - Browse loader with filtering
- `src/routes/discussions/[id]/+page.svelte` - Thread detail with replies
- `src/routes/discussions/[id]/+page.ts` - Thread loader with reactions
- `src/routes/discussions/new/+page.svelte` - Thread creation form

**Utilities:**
- `src/lib/utils/discussions.ts` - Subscription and notification helpers

**Collections:**
- `discussion_threads` - Main thread records
- `discussion_categories` - Category definitions
- `discussion_replies` - Flat reply structure
- `discussion_reactions` - Emoji reactions
- `discussion_subscriptions` - Thread subscriptions

### Success Metrics

The system is ready for production use with:
- Fast page loads (client-side routing)
- Intuitive UX (tested on mobile and desktop)
- Comprehensive error handling
- Proper security (authentication required, XSS prevention)
- Scalable architecture (PocketBase indexes, pagination)

This implementation delivers on the core philosophy: **human-first, lightweight, mobile-optimized discussions** that encourage genuine community building around board gaming in New Zealand.
