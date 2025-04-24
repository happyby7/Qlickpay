<script lang="ts">
  import { onMount } from 'svelte';
  import { fetchTables, changeTableStatus, updateOrderItem } from '$lib/waiter';
  import { fetchBill, fetchBillPaid } from '$lib/qr';
  import { connectWebSocket, newOrders, tableStatuses } from '$lib/storeWebSocket';
  import { page } from "$app/stores";
  import type { Table, Bill } from "$lib/types";
  import { generateSessionTokenTable, clearTable } from '$lib/waiter';

  $: pendingTotal = bill ? bill.items.reduce((sum, it) => sum + it.subtotal, 0): 0;
  $: paidTotal = paidBill ? paidBill.items.reduce((sum, it) => sum + it.subtotal, 0): 0;
    
  let restaurantId = Number($page.data.restaurantId);
  let tables: Table[] = [];
  let selectedTableId: number | null = null;

  let bill: Bill | null = null;
  let paidBill: Bill | null = null;

  let loadingBill = false;
  let errorBill = "";

  let editing = false;
  let removals: Record<number, string> = {};

  let confirmRemoval: Record<number, boolean> = {};
  let confirmDeactivate = false;
  let removalErrors: Record<number, string> = {};
    
  async function loadTables() {
    if (!restaurantId) return;
    try {
      tables = await fetchTables(restaurantId);
      tableStatuses.set(
       tables.reduce((acc, t) => {
         acc[t.id] = t.status;
         return acc;
       }, {} as Record<number, string>)
     );
    } catch (error) {
      console.error("❌ Error al cargar mesas:", error);
    }
  }
    
  async function loadBill(tableId: number) {
    if (!restaurantId || !tableId) return;
    loadingBill = true;
    errorBill = "";
    try {
      const [fetchedBill, fetchedPaid] = await Promise.all([
        fetchBill(String(restaurantId), String(tableId)),
        fetchBillPaid(String(restaurantId), String(tableId))
      ])
      if (!fetchedBill) {
        errorBill = "No se pudo cargar la cuenta.";
        bill = null;
      } else {
        bill = fetchedBill;
        paidBill = fetchedPaid;
      }
    } catch (error) {
      console.error("❌ Error al cargar la cuenta:", error);
      errorBill = "Error al conectar con el servidor.";
      bill = null;
    } finally {
      loadingBill = false;
    }
  }
    
  function openOrderDetails(tableId: number) {
    selectedTableId = tableId;
    loadBill(tableId);

    newOrders.update(counts => {
      delete counts[tableId];
      return { ...counts };
    });

    editing = false;
    removals = {};
    confirmRemoval = {};
    removalErrors = {};
  }
    
  function startEditing() {
    editing = true;
    if (bill) {
      bill.items.forEach((_, index) => {
        removals[index] = "cantidad";
      });
    }
  }

  function stopEditing() {
    editing = false;
    removals = {};
    confirmRemoval = {};
    removalErrors = {};
  }

  function initiateRemoval(index: number) {
    if (!bill) return;
    const quantityToRemove = Number(removals[index]);
    const item = bill.items[index];
    if (!item) return;
    if (!quantityToRemove || isNaN(quantityToRemove) || quantityToRemove < 1) {
      removalErrors[index] = "Ingrese un número válido mayor que 0.";
      return;
    }
    if (quantityToRemove > item.quantity) {
      removalErrors[index] = "La cantidad a eliminar no puede exceder la cantidad actual.";
      return;
    }
    removalErrors[index] = "";
    confirmRemoval[index] = true;
  }
  
  async function confirmRemovalFunc(index: number) {
    if (!bill) return;
    const removalQty = Number(removals[index]);
    const item = bill.items[index];
    if (!item) return;
    if (!removalQty || isNaN(removalQty) || removalQty < 1) {
      removalErrors[index] = "Ingrese un número válido mayor que 0.";
      return;
    }
    if (removalQty > item.quantity) {
      removalErrors[index] = "La cantidad a eliminar no puede exceder la cantidad actual.";
      return;
    }
    try {
      await updateOrderItem(String(restaurantId), String(selectedTableId), item.name, removalQty);
    } catch (error) {
      console.error("Error updating order item in backend:", error);
      removalErrors[index] = "Error actualizando en el servidor.";
      return;
    }
    const newQuantity = item.quantity - removalQty;
    const pricePerUnit = item.quantity > 0 ? item.subtotal / item.quantity : 0;
    if (newQuantity > 0) {
      item.quantity = newQuantity;
      item.subtotal = pricePerUnit * newQuantity;
    } else {
      bill.items.splice(index, 1);
    }
    bill.total_price = bill.items.reduce((acc, curr) => acc + curr.subtotal, 0);
    
    removals[index] = "cantidad";
    confirmRemoval[index] = false;
    removalErrors[index] = "";
    bill = { ...bill };
  }

  function cancelRemoval(index: number) {
      confirmRemoval[index] = false;
      removalErrors[index] = "";
      removals[index] = "cantidad";
  }

  function closeOrderDetails() {
      selectedTableId = null;
      bill = null;
      editing = false;
      removals = {};
      confirmRemoval = {};
      removalErrors = {};
  }

  function cancelDeactivate() {
    confirmDeactivate = false;
  }

  function confirmDeactivateTable() {
    confirmDeactivate = false;
    handleResetTable();
  }

  async function handleActivateTable() {
      if (!selectedTableId) return;
      await changeTableStatus(selectedTableId, 'occupied');
      await generateSessionTokenTable(String(restaurantId), String(selectedTableId));
  }

  async function handleResetTable() {
      if (!selectedTableId) return;
      await clearTable(selectedTableId, restaurantId);
      sessionStorage.removeItem("session_token");
      await changeTableStatus(selectedTableId, 'available');
      closeOrderDetails();
  }
      
  onMount(() => {
      loadTables()
        .then(() => { connectWebSocket();})
        .catch(console.error);
  });

