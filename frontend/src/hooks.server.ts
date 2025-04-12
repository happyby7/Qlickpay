import { type Handle } from '@sveltejs/kit';
import { createGuardHook } from 'svelte-guard';
import jwt from 'jsonwebtoken';
import { PRIVATE_JWT_SECRET } from '$env/static/private';

const guards = import.meta.glob('./routes/**/-guard.*');
const guardHandle = createGuardHook(guards);
const { verify } = jwt;

export const handle: Handle = async ({ event, resolve }) => {
  const token = event.cookies.get('auth');

  if (token) {
    try {
      const user = verify(token, PRIVATE_JWT_SECRET); 
      event.locals.user = user;
    } catch (error) {
        if (error instanceof Error) {
          console.warn('❌ Token inválido o expirado:', error.message);
        } else {
          console.warn('❌ Error desconocido al verificar el token:', error);
        }
        event.locals.user = null;
      }
  }
  return guardHandle({ event, resolve });
};
