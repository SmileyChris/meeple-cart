# NZ Board Game Trading Platform - Comprehensive Plan

## Tech Stack Architecture

**Core Stack:**

- **PocketBase**: Backend, auth, realtime, file storage
- **SvelteKit 2** + **Svelte 5**: Frontend with SSR/SSG capabilities
- **Tailwind CSS 4**: Styling with new container queries
- **Deployment**: VPS with Docker (or Fly.io for auto-scaling)
- **CDN**: Cloudflare for images (NZ edge locations)
- **Search**: Meilisearch (self-hosted) or PocketBase's built-in

## Data Architecture (PocketBase Collections)

```javascript
// Collections structure
users {
  // PocketBase defaults +
  display_name: string
  location: string (suburb/city)
  phone: string (verified)
  trade_count: number
  vouch_count: number
  joined_date: date
  bio: text
  preferred_contact: select (platform/phone/email)
  notification_prefs: json
}

listings {
  user: relation
  title: string
  type: select (trade/sell/want)
  status: select (active/pending/completed/cancelled)
  games: relation (multiple)
  description: text
  location: string
  shipping_available: bool
  prefer_bundle: bool
  bundle_discount: number
  views: number
  created: date
  bump_date: date
  photos: file (multiple)
}

games {
  listing: relation
  bgg_id: number
  title: string
  year: number
  condition: select (mint/excellent/good/fair/poor)
  price: number (optional)
  trade_value: number
  notes: text
  status: select (available/pending/sold/bundled)
  photo_regions: json (coordinates in listing photos)
}

messages {
  listing: relation
  thread_id: string (groups conversations)
  sender: relation
  recipient: relation
  content: text
  is_public: bool
  read: bool
  created: date
}

trades {
  listing: relation
  buyer: relation
  seller: relation
  seller_items: relation (multiple)
  buyer_items: relation (multiple)
  buyer_cash_amount: number
  buyer_items_description: text
  offer_message: text
  offer_status: select (pending/accepted/declined)
  status: select (initiated/accepted/shipped/received/completed/disputed/cancelled)
  tracking_number: string
  shipped_at: date
  received_at: date
  completed_date: date
  rating: number
  review: text
}

vouches {
  voucher: relation
  vouchee: relation
  message: text
  created: date
}

watchlist {
  user: relation
  listing: relation
  bgg_id: number (for wanted games)
  max_price: number
  max_distance: number
}
```

## Phase 1: MVP (Weeks 1-6)

### Core Features

**1. Authentication & Profiles**

```svelte
<!-- +page.svelte -->
<script>
  import { pb } from '$lib/pocketbase';
  import PhoneVerify from '$lib/components/PhoneVerify.svelte';

  let $user = $state(null);

  async function handleAuth() {
    // Email/password with PocketBase
    await pb.collection('users').authWithPassword(email, password);
    // Trigger phone verification flow
    if (!user.phone_verified) showPhoneVerify = true;
  }
</script>
```

**2. Simple Listing System**

- Single game listings only initially
- Basic CRUD with image upload
- Condition grading with visual guide
- Location autocomplete (NZ suburbs/cities)

**3. Browse & Search**

```javascript
// PocketBase filter examples
const listings = await pb.collection('listings').getList(1, 50, {
  filter: 'status = "active" && location ~ "Auckland"',
  sort: '-created',
  expand: 'user,games',
});
```

**4. Basic Messaging**

- Public comments on listings
- Private DM threads per listing
- Email notifications (using PocketBase hooks)

**5. Trade Completion**

- Simple "Mark as complete" flow
- Basic counter increment
- Optional review

### MVP UI Components (Svelte 5)

```svelte
<!-- ListingCard.svelte using Svelte 5 runes -->
<script>
  let { listing = {} } = $props();
  let expanded = $state(false);

  const timeAgo = $derived.by(() => {
    return formatDistanceToNow(listing.created);
  });
</script>

<div class="@container">
  <article class="bg-white rounded-lg shadow @lg:flex">
    <img src={listing.photos[0]} class="@lg:w-48 object-cover" />
    <div class="p-4">
      <h3>{listing.title}</h3>
      <p class="text-sm text-gray-500">
        {listing.user.display_name} · {timeAgo} · {listing.location}
      </p>
    </div>
  </article>
</div>
```

## Phase 2: Trust & Community (Weeks 7-12)

### Trust Features

**1. Social Graph**

```javascript
// PocketBase custom endpoint
pb.send('/api/trust-network', {
  method: 'GET',
  query: { userId: currentUser.id, targetId: listing.user.id },
});
// Returns: { degrees: 2, mutualTraders: ['user1', 'user2'] }
```

**2. Verification Badges**

- Phone verified ✓
- Email verified ✓
- 10+ trades ⭐
- Vouched by 3+ users 🏆

**3. Advanced Profiles**

```svelte
<!-- UserProfile.svelte -->
<script>
  let { userId } = $props();

  let profile = $state({});
  let trustSignals = $state([]);

  $effect(async () => {
    profile = await pb.collection('users').getOne(userId, {
      expand: 'vouches_via_vouchee',
    });
    trustSignals = await calculateTrustSignals(profile);
  });
</script>

<div class="space-y-4">
  <TrustBadges signals={trustSignals} />
  <TradeHistory trades={profile.trades} />
  <VouchSection vouches={profile.vouches} />
</div>
```

## Phase 3: Bulk Operations (Weeks 13-18)

