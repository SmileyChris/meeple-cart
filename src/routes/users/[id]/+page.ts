import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import type { TradeRecord } from '$lib/types/pocketbase';
import { pb } from '$lib/pocketbase';

export const load: PageLoad = async ({ params }) => {
  const { id } = params;

  try {
    // Fetch user profile
    const profile = await pb.collection('users').getOne(id);

    // Fetch active listings
    const listingsResult = await pb.collection('listings').getList(1, 50, {
      filter: `owner = "${id}" && status = "active"`,
      sort: '-created',
    });

    const listings = listingsResult.items.map((listing: any) => ({
      id: listing.id,
      title: listing.title,
      listingType: listing.listing_type,
      status: listing.status,
      created: listing.created,
      location: listing.location,
      gameCount: listing.game_count || 0,
      coverImage: listing.photos?.[0]
        ? pb.files.getUrl(listing, listing.photos[0], { thumb: '400x300' })
        : null,
    }));

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

    return {
      profile,
      listings,
      vouches,
      reviews,
    };
  } catch (err) {
    console.error(`Failed to load user profile ${id}`, err);
    throw error(404, 'User not found');
  }
};
