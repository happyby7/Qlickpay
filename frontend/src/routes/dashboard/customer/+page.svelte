<script lang="ts">
    import { goto } from "$app/navigation";
    import { page } from "$app/stores";

    $: user = $page.data.user;
    $: restaurantId = $page.data.restaurantId;
    $: tableId = $page.data.tableId;
    $: hasQRParams = $page.data.hasQRParams;

    function goToMenu() {
        let storedRestaurantId = restaurantId || sessionStorage.getItem("restaurantId") || "";
        let storedTableId = tableId || sessionStorage.getItem("tableId") || "";

        goto(`/menu?restaurantId=${storedRestaurantId}&tableId=${storedTableId}`);
    }

    function goToOrder() {
        let storedRestaurantId = restaurantId || sessionStorage.getItem("restaurantId") || "";
        let storedTableId = tableId || sessionStorage.getItem("tableId") || "";

        goto(`/order?restaurantId=${storedRestaurantId}&tableId=${storedTableId}`);
    }

    function goToRestaurant() {
        goto(`/restaurants`);
    }
</script>

<div class="dashboard-container">
    <h1>Dashboard del Cliente</h1>
    {#if hasQRParams}
        <p>Bienvenido {user.name}, estás en la mesa {tableId || "No asignada"} del restaurante {restaurantId || "No asignado"}.</p>
        <button on:click={goToMenu}>📜 Ver Carta y Pedir</button>
        <button on:click={goToOrder}>💳 Pagar la Cuenta</button>
    {:else}
        <p>Bienvenido {user.name}, explora nuestros restaurantes antes de llegar.</p>
        <button on:click={goToRestaurant}>🍽️ Explorar Restaurantes</button>
        <p style="color: gray;">Para pedir o pagar, escanea un código QR en el restaurante.</p>
    {/if}
</div>

<style>
    .dashboard-container {
        padding: 2rem;
        max-width: 600px;
        margin: 0 auto;
        text-align: center;
    }

    button {
        display: block;
        width: 100%;
        margin-top: 1rem;
        padding: 1rem;
        font-size: 1rem;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        background-color: #007BFF;
        color: white;
    }

    button:hover {
        background-color: #0056b3;
    }
</style>
