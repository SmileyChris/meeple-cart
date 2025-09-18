import { describe, expect, it, vi, beforeEach } from 'vitest';
import { actions } from './+page.server';

const buildFormData = (overrides: Record<string, FormDataEntryValue> = {}) => {
  const formData = new FormData();
  const base: Record<string, FormDataEntryValue> = {
    title: 'Listing title',
    listing_type: 'trade',
    summary: 'A short summary',
    location: 'Wellington',
    shipping_available: 'on',
    prefer_bundle: '',
    bundle_discount: '',
    game_title: 'Gloomhaven',
    condition: 'excellent',
    price: '120',
    trade_value: '',
    notes: 'Complete set',
    bgg_id: '174430',
  };

  Object.entries({ ...base, ...overrides }).forEach(([key, value]) => {
    if (value === null) {
      return;
    }

    formData.set(key, value);
  });

  return formData;
};

const createEvent = (
  formData: FormData,
  overrides: {
    listingCreate?: ReturnType<typeof vi.fn>;
    gameCreate?: ReturnType<typeof vi.fn>;
    listingDelete?: ReturnType<typeof vi.fn>;
  } = {}
) => {
  const listingCreate = overrides.listingCreate ?? vi.fn().mockResolvedValue({ id: 'listing123' });
  const gameCreate = overrides.gameCreate ?? vi.fn().mockResolvedValue({ id: 'game123' });
  const listingDelete = overrides.listingDelete ?? vi.fn().mockResolvedValue(undefined);

  const pb = {
    collection: (name: string) => {
      if (name === 'listings') {
        return {
          create: listingCreate,
          delete: listingDelete,
        };
      }

      if (name === 'games') {
        return {
          create: gameCreate,
        };
      }

      throw new Error(`Unexpected collection ${name}`);
    },
  };

  const request = {
    formData: async () => formData,
  } as Request;

  return {
    request,
    locals: {
      user: { id: 'user123' },
      pb,
    },
    listingCreate,
    gameCreate,
    listingDelete,
  };
};

describe('listings/new action', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('creates listing and game records then redirects', async () => {
    const formData = buildFormData();
    const { listingCreate, gameCreate, request, locals } = createEvent(formData);

    await expect(actions.default({ request, locals } as never)).rejects.toMatchObject({
      status: 303,
      location: '/profile',
    });

    expect(listingCreate).toHaveBeenCalledWith(expect.any(FormData));

    const payload = listingCreate.mock.calls[0][0] as FormData;
    expect(payload.get('owner')).toBe('user123');
    expect(payload.get('title')).toBe('Listing title');
    expect(payload.get('listing_type')).toBe('trade');
    expect(payload.get('status')).toBe('active');
    expect(payload.get('views')).toBe('0');
    expect(payload.getAll('photos')).toHaveLength(0);

    expect(gameCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        listing: 'listing123',
        title: 'Gloomhaven',
        condition: 'excellent',
      })
    );
  });

  it('returns validation errors when required fields are missing', async () => {
    const formData = buildFormData({ title: '' });
    const { request, locals } = createEvent(formData);

    const result = await actions.default({ request, locals } as never);

    expect(result?.status).toBe(400);
    expect(result?.data.fieldErrors.title).toBeDefined();
  });

  it('rolls back the listing when the game record fails to save', async () => {
    const formData = buildFormData();
    const failingGameCreate = vi.fn().mockRejectedValue(new Error('boom'));
    const listingDelete = vi.fn().mockResolvedValue(undefined);

    const { request, locals, listingCreate } = createEvent(formData, {
      gameCreate: failingGameCreate,
      listingDelete,
    });

    const result = await actions.default({ request, locals } as never);

    expect(result?.status).toBe(500);
    expect(failingGameCreate).toHaveBeenCalled();
    expect(listingCreate).toHaveBeenCalled();
    expect(listingDelete).toHaveBeenCalledWith('listing123');
  });

  it('validates photo uploads before creating the listing', async () => {
    const formData = buildFormData();
    const invalidFile = new File(['bad'], 'photo.gif', { type: 'image/gif' });
    formData.append('photos', invalidFile);

    const { request, locals } = createEvent(formData);

    const result = await actions.default({ request, locals } as never);

    expect(result?.status).toBe(400);
    expect(result?.data.fieldErrors.photos).toBeDefined();
  });
});
