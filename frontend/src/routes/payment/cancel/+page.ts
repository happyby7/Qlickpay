import type { PageLoad } from './$types';

export const load: PageLoad = ({ url }) => {
  return {
    errorMsg: url.searchParams.get('error')
  };
};
