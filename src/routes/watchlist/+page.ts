import type { PageLoad } from './$types';
import type { ReactionRecord, ReactionEmoji } from '$lib/types/pocketbase';
import type { ListingRecord } from '$lib/types/listing';
import { pb } from '$lib/pocketbase';
import { get } from 'svelte/store';
import { currentUser } from '$lib/pocketbase';

export const load: PageLoad = async () => {
  const user = get(currentUser);

  if (!user) {
    return {
      watchedListings: [],
    };
  }

  try {
    // Fetch all reactions by the current user
    const reactions = await pb.collection('reactions').getFullList<ReactionRecord>({
      filter: `user = "${user.id}"`,
      expand: 'listing,listing.owner',
      sort: '-created',
    });

    // Transform reactions into watchlist format
    const watchedListings = reactions
      .filter((reaction) => reaction.expand?.listing)
      .map((reaction) => {
        const listing = reaction.expand!.listing as unknown as ListingRecord;
        const owner = reaction.expand?.listing?.expand?.owner;

        // Get cover image (first photo if available)
        const coverImage =
          Array.isArray(listing.photos) && listing.photos.length > 0
            ? pb.files.getUrl(listing, listing.photos[0], { thumb: '800x600' }).toString()
            : null;

        // Count items for this listing
        const gameCount = listing.expand?.['items_via_listing']?.length ?? 0;

        return {
          watchlistId: reaction.id, // Use reaction ID
          reactionEmoji: reaction.emoji as ReactionEmoji,
          listingId: listing.id,
          title: listing.title,
          coverImage,
          listingType: listing.listing_type,
          status: listing.status,
          location: listing.location || null,
          gameCount,
          ownerName: owner?.display_name || null,
          watchedAt: reaction.created,
        };
      });

    return {
      watchedListings,
    };
  } catch (error) {
    console.error('Failed to load watchlist:', error);
    return {
      watchedListings: [],
    };
  }
};
