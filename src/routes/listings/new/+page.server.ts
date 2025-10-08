import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { LISTING_TYPES } from '$lib/types/listing';
import type { ListingType } from '$lib/types/listing';
import { notifyNewListing } from '$lib/server/notifications';
const CONDITION_OPTIONS = ['mint', 'excellent', 'good', 'fair', 'poor'] as const;

const DEFAULT_FORM_VALUES = {
  listing_type: 'trade' as ListingType,
  condition: 'excellent' as (typeof CONDITION_OPTIONS)[number],
};

const MAX_PHOTO_COUNT = 6;
const MAX_PHOTO_SIZE = 5 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);

const parseOptionalNumber = (
  value: FormDataEntryValue | null,
  { allowDecimals = true, min = 0, max }: { allowDecimals?: boolean; min?: number; max?: number }
): number | null => {
  if (typeof value !== 'string' || value.trim() === '') {
    return null;
  }

  const sanitized = value.trim();
  const parsed = allowDecimals ? Number.parseFloat(sanitized) : Number.parseInt(sanitized, 10);

  if (Number.isNaN(parsed)) {
    return Number.NaN;
  }

  if (parsed < min || (typeof max === 'number' && parsed > max)) {
    return Number.NaN;
  }

  return parsed;
};

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) {
    throw redirect(302, '/login');
  }

  return {
    listingTypes: LISTING_TYPES,
    conditionOptions: CONDITION_OPTIONS,
    defaults: DEFAULT_FORM_VALUES,
  };
};

