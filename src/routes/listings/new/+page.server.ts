import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { ListingType } from '$lib/types/listing';

const LISTING_TYPES: ListingType[] = ['trade', 'sell', 'want', 'bundle'];
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
    const listingType = String(form.get('listing_type') ?? '').toLowerCase();
    const summary = String(form.get('summary') ?? '').trim();
    const location = String(form.get('location') ?? '')
      .trim()
      .slice(0, 120);
    const shippingAvailable = form.get('shipping_available') === 'on';
    const preferBundle = form.get('prefer_bundle') === 'on';
    const bundleDiscountRaw = form.get('bundle_discount');

    const gameTitle = String(form.get('game_title') ?? '').trim();
    const condition = String(form.get('condition') ?? '').toLowerCase();
    const priceRaw = form.get('price');
    const tradeValueRaw = form.get('trade_value');
    const notes = String(form.get('notes') ?? '').trim();
    const bggIdRaw = form.get('bgg_id');
    const photoEntries = form.getAll('photos');

    const fieldErrors: Record<string, string> = {};

    if (!listingTitle) {
      fieldErrors.title = 'Listing title is required.';
    }

    if (!LISTING_TYPES.includes(listingType as ListingType)) {
      fieldErrors.listing_type = 'Select a valid listing type.';
    }

    if (!gameTitle) {
      fieldErrors.game_title = 'Enter the game title.';
    }

    if (!CONDITION_OPTIONS.includes(condition as (typeof CONDITION_OPTIONS)[number])) {
      fieldErrors.condition = 'Select a valid condition.';
    }

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

    const price = parseOptionalNumber(priceRaw, { allowDecimals: true, min: 0 });
    if (Number.isNaN(price)) {
      fieldErrors.price = 'Price must be a valid number greater than or equal to zero.';
    }

    const tradeValue = parseOptionalNumber(tradeValueRaw, { allowDecimals: true, min: 0 });
    if (Number.isNaN(tradeValue)) {
      fieldErrors.trade_value = 'Trade value must be a valid number greater than or equal to zero.';
    }

    const bggId = parseOptionalNumber(bggIdRaw, { allowDecimals: false, min: 0 });
    if (Number.isNaN(bggId)) {
      fieldErrors.bgg_id = 'BGG ID must be a whole number.';
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
      game_title: gameTitle,
      condition: CONDITION_OPTIONS.includes(condition as (typeof CONDITION_OPTIONS)[number])
        ? condition
        : DEFAULT_FORM_VALUES.condition,
      price: typeof priceRaw === 'string' ? priceRaw : '',
      trade_value: typeof tradeValueRaw === 'string' ? tradeValueRaw : '',
      notes,
      bgg_id: typeof bggIdRaw === 'string' ? bggIdRaw : '',
    };

    if (Object.keys(fieldErrors).length > 0) {
      return fail(400, {
        fieldErrors,
        values,
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
        const gamePayload: Record<string, unknown> = {
          listing: listingRecord.id,
          title: gameTitle,
          condition: values.condition,
          status: 'available',
          notes: notes || null,
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

        await locals.pb.collection('games').create(gamePayload);
      } catch (gameError) {
        console.error('Failed to create game record; rolling back listing', gameError);
        try {
          await locals.pb.collection('listings').delete(listingRecord.id);
        } catch (cleanupError) {
          console.error('Failed to rollback orphaned listing', cleanupError);
        }

        return fail(500, {
          message: 'We saved the listing but could not store the game details. Please try again.',
          values,
        });
      }
    } catch (listingError) {
      console.error('Failed to create listing record', listingError);
      return fail(500, {
        message: 'Unable to create listing right now. Please try again shortly.',
        values,
      });
    }

    throw redirect(303, '/profile');
  },
};
