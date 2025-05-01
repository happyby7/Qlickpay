import type { LayoutServerLoad } from './$types';
import { validateSessionToken } from '$lib/guard';
import { redirect } from '@sveltejs/kit';
import type { ModeState } from '$lib/types';

export const load: LayoutServerLoad = async ({ url, cookies, fetch }) => {
  const restaurantId = url.searchParams.get('restaurantId') || '';
  const tableId = url.searchParams.get('tableId') || '';

  const modeParam = url.searchParams.get('mode') ?? 'split-items';
  const mode: ModeState['value'] = ['split-items','custom'].includes(modeParam) ? (modeParam as ModeState['value']) : 'split-items';

  if (!restaurantId || !tableId) {
    console.error('🚨 Parámetros faltantes en los datos del servidor.');
    return { restaurantId: null, tableId: null };
  }

  if (restaurantId && tableId) {
    try {
      await validateSessionToken(restaurantId, tableId, cookies, fetch);
    } catch {
      console.error('Validación de token de sesión de mesa fallida. Redirigiendo...');
      throw redirect(302, '/');
    }
  }
  return { restaurantId, tableId, mode};
};
