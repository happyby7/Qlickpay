<script lang="ts">
    import { onMount } from "svelte";
    import { page } from "$app/stores";
    import { fetchBill, fetchBillPaid } from "$lib/qr";
    import { goto } from "$app/navigation";
    import type { ModeState, Bill } from "$lib/types";
    import { createCheckoutSession } from '$lib/payment';
  
    let bill: Bill | null = null;
    let paidBill: Bill | null = null;

    let loading = true;
    let checkoutError: string = "";
    let error = "";

    let restaurantId: string | null = null;
    let tableId: string | null = null;
  
    let mode: ModeState['value'] = 'split-items';
    
    let selectedQuantities: number[] = [];
    let customAmount: number = 0;
    let customError: string = "";
  
    $: ({ restaurantId, tableId } = $page.data);
    $: pendingTotal = bill ? bill.items.reduce((sum, it) => sum + it.subtotal, 0) : 0;
    $: paidTotal = paidBill? paidBill.items.reduce((sum, it) => sum + it.subtotal, 0) : 0;

    $: totalSelected = (mode === 'split-items' && bill)
        ? bill.items.reduce((acc, item, i) => {
            const unitPrice = item.quantity ? item.subtotal / item.quantity : 0;
            return acc + (selectedQuantities[i] || 0) * unitPrice;
          }, 0)
        : 0;

    $: remainingTotal = bill 
        ? Math.max(bill.total_price - (mode === 'split-items' ? totalSelected : customAmount), 0)
        : 0;

    $: mode = (['split-items', 'custom'].includes($page.url.searchParams.get('mode') ?? '')) 
        ? ($page.url.searchParams.get('mode') as 'split-items' | 'custom') 
        : 'split-items';
  
    async function loadBillData() {
      if (!restaurantId || !tableId) {
        error = "No se ha identificado la mesa.";
        loading = false;
        return;
      }
      loading = true;
      error = "";
      try {
        [bill, paidBill] = await Promise.all([fetchBill(restaurantId, tableId),fetchBillPaid(restaurantId, tableId)]);
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

    function getMaxSelectable(itemQty: number): number {
      return Math.floor(itemQty);
    }
  
    function increaseQuantity(i: number) {
      const item = bill!.items[i];
      const unitPrice = item.quantity ? item.subtotal / item.quantity : 0;
      const maxQty = getMaxSelectable(item.quantity);

      if ((selectedQuantities[i] || 0) < maxQty && totalSelected + unitPrice <= pendingTotal) selectedQuantities[i] += 1;
    }
  
    function decreaseQuantity(i: number) {
      if ((selectedQuantities[i] || 0) > 0) selectedQuantities[i] -= 1;
    }
  
    function onCustomAmountChange(e: Event) {
      const value = Number((e.target as HTMLInputElement).value);
      if (isNaN(value)) {
        customError = "Ingrese un número válido.";
        customAmount = 0;
      } else if (value < 0.50) {
        customError = "La cantidad mínima es 0.50€.";
        customAmount = 0;
      } else if (bill && value > pendingTotal) {
        customError = "La cantidad no puede ser mayor a la pendiente por pagar.";
        customAmount = parseFloat(pendingTotal.toFixed(2));
      } else {
        customError = "";
        customAmount = value;
      }
    }

    async function confirmPayment() {
      if (!restaurantId || !tableId) return;
      const amount = mode === 'split-items' ? totalSelected : customAmount;
      if (amount <= 0) return;

      const suffix = mode === 'split-items' ? '-split' : mode === 'custom' ? '-custom' : '';
      const orderId = `${restaurantId}-${tableId}${suffix}`;

      const metadata: Record<string, string> = { order_id: orderId };
      
      if (mode === 'split-items') {
        const itemsToPay = bill!.items
          .map((it, i) => ({ name: it.name, quantity: selectedQuantities[i] }))
          .filter(x => x.quantity > 0);
        metadata.items = JSON.stringify(itemsToPay);
      } else if (mode === 'custom') {
        metadata.custom_amount = customAmount.toString();
      }

      try {
        const { url } = await createCheckoutSession(orderId, amount, metadata);
        window.location.href = url;
      } catch (err: any) {
        checkoutError = err.message || "Error al crear sesión de pago.";
        setTimeout(() => (checkoutError = ""), 4000);
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
  {#if checkoutError}                               
    <p class="error">{checkoutError}</p>             
  {/if}

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
            <strong>{item.name} x {item.quantity}</strong>
            <span class="unit-price">Precio unitario: {(item.subtotal / item.quantity).toFixed(2)} EUR</span>
            <span class="pending-per-item">Pendiente: {item.subtotal.toFixed(2)} EUR</span>
          </div>
          {#if mode === 'split-items'}
            <div class="item-controls">
              <div class="item-quantity">
                <button on:click={() => decreaseQuantity(i)} disabled={(selectedQuantities[i] || 0) <= 0}>-</button>
                <span class="quantity-num">{selectedQuantities[i] || 0}</span>
                <button on:click={() => increaseQuantity(i)} disabled={(selectedQuantities[i] || 0) >= getMaxSelectable(item.quantity)}>+</button>
              </div>
              <div class="item-total">
                <span>{((item.quantity ? (item.subtotal / item.quantity) : 0) * (selectedQuantities[i] || 0)).toFixed(2)} EUR</span>
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

      <div class="line subline">
        <span>Total pendiente</span>
        <span>EUR {pendingTotal.toFixed(2)}</span>
      </div>

      <div class="line subline">
         <span>Total pagado</span>
         <span>EUR {paidTotal.toFixed(2)}</span>
      </div>

      {#if mode === 'split-items'}
        <div class="line highlight">
          <span>Tu parte a pagar</span>
          <span>EUR {totalSelected.toFixed(2)}</span>
        </div>
      {:else if mode === 'custom'}
        <div class="custom-input">
          <label for="customAmount">Ingresa tu cantidad a pagar</label>
          <input
            id="customAmount"
            type="number"
            min="0.50"
            max={pendingTotal.toFixed(2)}
            step="0.01"
            bind:value={customAmount}
            on:input={onCustomAmountChange}
          />
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
          <span>EUR {(pendingTotal - customAmount).toFixed(2)}</span>
        </div>
      {/if}
    </div>
    <div class="actions">
      <button class="remove-btn" on:click={goToOrder}>Eliminar división</button>
      <button class="confirm-btn" on:click={confirmPayment}
        disabled={mode === 'custom' ? (customAmount < 0.50 || !!customError) : totalSelected <= 0} >
        {mode === 'split-items' ? 'Confirmar división' : 'Confirmar cantidad'}
      </button>
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
    .info {
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
    .pending-per-item {
      display: block;
      font-size: 0.85rem;
      color: #92400e;
      margin-top: 0.2rem;
    }
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
    .line.subline {
      font-weight: normal;
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
    .error {
      background-color: #fde2e2;
      color: #b91c1c;
      padding: 0.75rem 1rem;
      border: 1px solid #f5c2c7;
      border-radius: 0.375rem;
      margin: 0.5rem auto 1rem;      
      max-width: 400px;              
      text-align: center;
    }

  </style>
  