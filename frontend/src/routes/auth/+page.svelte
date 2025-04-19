<script lang="ts">
  import { goto } from "$app/navigation";
  import { login, register } from "$lib/auth";
  import { page } from "$app/stores"; 
  import { onMount } from "svelte";

  export let isRegistering: boolean;
  export let restaurantId: string;
  export let tableId: string;

  let email = "";
  let password = "";
  let full_name = "";
  let passwordConfirm = "";
  let error = "";
  let successMessage = "";
  let jwtExpiredMessage = "";

  $: isRegistering = $page.url.searchParams.get("register") === "true";
  $: sessionExpired = $page.url.searchParams.get('sessionExpired') === 'true';

  onMount(() => {
    window.addEventListener('pageshow', (event) => {
      if (event.persisted) {
         location.reload();
      }
    }); 

    const url = new URL(window.location.href);
    const qsRestaurantId = url.searchParams.get("restaurantId") || "";
    const qsTableId = url.searchParams.get("tableId") || "";

    if (qsRestaurantId && qsTableId) {
      sessionStorage.setItem("restaurantId", qsRestaurantId);
      sessionStorage.setItem("tableId", qsTableId);
      restaurantId = qsRestaurantId;
      tableId = qsTableId;
    } else {
      restaurantId = sessionStorage.getItem("restaurantId") || "";
      tableId = sessionStorage.getItem("tableId") || "";
    }

    if (sessionExpired) {
     jwtExpiredMessage = "Tu sesión ha expirado. Por favor, inicia sesión de nuevo.";
    }
  });

  const handleLogin = async () => {
      error = "";
      successMessage = "";
      try {
          const response = await login(email, password);
          
          if (!response || !response.role) {
              throw new Error("No se recibió un rol válido.");
          }

          successMessage = "Inicio de sesión exitoso. Redirigiendo...";

          setTimeout(() => {
              if (response.role === "customer" && restaurantId && tableId) {
                  goto(`/dashboard/customer?restaurantId=${restaurantId}&tableId=${tableId}`);
              } else {
                  goto(`/dashboard/${response.role}`);
              }
          }, 1000);
      } catch (e) {
          console.error(e);
          error = "Credenciales incorrectas";
      }
  };

  const handleRegister = async () => {
    error = "";
    successMessage = "";
    
    if (password !== passwordConfirm) {
        error = "Las contraseñas no coinciden";
        return;
    }

    try {
        const response = await register(full_name, email, password);
        
        if (response.success) {
            successMessage = "¡Registro exitoso! Ahora inicia sesión en QlickPay.";
            setTimeout(() => goto("/"), 1000); 
        } else {
            error = response.message || "Error en el registro.";
        }
    } catch (e) {
        console.error(e);
        error = "Error en el registro";
    }
  };


  const switchToLogin = () => {
    isRegistering = false;
    successMessage = "";

    let storedRestaurantId = restaurantId || sessionStorage.getItem("restaurantId") || "";
    let storedTableId = tableId || sessionStorage.getItem("tableId") || "";

    if (storedRestaurantId && storedTableId) {
        goto(`/auth?restaurantId=${storedRestaurantId}&tableId=${storedTableId}`, { replaceState: true });
    } else {
        goto("/auth", { replaceState: true });
    }
};

const switchToRegister = () => {
    isRegistering = true;
    successMessage = "";

    let storedRestaurantId = restaurantId || sessionStorage.getItem("restaurantId") || "";
    let storedTableId = tableId || sessionStorage.getItem("tableId") || "";

    if (storedRestaurantId && storedTableId) {
        goto(`/auth?register=true&restaurantId=${storedRestaurantId}&tableId=${storedTableId}`, { replaceState: true });
    } else {
        goto("/auth?register=true", { replaceState: true });
    }
};

</script>

<div class="auth-container">
  {#if jwtExpiredMessage}
      <p class="success-text session-expired">{jwtExpiredMessage}</p>
  {/if}
  {#if successMessage}
      <p class="success-text">{successMessage}</p>
  {/if}

  {#if error}
      <p class="error-text">{error}</p>
  {/if}

  {#if isRegistering}
      <h2>Registro</h2>
      <form on:submit|preventDefault={handleRegister}>
          <input type="text" bind:value={full_name} placeholder="Nombre Completo" required />
          <input type="email" bind:value={email} placeholder="Correo" required />
          <input type="password" bind:value={password} placeholder="Contraseña" required />
          <input type="password" bind:value={passwordConfirm} placeholder="Confirmar Contraseña" required />
          <button type="submit">Registrarse</button>
          <p class="toggle-text">
              ¿Ya tienes cuenta?
              <button type="button" on:click={switchToLogin} class="link-button">Iniciar sesión</button>
          </p>
      </form>
  {:else}
      <h2>Iniciar Sesión</h2>
      <form on:submit|preventDefault={handleLogin}>
          <input type="email" bind:value={email} placeholder="Correo" required />
          <input type="password" bind:value={password} placeholder="Contraseña" required />
          <button type="submit">Iniciar Sesión</button>
          <p class="toggle-text">
              ¿No tienes cuenta?
              <button type="button" on:click={switchToRegister} class="link-button">Regístrate</button>
          </p>
      </form>
  {/if}
</div>

<style>
    .auth-container {
        max-width: 400px;
        margin: 60px auto;
        padding: 30px;
        border-radius: 12px;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
        background: white;
        text-align: center;
        font-family: "Inter", sans-serif;
        transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
    }
  
    .auth-container:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
    }
  
    h2 {
        font-size: 1.8rem;
        font-weight: 600;
        color: #333;
        margin-bottom: 20px;
    }
  
    input {
        width: 100%;
        padding: 12px;
        margin: 10px 0;
        border: 1px solid #ccc;
        border-radius: 8px;
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
        margin-top: 15px;
        background: #007BFF;
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 1rem;
        font-weight: 500;
        cursor: pointer;
        transition: background 0.3s ease-in-out;
    }
  
    .link-button {
        background: none;
        border: none;
        padding: 0;
        color: #007BFF;
        text-decoration: underline;
        cursor: pointer;
        font-size: inherit;
        font-family: inherit;
        transition: color 0.2s ease-in-out;
    }
  
    .link-button:hover {
        color: #0056b3;
    }
  
    .toggle-text {
        font-size: 0.9em;
        margin-top: 10px;
    }
  
    .error-text, .success-text {
        font-size: 0.9em;
        margin-top: 10px;
        padding: 8px;
        border-radius: 6px;
    }
  
    .error-text {
        color: #D8000C;
        background: #FFD2D2;
    }
  
    .success-text {
        color: #4F8A10;
        background: #DFF2BF;
    }
  
    @media (max-width: 480px) {
        .auth-container {
            width: 90%;
            padding: 20px;
        }
    }

    .session-expired {
        font-size: 0.9em;
        margin-top: 10px;
        border-radius: 6px;
        background: #DFF2BF; 
        color: #4F8A10;
    }
</style>
  
