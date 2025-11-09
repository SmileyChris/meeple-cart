import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
  // Simple loader - just ensures the page route works
  // Party ID comes from URL params, accessed in component via $page.params.id
  return {};
};
