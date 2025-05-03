<script lang="ts">
    import { onMount } from "svelte";
    import { fetchWaiters, addWaiter, deleteWaiter } from "$lib/waiter";
    import type { PageData } from './$types';
    import type { Waiter } from "../../../../lib/types";
    
    export let data: PageData;
    const { restaurantId } = data;

    let waiters: Waiter[] = [];
    let fullName = "";
    let email = "";
    let phone = "";
    let password = "";
    let errorMessage = "";
    let successMessage = "";
    let deleteMessage = ""; 
    let showSuccess = false;
    let showDelete = false; 

    function isValidEmail(email: string) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); 
    }

    async function loadWaiters() {
        if (!restaurantId) return;
        waiters = await fetchWaiters(restaurantId);
    }

    async function registerWaiter() {
        if (!restaurantId || !fullName || !email || !phone || !password) {
            errorMessage = "Todos los campos son obligatorios.";
            return;
        }

        if (!isValidEmail(email)) {
            errorMessage = "El correo debe tener un formato válido";
            return;
        }

        const response = await addWaiter(restaurantId, fullName, email, phone, password);
        if (response.success) {
            loadWaiters();
            fullName = "";
            email = "";
            phone = "";
            password = "";
            errorMessage = "";
            
            successMessage = "Mesero registrado correctamente";
            showSuccess = true;
            setTimeout(() => showSuccess = false, 2000);
        } else {
            errorMessage = response.message;
        }
    }

    async function removeWaiter(waiterId: number, fullName: string) {
        await deleteWaiter(waiterId);
        loadWaiters();

        deleteMessage = `Mesero ${fullName} eliminado`;
        showDelete = true;
        setTimeout(() => showDelete = false, 2000);
    }

    onMount(loadWaiters);
</script>

<h1>Gestión de Meseros</h1>

{#if showSuccess}
    <div class="success-message">{successMessage}</div>
{/if}

{#if showDelete}
    <div class="delete-message">{deleteMessage}</div>
{/if}

<div class="form-container">
    <h2>Registrar Mesero</h2>
    <input type="text" placeholder="Nombre Completo" bind:value={fullName} />
    <input type="email" placeholder="Correo Electrónico" bind:value={email} />
    <input type="tel" placeholder="Teléfono" bind:value={phone} />
    <input type="password" placeholder="Contraseña" bind:value={password} />
    <button on:click={registerWaiter}>➕ Agregar Mesero</button>
    {#if errorMessage}
        <p class="error">{errorMessage}</p>
    {/if}
</div>

<h2>Meseros Registrados</h2>
<ul>
    {#if waiters.length === 0}
        <p class="info">No hay meseros registrados aún.</p>
    {:else}
        {#each waiters as waiter}
            <li>
                {waiter.full_name} - {waiter.email}
                <button class="delete-btn" on:click={() => removeWaiter(waiter.id, waiter.full_name)}>Eliminar</button>
            </li>
        {/each}
    {/if}
</ul>

<style>
    .form-container {
        text-align: center;
        padding: 20px;
    }

    input {
        display: block;
        margin: 10px auto;
        padding: 8px;
        font-size: 1rem;
    }

    button {
        padding: 10px;
        font-size: 1rem;
        background: #007BFF;
        color: white;
        border: none;
        cursor: pointer;
        border-radius: 5px;
    }

    button:hover {
        background: #0056b3;
    }

    .delete-btn {
        background: red;
    }

    .error {
        color: red;
        margin-top: 10px;
    }

    .info {
        color: #666;
        text-align: center;
        font-size: 1rem;
    }

    .success-message {
        position: fixed;
        top: 20%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #d4edda;
        color: #155724;
        padding: 15px;
        border-radius: 5px;
        font-size: 1.2rem;
        font-weight: bold;
        text-align: center;
        box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
        animation: fadeOut 2s ease-in-out forwards;
    }

    .delete-message {
        position: fixed;
        top: 30%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #f8d7da;
        color: #721c24;
        padding: 15px;
        border-radius: 5px;
        font-size: 1.2rem;
        font-weight: bold;
        text-align: center;
        box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
        animation: fadeOut 2s ease-in-out forwards;
    }

    @keyframes fadeOut {
        0% { opacity: 1; }
        90% { opacity: 1; }
        100% { opacity: 0; }
    }
</style>
