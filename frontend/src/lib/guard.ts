import { redirect } from '@sveltejs/kit';
import { fetchTableStatus } from '$lib/order';
import { fetchSessionToken } from '$lib/auth';
import type { GuardOptions } from "$lib/types.ts";

export async function checkTableGuard(url: URL, options: GuardOptions = { requireParams: true }): Promise<void> {
  const restaurantIdStr = url.searchParams.get('restaurantId');
  const tableIdStr = url.searchParams.get('tableId');

  if (!restaurantIdStr || !tableIdStr) {
    if (options.requireParams) {
      console.error('Faltan restaurantId o tableId');
      throw redirect(302, '/');
    }
    return;
  }

  const restaurantId = parseInt(restaurantIdStr, 10);
  const tableId = parseInt(tableIdStr, 10);

  if (isNaN(restaurantId) || isNaN(tableId)) {
    if (options.requireParams) {
      console.error('restaurantId o tableId no válidos');
      throw redirect(302, '/');
    }
    return;
  }

  try {
    const result = await fetchTableStatus(restaurantId, tableId);
    if (!result || typeof result.status !== 'string') {
      console.error('Respuesta inválida al obtener el estado de la mesa:', result);
      if (options.requireParams) throw redirect(302, '/');
      return;
    }
    if (result.status === 'paid') {
      console.warn(`La mesa ${tableId} del restaurante ${restaurantId} ya está pagada.`);
      throw redirect(302, '/');
    }
  } catch (error: any) {
    if (error && typeof error === 'object' && 'status' in error && error.status === 302) {
      throw error;
    }
    console.error('Error al obtener el estado de la mesa:', error);
    if (options.requireParams) throw redirect(302, '/');
    return;
  }
}

export async function validateSessionToken( restaurantId: string,tableId: string,cookies: any, fetchFn: typeof fetch): Promise<string> {
  const cookieToken = cookies.get('valid');
  if (!cookieToken) {
    console.error("Sesión de mesa caducada, escanea de nuevo el QR para volver a la mesa.");
    throw redirect(302, '/?mesaSinSesion=true');
  }
  const serverToken = await fetchSessionToken(restaurantId, tableId, fetchFn);
  if (!serverToken) {
    console.error("La mesa se encuentra inactiva, pongase en contacto con uno de nuestros empleados.");
    throw redirect(302, '/?mesaNoActiva=true');
  }

  if (cookieToken !== serverToken) {
    console.error("Error al validar la sesión. Por favor, inténtalo de nuevo más tarde.");
    throw redirect(302, '/?errorValidacion=true');
  }
  return serverToken;
}
