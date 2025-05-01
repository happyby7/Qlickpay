// src/routes/owner/+layout.server.ts
import type { LayoutServerLoad } from './$types';
import { getTokenFromCookies } from '$lib/auth';
import { jwtDecode } from 'jwt-decode';
import type { TokenPayload } from '$lib/types';
import { redirect } from '@sveltejs/kit';

export const load: LayoutServerLoad = async ({ cookies, fetch }) => {
  const raw = cookies.get('auth') || '';

  let token = await getTokenFromCookies(raw, fetch);
  if (token && typeof token === 'object' && 'auth' in token) token = token.auth;

  if (!token || typeof token !== 'string') throw redirect(302, '/auth');
  
  let user: TokenPayload;
  try {
    user = jwtDecode<TokenPayload>(token);
  } catch {
    throw redirect(302, '/auth');
  }

  if (user.role !== 'owner') throw redirect(302, `/dashboard/${user.role}`);

  return { user, restaurantId: user.restaurantId};
};
