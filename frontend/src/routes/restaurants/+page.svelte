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
    
    function goToMenu(restaurantId: number, restaurantName: string) {
        goto(`/menu?restaurantId=${restaurantId}&restaurantName=${encodeURIComponent(restaurantName)}`);
    }
  </script>
  
  <div class="restaurants-container">
    <h1>Restaurantes Disponibles</h1>
    {#if error}
      <p class="error">{error}</p>
    {:else if restaurants.length === 0}
      <p class="empty">No hay restaurantes disponibles.</p>
    {:else}
      <ul class="restaurants-list">
        {#each restaurants as restaurant}
          <li class="restaurant-item">
            <h3 class="restaurant-name">{restaurant.name}</h3>
            <button on:click={() => goToMenu(restaurant.id, restaurant.name)}>Ver Menú</button>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
  
  <style>
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: "Segoe UI", Roboto, sans-serif;
    background: #fff;
    color: #333;
  }
  .restaurants-container {
    max-width: 500px;
    margin: 1rem auto;
    padding: 0.5rem;
    text-align: center;
  }
  .restaurants-list {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .restaurant-item {
    padding: 0.8rem 0;
    border-bottom: 1px solid #ccc;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
  .restaurant-name {
    font-size: 1rem;
    font-weight: 600;
    margin: 0;
  }
  button {
    padding: 0.5rem 1rem;
    cursor: pointer;
    background-color: #007BFF;
    color: #fff;
    border: none;
    border-radius: 5px;
    transition: background 0.3s;
  }

  button:hover {
    background-color: #0056b3;
  }
  .error {
    color: #721c24;
    background-color: #f8d7da;
    padding: 0.5rem;
    border-radius: 5px;
  }
  .empty {
    color: #888;
  }
  </style>
  