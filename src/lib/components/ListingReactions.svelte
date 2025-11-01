<script lang="ts">
  import { pb, currentUser } from '$lib/pocketbase';
  import type { ReactionEmoji, ReactionCounts, ReactionRecord, UserRecord } from '$lib/types/pocketbase';
  import { get } from 'svelte/store';

  let {
    listingId,
    initialCounts = {
      '👀': 0,
      '❤️': 0,
      '🔥': 0,
      '👍': 0,
      '🎉': 0,
      '😍': 0,
    },
    initialUserReaction = null,
  }: {
    listingId: string;
    initialCounts?: ReactionCounts;
    initialUserReaction?: ReactionEmoji | null;
  } = $props();

  const emojis: readonly ReactionEmoji[] = ['👀', '❤️', '🔥', '👍', '🎉', '😍'];

  let counts = $state<ReactionCounts>(initialCounts);
  let userReaction = $state<ReactionEmoji | null>(initialUserReaction);
  let isUpdating = $state(false);
  let dropdownOpen = $state(false);
  let showUsersForEmoji = $state<ReactionEmoji | null>(null);
  let usersForEmoji = $state<UserRecord[]>([]);
  let loadingUsers = $state(false);

  async function handleReactionClick(emoji: ReactionEmoji) {
    const user = get(currentUser);
    if (!user || isUpdating) return;

    dropdownOpen = false;
    isUpdating = true;

    try {
      if (userReaction === emoji) {
        // Remove reaction
        const reactions = await pb.collection('reactions').getFullList({
          filter: `user = "${user.id}" && listing = "${listingId}"`,
        });

        if (reactions.length > 0) {
          await pb.collection('reactions').delete(reactions[0].id);
          counts[emoji]--;
          userReaction = null;
        }
      } else {
        // Add or update reaction
        const reactions = await pb.collection('reactions').getFullList({
          filter: `user = "${user.id}" && listing = "${listingId}"`,
        });

        if (reactions.length > 0) {
          // Update existing reaction
          const oldEmoji = reactions[0].emoji as ReactionEmoji;
          await pb.collection('reactions').update(reactions[0].id, {
            emoji,
          });
          counts[oldEmoji]--;
          counts[emoji]++;
          userReaction = emoji;
        } else {
          // Create new reaction
          await pb.collection('reactions').create({
            user: user.id,
            listing: listingId,
            emoji,
          });
          counts[emoji]++;
          userReaction = emoji;
        }
      }
    } catch (error) {
      console.error('Failed to update reaction:', error);
    } finally {
      isUpdating = false;
    }
  }

  async function showReactionUsers(emoji: ReactionEmoji) {
    if (showUsersForEmoji === emoji) {
      // Close if clicking same emoji
      showUsersForEmoji = null;
      return;
    }

    showUsersForEmoji = emoji;
    loadingUsers = true;
    usersForEmoji = [];

    try {
      const reactions = await pb.collection('reactions').getFullList<ReactionRecord>({
        filter: `listing = "${listingId}" && emoji = "${emoji}"`,
        expand: 'user',
      });

      usersForEmoji = reactions
        .map((r) => r.expand?.user)
        .filter((u): u is UserRecord => u !== undefined);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      loadingUsers = false;
    }
  }

  // Get emojis with counts for display
  let emojisWithCounts = $derived(
    emojis.filter((emoji) => counts[emoji] > 0)
  );
</script>

<div class="flex flex-wrap items-center gap-2">
  <!-- Show emojis with counts -->
  {#each emojisWithCounts as emoji (emoji)}
    {@const count = counts[emoji]}
    {@const isActive = userReaction === emoji}
    <div class="relative">
      <button
        onclick={() => showReactionUsers(emoji)}
        class="group inline-flex items-center gap-1.5 rounded-full border transition-all {isActive
          ? 'border-emerald-500 bg-emerald-500/20'
          : 'border-subtle bg-surface-card hover:border-emerald-500/50 hover:bg-surface-card-alt'} px-3 py-1.5 text-sm cursor-pointer"
        aria-label={`See who reacted with ${emoji}`}
      >
        <span class="text-base transition-transform {isActive ? 'scale-110' : 'group-hover:scale-110'}"
          >{emoji}</span
        >
        <span class="font-medium {isActive ? 'text-emerald-300' : 'text-secondary'}"
          >{count}</span
        >
      </button>

      {#if showUsersForEmoji === emoji}
        <!-- Click outside to close -->
        <button
          class="fixed inset-0 z-[5]"
          onclick={() => (showUsersForEmoji = null)}
          aria-label="Close"
        ></button>

        <!-- Users popover -->
        <div
          class="absolute left-0 top-full z-[100] mt-2 min-w-[200px] rounded-xl border border-subtle bg-surface-panel p-3 shadow-xl"
        >
          <div class="mb-2 flex items-center gap-2 border-b border-subtle pb-2">
            <span class="text-lg">{emoji}</span>
            <span class="text-sm font-semibold text-primary">{count} {count === 1 ? 'reaction' : 'reactions'}</span>
          </div>

          {#if loadingUsers}
            <div class="py-2 text-center text-sm text-muted">Loading...</div>
          {:else if usersForEmoji.length > 0}
            <div class="space-y-1">
              {#each usersForEmoji as user}
                <a
                  href="/users/{user.id}"
                  class="block rounded-lg px-2 py-1.5 text-sm text-primary transition-colors hover:bg-surface-card-alt"
                >
                  {user.display_name}
                </a>
              {/each}
            </div>
          {:else}
            <div class="py-2 text-center text-sm text-muted">No reactions yet</div>
          {/if}
        </div>
      {/if}
    </div>
  {/each}

  <!-- React dropdown button -->
  {#if $currentUser}
    <div class="relative">
      <button
        onclick={() => (dropdownOpen = !dropdownOpen)}
        disabled={isUpdating}
        class="inline-flex items-center gap-2 rounded-full border border-subtle bg-surface-card px-3 py-1.5 text-sm transition-all hover:border-emerald-500/50 hover:bg-surface-card-alt"
        aria-label="Add reaction"
      >
        <svg
          class="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span class="font-medium">React / Watch</span>
      </button>

      {#if dropdownOpen}
        <!-- Click outside to close dropdown -->
        <button
          class="fixed inset-0 z-[5]"
          onclick={() => (dropdownOpen = false)}
          aria-label="Close reaction picker"
        ></button>

        <div
          class="absolute left-0 top-full z-[100] mt-2 rounded-xl border border-subtle bg-surface-panel p-2 shadow-xl"
        >
          <div class="flex gap-1">
            {#each emojis as emoji (emoji)}
              <button
                onclick={() => handleReactionClick(emoji)}
                disabled={isUpdating}
                class="rounded-lg p-2 text-2xl transition-all hover:scale-125 hover:bg-surface-card-alt"
                aria-label={`React with ${emoji}`}
              >
                {emoji}
              </button>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  {/if}
</div>
