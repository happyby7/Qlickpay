import type { PageLoad } from './$types';

export const load: PageLoad = async ({ data }) => {
  const { restaurantId, tableId } = data;

  if (!restaurantId || !tableId) {
    console.error('🚨 Parámetros faltantes en los datos del servidor.');
    return { restaurantId: null, tableId: null };
  }

  return { restaurantId, tableId };
};
