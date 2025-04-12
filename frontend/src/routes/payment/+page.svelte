<script lang="ts">
    import { onMount } from "svelte";
    import { page } from "$app/stores";
    import { fetchBill } from "$lib/qr";
    import { createCheckoutSession } from "$lib/payment";
  
    let bill: { total_price: number } | null = null;
    let loading = true;
    let error = "";
    let restaurantId: string | null = null;
    let tableId: string | null = null;
  
    $: ({ restaurantId, tableId } = $page.data);
  
    async function loadBill() {
      if (!restaurantId || !tableId) {
        console.error("❌ No se encontró restaurantId o tableId.");
        error = "Error: No se ha identificado la mesa.";
        return;
      }
  
      loading = true;
      error = "";
  
      try {
        const result = await fetchBill(restaurantId, tableId);
        if (!result) {
          error = "No se pudo cargar la cuenta. Inténtalo de nuevo.";
          return;
        }
        bill = result;
      } catch (e) {
        console.error("❌ Error al cargar la cuenta:", e);
        error = "Error al conectar con el servidor.";
      } finally {
        loading = false;
      }
    }
  
    async function pagar() {
      if (!bill || !restaurantId || !tableId) return;
      try {
        const orderId = `${restaurantId}-${tableId}`; 
        const { url } = await createCheckoutSession(orderId, bill.total_price);
        window.location.href = url;
      } catch (err) {
        console.error("❌ Error al iniciar el pago:", err);
        error = "No se pudo iniciar el pago.";
      }
    }
  
    onMount(() => {
      loadBill();
    });
  </script>
  
  {#if restaurantId && tableId}
    <h1>Pagar Cuenta - Mesa {tableId}</h1>
  
    {#if loading}
      <p class="info">Cargando cuenta...</p>
    {:else if error}
      <p class="error">{error}</p>
    {:else if bill}
      <p>Total a pagar: <strong>${bill.total_price.toFixed(2)}</strong></p>
      <button on:click={pagar}>Pagar con tarjeta</button>
    {/if}
  {:else}
    <p class="error">No se ha identificado la mesa.</p>
  {/if}
  
  <style>
    .info {
      color: blue;
    }
    .error {
      color: red;
    }
    button {
      margin-top: 1rem;
      padding: 0.5rem 1rem;
      font-size: 1rem;
    }
  </style>
  