import { describe, it, expect } from 'vitest';
import {
  buildListingPayload,
  buildListingFormData,
  buildItemPayloads,
  buildOfferTemplatePayload,
  type ListingFormValues,
  type ListingItemFormValues,
  type OfferTermsFormValues,
} from './listing-create';

describe('buildListingPayload', () => {
  const values: ListingFormValues = {
    title: '  Gloomhaven 2nd edition  ',
    summary: '  Barely played  ',
    location: '  Auckland CBD  ',
    regions: ['auckland', 'waikato'],
  };

  it('trims text fields and sets owner/status', () => {
    const payload = buildListingPayload(values, 'user123');

    expect(payload).toEqual({
      owner: 'user123',
      title: 'Gloomhaven 2nd edition',
      summary: 'Barely played',
      location: 'Auckland CBD',
      regions: ['auckland', 'waikato'],
      status: 'active',
    });
  });

  it('preserves an empty regions array', () => {
    const payload = buildListingPayload({ ...values, regions: [] }, 'user123');
    expect(payload.regions).toEqual([]);
  });
});

describe('buildListingFormData', () => {
  it('appends listing fields and JSON-encodes regions', () => {
    const payload = buildListingPayload(
      {
        title: 'Wingspan',
        summary: 'Great condition',
        location: 'Wellington',
        regions: ['wellington'],
      },
      'user123'
    );

    const formData = buildListingFormData(payload, []);

    expect(formData.get('owner')).toBe('user123');
    expect(formData.get('title')).toBe('Wingspan');
    expect(formData.get('summary')).toBe('Great condition');
    expect(formData.get('location')).toBe('Wellington');
    expect(formData.get('regions')).toBe(JSON.stringify(['wellington']));
    expect(formData.get('status')).toBe('active');
    expect(formData.getAll('photos')).toHaveLength(0);
  });

  it('appends every photo file under the photos key', () => {
    const payload = buildListingPayload(
      { title: 'T', summary: '', location: '', regions: [] },
      'user123'
    );
    const photoA = new File(['a'], 'a.png', { type: 'image/png' });
    const photoB = new File(['b'], 'b.png', { type: 'image/png' });

    const formData = buildListingFormData(payload, [photoA, photoB]);

    expect(formData.getAll('photos')).toEqual([photoA, photoB]);
  });
});

describe('buildItemPayloads', () => {
  const boardGame: ListingItemFormValues = {
    title: '  Everdell  ',
    condition: 'excellent',
    notes: '  Missing one meeple  ',
    bggId: '199792',
    year: '2018',
  };

  const otherItem: ListingItemFormValues = {
    title: '3D printed insert',
    condition: 'good',
    notes: '',
    bggId: '',
    year: '',
  };

  it('builds one payload per item, trimmed, tied to the listing, and available', () => {
    const payloads = buildItemPayloads([boardGame], 'listing123');

    expect(payloads).toEqual([
      {
        listing: 'listing123',
        title: 'Everdell',
        condition: 'excellent',
        notes: 'Missing one meeple',
        status: 'available',
        bgg_id: 199792,
        year: 2018,
      },
    ]);
  });

  it('omits bgg_id and year when not provided', () => {
    const [payload] = buildItemPayloads([otherItem], 'listing123');

    expect(payload).toEqual({
      listing: 'listing123',
      title: '3D printed insert',
      condition: 'good',
      notes: '',
      status: 'available',
    });
    expect(payload).not.toHaveProperty('bgg_id');
    expect(payload).not.toHaveProperty('year');
  });

  it('preserves item order across multiple items', () => {
    const payloads = buildItemPayloads([boardGame, otherItem], 'listing123');
    expect(payloads.map((p) => p.title)).toEqual(['Everdell', '3D printed insert']);
  });

  it('ignores an invalid (non-numeric) bgg_id or year', () => {
    const [payload] = buildItemPayloads(
      [{ ...otherItem, bggId: 'not-a-number', year: 'nope' }],
      'listing123'
    );
    expect(payload).not.toHaveProperty('bgg_id');
    expect(payload).not.toHaveProperty('year');
  });
});

describe('buildOfferTemplatePayload', () => {
  const context = { listingId: 'listing123', ownerId: 'user123', itemIds: ['item1', 'item2'] };

  const baseTerms: OfferTermsFormValues = {
    cashAmount: '',
    openToLowerOffers: false,
    openToTradeOffers: false,
    tradeForItemsText: '',
    canPost: false,
    notes: '',
  };

  it('includes required fields and links all created items', () => {
    const payload = buildOfferTemplatePayload(baseTerms, context);

    expect(payload).toEqual({
      listing: 'listing123',
      owner: 'user123',
      items: ['item1', 'item2'],
      open_to_lower_offers: false,
      open_to_trade_offers: false,
      can_post: false,
      status: 'active',
    });
  });

  it('converts a cash amount in dollars to integer cents', () => {
    const payload = buildOfferTemplatePayload({ ...baseTerms, cashAmount: '45.50' }, context);
    expect(payload.cash_amount).toBe(4550);
  });

  it('omits cash_amount when the price is left blank (trade only)', () => {
    const payload = buildOfferTemplatePayload(baseTerms, context);
    expect(payload).not.toHaveProperty('cash_amount');
  });

  it('ignores a non-numeric or negative cash amount', () => {
    const negative = buildOfferTemplatePayload({ ...baseTerms, cashAmount: '-5' }, context);
    expect(negative).not.toHaveProperty('cash_amount');

    const nonNumeric = buildOfferTemplatePayload({ ...baseTerms, cashAmount: 'abc' }, context);
    expect(nonNumeric).not.toHaveProperty('cash_amount');
  });

  it('stores free-text trade preferences as a one-element string array', () => {
    const payload = buildOfferTemplatePayload(
      { ...baseTerms, openToTradeOffers: true, tradeForItemsText: '  Scythe or Wingspan  ' },
      context
    );
    expect(payload.trade_for_items).toEqual(['Scythe or Wingspan']);
  });

  it('omits trade_for_items when the free-text field is blank', () => {
    const payload = buildOfferTemplatePayload(
      { ...baseTerms, openToTradeOffers: true, tradeForItemsText: '   ' },
      context
    );
    expect(payload).not.toHaveProperty('trade_for_items');
  });

  it('carries open_to_lower_offers and can_post through as booleans', () => {
    const payload = buildOfferTemplatePayload(
      { ...baseTerms, openToLowerOffers: true, canPost: true },
      context
    );
    expect(payload.open_to_lower_offers).toBe(true);
    expect(payload.can_post).toBe(true);
  });

  it('trims and includes offer notes when present', () => {
    const payload = buildOfferTemplatePayload(
      { ...baseTerms, notes: '  Cash preferred  ' },
      context
    );
    expect(payload.notes).toBe('Cash preferred');
  });

  it('omits notes when blank', () => {
    const payload = buildOfferTemplatePayload(baseTerms, context);
    expect(payload).not.toHaveProperty('notes');
  });
});
