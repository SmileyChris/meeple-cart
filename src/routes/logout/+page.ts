import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
  // Just load the logout page - actual logout happens when user confirms
  return {};
};
