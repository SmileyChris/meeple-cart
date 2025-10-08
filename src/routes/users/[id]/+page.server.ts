import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { UserRecord } from '$lib/types/pocketbase';
import type { ListingRecord, GameRecord } from '$lib/types/listing';
import { serializeNonPOJOs } from '$lib/utils/object';
import { normalizeListingType } from '$lib/types/listing';

export const load: PageServerLoad = async ({ params, locals }) => {
  const { id } = params;

  try {
    // Fetch user profile
    const user = await locals.pb.collection('users').getOne<UserRecord>(id);

    // Fetch user's active listings
    const listings = await locals.pb.collection('listings').getFullList<ListingRecord>({
      filter: `owner = "${id}" && status = "active"`,
      expand: 'games(listing)',
      sort: '-created',
    });

    const formattedListings = listings.map((listing) => {
      const games = (listing.expand?.['games(listing)'] as GameRecord[] | undefined) ?? [];

      let coverImage: string | null = null;
      if (listing.photos && listing.photos.length > 0) {
        coverImage = locals.pb.files.getUrl(listing, listing.photos[0], {
          thumb: '400x300',
        });
      }

      return {
        id: listing.id,
        title: listing.title,
        listingType: normalizeListingType(String(listing.listing_type)),
        location: listing.location ?? null,
        created: listing.created,
        gameCount: games.length,
        coverImage,
      };
    });

    // Fetch vouches received by this user
    const vouches = await locals.pb.collection('vouches').getFullList({
      filter: `vouchee = "${id}"`,
      expand: 'voucher',
      sort: '-created',
      limit: 10, // Show most recent 10
    });

    const formattedVouches = vouches.map((vouch) => {
      const voucher = vouch.expand?.voucher as UserRecord | undefined;
      return {
        id: vouch.id,
        voucherName: voucher?.display_name ?? 'Unknown',
        voucherId: voucher?.id ?? null,
        message: vouch.message ?? null,
        created: vouch.created,
      };
    });

    return {
      profile: serializeNonPOJOs(user),
      listings: serializeNonPOJOs(formattedListings),
      vouches: serializeNonPOJOs(formattedVouches),
    };
  } catch (err) {
    console.error(`Failed to load user profile ${id}`, err);
    throw error(404, 'User not found');
  }
};
