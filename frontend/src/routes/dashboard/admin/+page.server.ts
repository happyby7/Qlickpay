import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import type { TokenPayload } from '$lib/types.ts';

export const load: PageServerLoad = async ({ parent }) => {
  const { user, token } = await parent();

  if (!token || typeof token !== 'string') throw redirect(302, '/auth?sessionExpired=true');

  if (!user || user.role !== 'admin') {
    console.error('No tienes permisos de administrador. Redirigiendo...');
    throw redirect(302, `/`);
  }
  
  return { restaurantId: (user as TokenPayload).restaurantId || null };
};
