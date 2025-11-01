<script lang="ts">
  import { pb, currentUser } from '$lib/pocketbase';
  import type { ReactionEmoji, ReactionCounts, ReactionRecord, REACTION_EMOJIS } from '$lib/types/pocketbase';
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

  async function handleReactionClick(emoji: ReactionEmoji) {
    const user = get(currentUser);
    if (!user || isUpdating) return;

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
</script>

<div class="flex flex-wrap items-center gap-2">
  {#each emojis as emoji (emoji)}
    {@const count = counts[emoji]}
    {@const isActive = userReaction === emoji}
    {#if count > 0 || $currentUser}
      <button
        onclick={() => handleReactionClick(emoji)}
        disabled={!$currentUser || isUpdating}
        class="group inline-flex items-center gap-1.5 rounded-full border transition-all {isActive
          ? 'border-emerald-500 bg-emerald-500/20'
          : 'border-subtle bg-surface-card hover:border-emerald-500/50 hover:bg-surface-card-alt'} px-3 py-1.5 text-sm {!$currentUser
          ? 'cursor-default opacity-60'
          : 'cursor-pointer'}"
        aria-label={`React with ${emoji}`}
      >
        <span class="text-base transition-transform {isActive ? 'scale-110' : 'group-hover:scale-110'}"
          >{emoji}</span
        >
        {#if count > 0}
          <span class="font-medium {isActive ? 'text-emerald-300' : 'text-secondary'}"
            >{count}</span
          >
        {/if}
      </button>
    {/if}
  {/each}
</div>
