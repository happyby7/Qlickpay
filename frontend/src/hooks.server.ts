import { type Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
    const token = event.cookies.get('auth');
    if (token) event.locals.user = JSON.parse(atob(token.split('.')[1]));
    return resolve(event);
};