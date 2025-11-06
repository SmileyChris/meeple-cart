import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import type { TradeRecord } from '$lib/types/pocketbase';
import { pb } from '$lib/pocketbase';

export const load: PageLoad = async ({ params }) => {
  const { id } = params;

  try {
    // Fetch user profile
    const profile = await pb.collection('users').getOne(id);

    // Fetch active listings with games data
    const listingsResult = await pb.collection('listings').getList(1, 50, {
      filter: `owner = "${id}" && status = "active"`,
      expand: 'owner',
      sort: '-created',
    });

    // Fetch games for each listing
    const listingsWithGames = await Promise.all(
      listingsResult.items.map(async (listing: any) => {
        const gamesResult = await pb.collection('games').getList(1, 50, {
          filter: `listing = "${listing.id}"`,
          sort: 'created',
        });

        const games = gamesResult.items.map((game: any) => ({
          id: game.id,
          title: game.title,
          condition: game.condition,
          status: game.status,
          bggId: game.bgg_id,
          bggUrl: game.bgg_id ? `https://boardgamegeek.com/boardgame/${game.bgg_id}` : null,
          price: game.price,
          tradeValue: game.trade_value,
          canPost: game.can_post || false,
        }));

        return {
          id: listing.id,
          title: listing.title,
          listingType: listing.listing_type,
          summary: listing.summary || '',
          location: listing.location,
          regions: listing.regions || null,
          created: listing.created,
          ownerName: listing.expand?.owner?.display_name || null,
          ownerId: listing.owner,
          coverImage: listing.photos?.[0]
            ? pb.files.getUrl(listing, listing.photos[0], { thumb: '400x300' })
            : null,
          href: `/listings/${listing.id}`,
          games,
        };
      })
    );

    // Fetch vouches received
    const vouchesResult = await pb.collection('vouches').getList(1, 10, {
      filter: `vouchee = "${id}"`,
      expand: 'voucher',
      sort: '-created',
    });

    const vouches = vouchesResult.items.map((vouch: any) => ({
      id: vouch.id,
      voucherId: vouch.voucher,
      voucherName: vouch.expand?.voucher?.display_name || 'Anonymous',
      message: vouch.message,
      created: vouch.created,
    }));

    // Fetch reviews received (trades where this user was the seller and has a rating)
    const reviewsResult = await pb.collection('trades').getList<TradeRecord>(1, 10, {
      filter: `seller = "${id}" && rating != null`,
      expand: 'buyer,listing',
      sort: '-completed_date',
    });

    const reviews = reviewsResult.items.map((trade) => ({
      id: trade.id,
      rating: trade.rating!,
      review: trade.review,
      reviewerName: trade.expand?.buyer?.display_name || 'Anonymous',
      reviewerId: trade.buyer,
      listingTitle: trade.expand?.listing?.title || 'Unknown Listing',
      completedDate: trade.completed_date || trade.updated,
    }));

    // Calculate average rating
    const averageRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : null;

    // Calculate vouched trades count (unique trades that resulted in vouches)
    // A vouched trade is when THIS user received a vouch from a trading partner
    const vouchedTradesCount = vouches.length; // Each vouch represents a vouched trade

    return {
      profile,
      listings: listingsWithGames,
      vouches,
      reviews,
      averageRating,
      vouchedTradesCount,
    };
  } catch (err) {
    console.error(`Failed to load user profile ${id}`, err);
    throw error(404, 'User not found');
  }
};
