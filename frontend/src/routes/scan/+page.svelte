<script lang="ts">
  import type { PageData } from './$types';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  export let data: PageData;

  const { token, restaurantId, tableId, error } = data;

  onMount(() => {
    if (token && restaurantId && tableId) {
      goto(`/?restaurantId=${restaurantId}&tableId=${tableId}`, { replaceState: true });
    }
  });
</script>

{#if error}
  <p style="color: red;">{error}</p>
{:else if !token}
  <p style="color: red;">
    Esta mesa no ha sido activada o tiene que volver a escanear el QR de la mesa. Por favor, no dude en contactar con un trabajador.
  </p>
{:else}
  <p>Redirigiendo...</p>
{/if}
