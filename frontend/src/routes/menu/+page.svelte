<script lang="ts">
  import { onMount } from "svelte";
  import type { PageData } from "./$types";
  import { fetchMenu } from "$lib/menu";
  import { sendOrder } from "$lib/order";
  import type { MenuItem } from "$lib/types";

  let menuItems: MenuItem[] = [];
  let error = "";
  let successMessage = "";
  let showOrderSummary = false;
  let order = new Map<string, number>();
  let totalPedido = 0;
  let orderWarning = "";

  export let data: PageData;
  const { restaurantId, tableId, hasQRParams, restaurantName, error: pageError } = data;

  if (pageError) error = pageError;

  const orderKey = (id: string | number): string => id.toString();

  async function loadMenu() {
    if (!restaurantId) {
      error = "No se encontró el restaurante.";
      return;
    }
    try {
      const response = await fetchMenu(restaurantId);
      menuItems = response.menuItems;
    } catch (e) {
      error = "Error al cargar el menú.";
      console.error(e);
    }
  }

  onMount(() => {
     window.addEventListener('pageshow', (event) => {
      if (event.persisted) {
         location.reload();
      }
    });  
    loadMenu();
  });

  function updateOrder(item: MenuItem, delta: number) {
    if (!hasQRParams) {
      console.warn("Acción no permitida sin parámetros QR.");
      return;
    }
    const key = orderKey(item.id);
    const currentQty = order.get(key) || 0;
    const newQty = currentQty + delta;
    newQty > 0 ? order.set(key, newQty) : order.delete(key);
    order = new Map(order); 
    orderWarning = ""; 
  }

  function toggleOrderSummary() {
    showOrderSummary = !showOrderSummary;
    orderWarning = ""; 
  }

  async function confirmOrder() {
    if (!hasQRParams) {
      console.warn("Acción no permitida sin parámetros QR.");
      return;
    }
    const pedido = {
      table_id: tableId!,
      order_type: "qr_scan",
      items: Array.from(order.entries())
        .map(([key, qty]) => {
          const item = menuItems.find(i => orderKey(i.id) === key);
          return item
            ? { 
                menu_item_id: String(item.id),
                quantity: qty, 
                subtotal: (item.price * qty).toFixed(2) 
              }
            : null;
        })
        .filter((item): item is { menu_item_id: string; quantity: number; subtotal: string } => item !== null)
    };

    if (pedido.items.length === 0) {
      orderWarning = "Seleccione al menos un producto antes de confirmar su pedido."; 
      console.warn("❌ No hay artículos seleccionados en el pedido.");
      return;
    }

    try {
      await sendOrder(pedido);
      successMessage = "Pedido enviado a cocina!";
      setTimeout(() => (successMessage = ""), 4000); 
      order.clear();
      order = new Map();
      totalPedido = 0;
      showOrderSummary = false;
      orderWarning = ""; 
    } catch (e) {
      console.error("❌ Error al enviar el pedido:", e);
      error = "No se pudo completar el pedido.";
    }
  }

  $: orderItems = Array.from(order.entries())
    .map(([key, quantity]) => {
      const item = menuItems.find(i => orderKey(i.id) === key);
      return item
        ? { ...item, quantity, subtotal: (item.price * quantity).toFixed(2) }
        : null;
    })
    .filter(Boolean);

  $: totalPedido = orderItems.reduce((acc, item) => item ? acc + parseFloat(item.subtotal) : acc, 0);
</script>

<div class="menu-container">
<h1>Menú {restaurantName}</h1>

