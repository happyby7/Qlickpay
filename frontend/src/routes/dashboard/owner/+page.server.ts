import type { PageServerLoad } from './$types';
import { auth, getTokenFromCookies } from "$lib/auth";
import { jwtDecode } from "jwt-decode";
import { browser } from "$app/environment";
import type { TokenPayload } from "$lib/types";
import { get } from "svelte/store";
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ cookies, fetch }) => {
  let token: string | null | { auth: string } = null;

  if (browser) {
    token = get(auth);
  } else {
    const authCookie = cookies.get('auth') || '';
    token = await getTokenFromCookies(authCookie, fetch);
  }

  if (token && typeof token === 'object' && 'auth' in token) token = token.auth;

  if (!token || typeof token !== 'string') {
    console.log("🚨 No hay token disponible o token inválido:", token);
    throw redirect(302, '/auth');
  }

  let user: TokenPayload;
  
  try {
    user = jwtDecode<TokenPayload>(token);
  } catch (error) {
    console.error("❌ Error al decodificar el token:", error);
    throw redirect(302, '/auth');
  }

  if (user.role !== "owner") {
    throw redirect(302, `/dashboard/${user.role}`);
  }

  return { restaurantId: user?.restaurantId || null };
};
