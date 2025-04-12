<script lang="ts">
    import { onMount } from "svelte";
    import { page } from "$app/stores";
    import { fetchBill } from "$lib/qr";
    import { goto } from "$app/navigation";
    import type { ModeState } from "$lib/types";
  
    let bill: { items: { quantity: number, name: string, subtotal: number }[], total_price: number } | null = null;
    let loading = true;
    let error = "";
    let restaurantId: string | null = null;
    let tableId: string | null = null;
  
    let mode: ModeState['value'] = 'split-items';
    $: mode = (['split-items', 'custom'].includes($page.url.searchParams.get('mode') ?? '')) 
        ? ($page.url.searchParams.get('mode') as 'split-items' | 'custom') 
        : 'split-items';
  
    let selectedQuantities: number[] = [];
    let customAmount: number = 0;
    let customError: string = "";
  
    $: ({ restaurantId, tableId } = $page.data);
    $: totalSelected = (mode === 'split-items' && bill)
        ? bill.items.reduce((acc, item, i) => {
            const unitPrice = item.quantity ? item.subtotal / item.quantity : 0;
            return acc + (selectedQuantities[i] || 0) * unitPrice;
          }, 0)
        : 0;
    $: remainingTotal = bill 
        ? Math.max(bill.total_price - (mode === 'split-items' ? totalSelected : customAmount), 0)
        : 0;
  
    async function loadBillData() {
      if (!restaurantId || !tableId) {
        error = "No se ha identificado la mesa.";
        loading = false;
        return;
      }
      loading = true;
      error = "";
      try {
        bill = await fetchBill(restaurantId, tableId);
        if (bill) {
          if (mode === 'split-items') {
            selectedQuantities = bill.items.map(() => 0);
          } else {
            customAmount = 0;
          }
        } else {
          error = "No se pudo cargar la cuenta. Inténtalo de nuevo.";
        }
      } catch (e) {
        console.error("Error al cargar la cuenta:", e);
        error = "Error al conectar con el servidor.";
      } finally {
        loading = false;
      }
    }
  
    function increaseQuantity(i: number) {
      if (!bill) return;
      const available = bill.items[i].quantity - (selectedQuantities[i] || 0);
      const unitPrice = bill.items[i].quantity ? bill.items[i].subtotal / bill.items[i].quantity : 0;
      if (available > 0 && remainingTotal >= unitPrice) {
        selectedQuantities[i] += 1;
      }
    }
  
    function decreaseQuantity(i: number) {
      if ((selectedQuantities[i] || 0) > 0) {
        selectedQuantities[i] -= 1;
      }
    }
  
    function onCustomAmountChange(e: Event) {
      const target = e.target as HTMLInputElement;
      const value = Number(target.value);
      if (isNaN(value)) {
        customError = "Ingrese un número válido.";
        customAmount = 0;
      } else if (value < 0) {
        customError = "La cantidad no puede ser negativa.";
        customAmount = 0;
      } else if (bill && value > bill.total_price) {
        customError = "La cantidad no puede ser mayor al total.";
        customAmount = bill.total_price;
      } else {
        customError = "";
        customAmount = value;
      }
    }
  
    function goToOrder() {
      let storedRestaurantId = restaurantId || sessionStorage.getItem("restaurantId") || "";
      let storedTableId = tableId || sessionStorage.getItem("tableId") || "";
      goto(`/order?restaurantId=${storedRestaurantId}&tableId=${storedTableId}`);
    }
  
    onMount(() => {
      window.addEventListener('pageshow', (event) => {
        if (event.persisted) {
          location.reload();
        }
      });
      loadBillData();
    });
  </script>
  
  {#if restaurantId && tableId}
    <h1>{ mode === 'custom' ? 'Pagar una cantidad personalizada' : 'Paga por tus articulos' }</h1>
    {#if loading}
      <p class="info">Cargando cuenta...</p>
    {:else if error}
      <p class="error">{error}</p>
    {:else if bill}
      <ul>
        {#each bill.items as item, i}
          <li class={mode}>
            <div class="item-info">
                <strong>{item.name} {mode === 'custom' ? `x ${item.quantity}` : ''}</strong>
              <span class="unit-price">EUR {item.quantity ? (item.subtotal / item.quantity).toFixed(2) : "0.00"}</span>
            </div>
            {#if mode === 'split-items'}
              <div class="item-controls">
                <div class="item-quantity">
                  <button on:click={() => decreaseQuantity(i)} disabled={(selectedQuantities[i] || 0) <= 0}>-</button>
                  <span class="quantity-num">{selectedQuantities[i] || 0}</span>
                  <button on:click={() => increaseQuantity(i)} disabled={(bill.items[i].quantity - (selectedQuantities[i] || 0)) <= 0 || remainingTotal < (item.quantity ? item.subtotal / item.quantity : 0)}>+</button>
                </div>
                <div class="item-total">
                  <span>EUR {((item.quantity ? (item.subtotal / item.quantity) : 0) * (selectedQuantities[i] || 0)).toFixed(2)}</span>
                </div>
              </div>
            {/if}
          </li>
        {/each}
      </ul>
      <div class="summary">
        <div class="line">
          <span>Total de la cuenta</span>
          <span>EUR {bill.total_price.toFixed(2)}</span>
        </div>
        {#if mode === 'split-items'}
          <div class="line highlight">
            <span>Tu parte a pagar</span>
            <span>EUR {totalSelected.toFixed(2)}</span>
          </div>
        {:else if mode === 'custom'}
          <div class="custom-input">
            <label for="customAmount">Ingresa tu cantidad a pagar</label>
            <input id="customAmount" type="number" min="0" max={bill.total_price} value={customAmount} on:input={onCustomAmountChange} />
            {#if customError}
              <p class="error">{customError}</p>
            {/if}
          </div>
          <div class="line highlight">
            <span>Tu parte a pagar</span>
            <span>EUR {customAmount.toFixed(2)}</span>
          </div>
          <div class="line">
            <span>Restante</span>
            <span>EUR {remainingTotal.toFixed(2)}</span>
          </div>
        {/if}
      </div>
      <div class="actions">
        <button class="remove-btn" on:click={goToOrder}>Eliminar división</button>
        <button class="confirm-btn">{mode === 'split-items' ? 'Confirmar división' : 'Confirmar cantidad'}</button>
      </div>
    {/if}
  {:else}
    <p class="error">No se ha identificado la mesa.</p>
  {/if}
  
  <style>
    :global(body) {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu,
        Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
      background: #f5f5f5;
    }
    h1 {
      margin: 0.8rem;
      font-size: 1.2rem;
      text-align: center;
      color: #333;
    }
    .info, .error {
      text-align: center;
      margin: 0.8rem;
      color: #666;
    }
    ul {
      list-style: none;
      margin: 0.8rem;
      padding: 0;
      background: #fff;
      border-radius: 10px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.05);
    }
    /* Para ambos modos, mostramos el nombre y el precio unitario de forma compacta */
    li {
      padding: 0.6rem;
      border-bottom: 1px solid #eee;
      display: flex;
      flex-direction: column;
    }
    li:last-child {
      border-bottom: none;
    }
    .item-info {
      line-height: 1.2;
    }
    .item-info strong {
      font-size: 0.95rem;
      display: block;
    }
    .unit-price {
      font-size: 0.85rem;
      color: #777;
    }
    /* Estilos para el modo split-items: controles y total en una misma línea */
    li.split-items {
      display: grid;
      grid-template-columns: 1fr auto;
      align-items: center;
    }
    .item-controls {
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }
    .item-quantity {
      display: flex;
      align-items: center;
      gap: 0.2rem;
    }
    .item-quantity button {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: none;
      background: #f3f3f3;
      color: #444;
      font-size: 1rem;
      cursor: pointer;
    }
    .item-quantity button:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
    .quantity-num {
      min-width: 20px;
      text-align: center;
      font-weight: 600;
      font-size: 0.9rem;
    }
    .item-total {
      font-size: 0.9rem;
      color: #333;
      white-space: nowrap;
    }
    .summary {
      margin: 0.8rem;
      background: #fff;
      padding: 0.8rem;
      border-radius: 10px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.05);
    }
    .line {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.5rem;
      font-size: 0.95rem;
      color: #333;
    }
    .line.highlight {
      font-weight: bold;
    }
    .custom-input {
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
      margin-bottom: 0.5rem;
    }
    .custom-input label {
      font-size: 0.95rem;
      color: #333;
    }
    .custom-input input {
      padding: 0.4rem;
      font-size: 0.95rem;
      border: 1px solid #ccc;
      border-radius: 6px;
    }
    .actions {
      display: flex;
      justify-content: space-around;
      margin: 0.8rem;
    }
    .remove-btn, .confirm-btn {
      padding: 0.6rem 1.2rem;
      font-size: 0.95rem;
      border: none;
      border-radius: 20px;
      cursor: pointer;
    }
    .remove-btn {
      background: #fff;
      color: #d9534f;
      border: 2px solid #d9534f;
    }
    .confirm-btn {
      background: #007bff;
      color: #fff;
    }
  </style>
  