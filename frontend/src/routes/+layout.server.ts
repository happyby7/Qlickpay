import type { LayoutServerLoad } from './$types';
import { getTokenFromCookies } from '$lib/auth';

export const load: LayoutServerLoad = async ({ cookies, fetch }) => {
  const authCookie = cookies.get('auth') || '';
  const token = await getTokenFromCookies(authCookie, fetch);
  return { token };
};
