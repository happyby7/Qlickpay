<script lang="ts">
    import { onMount } from "svelte";
    import { page } from "$app/stores";
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
 
    const { restaurantId,tableId, hasQRParams, error: pageError } = $page.data;
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
    onMount(loadMenu);
  
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
      table_id: tableId,
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
        .filter((item): item is { menu_item_id: string; quantity: number; subtotal: string } => item !== null)};

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
    <h1>Menú del Restaurante {restaurantId}</h1>
    {#if successMessage}
        <p class="success">{successMessage}</p>
    {/if}
    {#if error}
      <p class="error">{error}</p>
    {:else if menuItems.length === 0}
      <p class="empty">Este restaurante aún no tiene un menú disponible.</p>
    {:else}
      <ul class="menu-list">
        {#each menuItems as item}
          <li class="menu-item">
            <h3>{item.name} - ${Number(item.price).toFixed(2)}</h3>
            <p>{item.description}</p>
            {#if hasQRParams}
              <div class="controls">
                <button type="button" on:click={() => updateOrder(item, -1)}>-</button>
                <span>{order.get(orderKey(item.id)) || 0}</span>
                <button type="button" on:click={() => updateOrder(item, 1)}>+</button>
              </div>
            {/if}
          </li>
        {/each}
      </ul>
      {#if !hasQRParams}
        <p class="info">Para hacer pedidos, escanea un código QR en el restaurante.</p>
      {/if}
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
                <span>${item.subtotal}</span>
              </li>
            {/if}
          {/each}
        </ul>
        <h3>Total: ${totalPedido.toFixed(2)}</h3>
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
    .menu-container {
      max-width: 600px;
      margin: 2rem auto;
      text-align: center;
    }
    ul.menu-list {
      list-style: none;
      padding: 0;
    }
    li.menu-item {
      margin-bottom: 1rem;
      padding: 1rem;
      border: 1px solid #ddd;
      border-radius: 8px;
    }
    .controls {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
    }
    button {
      padding: 0.5rem 1rem;
      cursor: pointer;
    }
    .floating-order-button {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background-color: #28a745;
      color: white;
      border: none;
      padding: 10px 15px;
      font-size: 0.8rem;
      border-radius: 50px;
      cursor: pointer;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
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
    }
    .order-summary {
      background: white;
      padding: 20px;
      border-radius: 8px;
      max-width: 500px;
      width: 90%;
      text-align: center;
    }
    .order-summary h2 {
      margin-bottom: 15px;
    }
    .order-summary ul {
      list-style: none;
      padding: 0;
    }
    .order-summary li {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #ddd;
    }
    .confirm-button {
      background: #007BFF;
      color: white;
      border: none;
      padding: 10px 20px;
      font-size: 1rem;
      cursor: pointer;
      margin-top: 10px;
    }
    .confirm-button:hover {
      background: #0056b3;
    }
    .success {
        color: #155724;
        background-color: #d4edda;
        border: 1px solid #c3e6cb;
        padding: 10px;
        margin-bottom: 10px;
        border-radius: 5px;
        text-align: center;
    }
    h3 {
        margin-top: 15px;
    }
    .order-warning {
        color: #000;
        font-size: 12px;
        margin-top: 10px;
        text-align: center;
    }
    .close-button {
      background: #dc3545;
      color: white;
      border: none;
      padding: 10px 20px;
      font-size: 1rem;
      cursor: pointer;
      margin-top: 10px;
    }
    .close-button:hover {
      background: #c82333;
    }
  </style>
  