import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, parent }) => {
  const { restaurantId, sessionExpired, tableId } = await parent();
  const isRegistering = url.searchParams.get('register') === 'true';

  return { isRegistering, sessionExpired, restaurantId, tableId };
};
