import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ parent }) => {
  const { restaurantId, tableId } = await parent();

  if (!restaurantId || !tableId) {
    console.error("Parámetros faltantes en la URL.");
    throw redirect(302, '/');
  }

  return { restaurantId, tableId, error: null };
};
