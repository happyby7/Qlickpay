import {type RequestEvent } from '@sveltejs/kit';
import type { Guard } from 'svelte-guard';
import { checkTableGuard } from '$lib/guard';

export const guard: Guard = async ({ url }: RequestEvent) => {
  await checkTableGuard(url, { requireParams: false });
  return true;
};
