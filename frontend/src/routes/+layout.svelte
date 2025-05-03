<script lang="ts">
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import { auth } from '$lib/auth';
  import ButtonLogout from '../components/ButtonLogout.svelte';
  import { jwtDecode } from 'jwt-decode';

  export let data: { sessionExpired: boolean; restaurantId: string | null; tableId: string | null; hasQRParams: boolean; user: { role?: string } | null;
    token?: string | { auth: string };
  };

  let restaurantId = '';
  let tableId = '';
  let isGuest = false;
  let role = 'customer';

  if (browser) {
    const tokenStr = typeof data.token === 'object' ? data.token.auth : data.token;
    auth.set(tokenStr ?? null);
    const url = new URL(location.href);
    const qsRest = url.searchParams.get('restaurantId');
    const qsTab  = url.searchParams.get('tableId');

    if (qsRest && qsTab) {
      sessionStorage.setItem('restaurantId', qsRest);
      sessionStorage.setItem('tableId', qsTab);
      restaurantId = qsRest;
      tableId = qsTab;
    } else {
      restaurantId = sessionStorage.getItem('restaurantId') || '';
      tableId = sessionStorage.getItem('tableId') || '';
    }

    isGuest = sessionStorage.getItem('isGuest') === 'true';
  }

  $: if (browser && data.sessionExpired && location.pathname !== '/auth') {
    auth.set(null);
    sessionStorage.clear();
    goto('/auth?sessionExpired=true', { replaceState: true });
  }

  $: if (browser && $auth) {
    try {
      role = (jwtDecode<{ role?: string }>($auth).role) || 'customer';
    } catch {
      role = 'customer';
    }
  }
</script>

<nav>
  <a href={role === 'customer' && restaurantId && tableId ? `/?restaurantId=${restaurantId}&tableId=${tableId}` : '/' }>Inicio</a>

  {#if $auth || isGuest}
    {#if role === 'customer' && restaurantId && tableId}
      <a href={`/dashboard/customer?restaurantId=${restaurantId}&tableId=${tableId}`}>Dashboard</a>
    {:else}
      <a href={`/dashboard/${role}`}>Dashboard</a>
    {/if}
  {/if}

  {#if $auth}
    <ButtonLogout />
  {/if}
</nav>

<slot />

<style>
  nav {
    display: flex;
    align-items: center;
    padding: 1rem;
    background: #f5f5f5;
    border-bottom: 1px solid #ddd;
  }
  nav a {
    margin-right: 1rem;
    text-decoration: none;
    color: #007BFF;
  }
</style>