### Bulk Listing Features

**1. BGG Integration**

```javascript
// Server-side BGG API integration
async function importFromBGG(username) {
  const collection = await fetch(`https://bgg-json.azurewebsites.net/collection/${username}`);
  return collection.map((game) => ({
    bgg_id: game.gameId,
    title: game.name,
    year: game.yearPublished,
    thumbnail: game.thumbnail,
  }));
}
```

**2. CSV Upload**

```svelte
<script>
  import Papa from 'papaparse';

  async function handleCSV(file) {
    Papa.parse(file, {
      header: true,
      complete: async (results) => {
        const games = results.data.map((row) => ({
          title: row.title,
          condition: row.condition,
          price: row.price,
          // ... mapping
        }));
        await createBulkListing(games);
      },
    });
  }
</script>
```

**3. Collection Management UI**

- Drag-and-drop reordering
- Batch status updates
- Quick-edit mode with inline forms
- Smart pricing suggestions based on condition

## Phase 4: Enhanced Discovery (Weeks 19-24)

### Advanced Features

**1. Smart Matching**

```javascript
// PocketBase realtime subscriptions
pb.collection('listings').subscribe('*', (e) => {
  if (matchesWatchlist(e.record)) {
    sendNotification(e.record);
  }
});
```

**2. Geographic Search**

- Map view with cluster markers
- Distance-based filtering
- "Along this route" for pickups
- Trade train coordination

**3. Bundle Intelligence**

- "Complete your set" suggestions
- Bundle break requests
- Optimal trade chains (A→B→C)

## Phase 5: Platform Polish (Weeks 25-30)

### Enhanced UX

**1. Real-time Features**

```svelte
<script>
  import { pb } from '$lib/pocketbase';

  let messages = $state([]);

  $effect(() => {
    // Subscribe to messages for this listing
    const unsubscribe = pb.collection('messages').subscribe(`listing="${listingId}"`, (e) => {
      if (e.action === 'create') {
        messages = [...messages, e.record];
      }
    });
    return unsubscribe;
  });
</script>
```

**2. Progressive Web App**

- Offline browsing of cached listings
- Push notifications for matches
- Camera integration for quick listing

**3. Advanced Media**

- Video condition demos
- 360° game box spins
- AR preview (place game on shelf)

## Infrastructure Considerations

### PocketBase Configuration

```javascript
// pb_hooks/main.pb.js
onModelAfterCreate((e) => {
  if (e.model.collection().name === 'trades') {
    // Update trade counts
    const seller = e.model.get('seller');
    seller.set('trade_count', seller.get('trade_count') + 1);
    dao.saveRecord(seller);
  }
});

onModelBeforeCreate((e) => {
  if (e.model.collection().name === 'listings') {
    // Auto-generate SEO-friendly slug
    e.model.set('slug', generateSlug(e.model.get('title')));
  }
});
```

### Deployment Architecture

```yaml
# docker-compose.yml
version: '3.8'
services:
  pocketbase:
    image: pocketbase/pocketbase
    volumes:
      - ./pocketbase/pb_data:/pb_data
      - ./pb_public:/pb_public
    environment:
      - PB_ENCRYPTION_KEY=${ENCRYPTION_KEY}
    ports:
      - 8090:8090

  sveltekit:
    build: .
    environment:
      - PUBLIC_POCKETBASE_URL=http://pocketbase:8090
    ports:
      - 3000:3000

  meilisearch:
    image: getmeili/meilisearch
    volumes:
      - ./meili_data:/meili_data
```

### Performance Optimizations

**1. Image Pipeline**

```javascript
// Image processing on upload
const sharp = require('sharp');

async function processListingImage(file) {
  const variants = await Promise.all([
    sharp(file).resize(150, 150).webp().toBuffer(), // thumbnail
    sharp(file).resize(400, 400).webp().toBuffer(), // card
    sharp(file).resize(1200, 1200).webp().toBuffer(), // full
  ]);
  return variants;
}
```

**2. Search Indexing**

```javascript
// Sync PocketBase with Meilisearch
pb.collection('listings').subscribe('*', async (e) => {
  await meiliClient.index('listings').updateDocuments([
    {
      id: e.record.id,
      title: e.record.title,
      description: e.record.description,
      location: e.record.location,
      games: e.record.expand?.games?.map((g) => g.title),
    },
  ]);
});
```

## Migration Strategy

**From Facebook Group:**

1. Soft launch with 50 active traders
2. Import helper for Facebook marketplace listings
3. Cross-post tool (post to both platforms)
4. Gradually add features based on feedback
5. Full launch when critical mass reached

## Success Metrics

- **Week 1-4**: 100 users, 50 listings
- **Month 2**: 500 users, 200 active listings
- **Month 3**: 1000 users, 50 trades/week
- **Month 6**: 3000 users, 200 trades/week
- **Year 1**: 5000+ users (50% of FB group)

## Key Technical Decisions

1. **PocketBase over custom backend**: Faster development, built-in auth, realtime, file handling
2. **Svelte 5 over React**: Smaller bundle, better performance, simpler state management with runes
3. **Server-side search over client**: Better performance, more sophisticated filtering
4. **Progressive enhancement**: Works without JS, enhances with it
5. **Mobile-first design**: Most users will browse on phones

This platform would fill a real gap in the NZ board gaming community while being technically sound and scalable. Want me to detail any specific aspect further or create some example code for particular features?
