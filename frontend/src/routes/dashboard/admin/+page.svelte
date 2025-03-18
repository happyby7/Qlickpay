<script lang="ts">
  import { registerOwner } from "$lib/admin";

    let full_name = "";
    let email = "";
    let phone = "";
    let password = "";
    let restaurant_name = "";
    let successMessage = "";
    let errorMessage = "";

    async function handleRegister() {
        successMessage = "";
        errorMessage = "";

        if (!full_name || !email || !phone || !password || !restaurant_name) {
            errorMessage = "Todos los campos son obligatorios.";
            return;
        }

        try {
            const response = await registerOwner(full_name, email, phone, password, restaurant_name);
            if (response.success) {
                successMessage = `Dueño registrado con éxito. Restaurante: `+ restaurant_name +'.';
                full_name = "";
                email = "";
                phone = "";
                password = "";
                restaurant_name = "";
            } else {
                errorMessage = response.message || "Error en el registro.";
            }
        } catch (error) {
            errorMessage = "Hubo un problema con la solicitud.";
        }
    }
</script>

<div class="admin-container">
  <h2>Panel del Administrador</h2>
  
  <h3>Registrar Nuevo Dueño</h3>
  <form on:submit|preventDefault={handleRegister}>
    <input type="text" bind:value={full_name} placeholder="Nombre Completo" required />
    <input type="email" bind:value={email} placeholder="Correo" required />
    <input type="text" bind:value={phone} placeholder="Teléfono" required />
    <input type="password" bind:value={password} placeholder="Contraseña" required />
    <input type="text" bind:value={restaurant_name} placeholder="Nombre del Restaurante" required />
    <button type="submit">Registrar Dueño</button>
  </form>

  {#if successMessage}
      <p class="success-text">{successMessage}</p>
  {/if}

  {#if errorMessage}
      <p class="error-text">{errorMessage}</p>
  {/if}
</div>

<style>
  .admin-container {
      max-width: 500px;
      margin: 50px auto;
      padding: 30px;
      border-radius: 10px;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
      background: white;
      text-align: center;
      font-family: "Inter", sans-serif;
  }

  h2, h3 {
      color: #333;
      margin-bottom: 15px;
  }

  input {
      width: 100%;
      padding: 10px;
      margin: 10px 0;
      border: 1px solid #ccc;
      border-radius: 5px;
      font-size: 1rem;
      transition: border 0.2s ease-in-out;
  }

  input:focus {
      outline: none;
      border: 1px solid #007BFF;
      box-shadow: 0 0 5px rgba(0, 123, 255, 0.3);
  }

  button {
      width: 100%;
      padding: 12px;
      background: #007BFF;
      color: white;
      border: none;
      border-radius: 5px;
      font-size: 1rem;
      cursor: pointer;
      transition: background 0.3s ease-in-out;
  }

  button:hover {
      background: #0056b3;
  }

  .success-text {
      color: #4F8A10;
      background: #DFF2BF;
      padding: 8px;
      border-radius: 6px;
      margin-top: 10px;
  }

  .error-text {
      color: #D8000C;
      background: #FFD2D2;
      padding: 8px;
      border-radius: 6px;
      margin-top: 10px;
  }
</style>
