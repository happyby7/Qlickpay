import type { LayoutServerLoad } from './$types';
import { getTokenFromCookies } from '$lib/auth';

export const load: LayoutServerLoad = async ({ cookies, fetch }) => {
  const authCookie = cookies.get('auth') || '';
  let token;
  try {
    token = await getTokenFromCookies(authCookie, fetch);
  } catch {
    cookies.delete('auth', { path: '/' });
    token = null;
  }
  return { token };
};
