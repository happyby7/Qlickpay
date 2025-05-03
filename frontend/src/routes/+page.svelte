<script lang="ts">
  import { browser } from '$app/environment';
  import { auth } from '$lib/auth';
  import { goto } from '$app/navigation';
  import { jwtDecode } from 'jwt-decode';
  import { onMount } from 'svelte';

  export let data: { isRegistering: boolean; restaurantId: string | null; tableId: string | null; 
    mesaSinSesion?: boolean;
    mesaNoActiva?: boolean;
    errorValidacion?: boolean;
  };

  let restaurantId = data.restaurantId || '';
  let tableId = data.tableId || '';
  let role = 'customer';

  $: if (browser && $auth) {
    try {
      role = (jwtDecode<{ role?: string }>($auth).role) || 'customer';
    } catch {
      role = 'customer';
    }
  }

  function goToAuth(mode = 'login') {
    sessionStorage.setItem('isRegistering', mode === 'register' ? 'true' : 'false');
    const base = '/auth' + (mode === 'register' ? '?register=true' : '');
    const qs = restaurantId && tableId? `${mode === 'register' ? '&' : '?'}restaurantId=${restaurantId}&tableId=${tableId}` : '';
    goto(base + qs);
  }

  function enterAsGuest() {
    sessionStorage.setItem('isGuest', 'true');
    const qs = restaurantId && tableId ? `?restaurantId=${restaurantId}&tableId=${tableId}` : '';
    goto(`/dashboard/customer${qs}`);
  }

  function goToDashboard() {
    const qs = restaurantId && tableId ? `?restaurantId=${restaurantId}&tableId=${tableId}` : '';
    goto($auth ? `/dashboard/${role}${qs}` : '/auth');
  }

  onMount(() => {
    window.addEventListener('pageshow', e => {
      if (e.persisted) location.reload();
    });
  });
</script>



{#if !$auth}
  <div class="bienvenida">

    {#if data.mesaSinSesion}
    <div class="alert-verde">
      Sesión de mesa caducada, escanea de nuevo el QR para volver a la mesa.
    </div>
    {/if}
  
    {#if data.mesaNoActiva}
      <div class="alert-verde">
        La mesa se encuentra inactiva, pongase en contacto con uno de nuestros empleados.
      </div>
    {/if}
  
    {#if data.errorValidacion}
      <div class="alert-verde">
        Error al validar la sesión. Por favor, inténtalo de nuevo más tarde.
      </div>
    {/if}

    <h1>QlickPay</h1>
    <button class="register" on:click={() => goToAuth('register')}>Registrarse</button>
    <button class="login" on:click={() => goToAuth('login')}>Iniciar Sesión</button>
    <button class="guest" on:click={enterAsGuest}>Entrar como Invitado</button>
    <p class="warning">En caso de malfuncionamiento, por favor recargue la página.</p>
  </div>
{:else}
  <p>Ya estás autenticado.</p>
  <button on:click={goToDashboard}>Ir al Dashboard</button>
{/if}

<style>
  .bienvenida {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    gap: 1rem;
  }
  button {
    padding: 1rem 2rem;
    font-size: 1.1rem;
    border: none;
    border-radius: 5px;
    cursor: pointer;
  }
  .register { background-color: #4CAF50; color: white; }
  .login { background-color: #2196F3; color: white; }
  .guest { background-color: #f44336; color: white; }
  .warning {
    font-size: 0.9em;
    color: gray;
    margin-top: 5px;
    text-align: center;
  }
  .alert-verde {
    font-size: 0.9em;
    background-color: #DFF2BF;
    color: #4F8A10;
    border: 1px solid #C3E6CB;
    padding: 0.75rem 1rem;
    border-radius: 0.375rem;
    margin: 0  auto 1rem;
    max-width: 400px;
    text-align: center;
  }

</style>
