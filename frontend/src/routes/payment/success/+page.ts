import type { PageLoad } from './$types';

export const load: PageLoad = ({ url }) => {
  return {
    sessionId: url.searchParams.get('session_id')
  };
};
