import type { PageServerLoad } from "./$types";
import { validateSessionToken } from "$lib/guard";
import { redirect } from "@sveltejs/kit";

export const load: PageServerLoad = async ({ url, cookies, fetch }) => {
  const restaurantId = url.searchParams.get("restaurantId");
  const tableId = url.searchParams.get("tableId");

  if (!restaurantId || !tableId) {
    console.error("🚨 Parámetros faltantes en la URL.");
    throw redirect(302, "/");
  }
  await validateSessionToken(restaurantId, tableId, cookies, fetch);
  return { restaurantId, tableId, error: null };
};
