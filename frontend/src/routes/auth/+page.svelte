<script context="module" lang="ts">
    export function load({ url }: { url: URL }) {
      return { isRegistering: url.searchParams.get('register') === 'true' };
    }
</script>
  
<script lang="ts">
    import { goto } from '$app/navigation';
    import { login, register } from '$lib/auth';
    import { browser } from '$app/environment';
    
    let isRegistering = sessionStorage.getItem('isRegistering') === 'true';
    let email = '';
    let password = '';
    let full_name = '';
    let passwordConfirm = '';
    let error = '';
    let successMessage = '';

    const handleLogin = async () => {
      error = '';
      successMessage = '';
      try {
        await login(email, password);
        successMessage = "Inicio de sesión exitoso. Redirigiendo...";
        setTimeout(() => goto('/dashboard'), 1000)
      } catch (e) {
        console.error(e);
        error = 'Error en autenticación';
      }
    };
  
    const handleRegister = async () => {
      error = '';
      successMessage = '';
      if (password !== passwordConfirm) {
        error = 'Las contraseñas no coinciden';
        return;
      }
      try {
        await register(full_name, email, password);
        successMessage = "¡Registro exitoso! Ya puedes iniciar sesión en Qlickpay.";
      } catch (e) {
        console.error(e);
        error = 'Error en el registro';
      }
    };
  
    const switchToLogin = () => {
      isRegistering = false;
      successMessage = '';
      sessionStorage.setItem('isRegistering', 'false');
      goto('/auth', { replaceState: true });
    };
  
    const switchToRegister = () => {
      isRegistering = true;
      successMessage = '';
      sessionStorage.setItem('isRegistering', 'true');
      goto('/auth?register=true', { replaceState: true });
    };

</script>

<div class="auth-container">
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
        {#if error}
          <p class="error-text">{error}</p>
        {/if}
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
        {#if error}
          <p class="error-text">{error}</p>
        {/if}
      </form>
    {/if}
</div>
  
<style>
    .auth-container {
      max-width: 400px;
      margin: 50px auto;
      padding: 20px;
      border-radius: 10px;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
      background: white;
      text-align: center;
    }
  
    input {
      width: 100%;
      padding: 10px;
      margin: 10px 0;
      border: 1px solid #ccc;
      border-radius: 5px;
      font-size: 16px;
    }
  
    button {
      width: 100%;
      padding: 10px;
      background: #007BFF;
      color: white;
      border: none;
      border-radius: 5px;
      font-size: 16px;
      cursor: pointer;
      transition: background 0.3s;
    }

    .toggle-text {
      font-size: 0.9em;
      margin-top: 10px;
    }
  
    /* Estilo para botones que actúan como enlaces */
    .link-button {
      background: none;
      border: none;
      padding: 0;
      margin-left: 5px;
      color: #007BFF;
      text-decoration: underline;
      cursor: pointer;
      font-size: inherit;
      font-family: inherit;
    }
  
    .link-button:hover {
      text-decoration: none;
    }
  
    .error-text {
      color: red;
      font-size: 0.9em;
      margin-top: 10px;
    }
</style>
  