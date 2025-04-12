<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { auth } from '$lib/auth';
  import ButtonLogout from '../components/ButtonLogout.svelte';
  import { jwtDecode } from 'jwt-decode';
  import { goto } from '$app/navigation';

  export let data;

  let isGuest = false;
  let restaurantId = "";
  let tableId = "";

  onMount(() => {
    if (browser) {
      const url = new URL(window.location.href);
      const qsRestaurantId = url.searchParams.get("restaurantId");
      const qsTableId = url.searchParams.get("tableId");

      if (qsRestaurantId && qsTableId) {
        sessionStorage.setItem("restaurantId", qsRestaurantId);
        sessionStorage.setItem("tableId", qsTableId);
        restaurantId = qsRestaurantId;
        tableId = qsTableId;
      } else {
        restaurantId = sessionStorage.getItem("restaurantId") || "";
        tableId = sessionStorage.getItem("tableId") || "";
      }
      isGuest = sessionStorage.getItem('isGuest') === 'true';
    }

    const tokenStr = data.token && (typeof data.token === 'object' ? data.token.auth : data.token);
    auth.set(tokenStr || null);
  });

  let role = "customer";
  $: if ($auth) {
    try {
      role = (jwtDecode($auth) as { role?: string })?.role || "customer";
    } catch (error) {
      console.error("❌ Error al decodificar el token:", error);
      role = "customer";
    }
  }

  function goToDashboard() {
    if (role === "customer") {
      if (restaurantId && tableId) {
        goto(`/dashboard/customer?restaurantId=${restaurantId}&tableId=${tableId}`);
      } else {
        goto(`/dashboard/customer`);
      }
    } else {
      goto(`/dashboard/${role}`);
    }
  }
</script>

<nav>
  <a href={role === "customer" && restaurantId && tableId ? `/?restaurantId=${restaurantId}&tableId=${tableId}` : "/"}>
    Inicio
  </a>
  {#if $auth || isGuest}
    {#if role === "customer" && restaurantId && tableId}
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
