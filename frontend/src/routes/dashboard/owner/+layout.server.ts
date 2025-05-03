import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: LayoutServerLoad = async ({ parent }) => {
  const { user, token } = await parent();

  if (!token || typeof token !== 'string') throw redirect(302, '/auth?sessionExpired=true');

  if (!user || user.role !== 'owner') {
    console.error('No tienes permisos de dueño de restaurante. Redirigiendo...');
    throw redirect(302, `/`);
  }
  
  return { restaurantId: user.restaurantId };
};
