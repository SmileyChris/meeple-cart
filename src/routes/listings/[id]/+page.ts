import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import type { ListingGameDetail, ListingRecord } from '$lib/types/listing';
import type {
  UserRecord,
  ItemRecord,
  ReactionCounts,
  ReactionEmoji,
  ReactionRecord,
  OfferTemplateRecord,
} from '$lib/types/pocketbase';
import { pb, currentUser } from '$lib/pocketbase';
import { get } from 'svelte/store';

const ITEMS_EXPAND_KEY = 'items(listing)';

export const load: PageLoad = async ({ params }) => {
  const { id } = params;

  try {
    const listing = await pb.collection('listings').getOne<ListingRecord>(id, {
      expand: 'owner,items(listing)',
    });

    const owner = listing.expand?.owner as UserRecord | undefined;
    const items = (listing.expand?.[ITEMS_EXPAND_KEY] as ItemRecord[] | undefined) ?? [];
    const formattedItems: ListingGameDetail[] = items.map((item) => {
      const bggId = typeof item.bgg_id === 'number' ? item.bgg_id : null;

      // Note: price/tradeValue now come from offer_templates, not items
      // For now, return null values - will need offer template integration
      return {
        id: item.id,
        title: item.title,
        condition: item.condition,
        status: item.status,
        bggId,
        bggUrl: bggId ? `https://boardgamegeek.com/boardgame/${bggId}` : null,
        price: null,
        tradeValue: null,
        notes: item.notes ?? null,
        year: typeof item.year === 'number' ? item.year : null,
        previousPrice: null,
        previousTradeValue: null,
        listingCreated: listing.created,
        priceHistory: undefined,
        canPost: false,
      };
    });

    const photos = Array.isArray(listing.photos)
      ? listing.photos.map((photo) => ({
          id: photo,
          full: pb.files.getUrl(listing, photo).toString(),
          thumb: pb.files.getUrl(listing, photo, { thumb: '400x300' }).toString(),
        }))
      : [];

    // Fetch reaction counts and user's reaction
    const user = get(currentUser);
    const reactions = await pb.collection('reactions').getFullList<ReactionRecord>({
      filter: `listing = "${id}"`,
    });

    const reactionCounts: ReactionCounts = {
      '👀': 0,
      '❤️': 0,
      '🔥': 0,
      '👍': 0,
      '🎉': 0,
      '😍': 0,
    };

    let userReaction: ReactionEmoji | null = null;

    reactions.forEach((reaction) => {
      const emoji = reaction.emoji as ReactionEmoji;
      reactionCounts[emoji]++;
      if (user && reaction.user === user.id) {
        userReaction = emoji;
      }
    });

    // User is "watching" if they have any reaction on this listing
    const isWatching = userReaction !== null;

    // Check for existing pending offer or accepted trade from this user
    let existingTrade = null;
    if (user) {
      const existingTrades = await pb.collection('trades').getList(1, 1, {
        filter: `listing = "${id}" && buyer = "${user.id}" && (offer_status = "pending" || offer_status = "accepted")`,
      });
      if (existingTrades.items.length > 0) {
        existingTrade = existingTrades.items[0];
      }
    }

    // Load active offer templates for this listing
    let offerTemplates: OfferTemplateRecord[] = [];
    try {
      const templates = await pb.collection('offer_templates').getFullList<OfferTemplateRecord>({
        filter: `listing = "${id}" && status = "active"`,
        sort: '-created',
        expand: 'items',
      });
      offerTemplates = templates;
    } catch (err) {
      console.error('Failed to load offer templates:', err);
      // Don't fail the whole page if templates fail to load
    }

    // Load listing-specific discussion threads
    let discussions = [];
    try {
      const threads = await pb.collection('discussion_threads').getList(1, 10, {
        filter: `listing = "${id}"`,
        sort: '-created',
        expand: 'author',
      });
      discussions = threads.items;
    } catch (err) {
      console.error('Failed to load discussions:', err);
      // Don't fail the whole page if discussions fail to load
    }

    // Count pending offers for this listing (only visible to owner)
    let pendingOfferCount = 0;
    if (user && owner && user.id === owner.id) {
      try {
        const pendingOffers = await pb.collection('trades').getList(1, 1, {
          filter: `listing = "${id}" && offer_status = "pending"`,
        });
        pendingOfferCount = pendingOffers.totalItems;
      } catch (err) {
        console.error('Failed to load pending offers count:', err);
      }
    }

    return {
      listing,
      owner: owner || null,
      games: formattedItems,
      photos,
      isWatching,
      reactionCounts,
      userReaction,
      existingTrade,
      offerTemplates,
      discussions,
      pendingOfferCount,
    };
  } catch (err) {
    console.error(`Failed to load listing ${id}`, err);
    throw error(404, 'Listing not found');
  }
};