</script>

{#if restaurantId}
  <h1>Dashboard de Mesero</h1>
  <div class="grid">
    {#each tables.sort((a, b) => a.table_number - b.table_number) as table}
      <div class="table { $tableStatuses[table.id] ? $tableStatuses[table.id] : table.status }"
           class:available={($tableStatuses[table.id] ? $tableStatuses[table.id] : table.status) === 'available'} 
           class:occupied={($tableStatuses[table.id] ? $tableStatuses[table.id] : table.status) === 'occupied'}
           class:paid={($tableStatuses[table.id] ? $tableStatuses[table.id] : table.status) === 'paid'}
           on:click={() => openOrderDetails(table.id)}
           role="button"
           tabindex="0"
           on:keydown={(e) => (e.key === "Enter" || e.key === " ") && openOrderDetails(table.id)}>
        <span>Mesa {table.table_number}</span>
        {#if $newOrders[table.id]}
          <span class="order-count">{$newOrders[table.id]}</span>
        {/if}
      </div> 
    {/each}
  </div>
{:else}
  <p class="error">No tienes un restaurante asignado.</p>
{/if}
{#if selectedTableId !== null}
  <div class="order-details">
    <h2>Detalles de la Mesa {tables.find(t => t.id === selectedTableId)?.table_number}</h2>
    <button class="close-btn" on:click={closeOrderDetails}>Cerrar</button>

    {#if loadingBill}
      <p class="info">Cargando pedidos...</p>
    {:else if errorBill}
      <p class="error">{errorBill}</p>
    {:else if bill}
      {#if ($tableStatuses[selectedTableId] ?? tables.find(t => t.id === selectedTableId)?.status) === 'available'}
        <p class="info">Para ver los detalles de la mesa es necesario activarla.</p>
        <button class="modify-order-btn" on:click={handleActivateTable}>Activar mesa</button>
      {:else}
        <!-- PEDIDOS PENDIENTES -->
        <h3>Pedidos pendientes</h3>
        {#if bill.items.length > 0}
          <ul>
            {#each bill.items as item, index}
              <li>{item.quantity}x {item.name} - {item.subtotal.toFixed(2)}€
                {#if editing}
                  <div class="modify-controls">
                    <input
                      type="text"
                      readonly
                      bind:value={removals[index]}
                      placeholder="cantidad"
                      class={removals[index] === 'cantidad' ? 'default' : ''}
                      on:focus={(e) => {
                        const target = e.target as HTMLInputElement;
                        target.removeAttribute('readonly');
                        if (target.value === 'cantidad') {
                          target.value = '';
                          removals[index] = '';
                        }
                      }}
                    />
                    <button on:click={() => initiateRemoval(index)}>Eliminar</button>
                  </div>
                  {#if confirmRemoval[index]}
                    <div class="confirm-removal">
                      ¿Confirmar eliminar {removals[index]} de {item.name}?
                      <button on:click={() => confirmRemovalFunc(index)}>Confirmar</button>
                      <button on:click={() => cancelRemoval(index)}>Cancelar</button>
                      {#if removalErrors[index]}
                        <p class="error">{removalErrors[index]}</p>
                      {/if}
                    </div>
                  {/if}
                {/if}
              </li>
            {/each}
          </ul>
          <h4>Total pendiente: {pendingTotal.toFixed(2)}€</h4>
        {:else}
          <p>No hay pedidos pendientes.</p>
        {/if}

        <!-- PEDIDOS PAGADOS -->
        <h3>Pedidos pagados</h3>
        {#if paidBill && paidBill.items.length > 0}
          <ul>
            {#each paidBill.items as item}
              <li>{item.quantity}x {item.name} - {item.subtotal.toFixed(2)}€</li>
            {/each}
          </ul>
          <h4>Total pagado: {paidTotal.toFixed(2)}€</h4>
        {:else}
          <p>No hay pedidos pagados.</p>
        {/if}

        <!-- Botones finales -->
        {#if ($tableStatuses[selectedTableId] ?? tables.find(t => t.id === selectedTableId)?.status) !== 'paid'}
          {#if bill.items.length === 0 || (!paidBill || paidBill.items.length === 0)}
            {#if !confirmDeactivate}
              <button class="deactivate-btn" on:click={() => confirmDeactivate = true}>Desactivar mesa</button>
            {:else}
              <div class="confirm-removal">¿Estás seguro de desactivar la mesa?
                <button class="cancel-btn" on:click={cancelDeactivate}>Cancelar</button>
                <button class="confirm-btn" on:click={confirmDeactivateTable}>Sí, desactivar</button>
              </div>
            {/if}
          {/if}
        {/if}

        {#if ($tableStatuses[selectedTableId] ?? tables.find(t => t.id === selectedTableId)?.status) === 'paid'}
          <button class="reset-btn" on:click={handleResetTable}>Confirmar mesa (resetear)</button>
        {/if}

        {#if bill.items.length > 0}
          {#if !editing}
            <button class="modify-order-btn" on:click={startEditing}>
              Modificar pedido
            </button>
          {:else}
            <button class="cancel-edit-btn" on:click={stopEditing}>
              Salir de edición
            </button>
          {/if}
        {/if}
      {/if}
    {/if}
  </div>
{/if}

<style>
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 10px;
  }
  .table {
    position: relative;
    width: 100px;
    height: 100px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    font-weight: bold;
    cursor: pointer;
    transition: background 0.3s ease;
    border: none;
  }
  .available { background-color: gray; }
  .occupied { background-color: blue; }
  .paid { background-color: green; }
  .order-count {
    position: absolute;
    top: 5px;
    right: 5px;
    background: red;
    color: white;
    border-radius: 50%;
    padding: 5px;
    font-size: 14px;
    font-weight: bold;
  }
  button {
    margin-top: 5px;
    padding: 5px;
    background: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
  }
  .order-details {
    position: fixed;
    top: 0;
    right: 0;
    width: 300px;
    height: 100%;
    background: white;
    border-left: 2px solid #ccc;
    padding: 20px;
    box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
    overflow-y: auto;
    transition: transform 0.3s ease-in-out;
  }
  .close-btn {
    background: red;
    color: white;
    border: none;
    padding: 5px 10px;
    cursor: pointer;
    position: absolute;
    top: 10px;
    right: 10px;
  }
  .modify-controls {
    margin-top: 5px;
  }
  .modify-controls input {
    width: 70px;
    margin-right: 5px;
  }
  .modify-controls input.default {
    color: lightgray;
  }
  .confirm-removal {
    margin-top: 5px;
    background: #f9f9f9;
    border: 1px solid #ccc;
    padding: 5px;
    border-radius: 5px;
  }
  .modify-order-btn,
  .cancel-edit-btn,
  .modify-controls button,
  .confirm-removal button {
    padding: 8px 12px;
    background: #007BFF;
    color: white;
    border: 1px solid #007BFF;
    border-radius: 4px;
    margin-right: 5px;
  }
  .reset-btn {
    margin-top: 10px;
    background: #10b981;
    color: white;
    border: none;
    padding: 8px 12px;
    border-radius: 5px; 
    cursor: pointer;
    font-weight: bold;
  }
  .error {
    color: red;
    font-size: 0.9em;
  }
  .deactivate-btn {
    margin: 0.5rem 0;
    background: #f59e0b;
    color: white;
    border: none;
    padding: 8px 12px;
    border-radius: 5px;
    cursor: pointer;
  }
  .deactivate-btn:hover {
   background: #d97706;
  }

</style>