export const actions: Actions = {
  default: async ({ request, locals }) => {
    if (!locals.user) {
      throw redirect(302, '/login');
    }

    const form = await request.formData();

    const listingTitle = String(form.get('title') ?? '').trim();
    const listingTypeRaw = String(form.get('listing_type') ?? '').toLowerCase();
    const listingType = listingTypeRaw === 'bundle' ? 'sell' : listingTypeRaw;
    const summary = String(form.get('summary') ?? '').trim();
    const location = String(form.get('location') ?? '')
      .trim()
      .slice(0, 120);
    const shippingAvailable = form.get('shipping_available') === 'on';
    const preferBundle = form.get('prefer_bundle') === 'on';
    const bundleDiscountRaw = form.get('bundle_discount');
    const photoEntries = form.getAll('photos');

    // Parse multiple games from form data
    const games: Array<{
      title: string;
      condition: string;
      priceRaw: FormDataEntryValue | null;
      tradeValueRaw: FormDataEntryValue | null;
      notes: string;
      bggIdRaw: FormDataEntryValue | null;
    }> = [];

    let gameIndex = 0;
    while (form.has(`game_${gameIndex}_title`)) {
      games.push({
        title: String(form.get(`game_${gameIndex}_title`) ?? '').trim(),
        condition: String(form.get(`game_${gameIndex}_condition`) ?? '').toLowerCase(),
        priceRaw: form.get(`game_${gameIndex}_price`),
        tradeValueRaw: form.get(`game_${gameIndex}_trade_value`),
        notes: String(form.get(`game_${gameIndex}_notes`) ?? '').trim(),
        bggIdRaw: form.get(`game_${gameIndex}_bgg_id`),
      });
      gameIndex++;
    }

    const fieldErrors: Record<string, string> = {};

    if (!listingTitle) {
      fieldErrors.title = 'Listing title is required.';
    }

    if (!LISTING_TYPES.includes(listingType as ListingType)) {
      fieldErrors.listing_type = 'Select a valid listing type.';
    }

    if (games.length === 0) {
      fieldErrors.games = 'At least one game is required.';
    }

    // Validate each game
    games.forEach((game, index) => {
      if (!game.title) {
        fieldErrors[`game_${index}_title`] = 'Enter the game title.';
      }

      if (!CONDITION_OPTIONS.includes(game.condition as (typeof CONDITION_OPTIONS)[number])) {
        fieldErrors[`game_${index}_condition`] = 'Select a valid condition.';
      }

      const price = parseOptionalNumber(game.priceRaw, { allowDecimals: true, min: 0 });
      if (Number.isNaN(price)) {
        fieldErrors[`game_${index}_price`] =
          'Price must be a valid number greater than or equal to zero.';
      }

      const tradeValue = parseOptionalNumber(game.tradeValueRaw, { allowDecimals: true, min: 0 });
      if (Number.isNaN(tradeValue)) {
        fieldErrors[`game_${index}_trade_value`] =
          'Trade value must be a valid number greater than or equal to zero.';
      }

      const bggId = parseOptionalNumber(game.bggIdRaw, { allowDecimals: false, min: 0 });
      if (Number.isNaN(bggId)) {
        fieldErrors[`game_${index}_bgg_id`] = 'BGG ID must be a whole number.';
      }
    });

    const photos = photoEntries.filter(
      (value): value is File => value instanceof File && value.size > 0
    );

    if (photos.length > MAX_PHOTO_COUNT) {
      fieldErrors.photos = `You can upload up to ${MAX_PHOTO_COUNT} photos.`;
    }

    for (const photo of photos) {
      if (!ALLOWED_PHOTO_TYPES.has(photo.type)) {
        fieldErrors.photos = 'Photos must be PNG, JPG, or WEBP images.';
        break;
      }

      if (photo.size > MAX_PHOTO_SIZE) {
        fieldErrors.photos = 'Each photo must be 5MB or smaller.';
        break;
      }
    }

    const bundleDiscount = parseOptionalNumber(bundleDiscountRaw, {
      allowDecimals: false,
      min: 0,
      max: 100,
    });

    if (Number.isNaN(bundleDiscount)) {
      fieldErrors.bundle_discount = 'Bundle discount must be a whole number between 0 and 100.';
    }

    const values = {
      title: listingTitle,
      listing_type: LISTING_TYPES.includes(listingType as ListingType)
        ? (listingType as ListingType)
        : DEFAULT_FORM_VALUES.listing_type,
      summary,
      location,
      shipping_available: shippingAvailable,
      prefer_bundle: preferBundle,
      bundle_discount: typeof bundleDiscountRaw === 'string' ? bundleDiscountRaw : '',
    };

    const gamesForForm = games.map((game) => ({
      title: game.title,
      condition: CONDITION_OPTIONS.includes(game.condition as (typeof CONDITION_OPTIONS)[number])
        ? game.condition
        : DEFAULT_FORM_VALUES.condition,
      price: typeof game.priceRaw === 'string' ? game.priceRaw : '',
      trade_value: typeof game.tradeValueRaw === 'string' ? game.tradeValueRaw : '',
      notes: game.notes,
      bgg_id: typeof game.bggIdRaw === 'string' ? game.bggIdRaw : '',
    }));

    if (Object.keys(fieldErrors).length > 0) {
      return fail(400, {
        fieldErrors,
        values,
        games: gamesForForm,
      });
    }

    try {
      const listingPayload = new FormData();
      listingPayload.set('owner', locals.user.id);
      listingPayload.set('title', listingTitle);
      listingPayload.set('listing_type', values.listing_type);
      listingPayload.set('status', 'active');
      listingPayload.set('shipping_available', shippingAvailable ? 'true' : 'false');
      listingPayload.set('prefer_bundle', preferBundle ? 'true' : 'false');
      listingPayload.set('views', '0');

      if (summary) {
        listingPayload.set('summary', summary);
      }

      if (location) {
        listingPayload.set('location', location);
      }

      if (bundleDiscount !== null) {
        listingPayload.set('bundle_discount', String(bundleDiscount));
      }

      for (const photo of photos) {
        listingPayload.append('photos', photo);
      }

      const listingRecord = await locals.pb.collection('listings').create(listingPayload);

      try {
        // Create all game records
        for (const game of games) {
          const price = parseOptionalNumber(game.priceRaw, { allowDecimals: true, min: 0 });
          const tradeValue = parseOptionalNumber(game.tradeValueRaw, {
            allowDecimals: true,
            min: 0,
          });
          const bggId = parseOptionalNumber(game.bggIdRaw, { allowDecimals: false, min: 0 });

          const gamePayload: Record<string, unknown> = {
            listing: listingRecord.id,
            title: game.title,
            condition: game.condition,
            status: 'available',
            notes: game.notes || null,
          };

          if (price !== null) {
            gamePayload.price = price;
          }

          if (tradeValue !== null) {
            gamePayload.trade_value = tradeValue;
          }

          if (bggId !== null) {
            gamePayload.bgg_id = bggId;
          }

          // Initialize price history with first entry
          gamePayload.price_history = [
            {
              price: price !== null ? price : undefined,
              trade_value: tradeValue !== null ? tradeValue : undefined,
              timestamp: new Date().toISOString(),
            },
          ];

          await locals.pb.collection('games').create(gamePayload);
        }

        // Notify users about new listing (non-blocking)
        notifyNewListing(locals.pb, listingRecord, locals.user.display_name).catch((err) =>
          console.error('Failed to send new listing notifications', err)
        );
      } catch (gameError) {
        console.error('Failed to create game records; rolling back listing', gameError);
        try {
          await locals.pb.collection('listings').delete(listingRecord.id);
        } catch (cleanupError) {
          console.error('Failed to rollback orphaned listing', cleanupError);
        }

        return fail(500, {
          message: 'We saved the listing but could not store the game details. Please try again.',
          values,
          games: gamesForForm,
        });
      }
    } catch (listingError) {
      console.error('Failed to create listing record', listingError);
      return fail(500, {
        message: 'Unable to create listing right now. Please try again shortly.',
        values,
        games: gamesForForm,
      });
    }

    throw redirect(303, '/profile');
  },
};
