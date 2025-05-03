import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { getTokenFromCookies } from '$lib/auth';
import { validateSessionToken } from '$lib/guard';
import type { TokenPayload } from '$lib/types.ts';
import { PRIVATE_JWT_SECRET } from '$env/static/private';
import { jwtDecode } from 'jwt-decode';
import jwt from 'jsonwebtoken';


export const load: LayoutServerLoad = async ({ url, cookies, fetch }) => {
  const { pathname, searchParams } = url;
  const sessionExpired = searchParams.get('sessionExpired') === 'true';

  const mesaSinSesion    = searchParams.get('mesaSinSesion')    === 'true';
  const mesaNoActiva     = searchParams.get('mesaNoActiva')     === 'true';
  const errorValidacion  = searchParams.get('errorValidacion')  === 'true';

  const restaurantId = searchParams.get('restaurantId') ?? null;
  const tableId = searchParams.get('tableId') ?? null;
  const hasQRParams  = Boolean(restaurantId && tableId);

  let user: TokenPayload | null = null;

  if (hasQRParams && !pathname.startsWith('/scan')) await validateSessionToken(restaurantId!, tableId!, cookies, fetch);
    
  const rawAuth = cookies.get('auth') || '';
  let token: string | null | { auth: string } = await getTokenFromCookies(rawAuth, fetch);

  if (token && typeof token === 'object' && 'auth' in token) token = token = token.auth;
  
  if (token && typeof token === "string") {
    try {
      jwt.verify(token, PRIVATE_JWT_SECRET);
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        cookies.delete('auth', { path: '/' });
        throw redirect(302, '/auth?sessionExpired=true');
      }
      console.error('❌ Token inválido:', error.message);
      cookies.delete('auth', { path: '/' });
      throw redirect(302, '/auth');
    }

    try {
      user = jwtDecode<TokenPayload>(token);
    } catch (error) {
      console.error("Error al decodificar el token:", error);
      throw redirect(302, "/auth");
    }
  } 

  return {sessionExpired, mesaSinSesion, mesaNoActiva, errorValidacion, restaurantId, tableId, hasQRParams, user, token};
};
