<script lang="ts">
    import { onMount } from "svelte";
    import { fetchMenu, addMenuItem, deleteMenuItem } from "$lib/menu";
    import type { PageData } from './$types';
    import type { MenuItem } from "../../../../lib/types";

    export let data: PageData;
    const { restaurantId } = data;

    let menuItems: MenuItem[] = [];
    let name = "";
    let description = "";
    let price = "";
    let category = "";
    let errorMessage = "";
    let successMessage = "";
    let showSuccess = false;

    async function loadMenu() {
        try {
          const response = await fetchMenu(String(restaurantId));
          menuItems = response.menuItems;
        } catch (e) {
            console.error(e);
        }
    }

    async function registerMenuItem() {
        if (!restaurantId || !name || !description || !price || !category) {
            errorMessage = "Todos los campos son obligatorios.";
            return;
        }

        const response = await addMenuItem(Number(restaurantId), name, description, parseFloat(price), category);
        if (response.success) {
            loadMenu();
            name = "";
            description = "";
            price = "";
            category = "";
            errorMessage = "";

            successMessage = "✅ Platillo agregado correctamente";
            showSuccess = true;
            setTimeout(() => showSuccess = false, 2000);
        } else {
            errorMessage = response.message;
        }
    }

    async function removeMenuItem(itemId: number) {
        await deleteMenuItem(itemId);
        loadMenu();
    }

    onMount(loadMenu);
</script>

<h1>Gestión de Menús</h1>

{#if showSuccess}
    <div class="success-message">{successMessage}</div>
{/if}

<div class="form-container">
    <h2>Agregar Platillo</h2>
    <input type="text" placeholder="Nombre" bind:value={name} />
    <input type="text" placeholder="Descripción" bind:value={description} />
    <input type="number" placeholder="Precio" bind:value={price} min="0" step="0.01" />
    <input type="text" placeholder="Categoría" bind:value={category} />
    <button on:click={registerMenuItem}>➕ Agregar Platillo</button>
    {#if errorMessage}
        <p class="error">{errorMessage}</p>
    {/if}
</div>

<h2>Menú del Restaurante</h2>
<ul>
    {#if menuItems.length === 0}
        <p class="info">No hay platillos registrados aún.</p>
    {:else}
        {#each menuItems as item}
            <li>
                {item.name} - {item.description} - {Number(item.price).toFixed(2)} € ({item.category})
                <button class="delete-btn" on:click={() => removeMenuItem(item.id)}>Eliminar</button>
            </li>
        {/each}
    {/if}
</ul>
