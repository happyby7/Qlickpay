import type { PageServerLoad } from './$types';
import { redirect } from "@sveltejs/kit";

export const load: PageServerLoad = async ({ parent, url }) => {
  const { restaurantId, tableId, hasQRParams } = await parent();
  const restaurantName = url.searchParams.get('restaurantName') ?? null;

  if (!restaurantId) {
    console.error("Parámetros faltantes en la URL.");
    throw redirect(302, "/");
  }

  return { restaurantId, tableId, hasQRParams, restaurantName, error: null };
};
