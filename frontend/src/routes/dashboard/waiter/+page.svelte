<script lang="ts">
    import { onMount } from 'svelte';
    import { fetchTables, changeTableStatus } from '$lib/waiter';
    import { fetchBill } from '$lib/qr';
    import { connectWebSocket, newOrders } from '$lib/storeWebSocket';
    import { page } from "$app/stores";
    import type { Table } from "$lib/types";
    
    let restaurantId = Number($page.data.restaurantId);
    let tables: Table[] = [];
    let selectedTableId: number | null = null;
    let bill: { items: { quantity: number, name: string, subtotal: number }[], total_price: number } | null = null;
    let loadingBill = false;
    let errorBill = "";
    
    async function loadTables() {
      if (!restaurantId) return;
      try {
        tables = await fetchTables(restaurantId);
      } catch (error) {
        console.error("❌ Error al cargar mesas:", error);
      }
    }
    
    async function loadBill(tableId: number) {
      if (!restaurantId || !tableId) return;
      loadingBill = true;
      errorBill = "";
      try {
        bill = await fetchBill(String(restaurantId), String(tableId));
      } catch (error) {
        console.error("❌ Error al cargar la cuenta:", error);
        errorBill = "Error al conectar con el servidor.";
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
    }
    
    function closeOrderDetails() {
      selectedTableId = null;
      bill = null;
    }
    
    onMount(() => {
      connectWebSocket(); 
      loadTables();
    });
  </script>
  
  {#if restaurantId}
    <h1>Dashboard de Mesero</h1>
    <div class="grid">
        {#each tables as table}
            <div class="table"
                 class:available={table.status === 'available'} 
                 class:occupied={table.status === 'occupied'}
                 class:paid={table.status === 'paid'}
                 on:click={() => openOrderDetails(table.id)}
                 role="button"
                 tabindex="0"
                 on:keydown={(e) => (e.key === "Enter" || e.key === " ") && openOrderDetails(table.id)}>
  
                <span>Mesa {table.table_number}</span>
  
                {#if $newOrders[table.id]}
                    <span class="order-count">🔴 {$newOrders[table.id]}</span>
                {/if}
  
                {#if table.status === 'paid'}
                    <button on:click={() => changeTableStatus(table.id, 'available')}>
                        Resetear Mesa
                    </button>
                {/if}
            </div> 
        {/each}
    </div>
  {:else}
    <p class="error">No tienes un restaurante asignado.</p>
  {/if}
  
  {#if selectedTableId !== null}
    <div class="order-details">
        <h2>Detalles de la Mesa {selectedTableId}</h2>
        <button class="close-btn" on:click={closeOrderDetails}>Cerrar</button>
  
        {#if loadingBill}
            <p class="info">Cargando pedidos...</p>
        {:else if errorBill}
            <p class="error">{errorBill}</p>
        {:else if bill}
            <ul>
                {#each bill.items as item}
                    <li>{item.quantity}x {item.name} - ${item.subtotal.toFixed(2)}</li>
                {/each}
            </ul>
            <h3>Total: ${bill.total_price.toFixed(2)}</h3>
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
  </style>
  