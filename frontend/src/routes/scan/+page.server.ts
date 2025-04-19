import type { PageServerLoad } from './$types';
import { fetchSessionToken } from '$lib/auth';

export const load: PageServerLoad = async ({ url, cookies, fetch }) => {
  const restaurantId = url.searchParams.get('restaurantId');
  const tableId = url.searchParams.get('tableId');

  if (!restaurantId || !tableId) {
    return { restaurantId, tableId, token: null, error: "Parámetros 'restaurantId' y/o 'tableId' ausentes." };
  }

  try {
    const token = await fetchSessionToken(restaurantId, tableId, fetch);
    if (token) {
      cookies.set('valid', token, { httpOnly: true,  secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 15 * 60  });
    }
    return { restaurantId, tableId, token: token ?? null };
  } catch (error) {
    console.error("Error al obtener token de sesión:", error);
    return { restaurantId, tableId, token: null, error: "Error al obtener token de sesión." };
  }
};
