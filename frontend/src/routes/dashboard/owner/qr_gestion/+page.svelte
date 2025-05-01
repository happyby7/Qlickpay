<script lang="ts">
    import { generateQRCodes } from "$lib/qr";
    import type { PageData } from './$types';

    export let data: PageData;
    const { restaurantId } = data;

    let tableCount: number = 1;
    let qrCodes: string[] = [];
    let errorMessage: string = "";

    async function generateQR() {
        if (!restaurantId) {
            errorMessage = "No tienes un restaurante asignado.";
            return;
        }

        if (tableCount < 1) {
            errorMessage = "El número de mesas debe ser mayor a 0.";
            return;
        }

        errorMessage = "";
        const response = await generateQRCodes(restaurantId, tableCount);
        
        if (response) {
            qrCodes = response;
        } else {
            errorMessage = "Hubo un error generando los QR.";
        }
    }
</script>

<div class="qr-container">
    <h2>Generar Códigos QR</h2>

    {#if restaurantId}
        <label for="tables">Número de Mesas:</label>
        <input id="tables" type="number" bind:value={tableCount} min="1" />

        <button on:click={generateQR}>Generar QR</button>

        {#if errorMessage}
            <p class="error">{errorMessage}</p>
        {/if}

        {#if qrCodes.length}
            <h3>Códigos QR Generados</h3>
            <ul>
                {#each qrCodes as qr}
                    <li>
                        <img src={qr} alt="Código QR de la mesa" />
                    </li>
                {/each}
            </ul>
        {/if}
    {:else}
        <p class="error">No tienes un restaurante asignado.</p>
    {/if}
</div>

<style>
    .qr-container {
        text-align: center;
        padding: 20px;
    }

    input {
        margin: 10px;
        padding: 8px;
        font-size: 1rem;
    }

    button {
        padding: 10px 15px;
        font-size: 1rem;
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
        margin-top: 10px;
    }

    img {
        width: 150px;
        margin: 10px;
    }
</style>
