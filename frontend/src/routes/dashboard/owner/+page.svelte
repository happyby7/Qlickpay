<script lang="ts">
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";

    $: restaurantId = $page.data.restaurantId;

    function navigateTo(path: string) {
        goto(`${path}?restaurantId=${restaurantId}`);
    }

</script>

{#if restaurantId}
    <h1>Panel de Dueño de restaurante</h1>

    <div class="menu-container">
        <button on:click={() => navigateTo("/dashboard/owner/qr_gestion")}>Gestionar QR</button>
        <button on:click={() => navigateTo("/dashboard/owner/waiters_gestion")}>Gestionar Meseros</button>
        <button on:click={() => navigateTo("/dashboard/owner/menu_gestion")}>Gestionar Menús</button> 
    </div>
{:else}
    <p class="error">No tienes un restaurante asignado.</p>
{/if}

<style>
    .menu-container {
        display: flex;
        gap: 20px;
        justify-content: center;
        padding: 20px;
    }

    button {
        padding: 15px 20px;
        font-size: 1.2rem;
        background: #007BFF;
        color: white;
        border: none;
        cursor: pointer;
        border-radius: 5px;
        transition: background 0.3s;
    }

    button:hover {
        background: #0056b3;
    }

    .error {
        color: red;
        text-align: center;
        margin-top: 20px;
    }
</style>
