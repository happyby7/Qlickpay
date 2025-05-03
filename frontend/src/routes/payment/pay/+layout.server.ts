import type { LayoutServerLoad } from './$types';
import type { ModeState } from '$lib/types.ts';

export const load: LayoutServerLoad = async ({ parent, url }) => {
  const { restaurantId, tableId } = await parent();

  const modeParam = url.searchParams.get('mode') ?? 'split-items';
  const mode: ModeState['value'] = ['split-items','custom'].includes(modeParam) ? (modeParam as ModeState['value']) : 'split-items';

  if (!restaurantId || !tableId) {
    console.error('Parámetros faltantes en la URL.');
    return { restaurantId: null, tableId: null };
  }

  return { restaurantId, tableId, mode};
};
