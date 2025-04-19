import {type RequestEvent } from '@sveltejs/kit';
import type { Guard } from 'svelte-guard';
import { checkTableGuard } from '$lib/guard';

export const tableGuard: Guard = async (event: RequestEvent) => {
	await checkTableGuard(event.url, { requireParams: false });
	return true;
};

