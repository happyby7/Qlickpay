import type { PageServerLoad } from './$types';
import { fetchSessionToken } from '$lib/auth';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ parent, cookies, fetch }) => {
  const { restaurantId, tableId } = await parent();

  if (!restaurantId || !tableId) {
      console.error("Parámetros faltantes en la URL.");
      throw redirect(302, '/');
    }

  try {
    const token = await fetchSessionToken(restaurantId, tableId, fetch);
    if (token) cookies.set('valid', token, { httpOnly: true,  secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 30 * 60 });
    
    return { restaurantId, tableId, token: token ?? null };
  } catch (err: any) {
    console.error("Error al obtener token de sesión de la mesa:", err);
    return { restaurantId, tableId, token: null, error: err.message || "Error al obtener token de sesión de la mesa.", };
  }
};
