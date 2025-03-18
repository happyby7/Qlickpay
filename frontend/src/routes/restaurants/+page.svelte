<script lang="ts">
    import { fetchRestaurants } from "$lib/restaurant";
    import type { Restaurant } from "$lib/types";
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";


    let restaurants: Restaurant[] = [];
    let error = "";

    async function loadRestaurants() {
        try {
            const response = await fetchRestaurants();
            restaurants = response.restaurants;
        } catch (err) {
            error = "Error al cargar los restaurantes.";
        }
    }

    onMount(() => {
        loadRestaurants();
    });

    function goToMenu(restaurantId: number) {
        goto(`/menu?restaurantId=${restaurantId}`);
    }
</script>

<div class="restaurants-container">
    <h1>Restaurantes Disponibles</h1>

    {#if error}
        <p style="color: red;">{error}</p>
    {:else if restaurants.length === 0}
        <p>No hay restaurantes disponibles.</p>
    {:else}
        <ul>
            {#each restaurants as restaurant}
                <li>
                    <h3>{restaurant.name}</h3>
                    <button on:click={() => goToMenu(restaurant.id)}>Ver Menú</button>
                </li>
            {/each}
        </ul>
    {/if}
</div>

<style>
    .restaurants-container {
        padding: 2rem;
        max-width: 600px;
        margin: 0 auto;
        text-align: center;
    }

    ul {
        list-style: none;
        padding: 0;
    }

    li {
        margin-bottom: 1rem;
        padding: 1rem;
        border: 1px solid #ddd;
        border-radius: 8px;
    }

    button {
        padding: 0.5rem 1rem;
        cursor: pointer;
        background-color: #007BFF;
        color: white;
        border: none;
        border-radius: 5px;
        transition: background 0.3s;
    }
</style>