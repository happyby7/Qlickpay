import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import type { TokenPayload } from '$lib/types';

export const load: PageServerLoad = async ({ parent }) => {
  const { restaurantId, tableId, hasQRParams, user } = await parent();
  
  let currentUser: TokenPayload | null = null;

  if (user && user.role === 'customer') {
    currentUser = user;
  } else if (!user) {
    currentUser = { id: '0', role: 'Usuario', name: 'invitado' };
  } else {
    console.error('No tienes permisos de cliente. Redirigiendo...');
    throw redirect(302, `/`);
  }

  return { user: currentUser, restaurantId, tableId, hasQRParams };
};

