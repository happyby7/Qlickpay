import type { PageServerLoad } from "./$types";
import { validateSessionToken } from "$lib/guard";
import { redirect } from "@sveltejs/kit";

export const load: PageServerLoad = async ({ url, cookies, fetch }) => {
  const restaurantId = url.searchParams.get("restaurantId");
  const tableId = url.searchParams.get("tableId");

  if (!restaurantId) {
    console.error("🚨 Parámetros faltantes en la URL.");
    throw redirect(302, "/");
  }

  if (restaurantId && tableId) {
    try {
      await validateSessionToken(restaurantId, tableId, cookies, fetch);
    } catch {
      console.error('Validación de token de sesión de mesa fallida. Redirigiendo...');
      throw redirect(302, '/');
    }
  }
  
  return { restaurantId, tableId, error: null };
};
