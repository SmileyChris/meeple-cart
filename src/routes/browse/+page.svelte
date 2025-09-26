<script lang="ts">
  import type { PageData } from './$types';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';

  export let data: PageData;

  // Mock BGG categories - in production these would come from the database
  const bggCategories = [
    { id: 'strategy', name: 'Strategy Games', icon: '🧩', color: 'blue' },
    { id: 'party', name: 'Party Games', icon: '🎉', color: 'purple' },
    { id: 'family', name: 'Family Games', icon: '👨‍👩‍👧‍👦', color: 'green' },
    { id: 'card', name: 'Card Games', icon: '🃏', color: 'red' },
    { id: 'cooperative', name: 'Cooperative', icon: '🤝', color: 'yellow' },
    { id: 'dice', name: 'Dice Games', icon: '🎲', color: 'orange' },
    { id: 'miniatures', name: 'Miniatures', icon: '⚔️', color: 'slate' },
    { id: 'party', name: 'Abstract', icon: '⚪', color: 'gray' },
  ];

  // Filter state
  let selectedCategory = '';
  let priceRange = { min: 0, max: 500 };
  let selectedConditions: string[] = [];
  let sortBy = 'newest';
  let viewMode: 'grid' | 'list' = 'grid';

  const conditions = ['New', 'Like New', 'Very Good', 'Good', 'Fair'];

  // Group listings by category (mock implementation)
  function groupListingsByCategory(listings: typeof data.listings) {
    const groups: Record<string, typeof listings> = {};
    
    // For now, randomly assign to categories - in production this would use BGG data
    listings.forEach((listing: any) => {
      const categoryIndex = Math.floor(Math.random() * bggCategories.length);
      const category = bggCategories[categoryIndex].id;
      
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(listing);
    });
    
    return groups;
  }

  const groupedListings = groupListingsByCategory(data.listings.filter((l: any) => l.type === 'sell' || l.type === 'trade'));

  function applyFilters() {
    const params = new URLSearchParams($page.url.searchParams);
    
    if (selectedCategory) params.set('category', selectedCategory);
    else params.delete('category');
    
    if (priceRange.min > 0) params.set('min_price', String(priceRange.min));
    else params.delete('min_price');
    
    if (priceRange.max < 500) params.set('max_price', String(priceRange.max));
    else params.delete('max_price');
    
    if (selectedConditions.length > 0) params.set('conditions', selectedConditions.join(','));
    else params.delete('conditions');
    
    params.set('sort', sortBy);
    
    goto(`?${params.toString()}`);
  }

  // Shopping cart functionality (would be in a store in production)
  let cart: Set<string> = new Set();
  
  function toggleCartItem(listingId: string) {
    if (cart.has(listingId)) {
      cart.delete(listingId);
    } else {
      cart.add(listingId);
    }
    cart = cart; // Trigger reactivity
  }
</script>

<svelte:head>
  <title>Browse Games · Meeple Cart</title>
  <meta
    name="description"
    content="Browse board games for sale and trade, organized by category"
  />
</svelte:head>

