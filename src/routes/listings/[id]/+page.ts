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

const ITEMS_EXPAND_KEY = 'items_via_listing';

export const load: PageLoad = async ({ params }) => {
  const { id } = params;

  let stage = 'start';
  let debugInfo = '';
  try {
    stage = 'getOne';
    console.log('Loading listing with ID:', id);
    const listing = await pb.collection('listings').getOne<ListingRecord>(id, {
      expand: 'owner,items_via_listing',
    });
    debugInfo = ` Keys: ${Object.keys(listing).join(',')}, CID: ${listing.collectionId}, CName: ${listing.collectionName}`;
    console.log('Listing loaded:', listing.id);

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

    stage = 'photos';
    const baseUrl = 'http://127.0.0.1:8090';
    const photos = Array.isArray(listing.photos)
      ? listing.photos.map((photo) => ({
        id: photo,
        full: `${baseUrl}/api/files/${listing.collectionName}/${listing.id}/${photo}`,
        thumb: `${baseUrl}/api/files/${listing.collectionName}/${listing.id}/${photo}?thumb=400x300`,
      }))
      : [];

    // Fetch reaction counts and user's reaction
    const user = get(currentUser);

    // Initialize default reaction state
    const reactionCounts: ReactionCounts = {
      '👀': 0,
      '❤️': 0,
      '🔥': 0,
      '👍': 0,
      '🎉': 0,
      '😍': 0,
    };
    let userReaction: ReactionEmoji | null = null;

    // Try to fetch reactions - collection may not exist yet
    try {
      const reactions = await pb.collection('reactions').getFullList<ReactionRecord>({
        filter: `listing = "${id}"`,
      });

      reactions.forEach((reaction) => {
        const emoji = reaction.emoji as ReactionEmoji;
        reactionCounts[emoji]++;
        if (user && reaction.user === user.id) {
          userReaction = emoji;
        }
      });
    } catch (err) {
      // Reactions collection doesn't exist yet - use default empty counts
      console.warn('Reactions collection not available:', err);
    }

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
    let chats: any[] = [];
    try {
      const threads = await pb.collection('discussion_threads').getList(1, 10, {
        filter: `listing = "${id}"`,
        sort: '-created',
        expand: 'author',
      });
      chats = threads.items;
    } catch (err) {
      console.error('Failed to load chats:', err);
      // Don't fail the whole page if chats fail to load
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

    // Determine listing type from offer templates
    let listingType = 'trade';
    if (offerTemplates.length > 0) {
      const types = offerTemplates.map((t) => t.template_type);
      if (types.every((t) => t === 'cash_only')) {
        listingType = 'sell';
      } else if (types.every((t) => t === 'trade_only')) {
        listingType = 'trade';
      }
    }

    return {
      listing: { ...listing, listing_type: listingType },
      owner: owner || null,
      games: formattedItems,
      photos,
      isWatching,
      reactionCounts,
      userReaction,
      existingTrade,
      offerTemplates,
      chats,
      pendingOfferCount,
    };
  } catch (err: any) {
    console.error(`Failed to load listing ${id} at stage ${stage}`, err);
    let debugInfo = '';
    if (stage === 'photos') {
      // @ts-ignore
      const l = (await pb.collection('listings').getOne(id).catch(() => ({}))) as any;
      debugInfo = ` Keys: ${Object.keys(l).join(',')}, CID: ${l.collectionId}, CName: ${l.collectionName}`;
    }
    throw error(500, `Failed at ${stage}: ${err.message || JSON.stringify(err)} ${debugInfo}`);
  }
};
