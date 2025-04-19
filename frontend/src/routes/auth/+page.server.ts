import type { PageServerLoad } from './$types';
import { validateSessionToken } from '$lib/guard';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ url, cookies, fetch }) => {
  const isRegistering = url.searchParams.get('register') === 'true';
  const restaurantId = url.searchParams.get('restaurantId') || '';
  const tableId = url.searchParams.get('tableId') || '';

  if (restaurantId && tableId) {
    try {
      await validateSessionToken(restaurantId, tableId, cookies, fetch);
    } catch {
      console.error('Validación de token de sesión de mesa fallida. Redirigiendo...');
      throw redirect(302, '/');
    }
  }
  return { isRegistering, restaurantId, tableId };
};
