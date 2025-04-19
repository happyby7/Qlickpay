// src/hooks.server.ts
import { type Handle } from '@sveltejs/kit';
import { createGuardHook } from 'svelte-guard';
import jwt from 'jsonwebtoken';
import { PRIVATE_JWT_SECRET } from '$env/static/private';
import { redirect } from '@sveltejs/kit';

const guards = import.meta.glob('./routes/**/-guard.*');
const guardHandle = createGuardHook(guards);
const { verify } = jwt;

export const handle: Handle = async ({ event, resolve }) => {
  const token = event.cookies.get('auth');

  if (token) {
    try {
      event.locals.user = verify(token, PRIVATE_JWT_SECRET);
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        event.cookies.delete('auth', { path: '/' });
        throw redirect(303, '/auth?sessionExpired=true');
      }
      console.warn('❌ Token inválido:', error.message);
      event.locals.user = null;
    }
  }
  return guardHandle({ event, resolve });
};