<main class="mx-auto max-w-7xl px-4 py-8">
  <div class="flex gap-8">
    <!-- Sidebar Filters -->
    <aside class="w-64 flex-shrink-0 space-y-6">
      <div>
        <h2 class="text-lg font-semibold text-slate-100 mb-4">Filters</h2>
        
        <!-- Categories -->
        <div class="mb-6">
          <h3 class="text-sm font-medium text-slate-300 mb-3">Categories</h3>
          <div class="space-y-2">
            {#each bggCategories as category}
              <button
                class="w-full text-left rounded-lg border px-3 py-2 text-sm transition {
                  selectedCategory === category.id
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                    : 'border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                }"
                on:click={() => { selectedCategory = selectedCategory === category.id ? '' : category.id; applyFilters(); }}
              >
                <span class="mr-2">{category.icon}</span>
                {category.name}
              </button>
            {/each}
          </div>
        </div>

        <!-- Price Range -->
        <div class="mb-6">
          <h3 class="text-sm font-medium text-slate-300 mb-3">Price Range</h3>
          <div class="space-y-3">
            <div class="flex items-center gap-2">
              <input
                type="number"
                class="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm text-slate-100"
                placeholder="Min"
                bind:value={priceRange.min}
                on:change={applyFilters}
              />
              <span class="text-slate-500">-</span>
              <input
                type="number"
                class="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm text-slate-100"
                placeholder="Max"
                bind:value={priceRange.max}
                on:change={applyFilters}
              />
            </div>
            <div class="flex gap-2">
              <button
                class="rounded-lg border border-slate-800 px-2 py-1 text-xs text-slate-400 hover:border-slate-700"
                on:click={() => { priceRange = { min: 0, max: 25 }; applyFilters(); }}
              >
                Under $25
              </button>
              <button
                class="rounded-lg border border-slate-800 px-2 py-1 text-xs text-slate-400 hover:border-slate-700"
                on:click={() => { priceRange = { min: 25, max: 50 }; applyFilters(); }}
              >
                $25-$50
              </button>
              <button
                class="rounded-lg border border-slate-800 px-2 py-1 text-xs text-slate-400 hover:border-slate-700"
                on:click={() => { priceRange = { min: 50, max: 100 }; applyFilters(); }}
              >
                $50-$100
              </button>
            </div>
          </div>
        </div>

        <!-- Condition -->
        <div class="mb-6">
          <h3 class="text-sm font-medium text-slate-300 mb-3">Condition</h3>
          <div class="space-y-2">
            {#each conditions as condition}
              <label class="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-300">
                <input
                  type="checkbox"
                  class="rounded border-slate-700 bg-slate-950 text-emerald-500"
                  value={condition}
                  on:change={(e) => {
                    if (e.currentTarget.checked) {
                      selectedConditions = [...selectedConditions, condition];
                    } else {
                      selectedConditions = selectedConditions.filter(c => c !== condition);
                    }
                    applyFilters();
                  }}
                />
                {condition}
              </label>
            {/each}
          </div>
        </div>

        <!-- Clear Filters -->
        <button
          class="w-full rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:border-emerald-500 hover:text-emerald-300 transition"
          on:click={() => {
            selectedCategory = '';
            priceRange = { min: 0, max: 500 };
            selectedConditions = [];
            sortBy = 'newest';
            goto('/browse');
          }}
        >
          Clear All Filters
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <div class="flex-1">
      <!-- Header Bar -->
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-semibold text-slate-100">Browse Games</h1>
          <p class="text-sm text-slate-400 mt-1">
            {data.listings.filter((l: any) => l.type === 'sell' || l.type === 'trade').length} games available
          </p>
        </div>
        
        <div class="flex items-center gap-3">
          <!-- Sort Dropdown -->
          <select
            class="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-300"
            bind:value={sortBy}
            on:change={applyFilters}
          >
            <option value="newest">Newest First</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="name">Name A-Z</option>
          </select>

          <!-- View Toggle -->
          <div class="flex rounded-lg border border-slate-700 overflow-hidden">
            <button
              class="px-3 py-2 text-sm {viewMode === 'grid' ? 'bg-slate-800 text-slate-100' : 'text-slate-400'}"
              on:click={() => viewMode = 'grid'}
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              class="px-3 py-2 text-sm {viewMode === 'list' ? 'bg-slate-800 text-slate-100' : 'text-slate-400'}"
              on:click={() => viewMode = 'list'}
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Shopping Cart Summary -->
      {#if cart.size > 0}
        <div class="mb-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span class="text-sm font-medium text-emerald-300">
                {cart.size} {cart.size === 1 ? 'item' : 'items'} selected
              </span>
            </div>
            <button
              class="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-emerald-400 transition"
            >
              View Cart
            </button>
          </div>
        </div>
      {/if}

      <!-- Category Sections -->
      {#if selectedCategory}
        <!-- Single category view -->
        <div class="space-y-4">
          {#if viewMode === 'grid'}
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {#each groupedListings[selectedCategory] || [] as listing}
                <div class="group relative bg-slate-900/40 rounded-lg border border-slate-800 overflow-hidden hover:border-slate-700 transition">
                  <div class="aspect-square bg-gradient-to-br from-slate-800 to-slate-900 p-4 flex items-center justify-center">
                    <span class="text-4xl opacity-20">🎲</span>
                  </div>
                  <div class="p-4">
                    <h3 class="font-medium text-slate-100 truncate">{listing.title}</h3>
                    <p class="text-sm text-slate-500 mt-1">{listing.condition || 'Good'}</p>
                    <div class="flex items-center justify-between mt-3">
                      <span class="text-lg font-semibold text-emerald-400">
                        ${listing.price || '??'}
                      </span>
                      <button
                        class="rounded-lg p-2 {cart.has(listing.id) ? 'bg-emerald-500 text-slate-900' : 'bg-slate-800 text-slate-400 hover:text-slate-100'} transition"
                        on:click={() => toggleCartItem(listing.id)}
                        aria-label="Add to cart"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          {:else}
            <!-- List view -->
            <div class="space-y-2">
              {#each groupedListings[selectedCategory] || [] as listing}
                <div class="flex items-center gap-4 bg-slate-900/40 rounded-lg border border-slate-800 p-4 hover:border-slate-700 transition">
                  <div class="w-16 h-16 rounded-lg bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                    <span class="text-2xl opacity-20">🎲</span>
                  </div>
                  <div class="flex-1">
                    <h3 class="font-medium text-slate-100">{listing.title}</h3>
                    <p class="text-sm text-slate-500">{listing.condition || 'Good'} · {listing.location}</p>
                  </div>
                  <span class="text-lg font-semibold text-emerald-400">
                    ${listing.price || '??'}
                  </span>
                  <button
                    class="rounded-lg p-2 {cart.has(listing.id) ? 'bg-emerald-500 text-slate-900' : 'bg-slate-800 text-slate-400 hover:text-slate-100'} transition"
                    on:click={() => toggleCartItem(listing.id)}
                    aria-label="Add to cart"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </button>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      {:else}
        <!-- All categories view -->
        <div class="space-y-8">
          {#each Object.entries(groupedListings) as [categoryId, listings]}
            {@const category = bggCategories.find(c => c.id === categoryId)}
            {#if listings.length > 0}
              <section>
                <div class="flex items-center justify-between mb-4">
                  <h2 class="text-lg font-semibold text-slate-100 flex items-center gap-2">
                    <span>{category?.icon}</span>
                    {category?.name}
                    <span class="text-sm font-normal text-slate-500">({listings.length})</span>
                  </h2>
                  <button
                    class="text-sm text-emerald-400 hover:text-emerald-300 transition"
                    on:click={() => { selectedCategory = categoryId; applyFilters(); }}
                  >
                    View all →
                  </button>
                </div>
                
                <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {#each listings.slice(0, 6) as listing}
                    <div class="group relative bg-slate-900/40 rounded-lg border border-slate-800 overflow-hidden hover:border-slate-700 transition">
                      <div class="aspect-square bg-gradient-to-br from-slate-800 to-slate-900 p-3 flex items-center justify-center">
                        <span class="text-3xl opacity-20">🎲</span>
                      </div>
                      <div class="p-3">
                        <h3 class="text-sm font-medium text-slate-100 truncate">{listing.title}</h3>
                        <div class="flex items-center justify-between mt-2">
                          <span class="text-sm font-semibold text-emerald-400">
                            ${listing.price || '??'}
                          </span>
                          <button
                            class="rounded p-1 {cart.has(listing.id) ? 'bg-emerald-500 text-slate-900' : 'bg-slate-800 text-slate-400 hover:text-slate-100'} transition"
                            on:click={() => toggleCartItem(listing.id)}
                            aria-label="Add to cart"
                          >
                            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  {/each}
                </div>
              </section>
            {/if}
          {/each}
        </div>
      {/if}
    </div>
  </div>
</main>