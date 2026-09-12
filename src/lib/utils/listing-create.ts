/**
 * Listing Creation Payload Builders
 *
 * Pure functions that turn "create a listing" form state into the record
 * payloads sent to PocketBase (listings -> items -> offer_templates). Kept
 * free of PocketBase/Svelte imports so they're trivial to unit test; the
 * calling page is responsible for the actual `pb.collection(...).create()`
 * calls and for supplying IDs produced by earlier creates.
 */

export type ItemCondition = 'mint' | 'excellent' | 'good' | 'fair' | 'poor';

export interface ListingFormValues {
  title: string;
  summary: string;
  location: string;
  regions: string[];
}

export interface ListingCreatePayload {
  owner: string;
  title: string;
  summary: string;
  location: string;
  regions: string[];
  status: 'active';
}

export interface ListingItemFormValues {
  title: string;
  condition: ItemCondition;
  notes: string;
  /** Raw string from the form/hidden input; '' means "no BGG match selected". */
  bggId: string;
  /** Raw string from the form input; '' means "not provided". */
  year: string;
}

export interface ItemCreatePayload {
  listing: string;
  title: string;
  condition: ItemCondition;
  notes: string;
  status: 'available';
  bgg_id?: number;
  year?: number;
}

export interface OfferTermsFormValues {
  /** NZ$ amount as a string, e.g. "45.50"; '' means trade only / no asking price. */
  cashAmount: string;
  openToLowerOffers: boolean;
  openToTradeOffers: boolean;
  /** Free-text "what you'd take" field, only meaningful when openToTradeOffers is true. */
  tradeForItemsText: string;
  canPost: boolean;
  notes: string;
}

export interface OfferTemplateCreateContext {
  listingId: string;
  ownerId: string;
  itemIds: string[];
}

export interface OfferTemplateCreatePayload {
  listing: string;
  owner: string;
  items: string[];
  open_to_lower_offers: boolean;
  open_to_trade_offers: boolean;
  can_post: boolean;
  status: 'active';
  cash_amount?: number;
  trade_for_items?: string[];
  notes?: string;
}

/**
 * Build the `listings` create payload from the overview form fields.
 */
export function buildListingPayload(
  values: ListingFormValues,
  ownerId: string
): ListingCreatePayload {
  return {
    owner: ownerId,
    title: values.title.trim(),
    summary: values.summary.trim(),
    location: values.location.trim(),
    regions: values.regions,
    status: 'active',
  };
}

/**
 * Wrap a listing payload (plus any selected photo files) in a FormData
 * instance, since PocketBase requires multipart submissions whenever a file
 * field is included. JSON fields (regions) are JSON-encoded strings, matching
 * the pattern used elsewhere in the app (see TradeParty/SubmissionForm.svelte).
 */
export function buildListingFormData(payload: ListingCreatePayload, photos: File[]): FormData {
  const formData = new FormData();

  formData.append('owner', payload.owner);
  formData.append('title', payload.title);
  formData.append('summary', payload.summary);
  formData.append('location', payload.location);
  formData.append('regions', JSON.stringify(payload.regions));
  formData.append('status', payload.status);

  for (const photo of photos) {
    formData.append('photos', photo);
  }

  return formData;
}

function parsePositiveInt(raw: string): number | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;

  const value = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(value) || Number.isNaN(value)) return undefined;

  return value;
}

/**
 * Build one `items` create payload per item entered in the form, in order.
 * The listing ID must already exist (items are created after the listing).
 */
export function buildItemPayloads(
  items: ListingItemFormValues[],
  listingId: string
): ItemCreatePayload[] {
  return items.map((item) => {
    const payload: ItemCreatePayload = {
      listing: listingId,
      title: item.title.trim(),
      condition: item.condition,
      notes: item.notes.trim(),
      status: 'available',
    };

    const bggId = parsePositiveInt(item.bggId);
    if (bggId !== undefined) payload.bgg_id = bggId;

    const year = parsePositiveInt(item.year);
    if (year !== undefined) payload.year = year;

    return payload;
  });
}

/**
 * Build the single `offer_templates` create payload covering every item
 * created for this listing, from the "Offer terms" section of the form.
 */
export function buildOfferTemplatePayload(
  terms: OfferTermsFormValues,
  context: OfferTemplateCreateContext
): OfferTemplateCreatePayload {
  const payload: OfferTemplateCreatePayload = {
    listing: context.listingId,
    owner: context.ownerId,
    items: context.itemIds,
    open_to_lower_offers: terms.openToLowerOffers,
    open_to_trade_offers: terms.openToTradeOffers,
    can_post: terms.canPost,
    status: 'active',
  };

  const trimmedCash = terms.cashAmount.trim();
  if (trimmedCash) {
    const dollars = Number.parseFloat(trimmedCash);
    if (Number.isFinite(dollars) && dollars >= 0) {
      payload.cash_amount = Math.round(dollars * 100);
    }
  }

  const trimmedTradeText = terms.tradeForItemsText.trim();
  if (trimmedTradeText) {
    payload.trade_for_items = [trimmedTradeText];
  }

  const trimmedNotes = terms.notes.trim();
  if (trimmedNotes) {
    payload.notes = trimmedNotes;
  }

  return payload;
}