{#if successMessage}
  <p class="success">{successMessage}</p>
{/if}
{#if error}
  <p class="error">{error}</p>
{:else if menuItems.length === 0}
  <p>Este restaurante aún no tiene un menú disponible.</p>
{:else}
  <ul class="menu-list">
    {#each menuItems as item}
      <li class="menu-item">
        <!--
           imágenes: <img src={item.image} alt={item.name} class="item-image" />
        -->
        <div class="item-header">
          <span class="item-name">{item.name}</span>
        </div>
        <p class="item-desc">{item.description}</p>

        {#if hasQRParams}
          <div class="controls">
            <button class="minus" type="button" on:click={() => updateOrder(item, -1)}>-</button>
            <span>{order.get(orderKey(item.id)) || 0}</span>
            <button class="plus" type="button" on:click={() => updateOrder(item, 1)}>+</button>
            <span class="control-price">{Number(item.price).toFixed(2)} <small>EUR</small></span>
          </div>
        {/if}
      </li>
    {/each}
  </ul>
{/if}
</div>

{#if hasQRParams}
<button type="button" class="floating-order-button" on:click={toggleOrderSummary}>
  🛒 Hacer Pedido
</button>
{/if}

{#if showOrderSummary}
<div class="modal-overlay">
  <div class="order-summary" role="dialog" aria-modal="true">
    <h2>Resumen del Pedido</h2>
    <ul>
      {#each orderItems as item (item?.id)}
        {#if item}
          <li>
            <span>{item.name} x {item.quantity}</span>
            <span>{item.subtotal} <small>EUR</small></span>
          </li>
        {/if}
      {/each}
    </ul>
    <h3>Total: {totalPedido.toFixed(2)} <small>EUR</small></h3>
    <button type="button" class="confirm-button" on:click={confirmOrder}>
      Confirmar Pedido
    </button>
    <button type="button" class="close-button" on:click={toggleOrderSummary}>
      Cerrar
    </button>
    {#if orderWarning}
      <p class="order-warning">{orderWarning}</p>
    {/if}
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
  max-width: 500px;
  margin: 1rem auto;
  padding: 0.5rem;
}

h1 {
  margin: 0.5rem 0;
  font-size: 1.2rem;
  text-align: center;
}

.success,
.error,

.success {
  color: #155724;
  background-color: #d4edda;
  border: 1px solid #c3e6cb;
  padding: 0.5rem;
  border-radius: 5px;
}

.error {
  background-color: #f8d7da;
  color: #721c24;
  padding: 0.5rem;
  border-radius: 5px;
}

.menu-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.menu-item {
  padding: 0.8rem 0;
  border-bottom: 1px solid #ccc;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.item-name {
  font-size: 1rem;
  font-weight: 600;
}

.item-desc {
  margin: 0;
  font-size: 0.9rem;
  color: #888; 
}

.control-price {
  font-size: 0.7rem;
  font-weight: bold;
}

.control-price small {
  font-size: 0.5rem;
  font-weight: normal;
}

.controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.controls button {
  font-size: 0.8rem;
  font-weight: bold;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}
.minus {
  background: #eee;
  color: #333;
}
.minus:hover {
  background: #ccc;
}
.plus {
  background: #eee;
  color: #333;
}
.plus:hover {
  background: #a8e6a1;
}

.floating-order-button {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background-color: #03dac6;
  color: #333;
  border: none;
  padding: 10px 16px;
  font-size: 1rem;
  border-radius: 50px;
  cursor: pointer;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.order-summary {
  background: #fff;
  padding: 1.5rem;
  border-radius: 12px;
  max-width: 500px;
  width: 100%;
  text-align: center;
  color: #333;
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.order-summary h2 {
  margin-bottom: 1rem;
}

.order-summary ul {
  list-style: none;
  padding: 0;
  margin: 0;
  margin-bottom: 1rem;
}

.order-summary li {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid #ddd;
}

.order-summary li:last-child {
  border-bottom: none;
}

.order-summary h3 {
  margin-top: 1rem;
}

.confirm-button,
.close-button {
  display: inline-block;
  margin: 0.5rem;
  padding: 0.6rem 1.2rem;
  font-size: 0.95rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.confirm-button {
  background: #007bff;
  color: #fff;
}

.confirm-button:hover {
  background: #0056b3;
}

.close-button {
  background: #dc3545;
  color: #fff;
}

.close-button:hover {
  background: #c82333;
}

.order-warning {
  color: #000;
  font-size: 0.9rem;
  margin-top: 10px;
  text-align: center;
}

/*
 imágenes a cada ítem:
  .item-image {
    width: 48px;
    height: 48px;
    border-radius: 4px;
    object-fit: cover;
    margin-right: 0.5rem;
  }
*/
</style>
