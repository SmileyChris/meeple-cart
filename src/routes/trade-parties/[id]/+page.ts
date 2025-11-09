import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
  const { id } = params;

  // Placeholder - return mock data for now
  return {
    id,
  };
};
