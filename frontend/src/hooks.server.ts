import { type Handle } from '@sveltejs/kit';
import { createGuardHook } from 'svelte-guard';

const guards = import.meta.glob('./routes/**/-guard.*');
const guardHandle = createGuardHook(guards);

export const handle: Handle = async ({ event, resolve }) => {
  return guardHandle({ event, resolve });
};