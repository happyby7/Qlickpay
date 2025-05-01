import type { PageLoad } from './$types';
import { browser } from '$app/environment';

export const load: PageLoad = async ({ data }) => {
  let { isRegistering, sessionExpired, restaurantId, tableId } = data;

  if (browser) {
    restaurantId = restaurantId || sessionStorage.getItem('restaurantId') || '';
    tableId = tableId || sessionStorage.getItem('tableId')      || '';

    if (restaurantId && tableId) {
      sessionStorage.setItem('restaurantId', restaurantId);
      sessionStorage.setItem('tableId', tableId);
    } else {
      sessionStorage.removeItem('restaurantId');
      sessionStorage.removeItem('tableId');
    }
  }

  return { isRegistering, sessionExpired, restaurantId, tableId };
};
