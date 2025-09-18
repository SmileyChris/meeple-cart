import type { LayoutServerLoad } from './$types';
import { serializeNonPOJOs } from '$lib/utils/object';

export const load: LayoutServerLoad = async ({ locals }) => {
  return {
    user: locals.user ? serializeNonPOJOs(locals.user) : null,
  };
};
