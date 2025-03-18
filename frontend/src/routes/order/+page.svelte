<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { page } from "$app/stores";
  import { fetchBill } from "$lib/qr";

  let bill: { items: { quantity: number, name: string, subtotal: number }[], total_price: number } | null = null;
  let loading = true;
  let error = "";
  let restaurantId: string | null = null;
  let tableId: string | null = null;
  let socket: WebSocket | null = null;

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

  onMount(() => {
      loadBill();

      /*
      restaurantId = paramRestaurantId;
      tableId = paramTableId;

      if (!restaurantId || !tableId) {
          console.warn("⚠️ No hay restaurantId o tableId, no se conectará al WebSocket.");
          return;
      }

      if (!socket) {
          const wsProtocol = location.protocol === "https:" ? "wss://" : "ws://";
          const wsUrl = `${wsProtocol}localhost:5001`;

          socket = new WebSocket(wsUrl);

          socket.addEventListener("open", () => console.log("📡 WebSocket conectado."));

          socket.addEventListener("message", (event) => {
              console.log("📩 Mensaje recibido por WebSocket:", event.data);
              const data = JSON.parse(event.data);

              if (data.event === "orderUpdated" && data.tableId === tableId) {
                  console.log("🔄 Pedido actualizado, recargando cuenta...");
                  loadBill();
              }
          });

          socket.addEventListener("close", () => {
              console.log("❌ WebSocket desconectado.");
              socket = null;
          });

          socket.addEventListener("error", (event) => {
              console.error("⚠️ Error en WebSocket:", event);
          });
      }
      */
  });

  /*
  onDestroy(() => {
      if (socket) {
          console.log("🔌 Cerrando WebSocket...");
          socket.close();
          socket = null;
      }
     
  });
   */

</script>

{#if restaurantId && tableId}
  <h1>Cuenta de la Mesa {tableId}</h1>

  {#if loading}
    <p class="info">Cargando cuenta...</p>
  {:else if error}
    <p class="error">{error}</p>
  {:else if bill}
    <ul>
      {#each bill.items as item}
        <li>{item.quantity}x {item.name} - ${item.subtotal.toFixed(2)}</li>
      {/each}
    </ul>
    <h2>Total: ${bill.total_price.toFixed(2)}</h2>
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
</style>
