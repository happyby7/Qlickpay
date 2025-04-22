<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { fetchBill } from "$lib/qr";
  import { goto } from "$app/navigation";
  import type { ModeState, Bill } from "$lib/types";
  import { fetchTableStatus } from "$lib/order";
  import { createCheckoutSession } from "$lib/payment";

  let bill: Bill | null = null;
  let loading = true;
  let error = "";
  let restaurantId: string | null = null;
  let tableId: string | null = null;

  let mode: ModeState['value'] = 'none';
  let showSplit: boolean = false;

  $: ({ restaurantId, tableId } = $page.data);

  async function robustCheckStatus() {
    if (!restaurantId || !tableId) return;
    try {
      const result = await fetchTableStatus(Number(restaurantId), Number(tableId));
      if (result && result.status === "paid") {
        console.warn(`La mesa ya está pagada. Redirigiendo a la página principal...`);
        goto('/');
      }
    } catch (error) {
      console.error("Error al comprobar el estado de la mesa:", error);
      goto('/');
    }
  }

  async function loadBill() {
    if (!restaurantId || !tableId) {
      console.error("❌ No se encontró restaurantId o tableId.");
      error = "Error: No se ha identificado la mesa.";
      return;
    }
    loading = true;
    error = "";
    try {
      bill = await fetchBill(restaurantId, tableId);
      if (!bill) {
        error = "No se pudo cargar la cuenta. Inténtalo de nuevo.";
      }
    } catch (e) {
      console.error("❌ Error al cargar la cuenta:", e);
      error = "Error al conectar con el servidor.";
    } finally {
      loading = false;
    }
  }

  async function pay(amount: number) {
    if (!restaurantId || !tableId || amount <= 0) return;
    const orderId = `${restaurantId}-${tableId}-full`;
    const { url } = await createCheckoutSession(orderId, amount, {});
    window.location.href = url;
  }

  onMount(() => {
    window.addEventListener('pageshow', (event) => {
      if (event.persisted) {
        location.reload();
      }
    });
    window.addEventListener('popstate', robustCheckStatus);
    
    robustCheckStatus();
    loadBill();
});


  function goToSplitItems() {
    let storedRestaurantId = restaurantId || sessionStorage.getItem("restaurantId") || "";
    let storedTableId = tableId || sessionStorage.getItem("tableId") || "";
    goto(`/payment/pay?mode=split-items&restaurantId=${storedRestaurantId}&tableId=${storedTableId}`);
  }

  function goToCustomAmount() {
    let storedRestaurantId = restaurantId || sessionStorage.getItem("restaurantId") || "";
    let storedTableId = tableId || sessionStorage.getItem("tableId") || "";
    goto(`/payment/pay?mode=custom&restaurantId=${storedRestaurantId}&tableId=${storedTableId}`);
  }
</script>

{#if restaurantId && tableId}
  <div class="menu-container">
    <h1>Paga tu cuenta</h1>
    {#if loading}
      <p class="info">Cargando cuenta...</p>
    {:else if error}
      <p class="error">{error}</p>
    {:else if bill}
      <ul class="bill-list">
        {#each bill.items as item}
          <li class="bill-item">
            {item.quantity}x {item.name} - {item.subtotal.toFixed(2)} <small>EUR</small>
          </li>
        {/each}
      </ul>
      <h2 class="total">Total: {bill.total_price.toFixed(2)} <small>EUR</small></h2>
    {/if}
  </div>
{:else}
  <p class="error">No se ha identificado la mesa.</p>
{/if}

{#if mode === 'none'}
  <div class="main-actions">
    <button class="fullpay-btn" on:click={() => bill && pay(bill.total_price)}>
      Pagar todo
    </button>
    <button class="split-btn" on:click={() => showSplit = true}>
      Dividir la cuenta
    </button>
  </div>
{/if}

{#if showSplit}
  <button
    class="backdrop"
    on:click={() => showSplit = false}
    on:keydown={(e) => (e.key === 'Escape' || e.key === 'Enter') && (showSplit = false)}
    aria-label="Cerrar panel de división"
    tabindex="0"
    type="button"
  ></button>
  <div class="slide-up options">
    <h2>Dividir la cuenta</h2>
    <p class="description">Puedes pagar solo tu parte.</p>
    <div class="option-row">
      <div>
        <strong>Pagar por tus artículos</strong>
        <p class="subtitle">Selecciona solo lo que has pedido</p>
      </div>
      <button on:click={goToSplitItems} class="select-btn">
        seleccionar
      </button>
    </div>
    <div class="option-row">
      <div>
        <strong>Pagar una cantidad personalizada</strong>
        <p class="subtitle">Introduce la cantidad que deseas pagar</p>
      </div>
      <button on:click={goToCustomAmount} class="select-btn">
        seleccionar
      </button>
    </div>
  </div>
{/if}

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: "Segoe UI", Roboto, sans-serif;
    background: #fff;
    color: #333;
  }

  .menu-container {
    max-width: 600px;
    margin: 2rem auto;
    padding: 1rem;
  }

  h1 {
    margin: 0.5rem 0;
    font-size: 1.2rem;
    text-align: center;
  }

  .info,
  .error {
    text-align: center;
    margin: 0.5rem 0;
  }

  .bill-list {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .bill-item {
    padding: 0.8rem 0;
    border-bottom: 1px solid #ccc;
    font-size: 0.95rem;
  }

  .total {
    text-align: center;
    margin: 1rem 0;
    font-size: 1rem;
    font-weight: bold;
  }

  .main-actions {
    display: flex;
    justify-content: center;
    gap: 1rem;
    margin-top: 2rem;
  }

  .fullpay-btn,
  .split-btn {
    padding: 0.7rem 1.5rem;
    font-size: 1rem;
    font-weight: bold;
    border: none;
    border-radius: 8px;
    cursor: pointer;
  }

  .fullpay-btn {
    background-color: #10b981;
    color: white;
  }

  .split-btn {
    background-color: #f3e8ff;
    color: #9333ea;
  }

  .backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    z-index: 9;
  }

  .slide-up {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: white;
    border-top-left-radius: 16px;
    border-top-right-radius: 16px;
    padding: 1.5rem 1.2rem;
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.2);
    z-index: 10;
    overflow-x: hidden;
    box-sizing: border-box;
  }

  .options h2 {
    margin-bottom: 0.4rem;
  }

  .description {
    color: #666;
    font-size: 0.95rem;
    margin-bottom: 1.2rem;
  }

  .option-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 0;
    border-bottom: 1px solid #eee;
  }

  .option-row strong {
    font-size: 1rem;
  }

  .subtitle {
    font-size: 0.85rem;
    color: #999;
    margin-top: 0.2rem;
  }

  .select-btn {
    background: #f3e8ff;
    color: #9333ea;
    border: none;
    padding: 0.5rem 1.2rem;
    font-weight: bold;
    border-radius: 9999px;
    cursor: pointer;
    transition: background 0.2s ease;
  }

  .select-btn:hover {
    background: #e9d5ff;
  }
</style>
