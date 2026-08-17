import type { PageLoad } from './$types';
import { NZ_REGIONS } from '$lib/constants/regions';

export const load: PageLoad = async () => ({
  regions: NZ_REGIONS.map((region) => region.value).filter(Boolean),
  preferences: {
    watched_regions: [] as string[],
    max_distance_km: null,
    email_frequency: 'instant',
    in_app_digest: 'instant',
    notify_new_listings: true,
    notify_price_drops: false,
    notify_new_messages: true,
  },
});
